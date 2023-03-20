import {buffer, createEmpty, extend, isEmpty} from "ol/extent";

/**
 * Calculates the extent of a set of features.
 * Also optional with a buffer.
 * @param {ol/Feature[]} features - The list of features.
 * @param {Number} [bufferValue=0] - The buffer for the extent.
 * @returns {Number[]|Boolean} The extent of the features or false for no extent.
 */
export default function calculateExtent (features, bufferValue = 0) {
    if (!Array.isArray(features)) {
        console.error("utils/features/calculateExtent: The first parameter must be an array, but got " + typeof features);
        return false;
    }
    if (typeof bufferValue !== "number") {
        console.error("utils/features/calculateExtent: The second parameter must be a number, but got " + typeof bufferValue);
        return false;
    }
    if (features.length > 0) {
        let extent = createEmpty();

        features.forEach(feature => {
            if (feature.getGeometry()) {
                extent = extend(extent, feature.getGeometry().getExtent());
            }
        });
        if (isEmpty(extent)) {
            return false;
        }
        return buffer(extent, parseFloat(bufferValue));
    }
    return false;
}
