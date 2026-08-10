/**
 * Filters visible layers from an OpenLayers collection.
 * Excludes marker layers by default and optionally a specific layer ID (e.g. the baselayer).
 *
 * @param {Object} layers - The OpenLayers layer collection.
 * @param {String} [excludeLayerId=null] - Optional ID of a layer that should also be ignored.
 * @returns {ol/Layer[]} Array of visible layers.
 */
export function getVisibleLayerList (layers, excludeLayerId = null) {
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
