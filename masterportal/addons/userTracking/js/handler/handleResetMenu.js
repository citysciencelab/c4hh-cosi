import {trackMatomoEvent, trackMatomoPageView} from "../trackMatomo.js";
import {assembleSourceInfoForEvent, isPayloadValid} from "../util.js";

/**
 * Tracks resetting the menu and reports the resulting page view.
 * Triggered by: Click on the X-Button.
 * @param {String} payload The menu side that is reset (main or secondary menu).
 * @param {Object} store The vuex store.
 * @returns {void}
 */
export function handleResetMenu (payload, store) {
    const funcName = "handleResetMenu";

    if (!isPayloadValid({funcName, isArrayOrObject: false, payload})) {
        return;
    }

    store.dispatch("UserTracking/forceClearSearchBarTimeout");

    const _source = assembleSourceInfoForEvent(funcName);

    // Actions
    trackMatomoEvent({
        category: "Menu",
        action: "Clicked X-button (reset menu)",
        name: payload,
        _source
    });

    // PageView
    store.commit("UserTracking/resetPageHistory", {side: payload});

    const page = store.getters["UserTracking/getCurrentPage"](payload);

    trackMatomoPageView({
        url: page.url,
        title: page.title,
        _source
    });
}
