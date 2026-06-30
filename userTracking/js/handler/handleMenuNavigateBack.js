import {trackMatomoPageView} from "../trackMatomo.js";
import {getLayerSelectionUrlSegement, isPayloadValid} from "../util.js";

/**
 * Tracks navigating back in the menu history and reports the resulting page view.
 * Triggered by: Click on the "< Menu"-button.
 *
 * Since the subscription fires after the action's mutations have been committed, the Menu
 * store already reflects the new (reduced) history depth. The tracking history is
 * synchronised to that depth.
 * Any excess entries caused by drift are removed before the page view is reported.
 *
 * In case the menu navigating back to is the "layerSelection" the layer-history is added
 * to the url.
 * @param {Object} payload The action payload.
 * @param {Boolean} [payload.doNotTrack] If true, the navigation is not tracked.
 * @param {String} payload.side The menu side that is navigated back (main or secondary menu).
 * @param {Object} store The vuex store.
 * @returns {void}
 */
export function handleMenuNavigateBack (payload, store) {
    store.dispatch("UserTracking/forceClearSearchBarTimeout");

    if (!isPayloadValid({funcName: handleMenuNavigateBack.name, payload}) || payload.doNotTrack) {
        return;
    }

    const menuHistoryLength = store.getters["Menu/navigationHistory"](payload.side).length,
        pageHistoryLength = store.getters["UserTracking/getPageHistoryLength"](payload.side),
        numberOfEntriesToRemove = Math.max(0, pageHistoryLength - (menuHistoryLength + 1));

    for (let i = 0; i < numberOfEntriesToRemove; i++) {
        store.commit("UserTracking/removeLastPageFromHistory", {side: payload.side});
    }

    const page = store.getters["UserTracking/getCurrentPage"](payload.side),
        urlSegment = page.url.endsWith("layerSelection")
            ? getLayerSelectionUrlSegement(store)
            : "";

    trackMatomoPageView(`${page.url}${urlSegment}`, page.title);
}
