/**
 * Puts a LayerStyler spec onto a Masterportal vector layer — and takes it off again.
 *
 * - canvas and clustered layers: ONE style function as the base of the layer's style
 *   stack (utils/layer/styleStack.js), so a LayerFilter on the same layer keeps
 *   working on top of it. OL styles are cached by look, not built per feature. The
 *   masterportalapi caches the style of every point ON the feature (createStyle →
 *   feature.setStyle), which beats a layer style — those caches are cleared.
 *   Clusters of several features get a bubble in the most frequent member colour.
 * - WebGL layers (no style functions): their renderer reads fillColor, strokeColor,
 *   strokeWidth, opacity and circleSize from each feature — written here, the
 *   values of the Masterportal style are kept and put back on reset.
 *
 * The layer's legend (menu "Legende") shows the styler's classes while it is styled.
 * The OL objects live in a module-level registry, the store only keeps the specs.
 */
import Style from "ol/style/Style.js";
import Fill from "ol/style/Fill.js";
import Stroke from "ol/style/Stroke.js";
import CircleStyle from "ol/style/Circle.js";
import Text from "ol/style/Text.js";
import {featureSource, getAllFeatures, layerKind, onFeaturesChanged} from "../../LayerFilter/utils/applyLayerFilter.js";
import {setBaseStyle} from "../../utils/layer/styleStack.js";
import {colorWithAlpha} from "./classify.js";
import {geomKindOf, layerGeomKind, resolveStyle} from "./styleSpec.js";

const WEBGL_KEYS = ["fillColor", "strokeColor", "strokeWidth", "opacity", "circleSize"],
    registry = new Map();
let updateHandler = null,
    legendRefresher = null;

/**
 * Registers who hears about re-resolved styles (new legend after a reload).
 * @param {Function|null} fn (layerId, resolved) => void
 * @returns {void}
 */
export function setStyleUpdateHandler (fn) {
    updateHandler = fn;
}

/**
 * Registers how the legend of a layer is rebuilt (store action of the core legend).
 * @param {Function|null} fn (layer) => void
 * @returns {void}
 */
export function setLegendRefresher (fn) {
    legendRefresher = fn;
}

/**
 * Whether a style of this tool sits on the layer.
 * @param {String} layerId Layer id.
 * @returns {Boolean} True if styled.
 */
export function isStyled (layerId) {
    return registry.has(layerId);
}

/**
 * The outline colour of a feature colour under a spec.
 * @param {Object} spec The spec.
 * @param {String} color The feature colour.
 * @returns {String|null} The colour, or null for no outline.
 */
function strokeColorOf (spec, color) {
    if (spec.stroke.mode === "none" || !(spec.stroke.width > 0)) {
        return null;
    }
    return spec.stroke.mode === "same" ? colorWithAlpha(color, 1) : spec.stroke.color;
}

/**
 * Builds the OL style function of a resolved spec.
 * @param {Object} spec The spec.
 * @param {Object} resolved The resolved spec (styleSpec.resolveStyle).
 * @returns {Function} (feature) => Style
 */
export function buildStyleFunction (spec, resolved) {
    const cache = new Map();

    /**
     * The (cached) style of one look.
     * @param {String} kind "point", "line" or "area".
     * @param {String} color Feature colour.
     * @param {Number} radius Point radius.
     * @returns {module:ol/style/Style} The style.
     */
    function look (kind, color, radius) {
        const key = `${kind}|${color}|${kind === "point" ? Math.round(radius * 2) / 2 : ""}`;
        let style = cache.get(key);

        if (!style) {
            const outline = strokeColorOf(spec, color),
                stroke = outline ? new Stroke({color: outline, width: spec.stroke.width}) : undefined;

            if (kind === "point") {
                style = new Style({image: new CircleStyle({radius, fill: new Fill({color: colorWithAlpha(color, spec.fillOpacity)}), stroke})});
            }
            else if (kind === "line") {
                style = new Style({stroke: new Stroke({color: colorWithAlpha(color, Math.max(spec.fillOpacity, 0.2)), width: spec.lineWidth})});
            }
            else {
                style = new Style({fill: new Fill({color: colorWithAlpha(color, spec.fillOpacity)}), stroke});
            }
            cache.set(key, style);
        }
        return style;
    }

    /**
     * The bubble of a cluster: the most frequent member colour, the member count.
     * @param {module:ol/Feature[]} members Clustered features.
     * @returns {module:ol/style/Style} The style.
     */
    function bubble (members) {
        const tally = new Map();
        let color = null,
            best = 0;

        members.forEach(m => {
            const c = resolved.colorOf(m),
                n = (tally.get(c) ?? 0) + 1;

            tally.set(c, n);
            if (n > best) {
                best = n;
                color = c;
            }
        });
        const key = `cluster|${color}|${members.length}`;
        let style = cache.get(key);

        if (!style) {
            style = new Style({
                image: new CircleStyle({
                    radius: Math.min(26, 10 + 2.5 * Math.log2(members.length)),
                    fill: new Fill({color: colorWithAlpha(color, 0.9)}),
                    stroke: new Stroke({color: "#ffffff", width: 2})
                }),
                text: new Text({
                    text: String(members.length),
                    font: "bold 12px sans-serif",
                    fill: new Fill({color: "#ffffff"}),
                    stroke: new Stroke({color: "rgba(0,0,0,0.45)", width: 2})
                })
            });
            cache.set(key, style);
        }
        return style;
    }

    return feature => {
        const members = feature.get("features");

        if (Array.isArray(members)) {
            if (members.length > 1) {
                return bubble(members);
            }
            if (members.length === 1) {
                const inner = members[0];

                return look(geomKindOf(inner.getGeometry()) ?? "point", resolved.colorOf(inner), resolved.radiusOf(inner));
            }
            return undefined;
        }
        return look(geomKindOf(feature.getGeometry()) ?? "area", resolved.colorOf(feature), resolved.radiusOf(feature));
    };
}

