/**
 * Puts a LayerFilter spec onto a Masterportal vector layer — and takes it off again.
 *
 * Why not the way the core filter does it: the core filter hides features by giving
 * EVERY feature its own style (`feature.setStyle(new Style())`) and by clearing and
 * re-adding the source. That is slow on big layers and leaves styles behind. Here:
 *
 * - canvas layers: ONE wrapping style function on the OL layer (plus clearing the
 *   per-feature style cache the masterportalapi puts on points, see below). A feature's verdict is
 *   computed once per filter (WeakMap) and the original Masterportal style function
 *   draws the matches; non-matches get a pale grey (dim) or nothing (hide).
 * - clustered layers: non-matches are taken out of the clustering with the core's own
 *   `hideInClustering` flag (set silently), then the cluster is rebuilt once. The
 *   cluster counts are then right; dimming is not possible there.
 * - WebGL layers (no style functions): the source only holds the matches; the full
 *   list is kept here and put back on reset. Dimming is not possible there either.
 *
 * The OL objects live in a module-level registry (not in Vuex): the store only keeps
 * the plain filter specs.
 */
import Style, {createDefaultStyle} from "ol/style/Style.js";
import Fill from "ol/style/Fill.js";
import Stroke from "ol/style/Stroke.js";
import CircleStyle from "ol/style/Circle.js";
import Cluster from "ol/source/Cluster.js";
import {buildPredicate} from "./filterSpec.js";

/** Pale grey for non-matching features (c4hh-app DIM_STYLE). */
export const DIM_STYLE = new Style({
    fill: new Fill({color: "rgba(180,180,180,0.10)"}),
    stroke: new Stroke({color: "rgba(140,140,140,0.40)", width: 0.5}),
    image: new CircleStyle({radius: 4, fill: new Fill({color: "rgba(130,130,130,0.55)"}), stroke: new Stroke({color: "rgba(255,255,255,0.8)", width: 1})})
});

const SUPPORTED_TYPES = ["WFS", "OAF", "GEOJSON", "VECTORBASE", "SENSORTHINGS"],
    registry = new Map();
let updateHandler = null;

/**
 * Registers who hears about re-applied filters (the store keeps the counts).
 * @param {Function|null} fn (layerId, {matched, total}) => void
 * @returns {void}
 */
export function setUpdateHandler (fn) {
    updateHandler = fn;
}

/**
 * How a layer has to be filtered.
 * @param {Object} layer Masterportal layer.
 * @returns {String} "webgl", "cluster" or "canvas".
 */
export function layerKind (layer) {
    if (layer.get("renderer") === "webgl") {
        return "webgl";
    }
    return layer.getLayerSource?.() instanceof Cluster ? "cluster" : "canvas";
}

/**
 * Whether the tool can filter a layer.
 * @param {Object} layer Masterportal layer.
 * @returns {Boolean} True if filterable.
 */
export function isFilterableLayer (layer) {
    const typ = String(layer?.get?.("typ") ?? "").toUpperCase();

    return SUPPORTED_TYPES.includes(typ) && typeof layer.getLayerSource === "function" && Boolean(layer.getLayerSource());
}

/**
 * The vector source holding the real features (the inner one of a cluster).
 * @param {Object} layer Masterportal layer.
 * @returns {module:ol/source/Vector} The source.
 */
export function featureSource (layer) {
    const source = layer.getLayerSource();

    return source instanceof Cluster ? source.getSource() : source;
}

/**
 * All features of a layer, including the ones a filter currently hides.
 * @param {Object} layer Masterportal layer.
 * @returns {module:ol/Feature[]} The features.
 */
export function getAllFeatures (layer) {
    const entry = registry.get(layer.get("id"));

    if (entry?.kind === "webgl" && entry.allFeatures) {
        return entry.allFeatures;
    }
    return featureSource(layer)?.getFeatures() ?? [];
}

/**
 * Whether a filter of this tool sits on the layer.
 * @param {String} layerId Layer id.
 * @returns {Boolean} True if filtered.
 */
export function isFiltered (layerId) {
    return registry.has(layerId);
}

/**
 * Whether non-matching features can be dimmed on this layer (else they are hidden).
 * @param {Object} layer Masterportal layer.
 * @returns {Boolean} True if dimming works.
 */
export function canDim (layer) {
    return layerKind(layer) === "canvas";
}

/**
 * Applies a filter spec. A spec that restricts nothing removes the filter.
 * @param {Object} layer Masterportal layer.
 * @param {Object} spec Filter spec.
 * @param {String} [missMode="dim"] "dim" or "hide".
 * @returns {{matched: Number, total: Number}} Match count over all features.
 */
