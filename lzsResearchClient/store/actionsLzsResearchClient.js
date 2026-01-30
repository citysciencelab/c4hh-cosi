import axios from "axios";
import {buildEndpointUrl} from "../utils/buildEndpointUrl";

export default {
    /**
     * Fetch a new request token, store it, and set the refresh schedule.
     *
     * @param {object} context - Vuex action context (commit, state).
     */
    async fetchRequestToken ({commit, state}) {
        try {
            const response = await axios.get(
                buildEndpointUrl(state.dispatchRequestUrl, {
                    preventCache: Date.now()
                })
            );

            commit("setRequestToken", response.data.token);
            commit("setRequestTokenExpireTime", response.data.expirationTime);
        }
        catch (error) {
            commit("setGlobalError", {
                type: "server",
                message: "Failed to fetch request token."
            });
        }
    },
    /**
     * Fetch the dataclass list from the API and store it in Vuex.
     * @param {object} context - Vuex action context (state, commit, dispatch).
     */
    async fetchDataClassList ({state, commit, dispatch}) {
        const params = {
                Token: state.requestToken
            },
            url = buildEndpointUrl(`${state.apiBasePath}/rest/dataclass/list`, params);

        await axios.get(url, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }).then(function (response) {
            const archiveList = [];

            response.data.forEach(archive => {
                archiveList.push({id: archive.id, name: archive.name});
            });

            commit("setArchiveList", archiveList);
            commit("setDataClassList", response.data);
        }).catch(function (error) {
            dispatch("axiosErrorHandling", error);
        });
    },
    /**
     * Search dataclass instances by attribute payload and commit results.
     * @param {object} context - Vuex action context (state, commit, dispatch).
     * @param {object} payload - Search payload sent to the API.
     */
    async searchByAttribute ({state, commit, dispatch}, payload) {
        commit("setSearchAttributeResponse", []);
        const params = {
                Token: state.requestToken,
                f: "json",
                preventCache: Date.now()
            },
            url = buildEndpointUrl(`${state.apiBasePath}/rest/dataclassinstance/search`, params);

        await axios.post(url, payload)
            .then(function (response) {
                const searchAttributeResponse = [];

                response.data.forEach(element => {
                    searchAttributeResponse.push({
                        archiveId: element.dataclassId,
                        instanceId: element.dataclassinstanceId,
                        attributes: element.dataclassinstanceAttributeArr
                            .filter(attr => attr.type !== "P")
                            .map(attr => ({...attr, id: attr.name}))
                    });
                });

                commit("setSearchAttributeResponse", searchAttributeResponse);
            }).catch(function (error) {
                dispatch("axiosErrorHandling", error);
            });
    },
    /**
     * Load placeholder JSON file from portalconfigs and commit it to the store.
     * @param {object} context - Vuex action context (state, commit).
     */
    async fetchPlaceholders ({state, commit, dispatch}) {
        const timestamp = Date.now();

        await axios.get(state.placeholderJsonPath + "?t=" + timestamp)
            .then(function (response) {
                commit("setPlaceholderDataClassList", response.data);
            }).catch(function (error) {
                dispatch("axiosErrorHandling", error);
            });
    },
    /**
     * Request available years for a given archive and add them to the store.
     * @param {object} context - Vuex action context (state, commit, dispatch).
     * @param {string} archiveId - Archive identifier to request years for.
     */
    async fetchYears ({state, commit, dispatch}, archiveId) {
        const params = {
                Token: state.requestToken,
                f: "json",
                preventCache: Date.now()
            },
            url = buildEndpointUrl(`${state.apiBasePath}/rest/geodatamanagement/dataclass/computeyears`, params);

        await axios.post(url, [archiveId])
            .then(function (response) {
                commit("addArchiveYear", {
                    [archiveId]: {
                        years: response?.data,
                        archiveName: (state.archiveList.find(a => a.id === archiveId) || {}).name
                    }
                });
            }).catch(function (error) {
                dispatch("axiosErrorHandling", error);
            });
    },
    /**
     * Send a geometry-based search request.
     * @param {object} context - Vuex action context (state).
     * @param {object} payload - Search payload including geometry and attributes.
     * @returns {Promise} Axios response from the search API.
     */
    async searchByGeometry ({state, commit, dispatch}, payload) {
        commit("setSearchAttributeResponse", []);

        const params = {
                Token: state.requestToken,
                f: "json",
                preventCache: Date.now()
            },
            url = buildEndpointUrl(`${state.apiBasePath}/rest/geodatamanagement/searchfeatures`, params);

        await axios.post(url, payload)
            .then(function (response) {
                const searchAttributeResponse = [];

                response.data.foundItems.forEach(element => {
                    searchAttributeResponse.push({
                        archiveId: element.dklId,
                        instanceId: element.dklInstanceId,
                        attributes: element.dklAttributeList
                            .filter(attr => attr.type !== "P")
                            .map(attr => ({...attr, name: attr.id}))
                    });
                });

                commit("setSearchAttributeResponse", searchAttributeResponse);

                return response;
            }).catch(function (error) {
                dispatch("axiosErrorHandling", error);

                return null;
            });
    },
    /**
     * Request primarydata for a given archive and instance and add them to the store.
     * @param {Object} context - Vuex action context (state, commit, dispatch).
     * @param {Object} payload
     * @param {String} payload.archiveId - Archive identifier to request primarydata for.
     * @param {String} payload.instanceId - Instance identifier to request primarydata for.
     */
    async fetchPrimarydata ({state, commit, dispatch}, payload) {
        const {archiveId, instanceId} = payload,
            params = {
                Token: state.requestToken,
                f: "json",
                preventCache: Date.now()
            },
            url = buildEndpointUrl(`${state.apiBasePath}/rest/primarydata/${archiveId}/${instanceId}`, params);

        await axios.get(url)
            .then(function (response) {
                commit("addPrimaryDataToInstance", {
                    instanceId: instanceId,
                    primaryData: response?.data
                });
            }).catch(function (error) {
                dispatch("axiosErrorHandling", error);
            });
    },
    /**
     * Download the preview picture for a given primaryDataId and add it to the store.
     * Return already stored preview picture if available for the given primaryDataId
     * @param {Object} context - Vuex action context (state, dispatch).
     * @param {Object} payload
     * @param {String} payload.archiveId - Archive identifier to request preview for.
     * @param {String} payload.instanceId - Instance identifier to request preview for.
     * @param {String} payload.primaryDataId - Primary data identifier to request preview for.
     * @returns {Binary} - preview picture or null
     */
    async downloadPreview ({state, dispatch}, payload) {
        const {archiveId, instanceId, primaryDataId} = payload,
            params = {
                Token: state.requestToken,
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

        return axios.get(url, {responseType: "blob"})
            .then(function (response) {
                const blobURL = window.URL.createObjectURL(response.data);

                existingPrimaryData[0].previewData = blobURL;

                return blobURL;
            }).catch(function (error) {
                dispatch("axiosErrorHandling", error);

                return null;
            });
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
                Token: state.requestToken
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
    },
    axiosErrorHandling ({state}, error) {
        if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
            state.errorMessage = error.response.data?.error?.errorMessage ?? error.config.url + ": " + error.response.statusText;
        }
        else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
            state.errorMessage = error.request;
        }
        else if (error.message) {
        // Something happened in setting up the request that triggered an Error
            state.errorMessage = error.message;
        }
        else {
            state.errorMessage = i18next.t("additional:modules.lzsResearchClient.generalErrorMessage");
        }
    }
};
