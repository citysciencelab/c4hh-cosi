import requestIsochrones from "./requestIsochrones";
<<<<<<< HEAD:cosi/AccessibilityAnalysis/utils/createIsochrones.js
import {transformFeatures} from "../../utils/features/transform";
<<<<<<< HEAD
import {multiPolygon as turfMultiPolygon, polygon as turfPolygon} from "@turf/helpers";
=======
import {transformCoordinate} from "./transformCoordinates";
=======
import {readFeatures} from "../components/util.js";
import {transformFeatures} from "../../utils/features/transform";
>>>>>>> 39389637 (add new addons_3_0_0 structure-add missing addons):cosi/AccessibilityAnalysis/service/createIsochrones.js
import {polygon as turfPolygon} from "@turf/helpers";
>>>>>>> cbf2be88 (add new addons_3_0_0 structure-add missing addons)
import {default as turfUnion} from "@turf/union";
import {default as turfBooleanPointInPolygon} from "@turf/boolean-point-in-polygon";
import axios from "axios";
<<<<<<< HEAD:cosi/AccessibilityAnalysis/utils/createIsochrones.js
=======
import * as Proj from "ol/proj.js";
>>>>>>> 39389637 (add new addons_3_0_0 structure-add missing addons):cosi/AccessibilityAnalysis/service/createIsochrones.js
import GeoJSON from "ol/format/GeoJSON";

let abortController,
    filterPoly;


/**
 *
 * @return {*} filterPoly
 */
export function getFilterPoly () {
    return filterPoly;
}

/**
 *
 * @export
 * @param {Array} coords coords
 * @param {String} geomType "MultiPolygon" or "Polygon"
 * @return {void}
 */
export function setFilterPoly (coords, geomType) {
    if (geomType === "MultiPolygon") {
        filterPoly = turfMultiPolygon(coords);
    }
    else {
        filterPoly = turfPolygon(coords);
    }
}


/**
 * create isochrones features
 * @export
<<<<<<< HEAD:cosi/AccessibilityAnalysis/utils/createIsochrones.js
 * @param {*} {transportType, coordinates, scaleUnit, distance, maxDistance, batchSize, baseUrl} parameters
 * @param {*} progress progress callback
 * @return {*} features
 */
