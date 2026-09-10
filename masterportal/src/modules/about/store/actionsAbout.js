import getCswRecordById from "@shared/js/api/getCswRecordById.js";
import packageJson from "../../../../package.json";

/**
 * The actions for the About module
 * @module modules/About/actions
 */
export default {
    /**
     * Set all info for the portal.
     * @returns {void}
     */
    async initializeAboutInfo () {
        let metadata;

        if (this.cswUrl && this.metaId) {
            try {
                metadata = await getCswRecordById.getRecordById(this.cswUrl, this.metaId);
            }
            catch (e) {
                console.warn("CSW request failed:", e);
            }
        }
        // use default csw_url from rest-services.json if csw_url not stated in the specific service
        else if (Config.cswId && typeof this.metaId !== "undefined") {
            const {default: store} = await import("../../../app-store/index.js"),
                service = store.getters.restServiceById(Config.cswId);
            let metaURL = "";

            if (!service) {
                console.warn("Rest Service with the ID " + Config.cswId + " is not configured in rest-services.json!");
            }
            else {
                metaURL = service.url;
            }

            if (metaURL && this.metaId) {
                try {
                    metadata = await getCswRecordById.getRecordById(metaURL, this.metaId);
                }
                catch (e) {
                    console.warn("CSW fallback request failed:", e);
                }
            }
        }

        if (typeof metadata !== "undefined") {
            this.title = metadata?.getTitle();
            this.abstractText = metadata?.getAbstract();

            if (metadata?.getContact()) {
                this.contact = metadata?.getContact();
            }
            else {
                this.contact = metadata?.getPublisher();
            }
        }

        this.currentMasterportalVersionNumber();
    },

    /**
 * Sets the current Masterportal version number.
 * @returns {void}
 */
    currentMasterportalVersionNumber () {
        this.version = this.version === true ? packageJson.version : this.version;
    }
};
