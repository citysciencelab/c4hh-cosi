import getColumns from "../utils/getColumns";
import {getTimestamps} from "../../utils/timeline";

export default {

    /**
     * Generates the table data for the v-data-table (headers/columns, items/rows)
     * @returns {void}
     */
    generateTable ({state, commit, dispatch, getters, rootGetters}) {
        commit("setTimestamps", []);
        dispatch("handleOrientationColumn", {
            hasMappingOrientationValue: getters.hasMappingOrientationValue,
            aggregateColumns: state.aggregateColumns
        });
        commit("setDistrictColumns", getColumns(rootGetters["Modules/DistrictSelector/selectedDistrictLevel"], rootGetters["Modules/DistrictSelector/selectedDistrictNames"], []));
        commit("setRows", getters.getRows);

        commit("setItems", getters.getData);
        commit("setTimestamps", [...getTimestamps(state.items, state.timestampPrefix)]);
        return getters.items;
    },

    /**
     * Adds a column for the orientations values if it is not yet available and
     * there is at least one orientation value in the mapping json.
     * @param {Boolean} hasMappingOrientationValue - True if there is an orientation value.
     * @param {Object[]} aggregateColumns - Columns for total and average values.
     * @returns {void}
     */
    handleOrientationColumn ({getters}, {hasMappingOrientationValue, aggregateColumns}) {
        const hasOrientationColumn = aggregateColumns.find(col => col.value === "orientationValue");

        if (hasMappingOrientationValue && !hasOrientationColumn) {
            aggregateColumns.splice(0, 0, {
                text: getters.getColumnHeader("orientationValue"),
                value: "orientationValue",
                align: "end",
                sortable: false,
                groupable: false,
                selected: false,
                isAggregation: true
            });
        }
    }
};
