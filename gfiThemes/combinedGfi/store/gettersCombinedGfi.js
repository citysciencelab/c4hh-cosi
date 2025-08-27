import state from "./stateCombinedGfi";
import {generateSimpleGetters} from "../../../../src/shared/js/utils/generators";


const getters = {
    /**
     * Generates simple getters for the state.
     *
     * @function
     * @param {Object} state - The state object.
     * @returns {Object} The generated getters.
     */
    ...generateSimpleGetters(state),
    /**
     * Getter for table data.
     *
     * @function
     * @param {Object} CombinedGfiState - The state object for combinedGfi.
     * @returns {Object} An object containing headers and items for the table.
     * @property {Array} headers - The columns of the table.
     * @property {Array} items - The rows of the table.
     */
    tableData: CombinedGfiState => ({
        headers: CombinedGfiState.columns,
        items: CombinedGfiState.rows
    })
};

export default getters;
