import {generateSimpleMutations} from "../../../../src_3_0_0/shared/js/utils/generators";
import statePopulationRequest from "./statePopulationRequest";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(statePopulationRequest),

    setRasterActive(state, payload) {
        console.log("setRasterActive:" + payload);
        state.rasterActive = payload;
        this.$refs.rasterCheckBox.checked = payload;
    }
};

export default mutations;
