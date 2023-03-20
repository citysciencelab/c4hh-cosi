import {search, setGazetteerUrl} from "@masterportal/masterportalapi/src/searchAddress";
import {Point} from "ol/geom.js";
import {sortObjectsByNestedAttributes} from "../../../../src/utils/sortObjects";

export default {
    /**
     * Sets the gazetteer URL in the masterportalAPI.
     * @param {Object} context The vuex context.
     * @returns {void}
     */
    setGazetteerUrl ({state, rootGetters}) {
        setGazetteerUrl(rootGetters.getRestServiceById(state.serviceId)?.url);
    },

    /**
     * Starts the processing of the entered address part or address.
     * @param {Object} context The vuex context.
     * @param {String} inputs The input part of an address.
     * @returns {void}
     */
    processInput ({dispatch}, inputs) {
        const input = inputs.evt.target.value,
            layer = inputs.layer;

        if (input.slice(-1) !== " " && input.length > 2) {
            dispatch("searchStreets", {input, layer});
        }
    },

    /**
     * Search for streets that contains the input.
     * @param {Object} context The vuex context.
     * @param {String} input The input part of a streetname.
     * @returns {void}
     */
    searchStreets ({rootGetters, dispatch}, {input, layer}) {
        search(input, {
            map: mapCollection.getMap(rootGetters["Maps/mode"]),
            searchStreets: true,
            searchStreetBeforeWord: false
        }, true)
            .then(streets => {
                const sortedStreetNames = streets.map(street => street.name).sort();

                dispatch("processStreetNames", {input, layer, sortedStreetNames});
            })
            .catch(error => {
                if (error.message.trim() !== "The operation was aborted." && error.message.trim() !== "The user aborted a request.") {
                    console.error("schoolRoutePlanning: An error occurred while searching.", error);
                }
            });
    },

    /**
     * Depending on the number of street names,
     * a distinction is made between searching for house numbers,
     * filtering or resetting everything.
     * @param {Object} context The vuex context.
     * @param {String} payload The payload.
     * @param {String} payload.input The input address.
     * @param {ol/Source} payload.layer Vector source of the route layer.
     * @param {String[]} payload.sortedStreetNames The sorted street names.
     * @returns {void}
     */
    processStreetNames ({commit, dispatch}, {input, layer, sortedStreetNames}) {
        if (sortedStreetNames.length === 1) {
            commit("setStreetNames", sortedStreetNames);
            dispatch("searchHousenumbers", {
                streetName: sortedStreetNames[0],
                eventType: "input"
            });
        }
        else if (sortedStreetNames.length > 0) {
            commit("setStreetNames", sortedStreetNames);
            commit("setHouseNumbers", []);
            commit("setFilteredHouseNumbers", []);
        }
        else {
            dispatch("filterHouseNumbers", {input, layer});
        }
    },

    /**
     * Search house number for a street name.
     * @param {Object} context The vuex context.
     * @param {Object} payload The payload.
     * @param {String} payload.streetName The streetname to search for housenumbers.
     * @param {String} payload.eventType The event type by means of which the input was made.
     * @returns {void}
     */
    searchHousenumbers ({rootGetters, commit}, payload) {
        const streetName = payload.streetName;

        if (payload?.eventType === "click") {
            commit("setStreetNames", [streetName]);
            commit("setInputAddress", streetName);
        }

        search(streetName, {
            map: mapCollection.getMap(rootGetters.mode),
            searchStreets: true,
            searchHouseNumbers: true,
            searchStreetBeforeWord: false
        })
            .then(response => {
                const houseNumbers = response.filter(value => value.type === "houseNumbersForStreet"),
                    sortedHouseNumbers = sortObjectsByNestedAttributes(houseNumbers, ["properties.hausnummernzusatz._", "properties.hausnummer._"]);

                commit("setHouseNumbers", sortedHouseNumbers);
                commit("setFilteredHouseNumbers", sortedHouseNumbers);
            })
            .catch(error => {
                if (error.message.trim() !== "The operation was aborted." && error.message.trim() !== "The user aborted a request.") {
                    console.error("schoolRoutePlanning: An error occurred while searching.", error);
                }
            });
    },

    /**
     * Filters by the address in the already loaded house numbers.
     * @param {Object} context The vuex context.
     * @param {Object} inputs The inputs.
     * @param {String} inputs.input The input address.
     * @param {ol/Source} inputs.layer Vector source of the route layer.
     * @returns {void}
     */
    filterHouseNumbers ({state, commit, dispatch}, inputs) {
        const input = inputs.input,
            filteredHouseNumbers = state.houseNumbers.filter(houseNumber => houseNumber.name.toLowerCase().includes(input.toLowerCase()));

        commit("setInputAddress", input);

        if (filteredHouseNumbers.length === 1) {
            dispatch("setGeometryByFeatureId", {
                id: "startPoint",
                source: inputs.layer.getSource(),
                geometry: new Point(filteredHouseNumbers[0].geometry.coordinates.map(coord => parseInt(coord, 10)))
            });
            dispatch("searchRegionalPrimarySchool", filteredHouseNumbers[0].name);
        }
        else {
            commit("setFilteredHouseNumbers", filteredHouseNumbers);
        }
    },

    /**
     * Find the house number to an input address.
     * @param {Object} context The vuex context.
     * @param {Object} inputs The inputs.
     * @param {String} inputs.input The input address.
     * @param {ol/Source} inputs.layer Vector source of the route layer.
     * @returns {void}
     */
    findHouseNumber ({state, commit, dispatch}, inputs) {
        const input = inputs.input,
            foundHouseNumber = state.houseNumbers.find(houseNumber => houseNumber.name === input);

        commit("setInputAddress", input);
        if (foundHouseNumber) {
            dispatch("setGeometryByFeatureId", {
                id: "startPoint",
                source: inputs.layer.getSource(),
                geometry: new Point(foundHouseNumber.geometry.coordinates.map(coord => parseInt(coord, 10)))
            });
            dispatch("searchRegionalPrimarySchool", foundHouseNumber.name);
            dispatch("selectSchool", {
                selectedSchoolId: state.selectedSchoolNumber?.id,
                layer: inputs.layer
            });
        }
    },

    /**
     * Search for the regional primary school to the given address.
     * @param {Object} context The vuex context.
     * @param {String} address The address to search the regional primary school
     * @returns {void}
     */
    searchRegionalPrimarySchool ({commit, rootGetters}, address) {
        search(address, {
            map: mapCollection.getMap(rootGetters["Maps/mode"]),
            searchAddress: true
        }).then(response => {
            commit("setRegionalPrimarySchool", response[0].properties.grundschulnr + "-0");
        });
    }
};
