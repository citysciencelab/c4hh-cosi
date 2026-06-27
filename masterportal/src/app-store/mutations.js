import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateAppStore from "./state.js";

/**
 * The root mutations.
 * @module app-store/mutations
 */
export default {
    ...generateSimpleMutations(stateAppStore),

    /**
     * Sets the object to states layerConfig under the given parentKey.
     * @param {Object} state store state
     * @param {Object} payload the payload
     * @param {Object[]} payload.layerConfigs object to set to the parentKey
     * @param {String} payload.parentKey the key of the parent object
     * @returns {void}
     */
    setLayerConfigByParentKey (state, {layerConfigs, parentKey}) {
        state.layerConfig[parentKey] = layerConfigs;
    },

    /**
     * Sets the loaded config to true.
     * @param {Object} state store state
     * @param {String} config The config that is loaded
     * @returns {void}
     */
    setLoadedConfigs (state, config) {
        state.loadedConfigs[config] = true;
    },

    /**
     * Returns the configured value for mouseHover.
     * @param {Object} state - The state of the app-store.
     * @param {Boolean|Object} value - The value to set for mouseHover.
     * @returns {void}
     */
    setMouseHover (state, value) {
        state.portalConfig.map.mouseHover = value;
    },

    /**
     * Sets the given urlParams to state.urlParams.
     * @param {Object} state store state
     * @param {Object} payload the payload
     * @param {Object} payload.params new url params
     * @returns {void}
     */
    setUrlParams (state, {params}) {
        params.forEach((value, key) => {
            state.urlParams[key.toUpperCase()] = value;
        });

        try {
            state.layerUrlParams = JSON.parse(state.urlParams.LAYERS || "[]");
        }
        catch (e) {
            console.warn("Failed to parse LAYERS param:", e);
            state.layerUrlParams = [];
        }
    },
    /**
     * Sets the position to map3dParameter.camera.cameraPosition and sets
     * map3dParameter.camera.positionInitiallyUsed to true.
     * @param {Object} state store state
     * @param {Array} cameraPosition The cameraPosition to set
     * @returns {void}
     */
    useCameraPosition (state, cameraPosition) {
        state.portalConfig.map.map3dParameter.camera.cameraPosition = cameraPosition;
        state.portalConfig.map.map3dParameter.camera.positionInitiallyUsed = true;
    }
};
