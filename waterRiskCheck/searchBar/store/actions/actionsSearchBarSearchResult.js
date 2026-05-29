import coreSearchBarSearchResultActions from "@modules/searchBar/store/actions/actionsSearchBarSearchResult.js";

/**
 * Reuse core searchBar search-result actions in the addon module.
 * Keep addon overrides local and minimal by extending this object only when needed.
 */
export default {
    ...coreSearchBarSearchResultActions
};
