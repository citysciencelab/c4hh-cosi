import {generateSimpleMutations} from "@shared/js/utils/generators";
import searchBarMutations from "./searchBar/mutationsSearchBar.js";
import stateLzsResearchClient from "./stateLzsResearchClient.js";

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
        const instanceDataset = state.searchAttributeResponse?.filter((datasets) => {
            return datasets.instanceId === primaryDataObj.instanceId;
        });

        if (instanceDataset && instanceDataset.length > 0) {
            instanceDataset.forEach(dataset => {
                dataset.primaryData = primaryDataObj.primaryData;
            });
        }
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
     * Filter the given search response so only the first entry for each unique instanceId remains,
     * preserve the original order, and store the result in state.searchAttributeResponse.
     *
     * @param {Object} state - Vuex state object.
     * @param {Array<Object>} searchResponse - Array of result objects; each object must contain an instanceId property.
     * @returns {void}
     */
    setSearchAttributeResponseWithUniqueInstanceIds (state, searchResponse) {
        const uniqueInstanceSearchAttributeResponse = (() => {
            const seen = new Set();

            return searchResponse.filter(item => {
                if (seen.has(item.instanceId)) {
                    return false;
                }
                seen.add(item.instanceId);
                return true;
            });
        })();

        state.searchAttributeResponse = uniqueInstanceSearchAttributeResponse;
    },
    /**
     * Updates the checked state on a dataset within searchAttributeResponse and attributesToDownload.
     * Adds the dataset to attributesToDownload if it is not already present.
     * @param {Object} state - The current state object.
     * @param {String} instanceId - The instanceId of the dataset to update.
     * @param {Boolean} checked - The new checked value.
     * @returns {void}
     */
    setCheckedForInstanceId (state, {instanceId, checked}) {
        const dataset = state.searchAttributeResponse?.find(d => d.instanceId === instanceId);

        if (dataset) {
            dataset.checked = checked;

            const alreadyInDownload = state.attributesToDownload.find(d => d.instanceId === instanceId);

            if (alreadyInDownload) {
                alreadyInDownload.checked = checked;
            }
            else {
                state.attributesToDownload.push(dataset);
            }
        }
        else {
            const datasetInDownload = state.attributesToDownload.find(d => d.instanceId === instanceId);

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
