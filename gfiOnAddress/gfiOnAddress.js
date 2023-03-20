import {search} from "@masterportal/masterportalapi/src/searchAddress";

import store from "../../src/app-store";
import {createGfiFeature} from "../../src/api/gfi/getWmsFeaturesByMimeType";

Backbone.Events.listenTo(Radio.channel("Searchbar"), {
    "hit": startGfi
});

/**
 * Starts the gfi with hit type properties.
 * Note: only for gazetteer addresses.
 * @param {Object} hit The clicked search hit.
 * @returns {void}
 */
async function startGfi (hit) {
    const gazetteerConfig = store.getters?.portalConfig?.searchBar?.gazetteer;

    if (gazetteerConfig?.gfiOnClick === true && hit?.type === i18next.t("common:modules.searchbar.type.address")) {
        const searchResult = hit.storedQuery === "houseNumbersForStreet" ? startSearch(hit) : hit,
            feature = createFeature(await searchResult, gazetteerConfig);

        store.commit("Maps/setClickCoordinate", [hit.coordinate[0], hit.coordinate[1]]);
        store.commit("Tools/Gfi/setGfiFeatures", [feature]);
    }
}

/**
 * Starts the search for an address.
 * @param {Object} hit The clicked search hit.
 * @returns {Object} The search result.
 */
async function startSearch (hit) {
    let searchResults = [];

    try {
        searchResults = await search(hit.name, {
            map: mapCollection.getMap("2D"),
            searchAddress: true
        }, false);
    }
    catch (e) {
        console.error(e);
    }

    return searchResults.length > 0 ? searchResults[0] : searchResults;
}

/**
 * Create feature to use it for the gfi.
 * @param {Object} searchResult The clicked search result.
 * @param {Object} gazetteerConfig The config of gazetter.
 * @returns {Object} The feature.
 */
export function createFeature (searchResult, gazetteerConfig) {
    const feature = createGfiFeature(
        createLayer(searchResult, gazetteerConfig),
        null, // for url
        {
            getProperties: () => prepareProperties(searchResult.properties)
        }
    );

    return feature;
}

/**
 * Creates an layer object to use it for the gfi.
 * @param {Object} searchResult The clicked search result.
 * @param {Object} gazetteerConfig The config of gazetter.
 * @returns {Object} The layer.
 */
export function createLayer (searchResult, gazetteerConfig) {
    const service = store?.getters?.getRestServiceById(gazetteerConfig.serviceId),
        layer = {
            get: (key) => {
                if (key === "name") {
                    return i18next.t("additional:modules.gfiOnAddress.title", {searchResultName: searchResult.name});
                }
                else if (key === "gfiTheme") {
                    return gazetteerConfig.gfiTheme || service?.gfiTheme || "default";
                }
                else if (key === "gfiAttributes") {
                    return gazetteerConfig.gfiAttributes || service?.gfiAttributes || "showAll";
                }
                return null;
            }
        };

    return layer;
}

/**
 * Prepare properties object values to strings.
 * @param {Object} properties The gfi properties
 * @returns {Object} prepared properties
 */
export function prepareProperties (properties) {
    const preparedProperties = {};

    Object.keys(properties).forEach(key => {
        let value = properties[key];

        if (typeof value === "object") {
            value = value._;
        }

        preparedProperties[key] = value;
    });

    return preparedProperties;
}
