import {isUrl} from "@shared/js/utils/urlHelper.js";

/**
 * The getters for the layerInformation.
 * @module modules/layerInformation/store/gettersLayerInformation
 */
export default {
    /**
     * Provides state for urlParams.
     * @param {Object} state state of the layerInformation store.
     * @returns {Object} state for urlParams
     */
    urlParams: state => {
        const layerInfoCopy = {...state.layerInfo},
            layerInfoEncoded = {};

        Object.entries(layerInfoCopy).forEach(([key, value]) => {
            let encoded = value;

            if (isUrl(value)) {
                encoded = encodeURIComponent(value);
            }
            layerInfoEncoded[key] = encoded;
        });

        return {
            layerInfo: layerInfoEncoded
        };
    }
};
