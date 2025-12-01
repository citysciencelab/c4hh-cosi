import {generateSimpleMutations} from "@shared/js/utils/generators";
import stateDashboard from "./stateDashboard";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(stateDashboard),
    setCalculation (state, payload) {
        state.calculations = [...state.calculations, payload];
    },
    removeCalculation (state, id) {
        state.calculations = state.calculations.filter(calc => calc.id !== id);
    },
    overwriteAllCalculations (state, payload) {
        state.calcualtions = payload;

    },

    /**
     * Fills the timestamps with the unique years from all items.
     * @param {Object} state The vuex state.
     * @returns {void}
     */
    updateTimestamps (state) {
        state.timestamps = [];
        state.items.forEach(item => {
            item.years.forEach(year => {
                if (!state.timestamps.includes(year)) {
                    state.timestamps.push(year);
                }
            });
        });
    }
};

export default mutations;
