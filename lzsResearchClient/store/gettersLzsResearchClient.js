import {generateSimpleGetters} from "@shared/js/utils/generators";
import lzsState from "./stateLzsResearchClient";

const getters = {
    ...generateSimpleGetters(lzsState),
    /**
     * Returns the name for a given archive ID from the state's dataClassList.
     * @param {Object} state - The Vuex state object.
     * @returns {function(string): string} - A function that takes an archiveId and returns the corresponding name, or an empty string if not found.
     */
    getNameForArchiveId: state => archiveId => {
        const result = state.dataClassList?.find((dataClass) => {
            return dataClass.id === archiveId;
        });

        return result?.name ?? "";
    },
    /**
     * Returns the dataclass protection class for a given archive ID from the state's dataClassList.
     * @param {Object} state - The Vuex state object.
     * @returns {function(string): string} - A function that takes an archiveId and returns the corresponding dataclass protection class, or an empty string if not found.
     */
    getDataProtectionClassForArchiveId: state => archiveId => {
        const result = state.dataClassList?.find((dataClass) => {
            return dataClass.id === archiveId;
        });

        return result?.highestActiveDataclassVersion?.dataProtectionClass ?? "";
    },
    /**
     * Checks if the archive with the given ID has georeference information (EPSG code).
     * @param {Object} state - The Vuex state object.
     * @returns {function(string): Boolean} - A function that takes an archiveId and returns true if the archive has an EPSG code, otherwise false.
     */
    archiveHasGeoref: state => archiveId => {
        const result = state.dataClassList?.find((dataClass) => {
            return dataClass.id === archiveId;
        });

        return result?.highestActiveDataclassVersion?.epsgcode !== null;
    },
    /**
     * Searches the object in the search result, according to the stored selectedInstanceId.
     * @param {Object} state - The Vuex state object.
     * @returns {function(): Object | null} - A function that returns the data object for the stored selectedInstanceId, otherwise null.
     */
    getDetailsForSelectedInstanceId: state => {
        const result = state.searchAttributeResponse?.find((datasets) => {
            return datasets.instanceId === state.selectedInstanceId;
        });

        return result;
    },
    /**
     * Returns the dossierIds for a given archive ID from the state's dataClassList.
     * @param {Object} state - The Vuex state object.
     * @returns {function(string): array} - A function that takes an archiveId and returns the corresponding dossierIds, or an empty array if not found.
     */
    getDossierIdsForArchiveId: state => archiveId => {
        const result = state.dataClassList?.find((dataClass) => {
            return dataClass.id === archiveId;
        });

        return result?.highestActiveDataclassVersion?.dossierIds ?? [];
    },
    /**
     * Returns the dossierData for a given archive ID and dossier ID from the state's dataClassList.
     * @param {Object} state - The Vuex state object.
     * @returns {function(string, string): Object | false} - A function that takes an archiveId and a dossierId and returns the corresponding dossierData, or false if not found.
     */
    getDossierDataForArchiveId: state => (archiveId, dossierId) => {
        const result = state.dataClassList?.find((dataClass) => {
            return dataClass.id === archiveId;
        });

        return result?.highestActiveDataclassVersion?.dossierData?.[dossierId] ?? false;
    }
};

export default getters;
