import {getLayerSource} from "./layer/getLayerSource";
import * as webgl from "@masterportal/masterportalapi/src/renderer/webgl";

/**
 * Reloads the source and filters it by BBOX geometry.
 * @param {Object} model - the layer model
 * @param {Vue} app - the calling component
 * @returns {void}
 */
function updateSource (model, app) {
    const source = getLayerSource(model.layer);

    if (!source) {
        return;
    }

    source.clear();

    // remove old listener -> necessary since the listener is an anonymous function
    if (source.getListeners("featuresloadend")) {
        delete source.listeners_.featuresloadend;
    }

    source.on("featuresloadend", function (evt) {
        if (model.attributes.renderer === "webgl") {
            // run afterloading functions for webGL layer
            webgl.afterLoading(
                evt.target.getFeatures(),
                model.attributes.styleId,
                model.attributes.excludeTypesFromParsing,
                model.attributes.isPointLayer
            );
        }
        const filteredFeatures = model.featuresFilter(model.attributes, source.getFeatures());


        source.addFeatures(filteredFeatures);
        if (app) {
            // updateFeaturesList event is the best way I found to let app know when data has finished loading.
            // as updateFeaturesList may be triggered multiple times from different places as data loads, info where this event came from needs to be passed along
            app.$root.$emit("updateFeaturesList", "setBBoxToGeom-updateSource");
        }
    });
    source.refresh();
}

/**
 * Sets the bounding box geometry to all vector layers in the layerlist
 * @param {Vue} app - the calling component
 * @param {GeometryCollection} bboxGeometry - target geometry to be set as bbox
 * @param {Array} layerlist - list of layers to be updated
 * @returns {void}
 */
function setBBoxToGeom (app, bboxGeometry, layerlist) {
    const filteredList = layerlist.filter(layer => layer.attributes.isNeverVisibleInTree !== true && layer.attributes.typ === "OAF" || layer.attributes.typ === "WFS" || layer.attributes.typ === "GeoJSON" || layer.attributes.typ === "VectorBase");

    filteredList.forEach(function (item) {
        item.attributes.bboxGeometry = bboxGeometry;
        item.attributes.bboxGeometryExtent = bboxGeometry?.getExtent();
        updateSource(item, app);
    });

}

export {
    setBBoxToGeom
};
