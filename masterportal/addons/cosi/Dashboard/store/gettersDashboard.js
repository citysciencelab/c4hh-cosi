
import {generateSimpleGetters} from "../../../../src/shared/js/utils/generators";
import stateDashboard from "./stateDashboard";
import {getTimestamps} from "../../utils/timeline";

export default {
    ...generateSimpleGetters(stateDashboard),

    /**
     * Gets the column header from value as key
     * @param {String} value - the value of the column
     * @return {String} the column header
     */
    getColumnHeader: state => function (value) {
        if (Object.prototype.hasOwnProperty.call(state.columnHeader, value) && typeof state.columnHeader[value] === "string") {
            return state.columnHeader[value];
        }

        return value;
    },

    getData (state, getters) {
        return state.rows.map(row => getters.getDistrictStatsByCategory(row), []);
    },

    getDistrictStatsByCategory: state => function (row) {
        const districtStats = {
            ...row
        };

        for (const col of state.districtColumns) {
            const statFeature = col.district.statFeatures
                .find(feature => feature.get("kategorie") === row.category);

            if (statFeature) {
                districtStats[col.value] = statFeature.getProperties();
            }
        }

        if (state.timestampsFiltered.length > 0) {
            districtStats.years = state.timestampsFiltered;
        }
        else {
            districtStats.years = [...getTimestamps(districtStats, state.timestampPrefix)].sort((a, b) => b - a);
        }

        districtStats.id = districtStats.category + districtStats.groupIndex;

        return districtStats;
    },

    /**
     * Generates empty rows for all data categories
     * taken from the mapping.json in /portal/cosi/config/ and set in config.json
     * @returns {void}
     */
    getRows (state, getters, rootGetters) {
        let counter = 0;

        return rootGetters.Modules.DistrictSelector.mapping.reduce((rows, category, index, array) => {
            const level = rootGetters.Modules.DistrictSelector.selectedDistrictLevel?.label?.toLowerCase() || "";
            let layerId;

            if (level.includes("stat") || level.includes("gebiet")) {
                layerId = category.stat_gebiet;
            }
            else if (level.includes("stadt")) {
                layerId = category.stadtteil;
            }
            else if (level.includes("bezirk")) {
                layerId = category.bezirk;
            }
            return [
                ...rows,
                {
                    visualized: false, // is the data visualized in the map
                    expanded: false, // is the timeline expanded
                    category: category.value,
                    group: category.group,
                    valueType: category.valueType,
                    isTemp: category.isTemp,
                    calculation: category.calculation,
                    groupIndex: array[index].group !== array[index + 1]?.group ? counter++ : counter,
                    orientationValue: category.orientationValue,
                    layerId: layerId ? String(layerId) : undefined
                }
            ];
        }, []);
    },

    /**
     * Checks whether there is at least one object with an orientation value in the mapping json.
     * @returns {Boolean} True if there is an orientation value.
     */
    hasMappingOrientationValue (state, getters, rootGetters) {
        return rootGetters.Modules.DistrictSelector.mapping.some(obj => typeof obj.orientationValue !== "undefined");
    }
};
