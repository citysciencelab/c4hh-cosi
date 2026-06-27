import axios from "axios";
import {point} from "@turf/helpers";

/**
 * Gets the WCS Points as GeoJSON features.
 * @param {String} baseUrl The base url of the request.
 * @param {String} coverageId The coverage id to request.
 * @param {Number[]} bbox The bbox to use for the request.
 * @param {String} epsg The epsg code.
 * @returns {Object[]} a list of point features in GeoJSON format.
 */
async function getWCSPoints (baseUrl, coverageId, bbox, epsg) {
    if (!Array.isArray(bbox) || bbox.length !== 4) {
        return [];
    }
    const lon = [bbox[0], bbox[2]],
        lat = [bbox[1], bbox[3]];
    let url = baseUrl;

    url += `?service=WCS&version=2.0.1&CoverageId=${coverageId}&request=GetCoverage&subset=Lat(${lat.join(",")})&subset=Long(${lon.join(",")})&format=text/plain&subsettingcrs=` + epsg;

    return new Promise((resolve, reject) => {
        axios.get(url, {
            headers: {
                accept: "text/plain"
            }
        }).then(response => {
            if (response.status !== 200) {
                reject(`Response was returned with code ${response.status}: ${response.statusText}`);
                return;
            }
            const lines = response.data.split("\n"),
                pointsToGather = [];

            lines.forEach(line => {
                const columns = line.split(" "),
                    value = isNaN(columns[2]) ? columns.pop() : Number(columns.pop());

                if (value === 32767 || !columns.length) {
                    return;
                }
                pointsToGather.push(point(columns, {value}));
            });
            resolve(pointsToGather);
        }).catch(error => reject(error));
    });
}


export default {
    getWCSPoints
};
