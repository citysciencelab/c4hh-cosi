
import {generateSimpleGetters} from "../../../../src_3_0_0/shared/js/utils/generators";
import sdpAddonState from "./stateSdpDownload";

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
