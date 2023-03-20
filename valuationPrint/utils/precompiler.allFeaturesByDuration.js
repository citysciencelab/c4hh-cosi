import {fetchRoutingOrsDirections} from "../../../src/modules/tools/routing/utils/directions/routing-ors-directions.js";
import crs from "@masterportal/masterportalapi/src/crs";
import {getCenter as getCenterOfExtent} from "ol/extent";
import thousandsSeparator from "../../../src/utils/thousandsSeparator";
import isObject from "../../../src/utils/isObject.js";

/**
 * This function uses the routing tool to get real distance and duration for each given feature to the given coordinate.
 * @param {Number[]} coordinate The coordinate to calculate the distances to.
 * @param {ol/Feature[]} features An array of features to find the closest one from.
 * @param {String} knowledgeBaseKeyDuration The key to use for the duration in the result.
 * @param {String} knowledgeBaseKeyDistance The key to use for the distance in the result.
 * @param {String} speedProfile The so called speedProfile (see routing tool for more details - e.g. "FOOT" or "CAR").
 * @param {String[]} propertyName All attributes that should be additionaly put into the result.
 * @param {Function} onstart A function(msg) to call each time when the routing module is called
 * @param {Function} onsuccess A function(data) with data as the resulting entry for the knowledge base. e.g. {name: ["KitaA", "KitaB"], distance: [3, 6], duration: [4, 7]}
 * @param {Function} onerror A function to call on error as function(error) with error an instance of Error.
 * @returns {void}
 */
export default function allFeaturesByDuration (coordinate, features, knowledgeBaseKeyDuration, knowledgeBaseKeyDistance, speedProfile, propertyName, onstart, onsuccess, onerror) {
    getFeaturesAndRouting(coordinate, features, speedProfile, onstart, featuresAndRouting => {
        if (!Array.isArray(featuresAndRouting)) {
            onerror(new Error("allFeaturesByDuration: featuresAndRouting is not an array"));
            console.warn("featuresAndRouting", featuresAndRouting);
            return;
        }
        const result = {};

        featuresAndRouting.forEach(({feature, routing}) => {
            if (!isObject(feature) || !isObject(routing)) {
                return;
            }
            if (Array.isArray(propertyName)) {
                propertyName.forEach(attrName => {
                    if (!Array.isArray(result[attrName])) {
                        result[attrName] = [];
                    }
                    result[attrName].push(feature.get(attrName));
                });
            }
            if (typeof knowledgeBaseKeyDuration === "string") {
                if (!Array.isArray(result[knowledgeBaseKeyDuration])) {
                    result[knowledgeBaseKeyDuration] = [];
                }
                result[knowledgeBaseKeyDuration].push(Math.ceil(routing.duration / 60));
            }
            if (typeof knowledgeBaseKeyDistance === "string") {
                if (!Array.isArray(result[knowledgeBaseKeyDistance])) {
                    result[knowledgeBaseKeyDistance] = [];
                }
                result[knowledgeBaseKeyDistance].push(thousandsSeparator(Math.round(routing.distance)));
            }
        });

        onsuccess(result);
    }, onerror);
}

/**
 * Requests the routing tool to receive the details for all routes between coordinate and a features.
 * @param {Number[]} coordinate The coordinate to calculate the distances to.
 * @param {ol/Feature} features The features to request the details for.
 * @param {String} speedProfile The so called speedProfile (see routing tool for more details - e.g. "FOOT" or "CAR").
 * @param {Function} onstart a function(msg) to call each time when the routing module is called
 * @param {Function} onsuccess A function function(routing) routing the details from the routing tool, including duration and distance.
 * @param {Function} onerror A function to call on error as function(error) with error an instance of Error.
 * @param {Object[]} [result=[]] The result of the request - for recursion only.
 * @param {Number} [idx=0] The pointer to the current feature in features list - for recursion only.
 * @returns {void}
 */
function getFeaturesAndRouting (coordinate, features, speedProfile, onstart, onsuccess, onerror, result = [], idx = 0) {
    const feature = features[idx];

    if (!isObject(feature)) {
        onsuccess(result);
        return;
    }

    onstart(i18next.t("additional:modules.tools.valuationPrint.pleaseWait"));
    requestRoutingByFeature(coordinate, feature, speedProfile, routing => {
        result.push({feature, routing});
        getFeaturesAndRouting(coordinate, features, speedProfile, onstart, onsuccess, onerror, result, idx + 1);
    }, onerror);
}

/**
 * Requests the routing tool to receive the details for a route between coordinate and a feature.
 * @param {Number[]} coordinate The coordinate to calculate the distances to.
 * @param {ol/Feature} feature The feature to request the details for.
 * @param {String} speedProfile The so called speedProfile (see routing tool for more details - e.g. "FOOT" or "CAR").
 * @param {Function} onsuccess A function function(routing) routing the details from the routing tool, including duration and distance.
 * @param {Function} onerror A function to call on error as function(error) with error an instance of Error.
 * @returns {void}
 */
function requestRoutingByFeature (coordinate, feature, speedProfile, onsuccess, onerror) {
    if (typeof feature?.getGeometry !== "function") {
        onerror(new Error("requestRoutingByFeature: A feature given to the routing is not a valid ol feature."));
        return;
    }
    const extent = feature.getGeometry().getExtent(),
        featureCenter = getCenterOfExtent(extent),
        targetProjection = "EPSG:4326",
        sourceProjection = crs.getMapProjection(mapCollection.getMap("2D"));

    fetchRoutingOrsDirections({
        coordinates: [
            crs.transform(sourceProjection, targetProjection, coordinate),
            crs.transform(sourceProjection, targetProjection, featureCenter)
        ],
        transformCoordinatesToLocal: coords => coords,
        speedProfile,
        avoidSpeedProfileOptions: [],
        preference: "RECOMMENDED",
        avoidPolygons: {
            coordinates: [],
            type: "MultiPolygon"
        },
        instructions: false
    }).then(result => {
        onsuccess(result);
    }).catch(error => {
        onerror(error);
    });
}
