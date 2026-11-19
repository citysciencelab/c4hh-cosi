/**
 * The planungszwilling_* layers of the portal: switch them to another view (planning
 * case, date) and draw them by planning status (SPEC §9a):
 *
 *   bestand    grey, thin
 *   neu        colour of the collection, dark outline
 *   geaendert  colour of the collection, dashed outline
 *   entfaellt  red, hatched / crossed, dashed outline
 *
 * The masterportalapi OAF loader keeps its url in a closure, so switching a view
 * puts an own loader on the layer's source (same request: bbox, bbox-crs, crs, limit,
 * next links) and reloads it. The layer config gets the new url too, for layers not
 * created yet. The style is the BASE of the layer's style stack, so "Filter (neu)"
 * keeps working on top of it.
 */
import Style from "ol/style/Style.js";
import Fill from "ol/style/Fill.js";
import Stroke from "ol/style/Stroke.js";
import CircleStyle from "ol/style/Circle.js";
import Text from "ol/style/Text.js";
import GeoJSON from "ol/format/GeoJSON.js";
import {featureSource} from "../../LayerFilter/utils/applyLayerFilter.js";
import {setBaseStyle} from "../../utils/layer/styleStack.js";
import {TWIN_LAYER_PREFIX} from "./twinApi.js";
import {collectionColor} from "./twinTimeline.js";

/** Which loader of a source is the current one (answers of older views are dropped). */
const generations = new WeakMap();
/** Letter in the point symbol of a collection. */
const LETTERS = {kitas: "K", wohnbau: "W", gebaeude: "G", oepnv_halte: "H", schulen: "S", soziales: "E", parken: "P"};
const GREY = "#8a8986",
    INK = "#0b0b0b",
    RED = "#d03b3b";

/** Planning states in the legend order, with their words. */
export const PF_STATES = [
    {key: "neu", label: "neu"},
    {key: "geaendert", label: "geändert"},
    {key: "entfaellt", label: "entfällt"},
    {key: "bestand", label: "Bestand"}
];

/**
 * A hex colour with an alpha.
 * @param {String} hex "#rrggbb".
 * @param {Number} alpha 0–1.
 * @returns {String} "rgba(…)".
 */
