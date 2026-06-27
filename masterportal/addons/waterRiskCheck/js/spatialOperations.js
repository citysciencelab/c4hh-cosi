import {intersect as turfIntersect} from "@turf/intersect";
import {featureCollection as turfFeatureCollection} from "@turf/helpers";
import {area as turfArea} from "@turf/area";
import {difference as turfDifference} from "@turf/difference";
import {buffer as turfBuffer} from "@turf/buffer";
import {pointsWithinPolygon} from "@turf/points-within-polygon";

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
        if (feature2 === null) {
            return;
        }

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
    if (feature === null) {
        return Object.groupBy(features, (gFeature) => {
            return gFeature.properties[property];
        });
    }

    const totalArea = turfArea(feature),
        groupedFeatures = Object.groupBy(features, (gFeature) => {
            return gFeature.properties[property];
        });

    Object.keys(groupedFeatures).forEach(key => {
        groupedFeatures[key + "_area"] = 0;
        groupedFeatures[key].forEach(groupedFeature => {
            groupedFeatures[key + "_area"] += turfArea(groupedFeature);
        });
        groupedFeatures[key + "_percent"] = groupedFeatures[key + "_area"] / totalArea;
    });
    return groupedFeatures;
}

/**
 * Calculates a buffer for passed features.
 * @param {GeoJSON[]} features - The features to buffer.
 * @param {Number} [radius=1] - Distance in meters to draw the buffer.
 * @returns {GeoJSON} The buffered features.
 */
function buffer (features, radius = 1) {
    const bufferedFeatures = [];

    if (typeof radius !== "number" || radius === 0) {
        return features;
    }

    features.forEach(feature => {
        bufferedFeatures.push(turfBuffer(feature, radius, {units: "meters"}));
    });
    return bufferedFeatures;
}

/**
 * Finds the point from all points with the highest value in the given polygons and returns it.
 * @param {Object[]} points The points as array.
 * @param {Object[]} polygons The polygons to check if any point is within.
 * @returns {Object|null} the found point or null.
 */
function findPointInPolygonsByHighestValue (points, polygons) {
    if (!Array.isArray(points) || !Array.isArray(polygons)) {
        return points;
    }
    const sortedPoints = points.sort((a, b) => b?.properties?.value - a?.properties?.value);
    let result = null;

    for (let i = 0; i < sortedPoints.length; i++) {
        const point = sortedPoints[i];

        for (let j = 0; j < polygons.length; j++) {
            if (pointsWithinPolygon(sortedPoints[i], polygons[j]).features.length) {
                result = point;
                break;
            }
        }
        if (result !== null) {
            break;
        }
    }

    return result;
}

export default {
    intersect,
    getUnbuiltArea,
    calcArea,
    buffer,
    findPointInPolygonsByHighestValue
};
