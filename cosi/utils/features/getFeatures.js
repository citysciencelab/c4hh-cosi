import {WFS, GeoJSON} from "ol/format.js";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList";
import wfsRequest from "@shared/js/api/wfs/getFeature";
import oafRequest from "@shared/js/api/oaf/getOAFFeature";
import {transformExtent} from "ol/proj";
import axios from "axios";

/**
 * Converts the passed bbox to a string and adds the name of the SRS to the bbox.
 * @param {Number[]} bbox - The bbox to add the SRS name to.
 * @param {String} [srsName=EPSG:25832] - The name of the passed SRS.
 * @returns {String | undefined} The bbox with the name of the SRS or an empty string.
 */
export function formatBbox (bbox, srsName = "EPSG:25832") {
    if (!Array.isArray(bbox) || Array.isArray(bbox) && bbox.length !== 4) {
        console.warn(`utils/features/getFeature/formatBbox: The first parameter must be an array of length 4. Got ${typeof bbox} and ${bbox?.length}.`);
        return undefined;
    }
    if (typeof srsName !== "string") {
        console.warn(`utils/features/getFeature/formatBbox: The second parameter must be a string. Got ${typeof srsName} instead.`);
        return undefined;
    }

    return bbox.join(",") + "," + srsName;
}

/**
 * Returns all features of a layer by the given layer id.
 * @param {String} layerId - The id of the layer.
 * @param {String|undefined} [bbox] - The BBOX to search for features.
 * @param {String|undefined} [srsName] - The SRS to be used for returned features.
 * @returns {ol/Feature[]} All features of the layer or an empty array.
 */
export async function getAllFeaturesByLayerId (layerId, bbox, srsName) {
    return getFeatures(layerId, {bbox, srsName});
}

/**
 * Returns features of a layer by a layerId.
 * @param {String} layerId - The id of the layer.
 * @param {Object} [opts] - The request options, such as bbox, filter, method.
 * @returns {Promise<ol/Feature[]>} All features of the layer or an empty array.
 */
export async function getFeatures (layerId, opts = {}) {
    if (typeof layerId !== "string") {
        console.error(`utils/features/getFeatures: layerId must be a string. Got ${typeof layerId} instead.`);
        return [];
    }
    const layer = rawLayerList.getLayerWhere({id: layerId});
    let response, features;

    if (!layer) {
        console.error(`utils/features/getFeatures: layer with the passed layerId (${layerId}) was not found.`);
        return [];
    }

    if (layer.typ === "WFS") {
        const wfsReader = new WFS({
            featureNS: layer?.featureNS,
            version: layer?.version
        });

        if (opts.method === "POST") {
            response = await wfsRequest.getFeaturePOST(layer.url, {
                ...opts,
                version: layer.version,
                featureTypes: [layer.featureType],
                featureNS: layer.featureNS,
                bbox: formatBbox(opts.bbox, opts.srsName)
            });
        }
        else {
            response = await wfsRequest.getFeatureGET(layer.url, {
                ...opts,
                service: "WFS",
                request: "GetFeature",
                version: layer.version,
                featureType: layer.featureType,
                featureNS: layer.featureNS,
                bbox: formatBbox(opts.bbox, opts.srsName)
            });
        }

        features = wfsReader.readFeatures(response);
    }
    else if (layer.typ === "OAF") {
        response = await oafRequest.getOAFFeatureGet({
            baseUrl: layer.url,
            collection: layer.collection,
            bbox: Array.isArray(opts.bbox) ? transformExtent(opts.bbox, opts.srsName || "EPSG:25832", "EPSG:4326") : opts.bbox,
            crs: layer.crs,
            limit: layer.limit || 1000,
            filter: opts.filter,
            filterCrs: opts.filterCrs,
            propertyNames: opts.propertyNames,
            literalFilters: opts.literalFilters
        });

        features = oafRequest.readAllOAFToGeoJSON(response);
    }
    else if (layer.typ === "GeoJSON") {
        const geoJsonReader = new GeoJSON();

        response = await axios.get(layer.url)
            .then(res => res.data)
            .catch(error => {
                console.error(error);
            });

        features = geoJsonReader.readFeatures(response, {
            dataProjection: "EPSG:4326",
            featureProjection: opts.srsName || "EPSG:25832"
        });
    }
    else {
        console.error(`utils/features/getFeatures: layer with the passed layerId (${layerId}) if not of type "WFS", "GeoJSON", or "OAF".`);
    }

    return features;
}

export default {
    getAllFeaturesByLayerId,
    getFeatures,
    formatBbox
};