function withAlpha (hex, alpha) {
    const n = parseInt(hex.slice(1), 16);

    return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${alpha})`;
}

let hatch = null;

/**
 * A red diagonal hatch for removed areas (falls back to a flat fill without canvas).
 * @returns {CanvasPattern|String} The fill.
 */
function hatchFill () {
    if (hatch === null) {
        const canvas = typeof document !== "undefined" ? document.createElement("canvas") : null,
            ctx = canvas?.getContext?.("2d");

        if (!ctx) {
            hatch = withAlpha(RED, 0.3);
            return hatch;
        }
        canvas.width = canvas.height = 8;
        ctx.strokeStyle = withAlpha(RED, 0.75);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 8);
        ctx.lineTo(8, 0);
        ctx.moveTo(-2, 2);
        ctx.lineTo(2, -2);
        ctx.moveTo(6, 10);
        ctx.lineTo(10, 6);
        ctx.stroke();
        hatch = ctx.createPattern(canvas, "repeat") ?? withAlpha(RED, 0.3);
    }
    return hatch;
}

/**
 * The look of one planning state of one collection.
 * @param {String} collection Collection key.
 * @param {String} state pf_status.
 * @param {String} kind "point", "line" or "area".
 * @returns {Style} The style.
 */
export function stateStyle (collection, state, kind) {
    const color = collectionColor(collection),
        dashed = [6, 4];

    if (kind === "point") {
        const radius = state === "bestand" ? 5 : 9,
            look = {
                neu: {fill: color, stroke: new Stroke({color: INK, width: 2})},
                geaendert: {fill: color, stroke: new Stroke({color: INK, width: 2, lineDash: [3, 2]})},
                entfaellt: {fill: withAlpha(RED, 0.35), stroke: new Stroke({color: RED, width: 2, lineDash: [3, 2]})},
                bestand: {fill: withAlpha(GREY, 0.8), stroke: new Stroke({color: "#ffffff", width: 1})}
            }[state] ?? {fill: color, stroke: new Stroke({color: "#ffffff", width: 1})};

        return new Style({
            image: new CircleStyle({radius, fill: new Fill({color: look.fill}), stroke: look.stroke}),
            text: state === "bestand" ? undefined : new Text({
                text: state === "entfaellt" ? "×" : LETTERS[collection] ?? "",
                font: "bold 11px sans-serif",
                fill: new Fill({color: state === "entfaellt" ? RED : "#ffffff"})
            })
        });
    }
    if (kind === "line") {
        const stroke = {
            neu: {color, width: 4},
            geaendert: {color, width: 4, lineDash: dashed},
            entfaellt: {color: RED, width: 3, lineDash: dashed},
            bestand: {color: GREY, width: 1.5}
        }[state] ?? {color, width: 3};

        return new Style({stroke: new Stroke(stroke)});
    }
    const area = {
        neu: {fill: withAlpha(color, 0.5), stroke: {color: INK, width: 2}},
        geaendert: {fill: withAlpha(color, 0.35), stroke: {color, width: 2.5, lineDash: dashed}},
        entfaellt: {fill: hatchFill(), stroke: {color: RED, width: 2, lineDash: dashed}},
        bestand: {fill: withAlpha(GREY, 0.18), stroke: {color: GREY, width: 1}}
    }[state] ?? {fill: withAlpha(color, 0.4), stroke: {color, width: 1.5}};

    return new Style({fill: new Fill({color: area.fill}), stroke: new Stroke(area.stroke)});
}

/**
 * The geometry kind of a feature.
 * @param {module:ol/Feature} feature The feature.
 * @returns {String} "point", "line" or "area".
 */
function kindOf (feature) {
    const type = feature.getGeometry()?.getType?.() ?? "";

    if (type.includes("Point")) {
        return "point";
    }
    return type.includes("LineString") ? "line" : "area";
}

/**
 * The style function of a twin layer.
 * @param {String} collection Collection key.
 * @returns {Function} (feature) => Style
 */
export function twinStyleFunction (collection) {
    const cache = new Map();

    return feature => {
        const inner = Array.isArray(feature.get("features")) ? feature.get("features")[0] : feature;

        if (!inner) {
            return undefined;
        }
        const key = `${inner.get("pf_status")}|${kindOf(inner)}`;

        if (!cache.has(key)) {
            cache.set(key, stateStyle(collection, inner.get("pf_status"), kindOf(inner)));
        }
        return cache.get(key);
    };
}

/**
 * A legend symbol of a state as SVG data URI (same look as on the map).
 * @param {String} collection Collection key.
 * @param {String} state pf_status.
 * @param {String} kind "point", "line" or "area".
 * @returns {String} The data URI.
 */
export function stateGraphic (collection, state, kind) {
    const color = collectionColor(collection),
        dash = state === "geaendert" || state === "entfaellt" ? "stroke-dasharray=\"3 2\"" : "",
        stroke = {neu: INK, geaendert: kind === "area" ? color : INK, entfaellt: RED, bestand: GREY}[state],
        fill = {neu: color, geaendert: color, entfaellt: "none", bestand: GREY}[state];
    let shape;

    if (kind === "point") {
        const letter = state === "bestand" ? "" : `<text x="10" y="14" font-size="10" font-weight="bold" font-family="sans-serif" text-anchor="middle" fill="${state === "entfaellt" ? RED : "#fff"}">${state === "entfaellt" ? "×" : LETTERS[collection] ?? ""}</text>`;

        shape = `<circle cx="10" cy="10" r="${state === "bestand" ? 5 : 8}" fill="${fill}" fill-opacity="${state === "bestand" ? 0.8 : 1}" stroke="${stroke}" stroke-width="2" ${dash}/>${letter}`;
    }
    else if (kind === "line") {
        const lineColor = stroke === INK ? color : stroke;

        shape = `<path d="M2 15 L8 6 L12 13 L18 4" fill="none" stroke="${lineColor}" stroke-width="3" ${dash}/>`;
    }
    else {
        const hatchLines = state === "entfaellt" ? `<path d="M3 15 L13 5 M7 17 L17 7 M3 9 L7 5" stroke="${RED}" stroke-width="1.2"/>` : "";

        shape = `<rect x="2" y="3" width="16" height="14" fill="${fill}" fill-opacity="${state === "bestand" ? 0.25 : 0.55}" stroke="${stroke}" stroke-width="2" ${dash}/>${hatchLines}`;
    }
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">${shape}</svg>`);
}

