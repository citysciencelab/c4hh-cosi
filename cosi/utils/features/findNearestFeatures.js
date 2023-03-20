import calculateExtent from "./calculateExtent";
import Feature from "ol/Feature";
import {getAllFeaturesByLayerId} from "./getAllFeaturesByLayerId";
import isObject from "../../../../src/utils/isObject";

/**
 * Finds the nearest feature(s) around the passed feature. Use the extent of the feature plus a buffer.
 * Increase the buffer until a feature is found.
 * @param {String} layerId - The layer id of the layer that belongs to the feature.
 * @param {ol/Feature} feature - The feature the nearest feature(s) are searched for.
 * @param {Number} initialBuffer - The initial buffer for the extent.
 * @param {Number} bufferIncrement - The buffer increment.
 * @param {Number} [maxIter=10] - The max number of iterations.
 * @param {String} [srsName=EPSG:25832] - The SRS to be used for returned features.
 * @return {ol/Feature[]|false} An array of ol features. False if something fails.
 */
async function findNearestFeatures (layerId, feature, initialBuffer, bufferIncrement, maxIter = 10, srsName = "EPSG:25832") {
    if (typeof layerId !== "string") {
        console.error(`utils/features/findNearestFeatures: The first parameter must be a string. Got ${typeof layerId} instead.`);
        return false;
    }
    if (!isObject(feature) || !(feature instanceof Feature)) {
        console.error("utils/features/findNearestFeatures: The second parameter must be an ol feature object, but got " + typeof feature);
        return false;
    }
    if (typeof initialBuffer !== "number") {
        console.error("utils/features/findNearestFeatures: The third parameter must be a number, but got " + typeof initialBuffer);
        return false;
    }
    if (typeof bufferIncrement !== "number") {
        console.error("utils/features/findNearestFeatures: The fourth parameter must be a number, but got " + typeof bufferIncrement);
        return false;
    }
    if (typeof maxIter !== "number") {
        console.error("utils/features/findNearestFeatures: The fifth parameter must be a number, but got " + typeof maxIter);
        return false;
    }
    if (typeof srsName !== "string") {
        console.error(`utils/features/findNearestFeatures: The sixth parameter must be a string. Got ${typeof srsName} instead.`);
        return false;
    }

    let buffer = initialBuffer,
        features = null,
        iter = 0;

    while (++iter < maxIter) {
        const extent = calculateExtent([feature], parseInt(buffer, 10));

        features = await getAllFeaturesByLayerId(layerId, formatBbox(extent, srsName), srsName);

        if (features.length) {
            return features;
        }

        buffer += bufferIncrement;
    }

    return features;
}

/**
 * Converts the passed bbox to a string and adds the name of the SRS to the bbox.
 * @param {Number[]} bbox - The bbox to add the SRS name to.
 * @param {String} [srsName=EPSG:25832] - The name of the passed SRS.
 * @returns {String} The bbox with the name of the SRS or an empty string.
 */
function formatBbox (bbox, srsName = "EPSG:25832") {
    if (!Array.isArray(bbox) || Array.isArray(bbox) && bbox.length !== 4) {
        console.error(`utils/features/findNearestFeatures: The first parameter must be an array of length 4. Got ${typeof bbox} and ${bbox?.length}.`);
        return "";
    }
    if (typeof srsName !== "string") {
        console.error(`utils/features/findNearestFeatures: The second parameter must be a string. Got ${typeof srsName} instead.`);
        return "";
    }

    return bbox.join(",") + "," + srsName;
}

module.exports = {
    findNearestFeatures,
    formatBbox
};
