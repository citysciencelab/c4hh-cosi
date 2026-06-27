import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateIsochrones from "./stateIsochrones.js";
import * as constantsRouting from "../constantsRouting.js";

/**
 * The getters for the routing isochrones.
 * @module modules/routing/store/isochrones/getters
 */
const getters = {
    /**
     * Returns an object of simple getters for a state object, where
     * simple means that they will just return an entry for any key.
     * For example, given a state object {key: value}, an object
     * {key: state => state[key]} will be returned.
     * This is useful to avoid writing basic operations.
     * @param {Object} state state to generate getters for
     * @returns {Object.<string, Function>} object of getters
     */
    ...generateSimpleGetters(stateIsochrones),
    /**
     * Gets the avoid speed profile options for the currently selected speed profile.
     * @param {Object} params with the configured settings
     * @param {Object} [params.settings] settings from stateIsochrones
     * @param {string} [params.settings.speedProfile] selected speedProfile
     * @param {string[]} [params.routingAvoidFeaturesOptions] selected avoid options
     * @returns {string[]} avoid speed profile options
     */
    selectedAvoidSpeedProfileOptions ({settings, routingAvoidFeaturesOptions}) {
        return constantsRouting.avoidSpeedProfileOptions.filter((option) => option.availableProfiles.includes(settings.speedProfile) && routingAvoidFeaturesOptions.includes(option.id));
    },
    /**
     * Checks if input is disabled.
     * @param {Object} params from stateIsochrones
     * @param {boolean} [params.isLoadingDirections] if the directions are currently loaded
     * @returns {boolean} true if input is disabled
     */
    isInputDisabled ({isLoadingIsochrones}) {
        return isLoadingIsochrones;
    },
    /**
     * Check if all HGV parameters are valid.
     * @param {Object} state state
     * @returns {boolean} true if all parameters are valid
     */
    allHGVRestrictionsValid (state) {
        return Object.values(state.isochronesRestrictionIsValid).every(val => val);
    }
};

export default getters;
