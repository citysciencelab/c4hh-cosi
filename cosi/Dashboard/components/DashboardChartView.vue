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
    computed: {
        ...mapGetters("Modules/Dashboard", ["districtColumns", "items", "statsFeatureFilter", "timestampPrefix", "timestamps", "timestampsFiltered"]),

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
        },

        /**
         * Gets the timestamps to use in the charts. All timestamps if none are filtered.
         * @returns {Number[]} The timestamps to use
         */
        timestampsToUse () {
            return this.timestampsFiltered.length > 0 ? this.timestampsFiltered : this.timestamps.toSorted();
        }
    },
    methods: {
        uniqueId,

        /**
         * Gets the barchart data for a given group.
         * @param {Object} group The group to get data for
         * @param {Object[]} districtColumns The district columns to use
         * @param {Object[]} timestampsToUse The timestamps to use
         * @param {String} timestampPrefix The prefix for the timestamps
         */
        getBarchartDataForGroup (group, districtColumns, timestampsToUse, timestampPrefix) {
            return group.map(item => ({
                name: item.category,
                data: [
                    Object.fromEntries(districtColumns.map(column => [
                        column.value,
                        item[column.value]?.[`${timestampPrefix}${timestampsToUse[0]}`]
                    ]))
                ]
            }));
        },

        /**
         * Gets the linechart data for a given group.
         * @param {Object} group The group to get data for
         * @param {Object[]} districtColumns The district columns to use
         * @param {Object[]} timestampsToUse The timestamps to use
         * @param {String} timestampPrefix The prefix for the timestamps
         */
        getLinechartDataForGroup (group, districtColumns, timestampsToUse, timestampPrefix) {
            return group.map(item => ({
                name: item.category,
                data: districtColumns.map(
                    column => Object.fromEntries(timestampsToUse.map(timestamp => [
                        timestamp,
                        item[column.value]?.[`${timestampPrefix}${timestamp}`]
                    ]))
                )
            }));
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
            :chart-mode="timestampsToUse.length === 1
                ? 'bar'
                : 'line'"
            :data="timestampsToUse.length === 1
                ? getBarchartDataForGroup(group, districtColumns, timestampsToUse, timestampPrefix)
                : getLinechartDataForGroup(group, districtColumns, timestampsToUse, timestampPrefix)"
            :show-x-values-filter="timestampsToUse.length > 1"
            :x-values-filter-label="$t('additional:modules.tools.cosi.dashboard.year')"
        />
    </AccordionItem>
</template>
