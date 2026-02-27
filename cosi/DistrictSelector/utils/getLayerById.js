import layerCollection from "@core/layers/js/layerCollection.js";
import layerFactory from "@core/layers/js/layerFactory";

/**
 * Gets a layer by its id from the layer collection. If the layer does not exist,
 * it creates a new vector-based layer with the specified id, adds it to the layer collection,
 * and then returns the newly created layer.         *
 * @param {string} id - The unique identifier of the layer to get or create.
 * @returns {Object} The layer object corresponding to the given id.
 */
function getLayerById (id) {
    if (typeof layerCollection.getLayerById(id) !== "undefined") {
        return layerCollection.getLayerById(id);
    }
    const layer = layerFactory.createLayer({
        typ: "VECTORBASE",
        id: id,
        name: id,
        alwaysOnTop: true
    });

    layer.getLayer().setStyle(
        {
            "fill-color": "rgba(235, 138, 62, 0)",
            "stroke-color": "#EB8A3E",
            "stroke-width": 3
        }
    );

    layerCollection.addLayer(layer);
    return layer;
}

export {
    getLayerById
};
