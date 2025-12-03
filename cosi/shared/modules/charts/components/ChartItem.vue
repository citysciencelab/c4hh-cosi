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
                        font: {
                            size: 14,
                            color: "#424242"
                        }
                    },
                    legend: {
                        display: false
                    }
                }
            },
            chartTitle: "",
            reloadChart: 1,
            tags: []
        };
    },

    computed: {
        /**
         * Returns the names of the charts that can be selected.
         * @returns {Array} An array of all dropdown options.
         */
        dropdownOptions () {
            return this.data.map(item => item.name);
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
            const entry = this.data.find(
                    item => item.name === selectedLabel && item.data
                ),
                values = Object.values(entry.data),
                labels = Object.keys(entry.data),
                dataset = {
                    backgroundColor: "#3C5F94",
                    borderColor: "#3C5F94",
                    borderWidth: 2,
                    fill: false,
                    data: values
                };

            this.chartTitle = entry.title;
            this.chartOptions.plugins.title.text = entry.title;

            if (this.chartMode === "bar") {
                this.chartdata.bar = {
                    labels,
                    datasets: [dataset]
                };
            }
            else if (this.chartMode === "line") {
                this.chartdata.line = {
                    labels,
                    datasets: [
                        {
                            ...dataset,
                            fill: false,
                            pointBorderColor: "#3C5F94",
                            pointBackgroundColor: "#3C5F94"
                        }
                    ]
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
        <TagGroup
            v-if="data.length < 6"
            class="mb-3 mt-2"
            :items="tags"
            :label="'Datensatz/Berechnung'"
            @update:selected-items="updateSelectedTag"
        />
        <Dropdown-Autocomplete
            v-else
            :items="dropdownOptions"
            :label="'Datensatz/Berechnung'"
            :model-value="[selectedTagLabel]"
            @update:model-value="loadChartData($event)"
        />
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
