import axios from "axios";
import {buildEndpointUrl} from "../utils/buildEndpointUrl";
import {saveAs, fetchWithProgress, setNested} from "../utils/zipHelpers";
import {zip} from "fflate/browser";

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
                            .map(attr => ({...attr, id: attr.name})),
                        geom: null
                    });
                });

                commit("setSearchAttributeResponseWithUniqueInstanceIds", searchAttributeResponse);

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
                            .map(attr => ({...attr, name: attr.id})),
                        geom: element.featuregeometrie?.features[0]?.geometry
                    });
                });

                commit("setSearchAttributeResponseWithUniqueInstanceIds", searchAttributeResponse);

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

        saveAs(null, url, "");
    },
    /**
     *
     * @param {Object} context - Vuex action context (state).
     * @param {Object} payload
     * @param {String} payload.dataclassId - Archive identifier to download the dataset for.
     * @param {String} payload.dataclassInstanceId - Instance identifier to download the dataset for.
     * @param {String} payload.srs - CRS to get the geometry.
     * @returns {Object} - information on the geometry of the instance, containing coordinates, type and crs
     */
    async fetchGeometryForInstanceId ({state, dispatch}, payload) {
        const params = {
                Token: state.requestToken,
                f: "json",
                preventCache: Date.now()
            },
            url = buildEndpointUrl(`${state.apiBasePath}/rest/geodatamanagement/dataclassinstance/computeenvelope`, params);

        await axios.post(url, payload)
            .then(function (response) {
                const existingInstanceData = state.searchAttributeResponse?.filter((datasets) => {
                    return datasets.instanceId === payload.dataclassInstanceId;
                });

                if (existingInstanceData) {
                    existingInstanceData[0].geom = response.data;
                }

                return response.data;
            }).catch(function (error) {
                dispatch("axiosErrorHandling", error);
            });
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
    },
    /**
     * Download selected primary data files (single item or array of items), show download
     * and zip progress in the Vuex state, build a nested folder structure and create a ZIP
     * using fflate, then trigger a browser save dialog.
     *
     * Behavior:
     * - Accepts a single item or an array of items describing search results
     *      (e.g. state.searchAttributeResponse or getters.getDetailsForSelectedInstanceId)
     * - Ensures primaryData for each item exists (dispatches fetchPrimarydata when missing).
     * - Builds a flat list of file URLs with target path parts and known sizes (contentFileLength).
     * - Downloads files in parallel while reporting incremental progress to state.progressNow
     *      and state.currentProgressValue via fetchWithProgress.
     * - Constructs a nested object matching fflate.zip input and calls zip(...).
     * - Triggers download via saveAs and updates final progress state.
     *
     * @async
     * @param {Object} context - Vuex action context.
     * @param {Object} context.state - Vuex state (used for progress and configuration).
     * @param {Function} context.getters - Vuex getters (used to derive archive names).
     * @param {Function} context.dispatch - Vuex dispatch (used to fetch missing primaryData).
     * @param {Object|Object[]} filesToDownload - Single result item or array of result items to download.
     * @returns {Promise<void>} Resolves when the ZIP has been created and download triggered.
     */
    async downloadSelectedFiles ({state, getters, dispatch}, filesToDownload) {
        if (typeof filesToDownload !== "object") {
            return;
        }

        let selectedFiles = filesToDownload;

        if (!Array.isArray(filesToDownload)) {
            selectedFiles = [filesToDownload];
        }

        // collect flat list of files with target path and url
        const files = [],
            numberResultsWithoutPrimaryData = selectedFiles.filter((file) => !file.primaryData).length;

        let countResultsWithoutPrimaryData = 0;

        state.errorMessage = "";
        state.progressNow = 0;
        state.currentProgressValue = i18next.t("additional:modules.lzsResearchClient.zipAndDownload.progress.start");

        for (const item of selectedFiles) {
            const archiveName = getters.nameForArchiveId(item.archiveId) || i18next.t("additional:modules.lzsResearchClient.zipAndDownload.withoutArchive"),
                jahrgangAttr = item.attributes.find(a => a.id === "JAHRGANG"),
                jahrgang = jahrgangAttr ? String(jahrgangAttr.value) : i18next.t("additional:modules.lzsResearchClient.zipAndDownload.withoutYear");

            if (!item.primaryData) {
                state.progressNow = ++countResultsWithoutPrimaryData / numberResultsWithoutPrimaryData * 20;
                state.currentProgressValue = i18next.t("additional:modules.lzsResearchClient.zipAndDownload.progress.fetchPrimaryData", {archiveName: archiveName});

                await dispatch("fetchPrimarydata", {
                    archiveId: item.archiveId,
                    instanceId: item.instanceId
                });
            }

            (item.primaryData || []).forEach(dataset => {
                const safeFilename = (dataset.contentFilename || "file").replace(/[\\/]/g, "_"),
                    url = buildEndpointUrl(
                        `${state.apiBasePath}/rest/primarydata/${item.archiveId}/${item.instanceId}/${dataset.primaryDataId}/content`,
                        {Token: state.requestToken}
                    ),
                    size = Number(dataset.contentFileSize) || 0;

                files.push({
                    pathParts: [archiveName, jahrgang, safeFilename],
                    url: url,
                    size: size
                });

                if (dataset.georeferencePrimarydata) {
                    const safeFilenameWorld = (dataset.georeferencePrimarydata.contentFilename || "file-world").replace(/[\\/]/g, "_"),
                        urlWorld = buildEndpointUrl(
                            `${state.apiBasePath}/rest/primarydata/${item.archiveId}/${item.instanceId}/${dataset.georeferencePrimarydata.primaryDataId}/content`,
                            {Token: state.requestToken}
                        ),
                        sizeWorld = Number(dataset.georeferencePrimarydata.contentFileSize) || 0;


                    files.push({
                        pathParts: [archiveName, jahrgang, safeFilenameWorld],
                        url: urlWorld,
                        size: sizeWorld
                    });
                }
            });
        }

        state.currentProgressValue = i18next.t("additional:modules.lzsResearchClient.zipAndDownload.progress.downloading");


        // total known bytes from contentFileLength
        const knownTotalBytes = files.reduce((s, f) => s + (f.size || 0), 0);

        if (knownTotalBytes > 500000000) {
            state.errorMessage = i18next.t("additional:modules.lzsResearchClient.zipAndDownload.progress.sumFileSizeError", {sumFileSize: (knownTotalBytes / 1000000).toFixed(2)});
            state.progressNow = 100;
            state.currentProgressValue = "";
            return;
        }

        // per-file last-seen bytes
        const lastSeen = new Map();
        let downloadedBytes = 0;

        // fetch files in parallel, update global progress using knownTotalBytes
        const fetched = await Promise.all(files.map(async file => {
            try {
                const data = await fetchWithProgress(file.url, (loaded) => {
                    const prev = lastSeen.get(file.url) || 0;
                    const delta = loaded - prev;

                    lastSeen.set(file.url, loaded);

                    if (knownTotalBytes > 0) {
                        downloadedBytes += delta;
                        // allocate 0..80% for download phase
                        state.progressNow = Math.min(80, Math.floor((downloadedBytes / knownTotalBytes) * 80));
                        state.currentProgressValue = i18next.t("additional:modules.lzsResearchClient.zipAndDownload.progress.downloadingFile", {fileName: file.pathParts.join("/"), interpolation: {escapeValue: false}});
                    }
                });

                // if no known sizes, approximate by file-count when a file finishes
                if (knownTotalBytes === 0) {
                    const finishedCount = Array.from(lastSeen.values()).filter(v => v > 0).length;

                    state.progressNow = Math.floor((finishedCount / files.length) * 80);
                    state.currentProgressValue = i18next.t("additional:modules.lzsResearchClient.zipAndDownload.progress.downloadingFile", {fileName: file.pathParts.join("/"), interpolation: {escapeValue: false}});
                }

                return {
                    pathParts: file.pathParts,
                    data
                };
            }
            catch (err) {
                console.error("error fetching files", file.url, err);
                return {
                    pathParts: file.pathParts,
                    err
                };
            }
        }));

        // build nested object structure required by fflate.zip
        const nested = {};

        fetched.forEach(item => {
            if (item.err) {
                return; // skip failed files
            }
            setNested(nested, item.pathParts, item.data);
        });

        state.progressNow = 85;
        state.currentProgressValue = i18next.t("additional:modules.lzsResearchClient.zipAndDownload.progress.zipping");

        // create zip and trigger download
        zip(nested, {}, (err, data) => {
            if (err) {
                state.errorMessage = err.message || String(err);
                state.progressNow = 100;
                state.currentProgressValue = "";
                return;
            }

            saveAs(
                new Blob(
                    [data],
                    {type: "application/zip"}
                ),
                null,
                state.zipFileName + ".zip"
            );

            state.progressNow = 100;
            state.currentProgressValue = i18next.t("additional:modules.lzsResearchClient.zipAndDownload.progress.done");
        });
    }
};
