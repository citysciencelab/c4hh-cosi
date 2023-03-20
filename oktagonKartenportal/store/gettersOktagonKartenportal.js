
import {generateSimpleGetters} from ".../../../src/app-store/utils/generators";
import resetTreeState from "./stateOktagonKartenportal";

const getters = {
    ...generateSimpleGetters(resetTreeState),
    /**
    * Creates the submit url
    * @param {Object} state state Current state object of the store.
    * @param  {Object} submitObject contains the submit parameters
    * @returns {String} returns the submit url
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
    * Returns the parameter value
    * @param {Object} parameterObject contains the url parameter and the property which is asked.
    * @returns {String} returns the parmeter value
    */
    getParameterValue: () => (parameterObject) => {
        return parameterObject.result[parameterObject.property];
    },
    /**
    * Handels the Bezirk URL parameter
    * @param {String} districtFromUrl contains the "Bezirk" URL String.
    * @returns {void} returns the distirct string if it exists in config.
    */
    hasDistrict: () => (districtFromUrl) => {
        let geometries,
            districtNameToZoom = "";

        if (Object.prototype.hasOwnProperty.call(Config, "zoomTo") && Config.zoomTo[0]?.allowedValues) {
            geometries = Config.zoomTo[0]?.allowedValues;
        }
        if (geometries && districtFromUrl && geometries.includes(districtFromUrl.toUpperCase())) {
            districtNameToZoom = districtFromUrl.toUpperCase();
        }

        return districtNameToZoom;
    }
};

export default getters;
