import {mainMenu} from "@shared/js/utils/constants";
import {trackMatomoPageView} from "../trackMatomo.js";
import {isPayloadValid} from "../util.js";

/**
 * Tracks a search as a page view, debounced to avoid tracking every keystroke.
 * Triggered by: Adding a character to the search input in the main menu.
 * @param {Object} payload The action payload.
 * @param {String} payload.searchInput The current content of the search input.
 * @param {Object} store The vuex store.
 * @returns {void}
 */
export function handleSearch (payload, store) {
    store.dispatch("UserTracking/forceClearSearchBarTimeout");

    if (
        !Config?.userTracking?.global?.privacy?.allowInputTracking
        || !isPayloadValid({funcName: handleSearch.name, payload})
        || !payload.searchInput
    ) {
        return;
    }

    const searchBarInputTimeoutId = setTimeout(() => {
        const page = store.getters["UserTracking/getCurrentPage"](mainMenu);

        store.commit("UserTracking/setSearchBarInputTimeoutId", null);

        trackMatomoPageView(
            `${page.url}?q=${encodeURIComponent(payload.searchInput)}`,
            `${page.title}: ${payload.searchInput}`
        );
    }, 500);

    store.commit("UserTracking/setSearchBarInputTimeoutId", searchBarInputTimeoutId);
}
