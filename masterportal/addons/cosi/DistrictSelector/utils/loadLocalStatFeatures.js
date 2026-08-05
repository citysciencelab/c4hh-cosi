import {GeoJSON} from "ol/format.js";

/**
 * In-flight or resolved responses per URL.
 * Statistical features are loaded district by district (104 Stadtteile), so
 * without this the same file would be fetched 104 times. Caching the Promise
 * — not the result — also collapses the concurrent first requests into one.
 * @type {Object<String, Promise<module:ol/Feature[]>>}
 */
const cache = {};

/**
 * Loads a self-hosted GeoJSON statistics layer and returns the features of one district.
 *
 * Unlike the WFS/OAF sources this cannot filter server side, so the whole file is
 * fetched once and filtered in memory. That is only viable for the small derived
 * datasets we generate ourselves (portal/cosi/tools/), not for upstream data.
 *
 * @param {String} url - the GeoJSON url, relative to the portal.
 * @param {String} keyOfAttrName - the attribute holding the district name.
 * @param {String} districtName - the district to filter for.
 * @returns {Promise<module:ol/Feature[]>} the district's features, empty if none match.
 */
export default async function loadLocalStatFeatures (url, keyOfAttrName, districtName) {
    if (!cache[url]) {
        cache[url] = fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(json => new GeoJSON().readFeatures(json))
            .catch(error => {
                console.error(`loadLocalStatFeatures: could not load ${url}`, error);
                // Drop the rejected promise so a later attempt can retry.
                delete cache[url];
                return [];
            });
    }

    const features = await cache[url];

    return features.filter(feature => feature.get(keyOfAttrName) === districtName);
}
