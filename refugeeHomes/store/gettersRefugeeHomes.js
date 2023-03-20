import {generateSimpleGetters} from "../../../src/app-store/utils/generators";
import state from "./stateRefugeeHomes";

const getters = {
    /**
     * Returns an object of simple getters for a state object, where
     * simple means that they will just return an entry for any key.
     * For example, given a state object {key: value}, an object
     * {key: state => state[key]} will be returned.
     * This is useful to avoid writing basic operations.
     * @param {object} state state to generate getters for
     * @returns {object.<string, function>} object of getters
     */
    ...generateSimpleGetters(state),
    /**
    * Returns the parameter value
    * @param {Object} parameterObject contains the url parameter and the property which is asked.
    * @returns {String} returns the parmeter value
    */
    getParameterValue: () => (parameterObject) => {
        return parameterObject.result[parameterObject.property];
    },
    /**
    * Handels the Bezirk URL parameter - check if district exists and converts district number to district name
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
        if (geometries && typeof districtFromUrl === "string" && districtFromUrl?.length === 1 && Number(districtFromUrl) < 8) {
            districtNameToZoom = geometries[Number(districtFromUrl) - 1];
        }
        return districtNameToZoom;
    }

};

export default getters;
