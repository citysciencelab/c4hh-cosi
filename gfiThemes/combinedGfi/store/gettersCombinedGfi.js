import state from "./stateCombinedGfi.js";
import {generateSimpleGetters} from "../../../../src/shared/js/utils/generators.js";
import {formatJsonData} from "../utils/exportUtils.js";


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
    }),
    /**
     * Getter for json data. Can be used for `dynamicImports` in case the OGC API relies on other service's data.
     *
     * @function
     * @param {Object} CombinedGfiState - The state object for combinedGfi.
     * @returns {object} json of retrieved information as it would appear in a json export
     */
    jsonData: CombinedGfiState => formatJsonData(CombinedGfiState.layerResults)
};

export default getters;
