import {intersect as turfIntersect} from "@turf/intersect";
import {featureCollection as turfFeatureCollection} from "@turf/helpers";
import {area as turfArea} from "@turf/area";
import {difference as turfDifference} from "@turf/difference";

/**
 * Gets the unbuilt area of the given parcel.
 * The difference between the parcel area and the building areas on this parcel.
 * If the parcel is unbuilt, the unbuilt area equals the parcel.
 * @param {GeoJSON} parcel - The parcel.
 * @param {GeoJSON[]} buildings - The buildings that belong to the parcel.
 * @returns {GeoJSON} The unbuilt area.
 */
function getUnbuiltArea (parcel, buildings) {
    if (!Array.isArray(buildings)) {
        return parcel;
    }
    const isParcelBuiltOn = buildings.length > 0;

    if (isParcelBuiltOn) {
        return turfDifference(turfFeatureCollection([parcel, ...buildings]));
    }
    return parcel;
}

/**
 * Intersects each feature from the given feature list with the second passed feature.
 * @param {GeoJSON[]} features - The features to intersect.
 * @param {GeoJSON} feature2 - Feature to intersect.
 * @returns {GeoJSON[]} Features representing the areas they share or an empty array.
 */
function intersect (features, feature2) {
    const intersected = [];

    features.forEach(feature => {
        const isIntersected = turfIntersect(turfFeatureCollection([feature, feature2]), {properties: feature.properties});

        if (isIntersected) {
            intersected.push(isIntersected);
        }
    });

    return intersected;
}

/**
 * Groups the given features by the passed property.
 * Calculates the area (in m²) and its share of the passed feature for each group.
 * @param {GeoJSON[]} features - The features to group.
 * @param {GeoJSON} feature - The feature that the shares are calculated from.
 * @param {String} property - A property of the passed features.
 * @returns {Object} The grouped features with the calculated values.
 */
function calcArea (features, feature, property) {
    const totalArea = turfArea(feature),
        groupedFeatures = Object.groupBy(features, (gFeature) => {
            return gFeature.properties[property];
        });

    Object.keys(groupedFeatures).forEach(key => {
        groupedFeatures[key + "_area"] = 0;
        groupedFeatures[key].forEach(groupedFeature => {
            groupedFeatures[key + "_area"] += turfArea(groupedFeature);
        });
        groupedFeatures[key + "_percent"] = (groupedFeatures[key + "_area"] / totalArea * 100).toFixed(2);
    });
    return groupedFeatures;
}

export {
    intersect,
    getUnbuiltArea,
    calcArea
};