export async function createIsochrones ({transportType, coordinates, scaleUnit, distance, maxDistance, batchSize, baseUrl, projectionCode}, progress) {
=======
 * @param {*} {transportType, coordinates, scaleUnit, distance, maxDistance, minDistance batchSize, baseUrl} parameters
 * @param {*} progress progress callback
 * @return {*} features
 */
export async function createIsochrones ({transportType, coordinates, scaleUnit, distance, maxDistance, minDistance, batchSize, baseUrl, projectionCode}, progress) {
>>>>>>> 39389637 (add new addons_3_0_0 structure-add missing addons):cosi/AccessibilityAnalysis/service/createIsochrones.js
    let ret;

    if (coordinates.length === 1) {
        progress(50);
<<<<<<< HEAD:cosi/AccessibilityAnalysis/utils/createIsochrones.js
        ret = await createIsochronesPoint(transportType, coordinates[0], scaleUnit, distance, maxDistance, baseUrl, projectionCode);
=======
        ret = await createIsochronesPoint(transportType, coordinates[0], scaleUnit, distance, maxDistance, minDistance, baseUrl, projectionCode);
>>>>>>> 39389637 (add new addons_3_0_0 structure-add missing addons):cosi/AccessibilityAnalysis/service/createIsochrones.js
        progress(100);
        return ret;
    }
    return createIsochronesPoints({transportType: transportType, coordinates: coordinates, scaleUnit: scaleUnit, distance: distance, maxDistance: maxDistance, selectedFacilityNames: null, batchSize: batchSize || 200, progress: progress, baseUrl: baseUrl, projectionCode: projectionCode});
}

/**
 * create isochrones features for selected several coordiantes
 * @param {*} transportType transportType
 * @param {*} coordinate coordinate
 * @param {*} scaleUnit scaleUnit
 * @param {*} distance distance
 * @param {*} maxDistance maxDistance
<<<<<<< HEAD:cosi/AccessibilityAnalysis/utils/createIsochrones.js
=======
 * @param {*} minDistance minDistance
>>>>>>> 39389637 (add new addons_3_0_0 structure-add missing addons):cosi/AccessibilityAnalysis/service/createIsochrones.js
 * @param {*} baseUrl baseUrl
 * @param {*} projectionCode projectionCode
 * @return {*} steps and features
 */
<<<<<<< HEAD:cosi/AccessibilityAnalysis/utils/createIsochrones.js
async function createIsochronesPoint (transportType, coordinate, scaleUnit, distance, maxDistance, baseUrl, projectionCode) {
=======
async function createIsochronesPoint (transportType, coordinate, scaleUnit, distance, maxDistance, minDistance, baseUrl, projectionCode) {
>>>>>>> 39389637 (add new addons_3_0_0 structure-add missing addons):cosi/AccessibilityAnalysis/service/createIsochrones.js
    if (abortController) {
        abortController.cancel();
    }
    abortController = axios.CancelToken.source();

    const
        range = scaleUnit === "time" ? distance * 60 : distance,
        maxRange = scaleUnit === "time" ? maxDistance * 60 : maxDistance,
        rangeArray = [range / 3, range * 2 / 3, range],
        json = await requestIsochrones(
            transportType,
            [coordinate],
            scaleUnit,
            maxDistance ? [...rangeArray, maxRange] : rangeArray,
            abortController,
            baseUrl
        ),

        // reverse JSON object sequence to render the isochrones in the correct order
        reversedFeatures = json.reverse(),
        featureType = "Erreichbarkeit ab einem Referenzpunkt";

    let newFeatures = reversedFeatures;

    newFeatures = transformFeatures(
        newFeatures,
        "EPSG:4326",
        projectionCode
    );

    newFeatures.forEach((feature) => {
        feature.set("featureType", featureType);
        feature.set("coordinate", [coordinate]);
    });

    return newFeatures;
}

/**
 * create isochrones features for selected several coordiantes
 * @param {Object} args {transportType, coordinates, scaleUnit, distance, maxDistance, selectedFacilityNames, batchSize, progress, baseUrl, projectionCode}
 * @param {*} args.coordinates coordinates
 * @param {*} args.scaleUnit scaleUnit
 * @param {*} args.distance distance
 * @param {*} args.maxDistance maxDistance
 * @param {*} args.selectedFacilityNames selectedFacilityNames
 * @param {*} args.batchSize batchSize
 * @param {*} args.progress progress callback
 * @param {*} args.baseUrl baseUrl
 * @param {*} args.projectionCode projectionCode
 * @return {*} features
 */
async function createIsochronesPoints (args) {
    args.progress(1);

    if (abortController) {
        abortController.cancel();
    }
    abortController = axios.CancelToken.source();

    const
        range = args.scaleUnit === "time" ? args.distance * 60 : args.distance,
        maxRange = args.scaleUnit === "time" ? args.maxDistance * 60 : args.maxDistance,
        rawRangeArray = [range, range * 2 / 3, range / 3],
        rangeArray = args.maxDistance ? [maxRange, ...rawRangeArray] : rawRangeArray,
        steps = rangeArray.length,

        // group coordinates into groups of 5
        coordinatesList = [],
        groupedFeaturesList = [],
        filteredCoordinates = filterPoly === undefined ? args.coordinates :
<<<<<<< HEAD
            args.coordinates.filter(c => turfBooleanPointInPolygon(c, filterPoly));
=======
<<<<<<< HEAD:cosi/AccessibilityAnalysis/utils/createIsochrones.js
            args.coordinates.filter(c => turfBooleanPointInPolygon(transformCoordinate(c, "EPSG:4326", args.projectionCode), filterPoly));
=======
            args.coordinates.filter(c => turfBooleanPointInPolygon(
                Proj.transform(c, "EPSG:4326", args.projectionCode), filterPoly));
>>>>>>> 39389637 (add new addons_3_0_0 structure-add missing addons):cosi/AccessibilityAnalysis/service/createIsochrones.js
>>>>>>> cbf2be88 (add new addons_3_0_0 structure-add missing addons)

    for (let i = 0; i < filteredCoordinates.length; i += args.batchSize) {
        const arrayItem = filteredCoordinates.slice(i, i + args.batchSize);

        coordinatesList.push(arrayItem);
    }

    let k = 0,
        features = [];

    for (const coords of coordinatesList) {
        try {
            const json = await requestIsochrones(
                    args.transportType,
                    coords,
                    args.scaleUnit,
                    rangeArray,
                    abortController,
                    args.baseUrl
                ),
                // reverse JSON object sequence to render the isochrones in the correct order
                // this reversion is intended for centrifugal isochrones (when range.length is larger than 1)
                reversedFeatures = json.reverse(),
                groupedFeatures = [];

            for (let i = 0; i < steps; i++) {
                groupedFeatures.push([]);
            }

            for (let i = 0; i < reversedFeatures.length; i = i + steps) {
                groupedFeatures[i % steps].push(reversedFeatures[i]);
                groupedFeatures[(i + 1) % steps].push(reversedFeatures[i + 1]);
                groupedFeatures[(i + 2) % steps].push(reversedFeatures[i + 2]);

                if (steps === 4) {
                    groupedFeatures[(i + 3) % steps].push(reversedFeatures[i + 3]);
                }
            }
            groupedFeaturesList.push(groupedFeatures);
        }
        catch (e) {
            if (e.response.data.error.code !== 3099) {
                throw e;
            }
        }
        args.progress(((k + 1) / coordinatesList.length) * 90);
        k++;
    }

    if (groupedFeaturesList.length) {
        const format = new GeoJSON();

        for (let i = 0; i < steps; i++) {
            let layeredList = groupedFeaturesList.map(groupedFeatures => groupedFeatures[i]),
                layerUnion,
                layerUnionFeatures;

            layeredList = [].concat(...layeredList);
            // convert to a turf.js feature
            layerUnion = format.writeFeatureObject(layeredList[0]);

            for (let j = 0; j < layeredList.length; j++) {
                try {
                    layerUnion = turfUnion(layerUnion, format.writeFeatureObject(layeredList[j]));
                }
                catch (e) {
                    console.error(e); // turf chokes one some resulting geometries
                }
            }
            // readGeometries
<<<<<<< HEAD:cosi/AccessibilityAnalysis/utils/createIsochrones.js
            layerUnionFeatures = new GeoJSON().readFeatures(JSON.stringify(layerUnion));
=======
            layerUnionFeatures = readFeatures(JSON.stringify(layerUnion));
>>>>>>> 39389637 (add new addons_3_0_0 structure-add missing addons):cosi/AccessibilityAnalysis/service/createIsochrones.js

            // TODO: get projections via arguments and/or store
            layerUnionFeatures = transformFeatures(layerUnionFeatures, "EPSG:4326", args.projectionCode);

            const featureType = "Erreichbarkeit im Gebiet";

            // TODO: add props to layers, like type of facility, unit of measured distance
            layerUnionFeatures.forEach(feature => {
                feature.set("featureType", featureType);
                feature.set("value", layeredList[0].get("value"));
                feature.set("mode", args.transportType);
                feature.set("unit", args.scaleUnit);
                feature.set("topic", args.selectedFacilityNames);
            });
            features = features.concat(layerUnionFeatures);
        }
    }
    args.progress(100);
    return features;
}

