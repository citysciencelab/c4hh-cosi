import searchBarActions from "./searchBar/actions/actionsSearchBar.js";
import axios from "axios";
import {buildEndpointUrl} from "../utils/buildEndpointUrl";
import {saveAs, fetchWithProgress, setNested, buildFileInformationObject, getHumanReadableFileSize} from "../utils/zipHelpers";
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
     * @param {Array} payload.primaryDataIds - Array of primary data identifiers to request primarydata for.
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
    },
    /**
     * Request metadata for a given dossier and add them to the store.
     * @param {Object} context - Vuex action context (state, commit, dispatch).
     * @param {Object} payload
     * @param {String} payload.archiveId - Archive identifier to request dossier data for.
     * @param {String} payload.dossierId - Dossier identifier to request metadata for.
     */
    async fetchDossierInformation ({state, commit, dispatch}, payload) {
        const {archiveId, dossierId} = payload,
            params = {
                Token: state.requestToken,
                f: "json",
                preventCache: Date.now()
            },
            url = buildEndpointUrl(`${state.apiBasePath}/rest/dossier/${dossierId}`, params);

        await axios.get(url)
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

        state.errorMessage = "";
        state.progressNow = 0;
        state.currentProgressValue = i18next.t("additional:modules.lzsResearchClient.zipAndDownload.progress.start");

        // Group selected files by archiveId and instanceId to fetch primaryData in batches
        const groupedByInstance = new Map();

        for (const item of selectedFiles) {
            if (!item.primaryData) {
                const key = `${item.archiveId}_${item.instanceId}`;

                if (!groupedByInstance.has(key)) {
                    groupedByInstance.set(key, {archiveId: item.archiveId, instanceId: item.instanceId});
                }
            }
        }

        const numberGroups = groupedByInstance.size;
        let countGroups = 0;

        for (const {archiveId, instanceId} of groupedByInstance.values()) {
            const archiveName = getters.getNameForArchiveId(archiveId) || i18next.t("additional:modules.lzsResearchClient.zipAndDownload.withoutArchive");

            state.progressNow = ++countGroups / numberGroups * 20;
            state.currentProgressValue = i18next.t("additional:modules.lzsResearchClient.zipAndDownload.progress.fetchPrimaryData", {archiveName: archiveName});

            await dispatch("fetchPrimarydata", {
                archiveId: archiveId,
                instanceId: instanceId
            });
        }

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
        const archiveIdsInDownload = [...new Set(files.map(file => file.archiveId))];

        for (const archiveId of archiveIdsInDownload) {
            const dossierIds = getters.getDossierIdsForArchiveId(archiveId),
                archiveName = getters.getNameForArchiveId(archiveId);

            for (const dossierId of dossierIds) {
                let dossierData = getters.getDossierDataForArchiveId(archiveId, dossierId);

                if (!dossierData) {
                    await dispatch("fetchDossierInformation", {
                        archiveId: archiveId,
                        dossierId: dossierId
                    });

                    dossierData = getters.getDossierDataForArchiveId(archiveId, dossierId);
                }

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
        }

        state.currentProgressValue = i18next.t("additional:modules.lzsResearchClient.zipAndDownload.progress.downloading");

        // total known bytes from contentFileLength
        const knownTotalBytes = files.reduce((s, f) => s + (f.size || 0), 0);

        if (state.maxDownloadMB > -1 && knownTotalBytes / 1e6 > state.maxDownloadMB) {
            state.errorMessage = i18next.t(
                "additional:modules.lzsResearchClient.zipAndDownload.progress.sumFileSizeError",
                {
                    maxFileSize: getHumanReadableFileSize(state.maxDownloadMB * 1e6),
                    sumFileSize: getHumanReadableFileSize(knownTotalBytes)
                });
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

        // eslint-disable-next-line require-atomic-updates
        state.progressNow = 85;
        // eslint-disable-next-line require-atomic-updates
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
