/**
 * Contains global actions of the search bar.
 * @module modules/searchBar/store/actions/actionsSearchBar
 */
import actionsSearchBarResultList from "@modules/searchBar/store/actions/actionsSearchBarResultList.js";
import actionsSearchBarSearchInterfaces from "./actionsSearchBarSearchInterfaces.js";
import actionsSearchBarSearchResult from "./actionsSearchBarSearchResult.js";
import SearchInterface from "@modules/searchBar/searchInterfaces/searchInterface.js";

export default {
    ...actionsSearchBarResultList,
    ...actionsSearchBarSearchInterfaces,
    ...actionsSearchBarSearchResult,

    /**
     * Overwrite default values in search interface.
     * @param {Object} param.state the state
     * @returns {void}
     */
    overwriteDefaultValues: ({state}) => {
        SearchInterface.prototype.timeout = state.timeout;
    }
};
