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
    },
    /**
     * Request primarydata for a given archive and instance and add them to the store.
     * @param {Object} context - Vuex action context (state, commit).
     * @param {Object} payload
     * @param {String} payload.archiveId - Archive identifier to request primarydata for.
     * @param {String} payload.instanceId - Instance identifier to request primarydata for.
     */
    async fetchPrimarydata ({state, commit}, payload) {
        const {archiveId, instanceId} = payload,
            params = {
                Token: Token,
                f: "json",
                preventCache: Date.now()
            },
            url = buildEndpointUrl(`${state.apiBasePath}/rest/primarydata/${archiveId}/${instanceId}`, params),
            response = await axios.get(url);

        commit("addPrimaryDataToInstance", {
            instanceId: instanceId,
            primaryData: response?.data
        });
    },
    /**
     * Download the preview picture for a given primaryDataId and add it to the store.
     * Return already stored preview picture if available for the given primaryDataId
     * @param {Object} context - Vuex action context (state, commit).
     * @param {Object} payload
     * @param {String} payload.archiveId - Archive identifier to request preview for.
     * @param {String} payload.instanceId - Instance identifier to request preview for.
     * @param {String} payload.primaryDataId - Primary data identifier to request preview for.
     */
    async downloadPreview ({state}, payload) {
        const {archiveId, instanceId, primaryDataId} = payload,
            params = {
                Token: Token,
                f: "json",
                preventCache: Date.now()
            },
            url = buildEndpointUrl(`${state.apiBasePath}/rest/primarydata/${archiveId}/${instanceId}/${primaryDataId}/${params.preventCache}/contentpreview`, params),
            existingInstanceData = state.searchAttributeResponse?.filter((datasets) => {
                return datasets.instanceId === instanceId;
            }),
            existingPrimaryData = existingInstanceData ? existingInstanceData[0].primaryData?.filter((primary) => {
                return primary.primaryDataId === primaryDataId;
            }) : [];

        if (existingPrimaryData && existingPrimaryData.length === 1 && existingPrimaryData[0].previewData) {
            return existingPrimaryData[0].previewData;
        }

        const response = await axios.get(url, {responseType: "blob"}),
            blobURL = window.URL.createObjectURL(response.data);

        existingPrimaryData[0].previewData = blobURL;

        return blobURL;
    },
    /**
     * Download the dataset for a given primaryDataId and open the 'save' dialog.
     * @param {Object} context - Vuex action context (state).
     * @param {Object} payload
     * @param {String} payload.archiveId - Archive identifier to download the dataset for.
     * @param {String} payload.instanceId - Instance identifier to download the dataset for.
     * @param {String} payload.primaryDataId - Primary data identifier to download the dataset for.
     */
    downloadDatafile ({state}, payload) {
        const {archiveId, instanceId, primaryDataId} = payload,
            params = {
                Token: Token
            },
            url = buildEndpointUrl(`${state.apiBasePath}/rest/primarydata/${archiveId}/${instanceId}/${primaryDataId}/content`, params);

        // create an invisible link to open 'save' dialog on click
        const link = document.createElement("a");

        link.href = url;
        link.download = ""; // the browser uses the filename delivered by the server (Content-Disposition)
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
