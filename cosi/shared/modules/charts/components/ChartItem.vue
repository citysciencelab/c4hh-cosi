<script>
import BarchartItem from "@shared/modules/charts/components/BarchartItem.vue";
import DropdownAutocomplete from "../../dropdown/components/DropdownAutocomplete.vue";
import LinechartItem from "@shared/modules/charts/components/LinechartItem.vue";
import TagGroup from "../../tags/components/TagGroup.vue";

export default {
    name: "ChartItem",
    components: {
        BarchartItem,
        DropdownAutocomplete,
        LinechartItem,
        TagGroup
    },
    props: {
        chartMode: {
            type: String,
            required: false,
            default: "bar",
            validator: v => ["bar", "line"].includes(v)
        },
        data: {
            type: Array,
            required: true
        },
        showXValuesFilter: {
            type: Boolean,
            required: false,
            default: false
        },
        xValuesFilterLabel: {
            type: String,
            required: false,
            default: ""
        }
    },
    data () {
        return {
            chartdata: {
                bar: {
                    labels: [],
                    datasets: []
                },
                line: {
                    labels: [],
                    datasets: []
                }
            },
            chartOptions: {
                plugins: {
                    title: {
                        display: true,
                        text: "",
                        align: "center",
                        font: {
                            size: 14,
                            color: "#424242"
                        },
                        fullSize: false,
                        padding: {
                            top: 10,
                            bottom: 30
                        }
                    },
                    legend: {
                        display: false
                    }
                }
            },
            chartTitle: "",
            selectedXValues: [],
            reloadChart: 1,
            tags: []
        };
    },

    computed: {
        /**
         * Returns all x values that are available in the data.
         * @returns {Number[]|String[]} An array of all x values.
         */
        allXValues () {
            const values = new Set();

            this.data.forEach(dataset => {
                dataset.data.forEach(dataEntry => {
                    for (const key in dataEntry) {
                        values.add(key);
                    }
                });
            });
            return [...values].sort().reverse();
        },
        /**
         * Returns the names of the charts that can be selected.
         * @returns {Array} An array of all dropdown options.
         */
        dropdownOptions () {
            return this.data.map(item => item.name);
        },

        /**
         * Returns the data filtered by the selected x values.
         * @returns {Object[]} The filtered data.
         */
        filteredData () {
            if (this.selectedXValues.length === 0) {
                return this.data;
            }
            return this.data.map(dataset => ({
                ...dataset,
                data: dataset.data.map(
                    dataEntry => Object.fromEntries(Object.entries(dataEntry)
                        .filter(([key]) => this.selectedXValues.includes(key))
                    )
                )
            }));
        },

        /**
         * Returns the selected tag.
         * @returns {String} The selected tag.
         */
        selectedTagLabel () {
            const selectedTag = this.tags.find(tag => tag.selected);

            return selectedTag ? selectedTag.label : "";
        }
    },

    watch: {
        filteredData: "loadChartData"
    },

    mounted () {
        this.initializeTags();
        this.loadInitialChart();
    },

    methods: {
        /**
         * Initializes the tags. The first tag is selected.
         * @returns {void}
         */
        initializeTags () {
            this.tags = this.data.map((item, idx) => ({
                label: item.name,
                selected: idx === 0,
                value: item.name
            }));
        },

        /**
         * Load the chart depending on the selected tag.
         * @returns {void}
         */
        loadInitialChart () {
            const firstSelected = this.tags.find(tag => tag.selected);

            if (!firstSelected) {
                return;
            }
            this.loadChartData(firstSelected.label);
        },

        /**
         * Loads the chart data and sets the chart options depending on whether it is a bar or line chart.
         * @param {Object} selectedLabel - The type/dataset selected by the user.
         * @returns {void}
         */
        loadChartData (selectedLabel) {
            const entry = this.filteredData.find(
                item => item.name === selectedLabel && item.data
            );

            if (!entry) {
                this.initializeTags();
                this.loadInitialChart();
                return;
            }
            const labels = [... new Set(entry.data.flatMap(dataSet => Object.keys(dataSet)))],
                datasets = entry.data.map(dataSet => ({
                    backgroundColor: "#3C5F94",
                    borderColor: "#3C5F94",
                    borderWidth: 2,
                    fill: false,
                    data: Object.values(dataSet)
                }));

            this.chartTitle = entry.title;
            this.chartOptions.plugins.title.text = entry.title;

            if (this.chartMode === "bar") {
                this.chartdata.bar = {
                    labels,
                    datasets
                };
            }
            else if (this.chartMode === "line") {
                this.chartdata.line = {
                    labels,
                    datasets: datasets.map(dataset => (
                        {
                            ...dataset,
                            fill: false,
                            pointBorderColor: "#3C5F94",
                            pointBackgroundColor: "#3C5F94"
                        }
                    ))
                };
            }
            this.reloadChart++;
        },
        /**
         * Updates the selected tags.
         * @param {Object} newTag - The selected tag.
         * @returns {void}
         */
        updateSelectedTag (newTag) {
            if (!newTag) {
                return;
            }

            this.tags.forEach(tag => {
                tag.selected = tag.label === newTag.label;
            });
            this.loadChartData(newTag.label);
        }
    }
};
</script>
<template lang="html">
    <div
        class="row"
    >
        <div
            v-if="data.length > 1"
            class="d-flex flex-wrap gap-3"
        >
            <TagGroup
                v-if="data.length < 6"
                class="col mb-3 mt-2"
                :items="tags"
                :label="$t('additional:modules.tools.cosi.calculateRatio.calculationType')"
                @update:selected-items="updateSelectedTag"
            />
            <Dropdown-Autocomplete
                v-else
                class="col"
                :items="dropdownOptions"
                :label="$t('additional:modules.tools.cosi.calculateRatio.calculationType')"
                :model-value="[selectedTagLabel]"
                @update:model-value="loadChartData($event)"
            />
            <DropdownAutocomplete
                v-if="showXValuesFilter"
                v-model="selectedXValues"
                :items="allXValues"
                :label="xValuesFilterLabel"
                multiple
            />
        </div>
        <BarchartItem
            v-if="chartMode === 'bar'"
            :key="reloadChart"
            :data="chartdata.bar"
            :given-options="chartOptions"
        />
        <LinechartItem
            v-if="chartMode === 'line'"
            :key="reloadChart"
            :given-options="chartOptions"
            :data="chartdata.line"
        />
    </div>
</template>
<style scoped lang="scss">
</style>
