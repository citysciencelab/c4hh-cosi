import {getCenter as getCenterOfExtent} from "ol/extent";
import LineString from "ol/geom/LineString";
import thousandsSeparator from "../../../src/utils/thousandsSeparator";


/**
 * A function to return a dataset of the feature closest to the given coordinate.
 * @param {Number[]} coordinate The coordinate to calculate the distances to.
 * @param {ol/Feature[]} features An array of features to find the closest one from.
 * @param {String} knowledgeBaseKey The key to use for the distance in the result.
 * @param {String[]} propertyName All attribute that should be additionaly put into the result.
 * @param {Function} onsuccess A function function(data) with data as the resulting entry for the knowledge base. e.g. {name: ["KitaA", "KitaB"], distance: [3, 6]}
 * @param {Function} onerror A function to call on error as function(error) with error an instance of Error.
 * @returns {void}
 */
export default function nextFeatureByDistance (coordinate, features, knowledgeBaseKey, propertyName, onsuccess, onerror) {
    if (!Array.isArray(coordinate)) {
        if (typeof onerror === "function") {
            onerror(new Error("nextFeatureByDistance: coordinate is not an array"));
        }
        return;
    }
    else if (!Array.isArray(features)) {
        if (typeof onerror === "function") {
            onerror(new Error("nextFeatureByDistance: features is not an array"));
        }
        return;
    }
    else if (typeof knowledgeBaseKey !== "string") {
        if (typeof onerror === "function") {
            onerror(new Error("nextFeatureByDistance: to store the distance a knowledgeBaseKey is needed"));
        }
        return;
    }
    else if (!features.length) {
        if (typeof onsuccess === "function") {
            onsuccess({});
        }
        return;
    }
    const result = {};
    let closestFeature = null,
        closestDistance = false;

    features.forEach(feature => {
        const extent = feature.getGeometry().getExtent(),
            featureCenter = getCenterOfExtent(extent),
            line = new LineString([featureCenter, coordinate]),
            distance = line.getLength();

        if (closestDistance === false || distance < closestDistance) {
            closestFeature = feature;
            closestDistance = distance;
        }
    });

    if (Array.isArray(propertyName)) {
        propertyName.forEach(attrName => {
            result[attrName] = [closestFeature.get(attrName)];
        });
    }
    result[knowledgeBaseKey] = [thousandsSeparator(Math.round(closestDistance) / 1000)];

    if (typeof onsuccess === "function") {
        onsuccess(result);
    }
}
