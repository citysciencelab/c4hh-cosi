import SearchInterfaceElasticSearch from "@modules/searchBar/searchInterfaces/searchInterfaceElasticSearch.js";
import SearchInterfaceGazetteer from "@modules/searchBar/searchInterfaces/searchInterfaceGazetteer.js";
import coreSearchBarSearchSearchInterfaces from "@modules/searchBar/store/actions/actionsSearchBarSearchInterfaces.js";

/**
 * Contains actions that communicate with the search interfaces.
 * @module modules/searchBar/store/actions/actionsSearchBarSearchInterfaces
 */

export default {
    ...coreSearchBarSearchSearchInterfaces,
    /**
     * Instantiate the configured search interfaces
     * and stores them in the state.
     * @param {Object} param.commit the commit
     * @param {Object} param.state the state
     * @param {Object[]} [searchInterfaceAddons=[]] The search interface addons.
     * @returns {void}
     */
    instantiateSearchInterfaces: ({commit, state}, searchInterfaceAddons = []) => {
        const searchInterfacesMapper = {
            elasticSearch: SearchInterfaceElasticSearch,
            gazetteer: SearchInterfaceGazetteer
        };

        Object.assign(searchInterfacesMapper, ...searchInterfaceAddons);
        commit("setSearchInterfaceInstances", []);
        commit("addMultipleSearchInterfaceIds");
        state.searchInterfaces.forEach(searchInterface => {
            const type = searchInterface.type;

            if (searchInterfacesMapper[type]) {
                commit("addSearchInterfaceInstances", new searchInterfacesMapper[type](searchInterface));
            }
            else {
                console.warn(`The searchInterface: "${type}" hasn't been implemented yet`);
            }
        });
    }
};
