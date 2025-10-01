import {getLayerSource} from "./layer/getLayerSource";
import * as webgl from "@masterportal/masterportalapi/src/renderer/webgl";

/**
 * reloads the source and filters it by BBOX
 * @param {module:ol/source/Vector} model - the layer model
 * @param {module:ol/geom/GeometryCollection} bboxGeometry - the bounding geometry
 * @param {String} url - the url of the WFS
 * @param {Object} item - the raw layer item
 * @param {Vue} [app] - the calling component
 * @returns {void}
 */
function updateSource (model, bboxGeometry, app) {
    const
        source = getLayerSource(model.layer);

    if (!source) {
        return;
    }

    source.clear();

    // remove old listener -> necessary since the listener is an anonymous function
    if (source.getListeners("featuresloadend")) {
        delete source.listeners_.featuresloadend;
    }


    if (bboxGeometry) {
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
console.log("filteredFeatures", filteredFeatures);
console.log(model.attributes);


            source.addFeatures(filteredFeatures);
            if (app) {
                // updateFeaturesList event is the best way I found to let app know when data has finished loading.
                // as updateFeaturesList may be triggered multiple times from different places as data loads, info where this event came from needs to be passed along
                app.$root.$emit("updateFeaturesList", "setBBoxToGeom-updateSource");
            }
        });
    }
    source.refresh();
}

/**
 * quick fix for VectorLayer BBox
 * @todo refactor to vuex store action
 * @param {module:ol/geom/GeometryCollection} bboxGeometry - the geometry to set the bounding box to
 * @returns {void}
 */
function setBBoxToGeom (app, bboxGeometry, layerlist) {
    const list = layerlist.filter(layer => layer.attributes.isNeverVisibleInTree !== true && layer.attributes.typ === "OAF" || layer.attributes.typ === "WFS" || layer.attributes.typ === "GeoJSON" || layer.attributes.typ === "VectorBase");

    setBboxGeometryToLayer(list, bboxGeometry, app);

}

/**
 * sets the bbox geometry for targeted raw layers or exisiting vector layers
 * @param {Array} itemList - list of target raw layers
 * @param {GeometryCollection} bboxGeometry - target geometry to be set as bbox
 * @param {Vue} [app] - the calling component
 * @returns {void}
 */
function setBboxGeometryToLayer (itemList, bboxGeometry, app) {
    console.log(itemList);
    console.log(bboxGeometry);


    itemList.forEach(function (item) {
        updateSource(item, bboxGeometry, app);
    });
}

export {
    setBBoxToGeom,
    setBboxGeometryToLayer
};