/**
 * Puts the planning-status style and legend on a twin layer.
 * @param {Object} layer Masterportal layer.
 * @param {String} kind Geometry kind of the collection ("point", "line", "area").
 * @param {Function} [refreshLegend] (layer) => void, the core legend's update.
 * @returns {void}
 */
export function styleTwinLayer (layer, kind, refreshLegend) {
    const collection = layer.get("collection");

    featureSource(layer)?.getFeatures().forEach(f => f.getStyle() && f.setStyle(null));
    setBaseStyle(layer, twinStyleFunction(collection));
    layer.createLegend = async () => PF_STATES.map(s => ({name: s.label, graphic: stateGraphic(collection, s.key, kind)}));
    refreshLegend?.(layer);
}

/**
 * A loader for a twin view that requests like the masterportalapi OAF loader.
 * @param {module:ol/source/Vector} source The (inner) vector source.
 * @param {Object} attrs Layer attributes (collection, crs, limit).
 * @param {String} viewUrl The view url.
 * @param {Function} [fetchFn=fetch] Fetch (tests).
 * @returns {Function} OL loader (extent, resolution, projection, success, failure).
 */
export function createViewLoader (source, attrs, viewUrl, fetchFn = fetch) {
    const format = source.getFormat?.() ?? new GeoJSON(),
        crs = attrs.crs || "http://www.opengis.net/def/crs/EPSG/0/25832";

    const generation = (generations.get(source) ?? 0) + 1;

    generations.set(source, generation);
    /**
     * Fetches all pages of one extent and adds the features.
     * @param {Number[]} extent Extent to load (infinite = everything).
     * @param {Function} success OL success callback.
     * @param {Function} failure OL failure callback.
     * @returns {Promise<void>} Done.
     */
    async function load (extent, success, failure) {
        const url = new URL(`${viewUrl}/collections/${attrs.collection}/items`),
            collected = [],
            box = Array.isArray(extent) && extent.every(Number.isFinite) ? extent : attrs.bbox;

        url.searchParams.set("limit", attrs.limit ?? 1000);
        url.searchParams.set("crs", crs);
        if (Array.isArray(box) && box.length === 4) {
            url.searchParams.set("bbox", box.join(","));
            url.searchParams.set("bbox-crs", crs);
        }
        try {
            let next = url.toString();

            while (next) {
                const response = await fetchFn(next, {headers: {Accept: "application/geo+json"}});

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const json = await response.json();

                collected.push(...json.features ?? []);
                next = (json.links ?? []).find(l => l.rel === "next")?.href ?? null;
            }
            if (generations.get(source) !== generation) {
                return;
            }
            const features = format.readFeatures({type: "FeatureCollection", features: collected});

            source.addFeatures(features);
            success?.(features);
        }
        catch (e) {
            console.warn(`Planungszwilling: ${viewUrl} (${attrs.collection}) nicht geladen: ${e?.message}`);
            source.removeLoadedExtent?.(extent);
            failure?.();
        }
    }

    // NOT async: OpenLayers treats a returned promise as the features
    return function loader (extent, resolution, projection, success, failure) {
        load(extent, success, failure);
    };
}

/**
 * Lets a created twin layer read another view.
 * @param {Object} layer Masterportal layer.
 * @param {String} viewUrl The view url.
 * @returns {void}
 */
export function switchLayerView (layer, viewUrl) {
    const source = featureSource(layer);

    if (!source) {
        return;
    }
    source.setLoader(createViewLoader(source, layer.attributes ?? {collection: layer.get("collection")}, viewUrl));
    source.refresh();
}

/**
 * Whether a layer (config) belongs to a Planungszwilling.
 * @param {Object} layerConf Layer config or {id}.
 * @returns {Boolean} True if so.
 */
export function isTwinLayer (layerConf) {
    return typeof layerConf?.id === "string" && layerConf.id.startsWith(TWIN_LAYER_PREFIX);
}

/**
 * The layer name for a view: "Kitas – Demo-Sicht Quartier, 31.12.2029".
 * @param {String} collectionLabel Name of the collection.
 * @param {String} planfallLabel Name of the planning case.
 * @param {String} stichtagText The date in words.
 * @returns {String} The name.
 */
export function viewLayerName (collectionLabel, planfallLabel, stichtagText) {
    return `${collectionLabel} – ${planfallLabel}, ${stichtagText}`;
}
