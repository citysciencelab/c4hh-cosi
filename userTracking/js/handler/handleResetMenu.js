import {trackMatomoPageView} from "../trackMatomo.js";
import {isPayloadValid} from "../util.js";

/**
 * Tracks resetting the menu and reports the resulting page view.
 * Triggered by: Click on the X-Button.
 * @param {String} payload The menu side that is reset (main or secondary menu).
 * @param {Object} store The vuex store.
 * @returns {void}
 */
export function handleResetMenu (payload, store) {
    if (!isPayloadValid({funcName: handleResetMenu.name, payload})) {
        return;
    }

    store.dispatch("UserTracking/forceClearSearchBarTimeout");
    store.commit("UserTracking/resetPageHistory", {side: payload});

    const page = store.getters["UserTracking/getCurrentPage"](payload);

    trackMatomoPageView(page.url, page.title);
}