export function applyLayerFilter (layer, spec, missMode = "dim") {
    const predicate = buildPredicate(spec),
        id = layer.get("id");

    if (!predicate) {
        clearLayerFilter(layer);
        const total = getAllFeatures(layer).length;

        return {matched: total, total};
    }

    const kind = layerKind(layer);
    let entry = registry.get(id);

    if (!entry) {
        entry = {kind, layer};
        if (kind === "canvas") {
            entry.originalStyle = layer.getLayer().getStyle();
        }
        if (kind === "webgl") {
            entry.allFeatures = featureSource(layer).getFeatures().slice();
        }
        registry.set(id, entry);
        // features loaded later (WFS reload, bbox strategy, import) get the filter too,
        // also while the tool is closed
        entry.unlisten = onFeaturesChanged(layer, () => {
            if (registry.get(id) === entry) {
                updateHandler?.(id, applyLayerFilter(layer, entry.spec, entry.missMode));
            }
        });
    }
    entry.spec = spec;
    entry.missMode = missMode;

    const features = getAllFeatures(layer),
        verdicts = new WeakMap();

    /**
     * The verdict of one feature, computed once per filter.
     * @param {module:ol/Feature} feature The feature.
     * @returns {Boolean} True if it matches.
     */
    function test (feature) {
        let v = verdicts.get(feature);

        if (v === undefined) {
            v = predicate(attr => feature.get(attr));
            verdicts.set(feature, v);
        }
        return v;
    }
    let matched = 0;

    features.forEach(f => {
        if (test(f)) {
            matched++;
        }
    });

    if (kind === "canvas") {
        const orig = entry.originalStyle,
            staticFn = orig ? () => orig : createDefaultStyle,
            origFn = typeof orig === "function" ? orig : staticFn,
            miss = missMode === "hide" ? undefined : DIM_STYLE;

        // The masterportalapi caches the style of every POINT it draws on the feature
        // itself (createStyle → feature.setStyle), and a feature style beats the layer
        // style. Non-matches lose that cache, or they would keep their full look.
        features.forEach(f => {
            if (f.getStyle() && !test(f)) {
                f.setStyle(null);
            }
        });
        layer.getLayer().setStyle((feature, resolution) => test(feature) ? origFn(feature, resolution) : miss);
    }
    else if (kind === "cluster") {
        features.forEach(f => f.set("hideInClustering", !test(f), true));
        layer.getLayerSource().refresh();
    }
    else {
        const source = featureSource(layer);

        entry.mutating = true;
        source.clear(true);
        source.addFeatures(features.filter(test));
        entry.mutating = false;
    }
    return {matched, total: features.length};
}

/**
 * Removes the filter of this tool from a layer and restores the original look.
 * @param {Object} layer Masterportal layer.
 * @returns {void}
 */
export function clearLayerFilter (layer) {
    const id = layer.get("id"),
        entry = registry.get(id);

    if (!entry) {
        return;
    }
    registry.delete(id);
    entry.unlisten?.();
    if (entry.kind === "canvas") {
        layer.getLayer().setStyle(entry.originalStyle);
    }
    else if (entry.kind === "cluster") {
        featureSource(layer).getFeatures().forEach(f => f.set("hideInClustering", false, true));
        layer.getLayerSource().refresh();
    }
    else {
        const source = featureSource(layer);

        source.clear(true);
        source.addFeatures(entry.allFeatures);
    }
}

/**
 * Calls back (debounced) whenever the layer's features change from outside: a WFS
 * reload, new features of a bbox strategy, an import into a VECTORBASE layer.
 * A WebGL reload replaces the list this module keeps.
 * @param {Object} layer Masterportal layer.
 * @param {Function} callback Called without arguments.
 * @param {Number} [wait=300] Debounce in ms.
 * @returns {Function} Unsubscribe.
 */
export function onFeaturesChanged (layer, callback, wait = 300) {
    const source = featureSource(layer);
    let timer = null;

    if (!source) {
        return () => undefined;
    }
    /**
     * Handles one source event.
     * @param {Object} evt The OL event.
     * @returns {void}
     */
    function fire (evt) {
        const entry = registry.get(layer.get("id"));

        if (entry?.mutating) {
            return;
        }
        if (entry?.kind === "webgl" && evt?.type === "featuresloadend") {
            // the source was reloaded in full — that is the new truth
            entry.allFeatures = source.getFeatures().slice();
        }
        // one timer per burst, not one per feature (a reload fires 100 000 events)
        if (timer === null) {
            timer = setTimeout(() => {
                timer = null;
                callback();
            }, wait);
        }
    }
    const keys = ["featuresloadend", "addfeature", "removefeature"].map(type => {
        source.on(type, fire);
        return type;
    });

    return () => {
        clearTimeout(timer);
        keys.forEach(type => source.un(type, fire));
    };
}

/**
 * Only for tests: forget every registered filter.
 * @returns {void}
 */
export function resetRegistry () {
    registry.clear();
}
