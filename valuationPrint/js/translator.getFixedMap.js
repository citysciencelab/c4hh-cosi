import {buildLayers} from "./parseLayerForMapfish";
import getPrintedLayers from "./getPrintedLayers";
import {getFeatureLayer} from "./createVectorLayer";
import Feature from "ol/Feature";
import {Point} from "ol/geom";

/**
 * Gets the map configuration with bounding box as fixed map type for mapfish in jasper.
 * @param {Number[]} coordinate - The center coordinate of the parcel extent.
 * @param {String} projection the projection
 * @param {Object} style the style for point feature
 * @param {Number[]} bbox the bounding box coordinates
 * @param {String[]} layerIds the layer id
 * @param {Number} [dpi=200] the dpi for resolution
 * @returns {Object} The map configuration in object
 */
function getFixedMap (coordinate, projection, style, bbox, layerIds, dpi = 200) {
    const mapConfig = {},
        defaultBbox = [545114.80, 5914269.80, 591483.01, 5957132.28],
        feature = new Feature({
            geometry: new Point(coordinate)
        });
    let originLayers = [];

    mapConfig.dpi = dpi;
    mapConfig.projection = projection;
    mapConfig.bbox = Array.isArray(bbox) && bbox.length === 4 ? bbox : defaultBbox;
    mapConfig.layers = [];

    if (!layerIds.includes("feature")) {
        originLayers.push({
            layer: getFeatureLayer(style, feature, "point"),
            opacity: 1,
            dpi
        });
        originLayers = originLayers.concat(getPrintedLayers(layerIds));
    }
    else {
        const splitIndex = layerIds.indexOf("feature"),
            frontLayerIds = layerIds.slice(0, splitIndex),
            backLayerIds = layerIds.slice(splitIndex + 1 - layerIds.length);

        originLayers = getPrintedLayers(frontLayerIds);
        originLayers.push({
            layer: getFeatureLayer(style, feature, "point"),
            opacity: 1,
            dpi
        });
        originLayers = originLayers.concat(getPrintedLayers(backLayerIds));

    }

    buildLayers(originLayers).then(parsedLayers => {
        mapConfig.layers = parsedLayers;
    });

    return mapConfig;
}

export {
    getFixedMap
};
