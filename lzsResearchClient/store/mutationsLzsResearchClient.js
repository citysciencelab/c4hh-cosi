import {generateSimpleMutations} from "@shared/js/utils/generators";
import stateLzsResearchClient from "./stateLzsResearchClient.js";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(stateLzsResearchClient),
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
    }
};

export default mutations;
