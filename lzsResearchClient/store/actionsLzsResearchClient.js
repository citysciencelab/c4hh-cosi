import axios from "axios";
import {buildEndpointUrl} from "../utils/buildEndpointUrl";

// will be imported later..
const Token = "";

export default {
    /**
     * Fetch the dataclass list from the API and store it in Vuex.
     * @param {object} context - Vuex action context (state, commit).
     */
    async fetchDataClassList ({state, commit}) {
        const params = {
                Token: Token
            },
            url = buildEndpointUrl(`${state.apiBasePath}/rest/dataclass/list`, params),
            response = await axios.get(url, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }),
            archiveList = [];

        response.data.forEach(archive => {
            archiveList.push({id: archive.id, name: archive.name});
        });

        commit("setArchiveList", archiveList);
        commit("setDataClassList", response.data);
    },
    /**
     * Search dataclass instances by attribute payload and commit results.
     * @param {object} context - Vuex action context (state, commit).
     * @param {object} payload - Search payload sent to the API.
     */
    async searchByAttribute ({state, commit}, payload) {
        commit("setSearchAttributeResponse", []);
        const params = {
                Token: Token,
                f: "json",
                preventCache: Date.now()
            },
            url = buildEndpointUrl(`${state.apiBasePath}/rest/dataclassinstance/search`, params),
            response = await axios.post(url, payload),
            searchAttributeResponse = [];

        response.data.forEach(element => {
            searchAttributeResponse.push({
                archiveId: element.dataclassId,
                instanceId: element.dataclassinstanceId,
                attributes: element.dataclassinstanceAttributeArr.filter(attr => attr.type !== "P")
            });
        });

        commit("setSearchAttributeResponse", searchAttributeResponse);
    },
    /**
     * Load placeholder JSON file from portalconfigs and commit it to the store.
     * @param {object} context - Vuex action context (state, commit).
     */
    async fetchPlaceholders ({state, commit}) {
        const timestamp = Date.now(),
            response = await axios.get(state.placeholderJsonPath + "?t=" + timestamp);

        commit("setPlaceholderDataClassList", response.data);
    },
    /**
     * Request available years for a given archive and add them to the store.
     * @param {object} context - Vuex action context (state, commit).
     * @param {string} archiveId - Archive identifier to request years for.
     */
    async fetchYears ({state, commit}, archiveId) {
        const params = {
                Token: Token,
                f: "json",
                preventCache: Date.now()
            },
            url = buildEndpointUrl(`${state.apiBasePath}/rest/geodatamanagement/dataclass/computeyears`, params),
            response = await axios.post(url, [archiveId]);

        // response.data?.forEach(year => {
        commit("addArchiveYear", {
            [archiveId]: {
                years: response?.data,
                archiveName: (state.archiveList.find(a => a.id === archiveId) || {}).name
            }
        });
        // });
    },
    /**
     * Send a geometry-based search request.
     * @param {object} context - Vuex action context (state).
     * @param {object} payload - Search payload including geometry and attributes.
     * @returns {Promise} Axios response from the search API.
     */
    async searchByGeometry ({state, commit}, payload) {
        // const payload = {
        //     // These two will be selectedArchivIds from component.
        //     // Conditional if there is a year selected or not.
        //     "dataclassIdsWithJahrgang": [
        //         "DKL_3DSTADT_LOD1",
        //         "DKL_AFIS_EINZEL",
        //         "DKL_ALKIS_GRAFIK"
        //     ],
        //     "dataclassIdsWithoutJahrgang": [],
        //     "srs": 25832,
        //     // feature geomerty here..
        //     "featuregeometrie": {
        //         "type": "Polygon",
        //         "coordinates": [
        //             [
        //                 [
        //                     534926.936499873,
        //                     5921380.215985099
        //                 ],
        //                 [
        //                     598427.063500127,
        //                     5921380.215985099
        //                 ],
        //                 [
        //                     598427.063500127,
        //                     5950186.784014901
        //                 ],
        //                 [
        //                     534926.936499873,
        //                     5950186.784014901
        //                 ],
        //                 [
        //                     534926.936499873,
        //                     5921380.215985099
        //                 ]
        //             ]
        //         ]
        //     },
        //     // years list in component will be here..
        //     "featureDataclassAttribs": [
        //         {
        //             "id": "JAHRGANG",
        //             "type": "I",
        //             "value": "2022"
        //         },
        //         {
        //             "id": "JAHRGANG",
        //             "type": "I",
        //             "value": "2023"
        //         }
        //     ]
        // };

        commit("setSearchAttributeResponse", []);

        const params = {
                Token: Token,
                f: "json",
                preventCache: Date.now()
            },
            url = buildEndpointUrl(`${state.apiBasePath}/rest/geodatamanagement/searchfeatures`, params),
            response = await axios.post(url, payload),
            searchAttributeResponse = [];

        response.data.foundItems.forEach(element => {
            searchAttributeResponse.push({
                archiveId: element.dklId,
                attributes: element.dklAttributeList.filter(attr => attr.type !== "P"),
                instanceId: element.dklInstanceId
            });
        });

        commit("setSearchAttributeResponse", searchAttributeResponse);

        return response;
    }
};
