import {generateSimpleMutations} from "@shared/js/utils/generators";
import searchBarMutations from "./searchBar/mutationsSearchBar.js";
import stateLzsResearchClient from "./stateLzsResearchClient.js";
import getters from "./gettersLzsResearchClient.js";

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
     * Updates the checked state on a dataset within searchAttributeResponse and attributesToDownload.
     * Adds the dataset to attributesToDownload if it is not already present.
     * @param {Object} state - The current state object.
     * @param {String} instanceId - The instanceId of the dataset to update.
     * @param {String} primaryDataId - The primaryDataId of the dataset to update (optional).
     * @param {Boolean} checked - The new checked value.
     * @returns {void}
     */
    setCheckedForInstanceId (state, {instanceId, primaryDataId, checked}) {
        const dataset = getters.findDatasetInAttributes(state)(instanceId, primaryDataId);

        if (dataset) {
            dataset.checked = checked;

            const alreadyInDownload = getters.findDatasetInDownload(state)(instanceId, primaryDataId);

            if (alreadyInDownload) {
                alreadyInDownload.checked = checked;
            }
            else {
                state.attributesToDownload.push(dataset);
            }
        }
        else {
            const datasetInDownload = getters.findDatasetInDownload(state)(instanceId, primaryDataId);

            if (datasetInDownload) {
                datasetInDownload.checked = checked;
            }
        }
    },
    /**
     * Remove unchecked datasets from attributesToDownload to remove unnecessary datasets from the download list.
     * @param {Object} state - The current state object.
     * @returns {void}
     * */
    removeUncheckedFromAttributesToDownload (state) {
        state.attributesToDownload = state.attributesToDownload.filter(d => d.checked);
    }
};

export default mutations;
