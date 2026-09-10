import {mainMenu, secondaryMenu} from "@shared/js/utils/constants";
import {getBaseUrl} from "../js/util";

/**
 * Creates the initial state for the UserTracking store module.
 * A factory function is used so that document-dependent values (title, URL)
 * are resolved at module registration time rather than at import time.
 * @returns {Object} The initial state.
 */
function createInitialState () {
    const baseUrl = getBaseUrl();

    return {
        history: {
            [mainMenu]: {page: [{title: document.title, url: `${baseUrl}${mainMenu}`}]},
            [secondaryMenu]: {page: [{title: document.title, url: `${baseUrl}${secondaryMenu}`}]}
        },
        searchBarInputTimeoutId: null
    };
}

export default createInitialState;
