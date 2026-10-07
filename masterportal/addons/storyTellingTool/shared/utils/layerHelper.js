import layerCollection from "@core/layers/js/layerCollection.js";
import layerFactory from "@core/layers/js/layerFactory.js";

/**
 * Filters visible layers from an OpenLayers collection.
 * Excludes marker layers by default and optionally a specific layer ID (e.g. the baselayer).
 *
 * @param {Object} layers - The OpenLayers layer collection.
 * @param {String} [excludeLayerId=null] - Optional ID of a layer that should also be ignored.
 * @returns {ol/Layer[]} Array of visible layers.
 */
function getVisibleLayerList (layers, excludeLayerId = null) {
    if (typeof layers?.getArray !== "function") {
        return [];
    }

    return layers.getArray().filter(layer => {
        const isVisible = layer.getVisible() === true,
            isNotMarkerPoint = layer.get("name") !== "markerPoint",
            isNotMarkerPolygon = layer.get("name") !== "markerPolygon",
            isNotExcluded = excludeLayerId ? layer.get("id") !== excludeLayerId : true;

        return isVisible && isNotMarkerPoint && isNotMarkerPolygon && isNotExcluded;
    });
}

/**
* Creates a layer if it does not yet exist and returns its source.
* @returns {Object} A vector layer source.
*/
function getLayerSource () {
    if (typeof layerCollection.getLayerById("drawn-story-creator") !== "undefined") {
        return layerCollection.getLayerById("drawn-story-creator").getLayerSource();
    }
    const layer = layerFactory.createLayer({
        typ: "VECTORBASE",
        id: "drawn-story-creator",
        name: "drawn-story-creator",
        alwaysOnTop: true
    });

    layerCollection.addLayer(layer);

    return layer.getLayerSource();
}

export {
    getVisibleLayerList,
    getLayerSource
};
