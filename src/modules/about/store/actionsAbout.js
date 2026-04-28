import getCswRecordById from "@shared/js/api/getCswRecordById.js";
import packageJson from "../../../../package.json";

/**
 * The actions for the About module
 * @module modules/About/actions
 */
export default {
    /**
     * set all info for the portal
     * @param {Object} context the vue context
     * @param {Object} context.commit the commit
     * @param {Object} context.dispatch the dispatch
     * @param {Object} context.state the state
     * @param {Object} context.rootGetters the rootGetters
     * @returns {void}
     */
    async initializeAboutInfo ({commit, dispatch, state, rootGetters}) {
        let metadata;

        if (state.cswUrl && state.metaId) {
            try {
                metadata = await getCswRecordById.getRecordById(state.cswUrl, state.metaId);
            }
            catch (e) {
                console.warn("CSW request failed:", e);
            }
        }
        // use default csw_url from rest-services.json if csw_url not stated in the specific service
        else if (Config.cswId && typeof state.metaId !== "undefined") {
            const service = rootGetters.restServiceById(Config.cswId);
            let metaURL = "";

            commit("setCustomText", null);
            if (!service) {
                console.warn("Rest Service with the ID " + Config.cswId + " is not configured in rest-services.json!");
            }
            else {
                metaURL = service.url;
            }

            if (metaURL && state.metaId) {
                try {
                    metadata = await getCswRecordById.getRecordById(metaURL, state.metaId);
                }
                catch (e) {
                    console.warn("CSW fallback request failed:", e);
                }
            }
        }

        if (typeof metadata !== "undefined") {
            commit("setTitle", metadata?.getTitle());
            commit("setAbstractText", metadata?.getAbstract());
            if (metadata?.getContact()) {
                commit("setContact", metadata?.getContact());
            }
            else {
                commit("setContact", metadata?.getPublisher());
            }
        }

        dispatch("currentMasterportalVersionNumber");
    },

    /**
     * Returns current Masterportal Version Number
     * @param {Object} context.commit the commit
     * @param {Object} context.state the state
     * @returns {String} Masterportal version number
     */
    currentMasterportalVersionNumber ({commit, state}) {
        commit("setVersion", state.version === true ? packageJson.version : state.version);
    }
};
