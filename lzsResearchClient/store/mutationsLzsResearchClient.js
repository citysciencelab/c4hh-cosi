import {generateSimpleMutations} from "@shared/js/utils/generators";
import searchBarMutations from "./searchBar/mutationsSearchBar.js";
import stateLzsResearchClient from "./stateLzsResearchClient.js";
import getters from "./gettersLzsResearchClient.js";
import {calcFileSizeBytes, calcPrimaryDataSizeBytes} from "../utils/zipHelpers.js";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(stateLzsResearchClient),
    ...searchBarMutations,
    /**
     * Merges new archive year data into the existing archive years state.
     * @param {Object} state - The current state object.
     * @param {Object} yearsListObj - The new years data object to be added or updated.
     * @example yearsListObj = {"DKL_3DSTADT_LOD2": {"year": "2022", "archiveName": "3D-Stadtmodell LoD2"}}
     * @example Result: archiveYears = {"DKL_3DSTADT_LOD1": {"year": "2022", "archiveName": "3D-Stadtmodell LoD1"},
     *                                  "DKL_3DSTADT_LOD2": {"year": "2022", "archiveName": "3D-Stadtmodell LoD2"}}
     */
    addArchiveYear (state, yearsListObj) {
        state.archiveYears = {
            ...state.archiveYears,
            ...yearsListObj
        };
    },
    /**
     * Adds the fetched primary data into the existing search response state.
     * @param {Object} state - The current state object.
     * @param {Object} primaryDataObj - The new data object to be added or updated.
     */
    addPrimaryDataToInstance (state, primaryDataObj) {
        const {instanceId, primaryDataId} = primaryDataObj.selectedDetail,
            selectedDataset = getters.findDatasetInAttributes(state)(instanceId, primaryDataId);

        if (!selectedDataset) {
            return;
        }

        const filenamesToAddToDownload = state.placeholderDataClassList?.[selectedDataset.archiveId]?.FILES_TO_ADD_TO_SINGLE_DOWNLOAD;

        selectedDataset.primaryData = (primaryDataObj.primaryData || []).filter(
            p => !primaryDataId || (p.primaryDataId === primaryDataId) ||
            (filenamesToAddToDownload && filenamesToAddToDownload.includes(p.contentFilename))
        );
        selectedDataset.primaryData.forEach(p => {
            p.fileSizeBytes = calcPrimaryDataSizeBytes(p);
        });
        selectedDataset.fileSizeBytes = calcFileSizeBytes(selectedDataset);
    },
    /** Updates the set of pending primary data fetches in the state.
     * @param {Object} state - The current state object.
     * @param {Object} payload - The payload object containing the instanceId and the add flag.
     * @param {boolean} payload.instanceId - The id of the instance for which the pending fetch count is being updated.
     * @param {boolean} payload.add - Flag indicating whether to add (true) or remove (false) the instanceId to pendingPrimaryDataFetches.
     */
    updatePendingPrimaryDataFetches (state, {instanceId, add = true}) {
        if (!add) {
            state.pendingPrimaryDataFetches.delete(instanceId);
            return;
        }

        state.pendingPrimaryDataFetches.add(instanceId);
    },
    /**
     * Adds the fetched dossier data into the existing data class object.
     * @param {Object} state - The current state object.
     * @param {Object} dossierDataObj - The new data object to be added or updated.
     */
    addDossierDataToArchive (state, dossierDataObj) {
        const archiveDataset = state.dataClassList?.find((dataset) => {
            return dataset.id === dossierDataObj.archiveId;
        });

        if (archiveDataset) {
            if (!archiveDataset.highestActiveDataclassVersion.dossierData) {
                archiveDataset.highestActiveDataclassVersion.dossierData = {};
            }

            archiveDataset.highestActiveDataclassVersion.dossierData[dossierDataObj.dossierId] = dossierDataObj.dossierData;
        }
    },
    /**
     * Updates the checked state on a dataset within searchAttributeResponse.
     * @param {Object} state - The current state object.
     * @param {String} instanceId - The instanceId of the dataset to update.
     * @param {String} primaryDataId - The primaryDataId of the dataset to update (optional).
     * @param {Boolean} checked - The new checked value.
     * @param {Boolean} checkInstance - Switch if the instance data or the primary dataset shall be checked.
     * @returns {void}
     */
    setCheckedForDataset (state, {instanceId, primaryDataId, checked, checkInstance = true}) {
        // nothing to do if we're asked to un-/check a primary dataset but no id was provided
        if (!checkInstance && !primaryDataId) {
            return;
        }

        // datasets from attributive search do not have a "primaryDataId" in the instance data object
        // when a dataset on the detail tab, reached via the attributive search, shall be un-/checked,
        //  the getter "findDatasetInAttributes" must not be fed with the given primaryDataId
        const dataset = getters.findDatasetInAttributes(state)(instanceId, primaryDataId) || getters.findDatasetInAttributes(state)(instanceId, null);

        if (!dataset) {
            return;
        }

        if (checkInstance) {
            dataset.checked = checked;
            return;
        }

        const primaryDataset = dataset.primaryData?.find((data) => {
            return data.primaryDataId === primaryDataId;
        });

        if (primaryDataset) {
            primaryDataset.checked = checked;
        }
    }
};

export default mutations;
