import {generateSimpleMutations} from "../../../src/app-store/utils/generators";
import stateQuickResponseCode from "./stateQuickResponseCode";

const mutations = {
    ...generateSimpleMutations(stateQuickResponseCode),

    /**
     * Sets the click event coordinate.
     * @param {Object} state The state of quick response code.
     * @param {Event} evt The click event.
     * @returns {void}
     */
    setEvtCoordinate (state, evt) {
        state.evtCoordinate = evt.coordinate;
    }
};

export default mutations;
