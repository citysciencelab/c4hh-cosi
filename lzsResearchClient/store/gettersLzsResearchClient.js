import {generateSimpleGetters} from "@shared/js/utils/generators";
import lzsState from "./stateLzsResearchClient";

const getters = {
    ...generateSimpleGetters(lzsState),
    /**
     * Returns the name for a given archive ID from the state's dataClassList.
     * @param {Object} state - The Vuex state object.
     * @returns {function(string): string} - A function that takes an archiveId and returns the corresponding name, or an empty string if not found.
     */
    nameForArchiveId: state => archiveId => {
        const result = state.dataClassList?.filter((dataClass) => {
            return dataClass.id === archiveId;
        });

        if (result && result.length === 1) {
            return result[0].name;
        }

        return "";
    },
    /**
     * Checks if the archive with the given ID has georeference information (EPSG code).
     * @param {Object} state - The Vuex state object.
     * @returns {function(string): Boolean} - A function that takes an archiveId and returns true if the archive has an EPSG code, otherwise false.
     */
    archiveHasGeoref: state => archiveId => {
        const result = state.dataClassList?.filter((dataClass) => {
            return dataClass.id === archiveId;
        });

        if (result && result.length === 1) {
            return result[0].highestActiveDataclassVersion.epsgcode !== null;
        }

        return false;
    },
    /**
     * Searches the object in the search result, according to the stored selectedInstanceId.
     * @param {Object} state - The Vuex state object.
     * @returns {function(): Object | null} - A function that returns the data object for the stored selectedInstanceId, otherwise null.
     */
    getDetailsForSelectedInstanceId: state => {
        const result = state.searchAttributeResponse?.filter((datasets) => {
            return datasets.instanceId === state.selectedInstanceId;
        });

        if (result && result.length === 1) {
            return result[0];
        }

        return null;
    }
};

export default getters;
