
import {generateSimpleGetters} from "../../../src/shared/js/utils/generators.js";
import resetTreeState from "./stateOktagon.js";

const getters = {
    ...generateSimpleGetters(resetTreeState),
    /**
    * Creates a submit URL by appending the given parameters to the base returnURL.
    * @param {Object} state - The current local state of the store.
    * @returns {function(Object): String} Function that accepts a parameter object and returns the constructed submit URL.
    */
    createSubmitURL: state => (submitObject) => {
        let submitURL = state.returnURL;

        if (submitURL && submitURL.includes("?")) {
            submitURL += "&";
        }
        else {
            submitURL += "?";
        }
        Object.keys(submitObject).forEach((prop, index) => {
            if (index > 0) {
                submitURL += "&";
            }
            submitURL += prop + "=" + submitObject[prop];
        });

        return submitURL;
    },
    /**
    * Returns the value of a specific property from a given parameter object.
    * @returns {function(Object): String} Function that accepts a parameter object with `result` (Object) and `property` (String) and returns the corresponding value.
    */
    getParameterValue: () => (parameterObject) => {
        return parameterObject.result[parameterObject.property];
    },
    /**
    * Checks if a given district (from URL) is valid and allowed in the configuration.
    * @param {Object} _ - oktagon state.
    * @param {Object} __ - oktagon getters.
    * @param {Object} ___ - Root state.
    * @param {Object} rootGetters - All root getters of the store.
    * @returns {function(String): String} Function that accepts the district string from the URL and returns the valid district name (uppercase) if found in config, otherwise an empty string.
    */
    hasDistrict: (___, __, _, rootGetters) => (districtFromUrl) => {
        let geometries,
            districtNameToZoom = "";

        if (Object.prototype.hasOwnProperty.call(rootGetters, "zoomTo") && rootGetters.zoomTo[0]?.allowedValues) {
            geometries = rootGetters.zoomTo[0]?.allowedValues;
        }
        if (geometries && districtFromUrl && geometries.includes(districtFromUrl.toUpperCase())) {
            districtNameToZoom = districtFromUrl.toUpperCase();
        }
        return districtNameToZoom;
    }
};

export default getters;
