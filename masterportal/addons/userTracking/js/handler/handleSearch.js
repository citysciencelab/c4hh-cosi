import {mainMenu} from "@shared/js/utils/constants";
import {trackMatomoEvent, trackMatomoPageView} from "../trackMatomo.js";
import {assembleSourceInfoForEvent, isPayloadValid} from "../util.js";

/**
 * Tracks a search as a page view, debounced to avoid tracking every keystroke.
 * Triggered by: Adding a character to the search input in the main menu.
 * @param {Object} payload The action payload.
 * @param {String} payload.searchInput The current content of the search input.
 * @param {Object} store The vuex store.
 * @returns {void}
 */
export function handleSearch (payload, store) {
    const funcName = "handleSearch";

    store.dispatch("UserTracking/forceClearSearchBarTimeout");

    if (
        !Config?.userTracking?.options?.enableInputTracking
        || !isPayloadValid({funcName, payload})
        || !payload.searchInput
    ) {
        return;
    }

    const _source = assembleSourceInfoForEvent(funcName);

    const searchBarInputTimeoutId = setTimeout(() => {
        // Actions
        trackMatomoEvent({
            category: "Layer",
            action: "Processed search",
            name: payload.searchInput,
            _source
        });

        // PageView
        const page = store.getters["UserTracking/getCurrentPage"](mainMenu);

        store.commit("UserTracking/setSearchBarInputTimeoutId", null);

        trackMatomoPageView({
            url: `${page.url}?q=${encodeURIComponent(payload.searchInput)}`,
            title: `${page.title}: ${payload.searchInput}`,
            _source
        });
    }, 500);

    store.commit("UserTracking/setSearchBarInputTimeoutId", searchBarInputTimeoutId);
}
