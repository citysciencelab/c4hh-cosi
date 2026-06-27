<script>
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import {uniqueId} from "@shared/js/utils/uniqueId";
import {mapGetters} from "vuex";
import ChartItem from "../../shared/modules/charts/components/ChartItem.vue";

export default {
    name: "DashboardChartView",
    components: {
        AccordionItem,
        ChartItem
    },
    data () {
        return {
            higherDistrictLevel: [],
            userHiddenStates: {}
        };
    },
    computed: {
        ...mapGetters("Modules/Dashboard", ["districtColumns", "items", "statsFeatureFilter", "timestampPrefix", "timestamps", "timestampsFiltered"]),
        ...mapGetters(
            "Modules/DistrictSelector", ["districtLevels", "selectedDistrictLevelId"]
        ),

        /**
         * Gets the items grouped by their group property.
         * @returns {Object} Object with groups as keys and array of items as values.
         */
        groupedItems () {
            const groups = {};

            this.items.forEach(item => {
                groups[item.group] ??= [];
                groups[item.group].push(item);
            });
            return groups;
        },

        /**
         * Gets the selected items grouped by their group property.
         * @returns {Object} Object with groups as keys and array of items as values.
         */
        selectedGroupedItems () {
            const groups = {};

            this.items.forEach(item => {
                if (this.statsFeatureFilter.length > 0 && !this.statsFeatureFilter.includes(item.category)) {
                    return;
                }
                groups[item.group] ??= [];
                groups[item.group].push(item);
            });
            return groups;
        }
    },
    methods: {
        uniqueId,

        /**
         * Checks whether the given district level is higher than the currently selected district level.
         * @param {String} districtLevel - The district level to check.
         * @returns {Boolean} Returns true if the given district level is above the selected one otherwise false.
         */
        isHigherDistrictLevel (districtLevel) {
            const index = this.districtLevels.findIndex(
                level => level.layerId === this.selectedDistrictLevelId
            );

            if (index === -1) {
                return false;
            }

            for (let i = index + 1; i < this.districtLevels.length; i++) {
                if (this.districtLevels[i].label === districtLevel) {
                    return true;
                }
            }
            return false;
        },

        /**
         * Determines whether a specific district should be hidden.
         * @param {Object} column - The district column object.
         * @param {Object} item - The group object.
         * @returns {Boolean} True if the district should be hidden, false otherwise.
         */
        isItemHidden (column, item) {
            if (this.userHiddenStates[column.value] !== undefined) {
                return this.userHiddenStates[column.value];
            }
            return this.isHigherDistrictLevel(column.districtLevel) && item.valueType !== "relative";
        },

        /**
         * Gets the barchart data for a given group.
         * @param {Object} group - The group to get data for
         * @param {Object[]} districtColumns - The district columns to use
         * @param {String} timestamp - The timestamp to use for the barchart data
         * @param {String} timestampPrefix - The prefix for the timestamps
         * @returns {Object[]} The barchart data for the group
         */
        getBarchartDataForGroup (group, districtColumns, timestamp, timestampPrefix) {
            return group.map(item => ({
                name: item.category,
                title: "Statistische Daten: " + item.category + " für " + timestamp,
                data: [
                    Object.fromEntries(districtColumns.map(column => [
                        column.value,
                        {
                            value: item[column.value]?.[`${timestampPrefix}${timestamp}`],
                            hidden: this.isItemHidden(column, item)
                        }
                    ]))
                ]
            }));
        },

        /**
         * Gets the linechart data for a given group.
         * @param {Object} group - The group to get data for
         * @param {Object[]} districtColumns - The district columns to use
         * @param {String} timestampPrefix - The prefix for the timestamps
         * @returns {Object[]} The linechart data for the group
         */
        getLinechartDataForGroup (group, districtColumns, timestampPrefix) {
            return group.map(item => ({
                name: item.category,
                title: "Statistische Daten: " + item.category,
                data: districtColumns.map(column => ({
                    district: column.value,
                    hidden: this.isItemHidden(column, item),
                    values: Object.fromEntries(item.years
                        .filter(timestamp => typeof item[column.value]?.[`${timestampPrefix}${timestamp}`] !== "undefined")
                        .map(timestamp => [
                            timestamp,
                            item[column.value]?.[`${timestampPrefix}${timestamp}`]
                        ])
                    )
                }))
            }));
        },

        /**
         * Returns the chart data for the specified group and district columns based on the chart mode.
         * Determines whether to generate data for a bar chart or a line chart.         *
         * @param {Object[]} group - The group object containing data for the chart.
         * @param {Object[]} districtColumns - An array of district column identifiers.
         * @returns {Object[]} The chart data formatted for the specified chart mode (bar or line).
         */
        getChartData (group, districtColumns) {
            const chartMode = this.getChartMode(group, districtColumns);

            if (chartMode.type === "bar") {
                return this.getBarchartDataForGroup(group, districtColumns, chartMode.timestamps[0], this.timestampPrefix);
            }
            return this.getLinechartDataForGroup(group, districtColumns, this.timestampPrefix);
        },

        /**
         * Determines the chart mode (either "bar" or "line") based on the uniqueness of timestamps.
         * @param {Object[]} group - The grouped array of dashboard item objects.
         * @param {Object[]} districtColumns - The array of dashboard column objects.
         * @returns {Object} An object containing the unique timestamps and the determined chart type ("bar" or "line").
         */
        getChartMode (group, districtColumns) {
            const uniqueTimestamps = this.getUniqueTimestamps(group, districtColumns, this.timestampPrefix);

            return {
                timestamps: uniqueTimestamps,
                type: uniqueTimestamps.length === 1 ? "bar" : "line"
            };
        },

        /**
         * Extracts unique timestamps from a group of data based on specified district columns and a timestamp prefix.         *
         * @param {Object[]} group - The grouped array of dashboard item objects.
         * @param {Object[]} districtColumns - The array of dashboard column objects.
         * @param {String} timestampPrefix - The prefix to prepend to each timestamp for lookup.
         * @returns {String[]} - An array of unique timestamps.
         */
        getUniqueTimestamps (group, districtColumns, timestampPrefix) {
            const timestamps = group.flatMap(
                item => districtColumns.flatMap(
                    column => item.years.filter(
                        timestamp => typeof item[column.value]?.[`${timestampPrefix}${timestamp}`] !== "undefined"
                    )
                )
            );

            return [...new Set(timestamps)];
        },

        /**
         * Sets the visibility state for a specific legend item.
         * @param {string} label - The legend item's label
         * @param {boolean} hidden - Whether the legend item should be hidden
         */
        handleLegendChange (label, hidden) {
            this.userHiddenStates = {
                ...this.userHiddenStates,
                [label]: hidden
            };
        }
    }
};
</script>

<template>
    <AccordionItem
        v-for="(group, groupName) in selectedGroupedItems"
        :id="uniqueId()"
        :key="groupName"
        :title="groupName"
        coloured-header
    >
        <ChartItem
            class="mt-4 mb-5"
            :chart-mode="getChartMode(group, districtColumns, timestampPrefix).type"
            :data="getChartData(group, districtColumns)"
            :download-mode="true"
            :show-x-values-filter="getChartMode(group, districtColumns).type === 'line'"
            :x-values-filter-label="$t('additional:modules.tools.cosi.dashboard.year')"
            :selection-mode="'dropdown'"
            :selection-label="$t('additional:modules.tools.cosi.dashboard.datasetLabel')"
            :show-legend="true"
            @legend-change="(label, hidden) => handleLegendChange(label, hidden)"
        />
    </AccordionItem>
</template>