/**
 * Clears the per-feature style caches of the masterportalapi (points, clusters).
 * @param {Object} layer Masterportal layer.
 * @returns {void}
 */
function clearFeatureStyles (layer) {
    const clusters = layer.getLayerSource();

    getAllFeatures(layer).forEach(f => f.getStyle() && f.setStyle(null));
    if (clusters !== featureSource(layer)) {
        clusters.getFeatures().forEach(f => f.getStyle() && f.setStyle(null));
    }
}

/**
 * Writes the look of every feature onto it, for the WebGL renderer.
 * @param {Object} entry Registry entry.
 * @param {module:ol/Feature[]} features The features.
 * @returns {void}
 */
function writeWebglProps (entry, features) {
    const {spec, resolved} = entry;

    features.forEach(f => {
        if (!entry.webglOriginal.has(f)) {
            entry.webglOriginal.set(f, Object.fromEntries(WEBGL_KEYS.map(k => [k, f.get(k)])));
        }
        const color = resolved.colorOf(f),
            outline = strokeColorOf(spec, color);

        // one change event per feature: the WebGL renderer redraws it
        f.setProperties({
            fillColor: colorWithAlpha(color, spec.fillOpacity),
            opacity: spec.fillOpacity,
            strokeColor: outline ?? colorWithAlpha(color, 0),
            strokeWidth: outline ? spec.stroke.width : 0,
            circleSize: resolved.radiusOf(f) * 2
        });
    });
}

/**
 * A legend symbol as SVG data URI.
 * @param {Object} spec The spec.
 * @param {String} geomKind "point", "line", "area" or "mixed".
 * @param {String} color The colour.
 * @returns {String} The data URI.
 */
export function legendGraphic (spec, geomKind, color) {
    const fill = colorWithAlpha(color, spec.fillOpacity),
        outline = strokeColorOf(spec, color),
        stroke = outline ? `stroke="${outline}" stroke-width="${Math.min(spec.stroke.width, 3)}"` : "";
    let shape;

    if (geomKind === "point") {
        shape = `<circle cx="10" cy="10" r="7" fill="${fill}" ${stroke}/>`;
    }
    else if (geomKind === "line") {
        shape = `<path d="M2 15 L8 6 L12 13 L18 4" fill="none" stroke="${colorWithAlpha(color, Math.max(spec.fillOpacity, 0.2))}" stroke-width="${Math.min(spec.lineWidth, 5)}" stroke-linecap="round"/>`;
    }
    else {
        shape = `<rect x="2" y="3" width="16" height="14" rx="1" fill="${fill}" ${stroke}/>`;
    }
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">${shape}</svg>`);
}

/**
 * Lets the layer's legend show the styler's classes (until the style is removed).
 * @param {Object} entry Registry entry.
 * @returns {void}
 */
function installLegend (entry) {
    const {layer, spec, resolved, geomKind} = entry,
        legend = resolved.legend.map(l => ({name: l.label, graphic: legendGraphic(spec, geomKind, l.color)}));

    layer.createLegend = async () => legend;
    legendRefresher?.(layer);
}

/**
 * Resolves and applies a spec (also used when the features change).
 * @param {Object} entry Registry entry.
 * @returns {Object} The resolved spec.
 */
function render (entry) {
    const {layer} = entry,
        features = getAllFeatures(layer);

    entry.geomKind = layerGeomKind(features);
    entry.resolved = resolveStyle(entry.spec, features);
    if (entry.kind === "webgl") {
        writeWebglProps(entry, features);
    }
    else {
        clearFeatureStyles(layer);
        setBaseStyle(layer, buildStyleFunction(entry.spec, entry.resolved));
    }
    installLegend(entry);
    return entry.resolved;
}

/**
 * Applies a style spec to a layer.
 * @param {Object} layer Masterportal layer.
 * @param {Object} spec The spec.
 * @returns {Object} The resolved spec ({legend, sizeDomain, multi, …}).
 */
export function applyLayerStyle (layer, spec) {
    const id = layer.get("id");
    let entry = registry.get(id);

    if (!entry) {
        entry = {layer, kind: layerKind(layer), webglOriginal: new WeakMap()};
        registry.set(id, entry);
        // features loaded later (WFS reload, bbox strategy) get the style and new breaks
        entry.unlisten = onFeaturesChanged(layer, () => {
            if (registry.get(id) === entry) {
                updateHandler?.(id, render(entry));
            }
        });
    }
    entry.spec = spec;
    return render(entry);
}

/**
 * Removes the style of this tool and brings back the Masterportal style and legend.
 * @param {Object} layer Masterportal layer.
 * @returns {void}
 */
export function clearLayerStyle (layer) {
    const id = layer.get("id"),
        entry = registry.get(id);

    if (!entry) {
        return;
    }
    registry.delete(id);
    entry.unlisten?.();
    if (entry.kind === "webgl") {
        getAllFeatures(layer).forEach(f => {
            const original = entry.webglOriginal.get(f);

            if (original) {
                f.setProperties(original);
            }
        });
    }
    else {
        clearFeatureStyles(layer);
        setBaseStyle(layer, null);
    }
    // the prototype's legend again
    delete layer.createLegend;
    legendRefresher?.(layer);
}

/**
 * Only for tests: forget every registered style.
 * @returns {void}
 */
export function resetStyleRegistry () {
    registry.clear();
}
