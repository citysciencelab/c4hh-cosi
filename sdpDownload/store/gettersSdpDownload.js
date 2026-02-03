
import {generateSimpleGetters} from "../../../src/shared/js/utils/generators.js";
import sdpAddonState from "./stateSdpDownload.js";

const getters = {
    ...generateSimpleGetters(sdpAddonState),

    /**
     * Provides state for urlParams, returns only type, name and icon.
     * @param {Object} state state of the app-store.
     * @returns {Object} state for urlParams
     */
    urlParams: state => {
        return {
            type: state.type,
            name: state.name,
            icon: state.icon
        };
    }
};

export default getters;
