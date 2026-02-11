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
        },
        selectionMode: {
            type: String,
            required: false,
            default: "tags",
            validator: v => ["tags", "dropdown"].includes(v)
        },
        selectionLabel: {
            type: String,
            required: false,
            default: "Datensatz"
        },
        showLegend: {
            type: Boolean,
            required: false,
            default: false
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
                        display: false,
                        position: "bottom",
                        align: "center",
                        labels: {
                            usePointStyle: true,
                            pointStyle: "rectRounded",
                            boxWidth: 30,
                            padding: 15
                        }
                    }
                }
            },
            selectedXValues: [],
            barChartTitle: "",
            lineChartTitle: "",
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
                    for (const key in dataEntry.values) {
                        values.add(key);
                    }
                });
            });
            return [...values].sort().reverse();
        },
        /**
         * Determines the chart type to render. Forces "bar" mode when exactly one x-value is selected
         * @returns {String} The effective chart mode ("bar" or "line").
         */
        effectiveChartMode () {
            if (this.selectedXValues.length === 1) {
                return "bar";
            }
            return this.chartMode;
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
            if (this.selectedXValues.length === 1) {
                const selectedYear = this.selectedXValues[0];

                return this.data.map(dataset => ({
                    ...dataset,
                    data: [
                        Object.fromEntries(
                            dataset.data.map(dataEntry => [
                                dataEntry.district,
                                {
                                    value: dataEntry.values?.[selectedYear],
                                    hidden: dataEntry.hidden || false
                                }
                            ])
                        )
                    ]
                }));
            }

            return this.data.map(dataset => ({
                ...dataset,
                data: dataset.data.map(dataEntry => ({
                    ...dataEntry,
                    values: Object.fromEntries(
                        Object.entries(dataEntry.values || {})
                            .filter(([key]) => this.selectedXValues.includes(key))
                    )
                }))
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
        data () {
            const availableYears = this.allXValues;

            this.selectedXValues = this.selectedXValues.filter(year => availableYears.includes(year));
        },
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
            let title = entry?.title || "";

            if (!entry) {
                this.initializeTags();
                this.loadInitialChart();
                return;
            }
            this.chartOptions.plugins.legend.display = this.showLegend;

            if (this.selectedXValues.length === 1) {
                const year = this.selectedXValues[0];

                if (!title.includes(year)) {
                    title += " für " + year;
                }
            }

            this.chartOptions.plugins.title.text = title;

            if (this.effectiveChartMode === "bar") {
                const rawData = entry.data?.[0],
                    labels = Object.keys(rawData);

                this.chartdata.bar = {
                    labels: [""],
                    datasets: labels.map((key) => ({
                        label: key,
                        data: [typeof rawData[key] === "object" && rawData[key] !== null ? rawData[key].value : rawData[key]],
                        borderWidth: 2,
                        hidden: typeof rawData[key] === "object" && rawData[key] !== null ? rawData[key].hidden || false : false
                    }))
                };
            }
            if (this.effectiveChartMode === "line") {
                const lineLabels = [
                    ...new Set(
                        entry.data.flatMap(dataSet => Object.keys(dataSet.values)
                        )
                    )
                ];

                this.chartdata.line = {
                    labels: lineLabels,
                    datasets: entry.data.map((dataSet) => ({
                        label: dataSet.district,
                        data: lineLabels.map(label => dataSet.values?.[label]),
                        borderWidth: 2,
                        fill: false,
                        tension: 0.35,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        pointHitRadius: 10,
                        pointBorderWidth: 2,
                        hidden: dataSet.hidden || false
                    }))
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
            class="d-flex flex-wrap gap-3 mb-3"
        >
            <TagGroup
                v-if="selectionMode === 'tags'"
                class="col mb-3 mt-2"
                :items="tags"
                :label="selectionLabel"
                @update:selected-items="updateSelectedTag"
            />
            <Dropdown-Autocomplete
                v-else
                class="col"
                :items="dropdownOptions"
                :label="selectionLabel"
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
            v-if="effectiveChartMode === 'bar'"
            :key="reloadChart"
            :data="chartdata.bar"
            :given-options="chartOptions"
        />
        <LinechartItem
            v-if="effectiveChartMode === 'line'"
            :key="reloadChart"
            :given-options="chartOptions"
            :data="chartdata.line"
        />
    </div>
</template>
<style scoped lang="scss">
</style>
