import searchBarActions from "./searchBar/actions/actionsSearchBar.js";
import axios from "axios";
import {buildEndpointUrl} from "../utils/buildEndpointUrl";
import {saveAs, fetchWithProgress, setNested, calcProgress, buildFileInformationObject, getHumanReadableFileSize} from "../utils/zipHelpers";
import {zip} from "fflate/browser";

export default {
    ...searchBarActions,

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
    async fetchDataClassList ({state, commit}) {
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
        }).catch(function () {
            commit("setGlobalError", {
                type: "server",
                message: "Failed to fetch data class list."
            });
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
        let result = false;

        await axios.post(url, payload)
            .then(function (response) {
                const searchAttributeResponse = [];

                response.data.forEach(element => {
                    searchAttributeResponse.push({
                        archiveId: element.dataclassId,
                        instanceId: element.dataclassinstanceId,
                        primaryDataId: null,
                        attributes: element.dataclassinstanceAttributeArr
                            .filter(attr => attr.type !== "P")
                            .map(attr => ({...attr, id: attr.name})),
                        geom: null,
                        checked: false
                    });
                });

                state.searchAttributeResponse = searchAttributeResponse;

                result = true;

            }).catch(function (error) {
                dispatch("axiosErrorHandling", error);

                result = false;
            });

        return result;
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
    async fetchYears ({state, commit}, archiveId) {
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
                console.error("fetchYears failed:", error);
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
        let result = false;

        await axios.post(url, payload)
            .then(async function (response) {
                const searchAttributeResponse = [];

                const instanceIds = await response.data.foundItems?.map(item => item.dklInstanceId) || [];
                const instanceIdIsUnique = instanceIds.length === new Set(instanceIds).size;


                response.data.foundItems.forEach(element => {
                    const filteredAttributes = instanceIdIsUnique
                        ? element.dklAttributeList
                            .filter(attr => attr.type !== "P")
                        : element.dklAttributeList
                            .filter(attr => attr.id.toLowerCase() !== "dateityp");
                    const mappedAttributes = filteredAttributes.map(attr => ({...attr, name: attr.id}));

                    searchAttributeResponse.push({
                        archiveId: element.dklId,
                        instanceId: element.dklInstanceId,
                        primaryDataId: element.primarydataPictureId,
                        attributes: mappedAttributes,
                        geom: element.featuregeometrie?.features[0]?.geometry,
                        checked: false
                    });
                });

                state.searchAttributeResponse = searchAttributeResponse;

                result = true;

            }).catch(function (error) {
                dispatch("axiosErrorHandling", error);

                result = false;
            });

        return result;
    },
    /**
     * Request primarydata for a given archive and instance and add them to the store.
     * @param {Object} context - Vuex action context (state, commit, dispatch).
     * @param {Object} payload
     * @param {String} payload.archiveId - Archive identifier to request primarydata for.
     * @param {String} payload.instanceId - Instance identifier to request primarydata for.
     * @param {AbortSignal} payload.signal - AbortSignal to cancel the request if needed.
     */
    async fetchPrimarydata ({state, commit, dispatch}, payload) {
        const {archiveId, instanceId, signal} = payload,
            params = {
                Token: state.requestToken,
                f: "json",
                preventCache: Date.now()
            },
            url = buildEndpointUrl(`${state.apiBasePath}/rest/primarydata/${archiveId}/${instanceId}`, params);

        if (state.pendingPrimaryDataFetches.has(instanceId)) {
            return;
        }

        commit("updatePendingPrimaryDataFetches", {instanceId: instanceId, add: true});

        try {
            await axios.get(url, {signal})
                .then(function (response) {
                    const primaryDataIds = response?.data?.map(p => p.primaryDataId) || [];

                    commit("addPrimaryDataToInstance", {
                        selectedDetail: {instanceId: instanceId},
                        primaryData: response?.data
                    });

                    for (const primaryDataId of primaryDataIds) {
                        commit("addPrimaryDataToInstance", {
                            selectedDetail: {instanceId: instanceId, primaryDataId: primaryDataId},
                            primaryData: response?.data
                        });
                    }
                }).catch(function (error) {
                    dispatch("axiosErrorHandling", error);
                });

        }
        finally {
            commit("updatePendingPrimaryDataFetches", {instanceId: instanceId, add: false});
        }
    },
    /**
     * Request metadata for a given dossier and add them to the store.
     * @param {Object} context - Vuex action context (state, commit, dispatch).
     * @param {Object} payload
     * @param {String} payload.archiveId - Archive identifier to request dossier data for.
     * @param {String} payload.dossierId - Dossier identifier to request metadata for.
     * @param {AbortSignal} payload.signal - AbortSignal to cancel the request if needed.
     */
    async fetchDossierInformation ({state, commit, dispatch}, payload) {
        const {archiveId, dossierId, signal} = payload,
            params = {
                Token: state.requestToken,
                f: "json",
                preventCache: Date.now()
            },
            url = buildEndpointUrl(`${state.apiBasePath}/rest/dossier/${dossierId}`, params);

        await axios.get(url, {signal})
            .then(function (response) {
                commit("addDossierDataToArchive", {
                    archiveId: archiveId,
                    dossierId: dossierId,
                    dossierData: response?.data
                });
            }).catch(function (error) {
                dispatch("axiosErrorHandling", error);
            });
    },
    /**
     * Download the preview picture for a given primaryDataId and add it to the store.
     * Return already stored preview picture if available for the given primaryDataId
     * @param {Object} context - Vuex action context (state, getters, dispatch).
     * @param {Object} payload
     * @param {String} payload.archiveId - Archive identifier to request preview for.
     * @param {String} payload.instanceId - Instance identifier to request preview for.
     * @param {String} payload.primaryDataId - Primary data identifier to request preview for.
     * @returns {Binary} - preview picture or null
     */
    async downloadPreview ({state, getters, dispatch}, payload) {
        const {archiveId, instanceId, primaryDataId} = payload,
            params = {
                Token: state.requestToken,
                f: "json",
                preventCache: Date.now()
            },
            url = buildEndpointUrl(`${state.apiBasePath}/rest/primarydata/${archiveId}/${instanceId}/${primaryDataId}/${params.preventCache}/contentpreview`, params),

            selectedDataset = getters.findDatasetInAttributes(instanceId, primaryDataId),
            existingPrimaryData = selectedDataset?.primaryData?.find(p => p.primaryDataId === primaryDataId);

        if (existingPrimaryData && existingPrimaryData.previewData) {
            return existingPrimaryData.previewData;
        }

        return axios.get(url, {responseType: "blob"})
            .then(function (response) {
                const blobURL = window.URL.createObjectURL(response.data);

                if (existingPrimaryData) {
                    existingPrimaryData.previewData = blobURL;
                }

                return blobURL;
            }).catch(function (error) {
                dispatch("axiosErrorHandling", error);

                return null;
            });
    },
    /**
     *
     * @param {Object} context - Vuex action context (state).
     * @param {Object} payload
     * @param {String} payload.archiveId - Archive identifier to download the dataset for.
     * @param {String} payload.instanceId - Instance identifier to download the dataset for.
     * @param {String} payload.srs - CRS to get the geometry.
     * @returns {Object} - information on the geometry of the instance, containing coordinates, type and crs
     */
    async fetchGeometryForInstanceId ({state, dispatch}, payload) {
        const convertedPayload = {
                dataclassId: payload.archiveId,
                dataclassInstanceId: payload.instanceId,
                srs: payload.srs
            },
            params = {
                Token: state.requestToken,
                f: "json",
                preventCache: Date.now()
            },
            url = buildEndpointUrl(`${state.apiBasePath}/rest/geodatamanagement/dataclassinstance/computeenvelope`, params);
        let result = null;

        await axios.post(url, convertedPayload)
            .then(function (response) {
                const existingInstanceData = state.searchAttributeResponse?.find((dataset) => {
                    return dataset.instanceId === payload.instanceId;
                });

                if (existingInstanceData) {
                    existingInstanceData.geom = response.data;
                    result = response.data;
                }
            }).catch(function (error) {
                dispatch("axiosErrorHandling", error);
            });

        return result;
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
     * Retrieves the parcel source data from the configured URL and commits it to the store.
     * This data is used for the parcel search functionality.
     *
     * @returns {void}
     */
    retrieveParcelSourceData ({commit, getters, dispatch}) {
        const {parcelSearchSelectSource} = getters;

        axios.get(encodeURI(parcelSearchSelectSource))
            .then(response => {
                commit("setParcelSourceData", response.data);
            })
            .catch(error => dispatch("axiosErrorHandling", error));
    },
    /**
     * Download selected primary data files (single item or array of items), show download
     * and zip progress in the Vuex state, build a nested folder structure and create a ZIP
     * using fflate, then trigger a browser save dialog.
     *
     * Behavior:
     * - Accepts a single item or an array of items describing search results
     *      (e.g. state.searchAttributeResponse or getters.getDetailsForSelectedDetail)
     * - Ensures primaryData for each item exists (dispatches fetchPrimarydata when missing).
     * - Builds a flat list of file URLs with target path parts and known sizes (contentFileLength).
     * - Downloads files in parallel while reporting incremental progress to state.progressNow
     *      and via fetchWithProgress.
     * - Constructs a nested object matching fflate.zip input and calls zip(...).
     * - Triggers download via saveAs and updates final progress state.
     *
     * @async
     * @param {Object} context - Vuex action context.
     * @param {Object} context.state - Vuex state (used for progress and configuration).
     * @param {Object} context.getters - Vuex getters (used to derive archive names).
     * @param {Function} context.dispatch - Vuex dispatch (used to fetch missing primaryData).
     * @param {Object|Object[]} filesToDownload - Single result item or array of result items to download.
     * @returns {Promise<void>} Resolves when the ZIP has been created and download triggered.
     */
    async downloadSelectedFiles ({state, getters, dispatch}, filesToDownload) {
        if (!filesToDownload || typeof filesToDownload !== "object") {
            return;
        }

        const selectedFiles = Array.isArray(filesToDownload) ? filesToDownload : [filesToDownload];

        state.downloadAbortController = new AbortController();
        const {signal} = state.downloadAbortController;

        // Progress phase boundaries
        // 0..20 = fetching primaryData
        // 20..80 = downloading files
        // 80..90 = building nested structure
        // 90..100 = zipping
        // 100 = done
        const phaseEnd = {fetch: 20, download: 80, setNested: 90, done: 100};

        state.errorMessage = "";
        state.progressNow = 0;
        state.progressPhase = "start";

        // Group selected files by archiveId and instanceId to fetch primaryData in batches
        // Skip items that already have primaryData loaded.
        const groupedByInstance = new Map();

        for (const item of selectedFiles) {
            if (!item.primaryData) {
                const key = `${item.archiveId}_${item.instanceId}`;

                if (!groupedByInstance.has(key)) {
                    groupedByInstance.set(key, {archiveId: item.archiveId, instanceId: item.instanceId});
                }
            }
        }

        const totalInstances = groupedByInstance.size;
        let completedInstances = 0;

        await Promise.all(
            [...groupedByInstance.values()].map(
                ({archiveId, instanceId}) => dispatch("fetchPrimarydata", {
                    archiveId,
                    instanceId,
                    signal
                }).then(() => {
                    const current = ++completedInstances;

                    state.progressNow = calcProgress({
                        value: current,
                        total: totalInstances,
                        start: 0,
                        end: phaseEnd.fetch
                    });
                    state.progressPhase = "fetch";
                    state.progressCurrent = current;
                    state.progressTotal = totalInstances;
                })
            )
        );

        if (signal.aborted) {
            return;
        }

        // eslint-disable-next-line require-atomic-updates
        state.progressPhase = "dossier";

        // collect flat list of files with target path and url
        const files = [];

        for (const item of selectedFiles) {
            const archiveName = getters.getNameForArchiveId(item.archiveId) || i18next.t("additional:modules.lzsResearchClient.zipAndDownload.withoutArchive"),
                jahrgangAttr = item.attributes.find(a => a.id === "JAHRGANG"),
                jahrgang = jahrgangAttr ? String(jahrgangAttr.value) : i18next.t("additional:modules.lzsResearchClient.zipAndDownload.withoutYear");

            (item.primaryData || []).forEach(dataset => {
                files.push(
                    buildFileInformationObject(
                        dataset.contentFilename || "file",
                        `${state.apiBasePath}/rest/primarydata/${item.archiveId}/${item.instanceId}/${dataset.primaryDataId}/content`,
                        dataset.contentFileSize,
                        item.archiveId,
                        archiveName,
                        jahrgang,
                        state.requestToken
                    )
                );

                if (dataset.georeferencePrimarydata) {
                    files.push(
                        buildFileInformationObject(
                            dataset.georeferencePrimarydata.contentFilename || "file-world",
                            `${state.apiBasePath}/rest/primarydata/${item.archiveId}/${item.instanceId}/${dataset.georeferencePrimarydata.primaryDataId}/content`,
                            dataset.georeferencePrimarydata.contentFileSize,
                            item.archiveId,
                            archiveName,
                            jahrgang,
                            state.requestToken
                        )
                    );
                }
            });
        }

        // add the metadata (in backend it is called 'dossier') to each archive, affected by the downloaded files
        const archiveDossierPairs = [...new Set(files.map(file => file.archiveId))]
            .flatMap(archiveId => getters
                .getDossierIdsForArchiveId(archiveId)
                .map(dossierId => ({
                    archiveId,
                    dossierId
                }))
            );

        // fetch dossier data in parallel for each archive/dossier pair if not already present in the store
        await Promise.all(
            archiveDossierPairs
                .filter(({archiveId, dossierId}) => !getters.getDossierDataForArchiveId(archiveId, dossierId))
                .map(({archiveId, dossierId}) => dispatch("fetchDossierInformation", {archiveId, dossierId, signal}))
        );

        if (signal.aborted) {
            return;
        }

        for (const {archiveId, dossierId} of archiveDossierPairs) {
            const dossierData = getters.getDossierDataForArchiveId(archiveId, dossierId),
                archiveName = getters.getNameForArchiveId(archiveId);

            if (dossierData) {
                files.push(
                    buildFileInformationObject(
                        dossierData.contentFilename || "metadata-file",
                        `${state.apiBasePath}/rest/dossier/${dossierId}/content`,
                        50000, // no content file size given for dossiers, use an estimated file size (50 kB)
                        archiveId,
                        archiveName,
                        i18next.t("additional:modules.lzsResearchClient.zipAndDownload.metadataFolderName"),
                        state.requestToken
                    )
                );
            }
        }

        // total known bytes from contentFileLength
        const knownTotalBytes = files.reduce((s, f) => s + (f.size || 0), 0);

        if (state.maxDownloadMB > -1 && knownTotalBytes / 1e6 > state.maxDownloadMB) {
            state.errorMessage = i18next.t(
                "additional:modules.lzsResearchClient.zipAndDownload.progress.sumFileSizeError",
                {
                    maxFileSize: getHumanReadableFileSize(state.maxDownloadMB * 1e6),
                    sumFileSize: getHumanReadableFileSize(knownTotalBytes)
                });
            state.progressNow = phaseEnd.done;
            state.progressPhase = "error";
            return;
        }

        state.progressPhase = "download";
        state.progressCurrent = 0;
        state.progressTotal = files.length;

        // per-file last-seen bytes
        const lastSeen = new Map();
        let downloadedBytes = 0,
            completedFiles = 0;

        // fetch files in parallel, update global progress using knownTotalBytes or completedFiles as fallback
        const fetched = await Promise.all(files.map(async file => {
            try {
                const data = await fetchWithProgress(file.url, (loaded) => {
                    const prev = lastSeen.get(file.url) || 0;
                    const delta = loaded - prev;

                    lastSeen.set(file.url, loaded);

                    if (knownTotalBytes > 0) {
                        downloadedBytes += delta;
                        state.progressNow = calcProgress({
                            value: downloadedBytes,
                            total: knownTotalBytes,
                            start: phaseEnd.fetch,
                            end: phaseEnd.download
                        });
                    }
                }, signal);

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
            finally {
                const current = ++completedFiles;

                if (knownTotalBytes === 0) {
                    state.progressNow = calcProgress({
                        value: current,
                        total: files.length,
                        start: phaseEnd.fetch,
                        end: phaseEnd.download
                    });
                }

                state.progressCurrent = current;
                state.progressTotal = files.length;
            }
        }));

        if (signal.aborted) {
            return;
        }

        // build nested object structure required by fflate.zip
        const nested = {};

        fetched
            .filter(item => !item.err) // skip failed files
            .forEach(item => setNested(nested, item.pathParts, item.data));

        if (signal.aborted) {
            return;
        }

        // eslint-disable-next-line require-atomic-updates
        state.progressNow = phaseEnd.setNested;
        // eslint-disable-next-line require-atomic-updates
        state.progressPhase = "zip";

        // create zip and trigger download
        try {
            const zippedData = await new Promise((resolve, reject) => {
                const terminate = zip(nested, {}, (err, data) => err ? reject(err) : resolve(data));

                signal.addEventListener("abort", () => {
                    terminate();
                    reject(new DOMException("Aborted", "AbortError"));
                }, {once: true});
            });

            if (!signal.aborted) {
                saveAs(
                    new Blob([zippedData], {type: "application/zip"}),
                    null,
                    state.zipFileName + ".zip"
                );
            }


            // eslint-disable-next-line require-atomic-updates
            state.progressNow = phaseEnd.done;
            // eslint-disable-next-line require-atomic-updates
            state.progressPhase = "done";
        }
        catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") {
                return;
            }
            // eslint-disable-next-line require-atomic-updates
            state.errorMessage = err.message || String(err);
            // eslint-disable-next-line require-atomic-updates
            state.progressNow = phaseEnd.done;

            // eslint-disable-next-line require-atomic-updates
            state.progressPhase = "error";
        }
    }
};
