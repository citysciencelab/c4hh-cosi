import {mainMenu} from "@shared/js/utils/constants";
import {trackMatomoPageView} from "../trackMatomo.js";
import {getLayerSelectionUrlSegement} from "../util.js";

/**
 * Tracks navigating in the layer selection breadcrumb and reports the resulting page view.
 * Triggered by: Click on a link in the breadcrumb list in "Themen hinzufügen".
 * @param {Object} [payload] the action-payload
 * @param {Boolean} [payload.doNotTrack] Additional flag for user tracking observing this action.
 * @param {String} [payload.lastFolderName] The name of the folder navigated into; navigation into "root" is ignored.
 * @param {Object} store The vuex store.
 * @returns {void}
 */
export function handleLayerNavigate (payload, store) {
    if (payload?.doNotTrack || payload?.lastFolderName === "root") {
        return;
    }

    const page = store.getters["UserTracking/getCurrentPage"](mainMenu),
        urlSegement = getLayerSelectionUrlSegement(store);

    trackMatomoPageView(`${page.url}${urlSegement}`, page.title);
}
