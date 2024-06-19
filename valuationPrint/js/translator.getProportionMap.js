import {buildLayers} from "./parseLayerForMapfish";
import getPrintedLayers from "./getPrintedLayers";
import {getFeatureLayer} from "./createVectorLayer";

/**
 * Gets the map configuration with a proportional bounding box as proportion map type for mapfish in jasper.
 * @param {ol/Feature} feature - The parcel feature.
 * @param {Number[]} extent The extent coordinates of parcel as feature
 * @param {String} projection the projection
 * @param {Object} style the style for point feature
 * @param {Number} proportion the proportion of the parcel in the map
 * @param {String[]} layerIds the layer id
 * @param {Number} [dpi=200] the dpi for resolution
 * @returns {Object} The map configuration in object
 */
function getProportionMap (feature, extent, projection, style, proportion, layerIds, dpi = 200) {
    const mapConfig = {},
        defaultBbox = [545114.80, 5914269.80, 591483.01, 5957132.28];
    let originLayers = [];

    mapConfig.dpi = dpi;
    mapConfig.projection = projection;
    mapConfig.bbox = Array.isArray(extent) && extent.length === 4 ? getBoundingBox(extent, proportion) : defaultBbox;
    mapConfig.layers = [];

    if (!layerIds.includes("feature")) {
        originLayers.push({
            layer: getFeatureLayer(style, feature),
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
            layer: getFeatureLayer(style, feature),
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

/**
 * Getting the Bounding Box of the map according to the extent of feature and proportion
 * The size of feature extent / the size of map is the proportion
 * @param {Number[]} coordinates The geo coordination
 * @param {Object} configProp the proportion of the map
 * @returns {Number[]} the bounding box of the map
 */
function getBoundingBox (coordinates, configProp) {
    const longiDiff = coordinates[2] - coordinates[0],
        latiDiff = coordinates[3] - coordinates[1],
        minDiff = Math.min(longiDiff, latiDiff),
        latiLongiDiff = (latiDiff - longiDiff) > 0 ? (latiDiff - longiDiff) / 2 : 0,
        longiLatiDiff = (longiDiff - latiDiff) > 0 ? (longiDiff - latiDiff) / 2 : 0;

    let proportion = 0.33,
        ratio = 1,
        longiLeft = 0,
        longiRight = 0,
        latiBottom = 0,
        latiTop = 0;

    if (typeof configProp === "number" && configProp > 0 && configProp < 1) {
        proportion = configProp;
    }

    ratio = (1 - proportion) / (2 * proportion);

    longiLeft = coordinates[0] - minDiff * ratio - latiLongiDiff;
    longiRight = coordinates[2] + minDiff * ratio + latiLongiDiff;
    latiBottom = coordinates[1] - minDiff * ratio - longiLatiDiff;
    latiTop = coordinates[3] + minDiff * ratio + longiLatiDiff;

    return [longiLeft, latiBottom, longiRight, latiTop];
}

export {
    getProportionMap,
    getBoundingBox
};
