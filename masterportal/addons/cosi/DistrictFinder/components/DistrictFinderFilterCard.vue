<script>
import BarchartItemAnnotated from "../../components/BarchartItemAnnotated.vue";
import Badges from "../../shared/modules/badges/components/Badges.vue";
import CustomCard from "../../shared/modules/cards/components/CustomCard.vue";
import deepAssign from "@shared/js/utils/deepAssign";
import DistrictFinderFilterSpinner from "./DistrictFinderFilterSpinner.vue";
import DropdownAutocomplete from "../../shared/modules/dropdown/components/DropdownAutocomplete.vue";
// import groupMapping from "../../utils/groupMapping";
import getOAFFeature from "@shared/js/api/oaf/getOAFFeature";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import {mapGetters} from "vuex";
import {VSnackbar} from "vuetify/components/VSnackbar";
export default {
    name: "DistrictFinderFilterCard",
    components: {
        BarchartItemAnnotated,
        Badges,
        CustomCard,
        DistrictFinderFilterSpinner,
        DropdownAutocomplete,
        InputText,
        VSnackbar
    },
    props: {
        active: {
            type: Boolean,
            required: false,
            default: false
        },
        cardNumber: {
            type: Number,
            required: true
        },
        condition: {
            type: Object,
            required: true
        },
        changeToLatestYear: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    emits: ["delete", "prepareFeatures", "scanCompleted", "validateField", "showHint"],
    data () {
        return {
            expandDataInfo: true,
            features: [],
            isLoading: false,
            latestPendingRequest: null,
            resultNames: [],
            referenceValue: undefined,
            selectedCategory: null,
            selectedData: "statistische Daten",
            selectedFilter: "=",
            selectedYear: new Date().getFullYear() - 1,
            showHint: false,
            tolerance: undefined,
            years: new Array(10).fill(new Date().getFullYear() - 1).map((v, i) => v - i),
            chartConfig: {
                data: {
                    datasets: [{
                        data: []
                    }],
                    labels: []
                },
                options: {
                    maintainAspectRatio: false,
                    animation: false,
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                autoSkip: true,
                                maxTicksLimit: 4
                            }
                        },
                        x: {
                            display: false
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        annotation: {
                            annotations: {
                                referenceLine: {
                                    type: "line",
                                    scaleID: "y",
                                    label: {},
                                    enter ({element}) {
                                        element.label.options.display = true;
                                        return true;
                                    },
                                    leave ({element}) {
                                        element.label.options.display = false;
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                }
            },
            chartOptions: {
                barPercentage: 1.0,
                categoryPercentage: 1.0,
                borderWidth: 0,
                hoverBackgroundColor: "rgb(49, 119, 177, 1)"
            },
            noDataset: false
        };
    },
    computed: {
        ...mapGetters("Modules/Language", ["currentLocale"]),
        ...mapGetters("Modules/DistrictFinder", ["chartColors", "groupBlacklist", "mapColors", "mapping", "referenceLineColor", "selectedLevelId", "selectedDistricts", "topLevelSelection"]),
        ...mapGetters("Modules/DistrictSelector", ["districtLevels", "selectedDistrictLevel"]),

        /**
         * Returns the selected features if a selection is made or all features.
         * @returns {Object[]} The statistical features.
         */
        featuresToUse () {
            const selectedDistrictsArray = [];

            if (Array.isArray(this.selectedDistricts)) {
                this.selectedDistricts.forEach(district => {
                    selectedDistrictsArray.push(this.selectedDistrictLevel.districtNamesMap?.[district] || district);
                });
            }

            return selectedDistrictsArray?.length
                ? this.features.filter(
                    feature => selectedDistrictsArray.includes(feature?.properties?.[this.keyOfAttrNameForSelectedLayer]))
                : this.features;
        },
        /**
         * Returns what the badges should look like.
         * @returns {Object[]} data for the badges.
         */
        dataChips () {
            return [
                {
                    backgroundColor: "#008DCB",
                    color: "rgba(255, 255, 255, 1)",
                    icon: "bi bi-bar-chart",
                    text: this.$t("additional:modules.cosi.districtSelector.statisticalData")
                }
            ];
        },

        /**
         * Returns translated dropdown entries for filter rules.
         * @returns {Object[]} dropdown entries with text and value keys.
         */
        filterRules () {
            return [
                {value: "=", title: this.$t("additional:modules.tools.cosi.districtFinder.comparison.equals")},
                {value: "<", title: this.$t("additional:modules.tools.cosi.districtFinder.comparison.less")},
                {value: ">", title: this.$t("additional:modules.tools.cosi.districtFinder.comparison.greater")}
            ];
        },
        /**
         * Returns the statistical values for the current district level as defined in the mapping.
         * @returns {Object[]} The mapping dataset values or an empty array.
         */
        datasetStatItems () {
            return this.datasetStat.map(v => v.value);
        },
        /**
         *  Returns the selected item based on the category.
         * @returns {Object[]} The mapping dataset values or an empty array.
         */
        selectedStatItems () {
            const item = this.datasetStat.find(v => v.category === this.selectedCategory);

            return item ? item.value : "";
        },
        /**
         * Returns the statistical datasets for the current district level as defined in the mapping.
         * @returns {Object[]} The mapping datasets or an empty array.
         */
        datasetStat () {
            // return groupMapping(this.mapping.filter(m => m[this.keyOfAttrNameStats]));
            return this.mapping.filter(m => m[this.keyOfAttrNameStats]);
        },

        /**
         * Returns if the reference value and tolerance is validated.
         * @returns {Boolean} true if the reference value and tolerance is validated.
         */
        isFieldValidated () {
            return this.checkInRange(this.selectedDataset?.valueType, this.referenceValue) && this.checkInRange(this.selectedDataset?.valueType, this.tolerance);
        },

        /**
         * Returns the key to be used for the district name in the currently selected layer.
         * (for example: "stat_gebiet", "statistisches_gebiet" or "stadtteil")
         * @returns {String} The key.
         */
        keyOfAttrNameForSelectedLayer () {
            return this.selectedDistrictLevel.stats.keyOfAttrName[
                this.selectedDistrictLevel.stats.layerIds.indexOf(
                    this.selectedStatLayer?.id
                )
            ];
        },

        /**
         * Gets the key for the attribute "name" of the regional statistical data features.
         * @returns {String} The name of the attribute.
         */
        keyOfAttrNameStats () {
            return this.selectedDistrictLevel.stats.keyOfAttrName[0];
        },

        /*
         * Returns the maximum value for the chosen category in the features to be used.
         * @returns {String} The maximum value or "-".
         */
        maximum () {
            const max = Math.max(... this.featuresToUse.map(feature => feature?.properties?.[this.selectedCategory])
                .filter(value => typeof value === "number")
            );

            return Number.isFinite(max) ? max.toLocaleString(this.currentLocale || "de-DE") : "-";
        },

        /**
         * Returns the mean value for the chosen category in the features to be used.
         * @returns {String} The mean value or "-".
         */
        meanValue () {
            const values = this.featuresToUse.map(feature => feature?.properties?.[this.selectedCategory])
                    .filter(value => typeof value === "number"),
                mean = values.reduce((acc, curr) => acc + curr, 0) / values.length;

            return Number.isFinite(mean) ? mean.toLocaleString(this.currentLocale || "de-DE", {maximumFractionDigits: 1}) : "-";
        },

        /**
         * Returns the minimum value for the chosen category in the features to be used.
         * @returns {String} The minimum value or "-".
         */
        minimum () {
            const min = Math.min(... this.featuresToUse.map(feature => feature?.properties?.[this.selectedCategory])
                .filter(value => typeof value === "number")
            );

            return Number.isFinite(min) ? min.toLocaleString(this.currentLocale || "de-DE") : "-";
        },

        /**
         * Returns currently selected statistical dataset.
         * @returns {Object} A single mapping dataset or undefined.
         */
        selectedDataset () {
            return this.datasetStat.find(d => d.category === this.selectedCategory);
        },

        /**
         * Returns if the current dataset group is in blacklist
         * @returns {Boolean} true if it is in blacklist.
         */
        isGroupInBlacklist () {
            return this.groupBlacklist.includes(this.datasetStat.find(d => d.category === this.selectedCategory).group);
        },

        /**
         * Gets the districts level at which the screening is running.
         * @returns {Object} The selected district level.
         */
        selectedDistrictLevel () {
            return this.districtLevels.find(district => district.layerId === this.selectedLevelId);
        },

        /**
         * Returns the statistical layer matching the currently selected dataset.
         * @returns {Object} A layer object or undefined.
         */
        selectedStatLayer () {
            return this.selectedDistrictLevel?.stats?.layers?.find(
                layer => layer.id === this.selectedDataset?.[this.keyOfAttrNameStats]);
        },

        /**
         * Returns the type of the selected dataset.
         * @returns {String} "absolut(e)", "relativ(e)", or "-".
         */
        type () {
            if (typeof this.selectedDataset?.valueType !== "string") {
                return "-";
            }
            return this.$t("additional:modules.tools.cosi.districtFinder.label.valueType",
                {context: this.selectedDataset.valueType});
        }
    },
    watch: {
        features: {
            handler () {
                this.addChartData();
            },
            deep: true
        },
        referenceValue (val) {
            this.chartConfig.options = Object.assign({}, deepAssign(this.chartConfig.options,
                {plugins: {annotation: {annotations: {referenceLine: {
                    borderColor: this.referenceLineColor,
                    value: typeof val === "number" ? val : undefined,
                    label: {
                        content: this.$t("additional:modules.tools.cosi.districtFinder.label.referenceValue")
                    }
                }}}}}
            ));
        },
        resultNames: {
            handler () {
                this.addChartData();
            },
            deep: true
        },
        /**
         * Updates the condition and its chart whenever the district selection changes.
         * @returns {void}
         */
        selectedDistricts () {
            if (this.selectedDataset) {
                this.chartConfig.options.animation = true;
                this.latestPendingRequest ? this.updateYear() : this.addChartData();
                setTimeout(() => {
                    this.chartConfig.options.animation = false;
                });
            }
        },

        /**
         * Updates the condition and its chart whenever the screening level changes.
         * @returns {void}
         */
        selectedLevelId () {
            if (this.selectedCategory && !this.selectedStatLayer) {
                this.noDataset = true;
            }
            this.updateSelectedCategory();
        }
    },
    mounted () {
        this.setConditionAttributes(this.condition);
    },
    methods: {
        /**
         * Adds data, labels and colors to the chart options.
          * @returns {void}
         */
        addChartData () {
            const sorted = this.sortedData(),
                allData = sorted.map(data => data[this.selectedCategory]),
                allLabels = sorted.map(label => label[this.keyOfAttrNameForSelectedLayer]);

            this.chartConfig.data = Object.assign({}, this.chartConfig.data, {labels: allLabels, datasets: [{...this.chartOptions, data: allData, backgroundColor: this.getChartColors(this.keyOfAttrNameForSelectedLayer)}]});
        },

        /**
         * Checks if the value is in range.
         * @param {String} type The type of stats.
         * @param {Number} value The main value to be evaluated.
         * @return {Boolean} if the value is in range.
         */
        checkInRange (type, value) {
            if (type === "relative" && (value < 0 || value > 100)) {
                return false;
            }

            return true;
        },

        /**
         * Compares two numerical values.
         * @param {String} mode The comparison operator to apply. One of "=", "<" or ">".
         * @param {Number} value The main value to be evaluated.
         * @param {Number} referenceValue The reference value to be evaluated.
         * @param {Number} [tolerance=0] Tolerance for mode "=".
         * @return {Boolean} Whether or not the values meet the chosen condition.
         */
        comparisonFunction (mode, value, referenceValue, tolerance = 0) {
            if (typeof referenceValue !== "number" || mode === "=" && typeof tolerance !== "number") {
                return false;
            }
            if (mode === "<") {
                return value < referenceValue;
            }
            if (mode === ">") {
                return value > referenceValue;
            }
            if (mode === "=") {
                return Math.abs(value - referenceValue) <= tolerance;
            }
            return false;
        },

        deleteCard () {
            this.$emit("delete", this.condition.id);
        },

        /**
         * Performs OAF request to get the statistical features and emits matching district names.
         * @param {Object} layer An oaf layer object containing at least url and collection.
         * @param {Number|String} year The year to retrieve the data for.
         * @param {String} [filter = true] The CQL2 filter property for oaf request. (https://lgv-hamburg.atlassian.net/wiki/spaces/EDDUN/pages/109183062/OAF+OGC+API+Features#4-Filtern-mit-CQL2)
         * @returns {Object[]} The retrieved features or an empty array.
         */
        async fetchFeatures (layer, year, filter = true) {

            if (!layer || !year) {
                return [];
            }

            const features = await getOAFFeature.getOAFFeatureGet(layer.url, layer.collection, {
                limit: 10000,
                filterCrs: "http://www.opengis.net/def/crs/EPSG/0/25832",
                crs: "http://www.opengis.net/def/crs/EPSG/0/25832",
                filter: filter,
                literalFilters: {jahr: `${year}`}
            });

            return features;
        },
        /**
         * Gets the chart colors depending on whether the condition is true or not.
         * @param {String} key The key to be used for the district name.
         * @returns {String[]} An array of the chart colors.
         */
        getChartColors (key) {
            const colorValues = [];

            this.sortedData().forEach(district => {
                if (typeof this.referenceValue !== "string") {
                    this.resultNames?.includes(district[key]) ? colorValues.push(this.chartColors.conditionTrue) : colorValues.push(this.chartColors.conditionFalse);
                }
                else {
                    colorValues.push(this.chartColors.conditionFalse);
                }
            });
            return colorValues;
        },
        /**
         * Transforms an oaf temporal extent object into an array of years.
         * @param {Date[][]} extent The temporal extent.
         * @return {Number[]} An array of the years that are part of the extent.
         */
        getYearsForTemporalExtent (extent) {
            if (!Array.isArray(extent)
                || !extent.length
                || !extent.every(interval => Array.isArray(interval))
                || !extent.every(interval => interval.length === 2)
                || !extent.every(interval => interval.every(date => date instanceof Date))
            ) {
                return [];
            }

            const years = new Set();

            extent.forEach(interval => {
                const firstYear = interval[0].getFullYear(),
                    lastYear = interval[1].getFullYear(),
                    yearsToAdd = new Array(lastYear - firstYear + 1).fill(firstYear).map((v, i) => v + i);

                yearsToAdd.forEach(year => years.add(year));
            });
            return [...years];
        },

        /**
         * Sets the attributes of this condition/card
         * @param {Object} condition - The condition attributes
         * @returns {void}
         */
        async setConditionAttributes (condition) {
            if (Object.prototype.hasOwnProperty.call(condition, "referenceValue")) {
                this.referenceValue = condition.referenceValue;
            }
            if (Object.prototype.hasOwnProperty.call(condition, "rule")) {
                this.selectedFilter = condition.rule;
            }
            if (Object.prototype.hasOwnProperty.call(condition, "ruleTolerance")) {
                this.tolerance = condition.ruleTolerance;
            }
            if (Object.prototype.hasOwnProperty.call(condition, "statisticCategory")) {
                this.selectedCategory = condition.statisticCategory;
                if (this.changeToLatestYear && this.selectedYear !== condition?.year) {
                    this.$emit("showHint", true);
                }
                await this.updateSelectedCategory(!this.changeToLatestYear);
            }
            if (Object.prototype.hasOwnProperty.call(condition, "year")) {
                if (this.selectedYear !== condition.year) {
                    this.selectedYear = condition.year;
                }
                if (!this.changeToLatestYear) {
                    this.updateYear();
                }
            }
        },

        /**
         * Sorts all areas in ascending order for chart.
         * @return {Object} an Object of all sorted data and labels.
         */
        sortedData () {
            return this.featuresToUse.map(feature => feature.properties)
                .sort((a, b) => a[this.selectedCategory] - b[this.selectedCategory]);
        },

        /**
         * Applies the current filter rules on the features and emits their names.
         * @emits scanCompleted - passing own condition id and the found district names.
         * @emits validateField - passing if the field is validated.
         */
        updateResults () {
            this.resultNames = this.features
                .filter(f => this.comparisonFunction(this.selectedFilter, f.properties[this.selectedCategory], this.referenceValue, this.tolerance))
                .map(f => f.properties[this.keyOfAttrNameForSelectedLayer]);

            if (this.selectedCategory !== null && typeof this.referenceValue !== "undefined") {
                this.$emit("scanCompleted", this.condition.id, this.resultNames, this.selectedYear, this.selectedCategory, this.referenceValue, this.tolerance, this.selectedFilter);
                this.$emit("validateField", this.isFieldValidated);
            }

            this.isLoading = false;
        },

        /**
         * Performs necessary updates when the selected category has changed.
         * @param {Boolean} skipYearUpdate  - The flag which decides wether the updateYear function should be called or not.
         * @returns {void}
         */
        async updateSelectedCategory (skipYearUpdate = false) {
            if (!this.selectedStatLayer) {
                console.warn("No layer found for selected category. Check categories and layer ids in config.json and mapping.json. Make also sure the required category (still) exists in the data schema.");
                this.features = [];
                return;
            }

            const years = this.getYearsForTemporalExtent(
                await getOAFFeature.getTemporalExtent(this.selectedStatLayer.url, this.selectedStatLayer.collection)
            );

            this.years = years.length ? years.reverse()
                : new Array(10).fill(new Date().getFullYear() - 1).map((v, i) => v - i);

            if (skipYearUpdate === true) {
                return;
            }

            this.selectedYear = this.years[0];
            await this.updateYear();
        },

        /**
         * Performs necessary updates when the selected year has changed.
         * @returns {void}
         */
        async updateYear () {
            if (!this.selectedCategory) {
                return;
            }

            this.isLoading = true;

            this.chartConfig.options.animation = true;
            let requestTimestamp;

            if (!this.isGroupInBlacklist) {
                try {
                    const topFilter = `bezirk IN ('${this.topLevelSelection.join("','")}')`;

                    requestTimestamp = this.latestPendingRequest = Date.now();

                    this.features = await this.fetchFeatures(
                        this.selectedStatLayer, this.selectedYear, topFilter
                    );
                    this.features.forEach(feature => {
                        feature.properties[this.selectedCategory] ||= 0;
                    });

                    if (requestTimestamp !== this.latestPendingRequest) {
                        return;
                    }
                    this.$emit("prepareFeatures", this.features, this.keyOfAttrNameForSelectedLayer);
                    this.updateResults();

                    setTimeout(() => {
                        this.chartConfig.options.animation = false;
                    });
                }
                catch {
                    console.warn("Request prefiltering by bezirk failed");
                }
            }

            requestTimestamp = this.latestPendingRequest = Date.now();

            this.features = await this.fetchFeatures(
                this.selectedStatLayer, this.selectedYear
            );
            this.features.forEach(feature => {
                feature.properties[this.selectedCategory] ||= 0;
            });

            if (requestTimestamp !== this.latestPendingRequest) {
                return;
            }
            this.latestPendingRequest = null;
            this.$emit("prepareFeatures", this.features, this.keyOfAttrNameForSelectedLayer);
            this.updateResults();

            setTimeout(() => {
                this.chartConfig.options.animation = false;
            });
        },
        /**
         * Updates the category depending on user selection.
         * @returns {void}
         */
        updateCategory (val) {
            const item = this.datasetStat.find(v => v.value === val);

            this.selectedCategory = item ? item.category : "";
            this.updateSelectedCategory();
        }
    }
};
</script>

<template lang="html">
    <div class="filter-card">
        <CustomCard
            class="mb-3 d-flex flex-nowrap"
            :closeable="true"
            @click:close="deleteCard"
        >
            <Badges
                v-for="(data, index) in dataChips"
                :key="index"
                class="mb-2 mt-1"
                :color="data.color"
                :text="data.text"
                :background-color="data.backgroundColor"
                :icon="data.icon"
            />
            <div class="container px-2 py-1">
                <div class="row">
                    <h5
                        class="d-flex align-items-center col-md-9 py-0 pb-0 pt-3"
                    >
                        {{ cardNumber }}. {{ $t('additional:modules.tools.cosi.districtFinder.condition') }}
                    </h5>
                    <div
                        v-if="typeof selectedDataset !== 'undefined' && selectedData === 'statistische Daten'"
                        class="col-md-3 p-0"
                    >
                        <Dropdown-Autocomplete
                            class="flex-grow-1"
                            :items="years"
                            :model-value="selectedYear"
                            :label="$t('additional:modules.tools.cosi.districtFinder.label.year')"
                            @update:model-value="updateYear"
                        />
                    </div>
                </div>
                <div class="row">
                    <div class="col-12 py-0 pe-0">
                        <Dropdown-Autocomplete
                            class="flex-grow-1"
                            :items="selectedData === 'statistische Daten' ? datasetStatItems : datasetFachdaten"
                            :model-value="selectedStatItems"
                            :label="$t('additional:modules.tools.cosi.districtFinder.label.dataset')"
                            @update:model-value="updateCategory"
                        />
                    </div>
                </div>
                <div
                    v-if="typeof selectedDataset !== 'undefined'"
                    class="row align-items-center"
                >
                    <div
                        v-if="typeof selectedDataset !== 'undefined'"
                        class="col-4 pt-1 pb-0 pe-1"
                    >
                        <Dropdown-Autocomplete
                            v-model="selectedFilter"
                            class="filter-rule flex-grow-1"
                            :items="filterRules"
                            :label="$t('additional:modules.tools.cosi.districtFinder.label.rule')"
                            @update:model-value="updateResults"
                        />
                    </div>
                    <div class="col-4">
                        <InputText
                            id="reference"
                            v-model.number="referenceValue"
                            class="reference-filter"
                            :class="{invalid: referenceValue === '' || !checkInRange(selectedDataset?.valueType, referenceValue)}"
                            type="number"
                            :placeholder="$t('additional:modules.tools.cosi.districtFinder.label.referenceValue')"
                            :label="$t('additional:modules.tools.cosi.districtFinder.label.referenceValue')"
                            @update:model-value="updateResults"
                        />
                    </div>
                    <div
                        class="col-4"
                        :class="typeof selectedDataset !== 'undefined' && selectedFilter === '=' ? '' : 'invisible'"
                    >
                        <InputText
                            id="tolerance"
                            v-model.number="tolerance"
                            :disabled="typeof referenceValue !== 'number'"
                            class="tolerance"
                            :class="{invalid: tolerance === '' || !checkInRange(selectedDataset?.valueType, tolerance)}"
                            :placeholder="$t('additional:modules.tools.cosi.districtFinder.label.tolerance')"
                            type="number"
                            :min="0"
                            :label="$t('additional:modules.tools.cosi.districtFinder.label.tolerance')"
                            @update:model-value="updateResults"
                        />
                    </div>
                </div>
                <div
                    v-if="!isFieldValidated"
                    class="hint row gy-0 pt-0"
                >
                    {{ $t("additional:modules.tools.cosi.districtFinder.errors.relativErr") }}
                </div>
                <div
                    v-if="typeof selectedDataset !== 'undefined'"
                    class="ps-0 pt-4 pb-1"
                >
                    <button
                        id="details-button"
                        type="button"
                        class="btn btn-link btn-sm pb-0 ps-0"
                        @click="expandDataInfo = !expandDataInfo"
                    >
                        <i
                            class="expand me-1"
                            :class="!expandDataInfo ? 'bi bi-chevron-down' : 'bi bi-chevron-up'"
                        />
                        {{ !expandDataInfo ? $t('additional:modules.tools.cosi.districtFinder.showDetails') : $t('additional:modules.tools.cosi.districtFinder.hideDetails') }}
                    </button>
                </div>
                <div
                    v-if="typeof selectedDataset !== 'undefined' && expandDataInfo"
                >
                    <div
                        v-if="features.length"
                        class="chart-container"
                    >
                        <BarchartItemAnnotated
                            :given-options="chartConfig.options"
                            :data="chartConfig.data"
                        />
                    </div>
                    <hr class="px-0 mx-0">
                    <div class="row">
                        <div class="col-3 pb-0">
                            <p class="text-center mb-0">
                                {{ $t('additional:modules.tools.cosi.districtFinder.label.minimum') }}
                            </p>
                            <p class="info-value text-center">
                                {{ minimum }}
                            </p>
                        </div>
                        <div class="col-3 pb-0">
                            <p class="text-center mb-0">
                                {{ $t('additional:modules.tools.cosi.districtFinder.label.meanValue') }}
                            </p>
                            <p class="info-value text-center">
                                {{ meanValue }}
                            </p>
                        </div>
                        <div class="col-3 pb-0">
                            <p class="text-center mb-0">
                                {{ $t('additional:modules.tools.cosi.districtFinder.label.maximum') }}
                            </p>
                            <p class="info-value text-center">
                                {{ maximum }}
                            </p>
                        </div>
                        <div class="col-3 pb-0">
                            <p class="text-center mb-0">
                                {{ $t('additional:modules.tools.cosi.districtFinder.label.type') }}
                            </p>
                            <p class="info-value text-center">
                                {{ type }}
                            </p>
                        </div>
                    </div>
                </div>
                <v-snackbar
                    v-model="noDataset"
                    :timeout="5000"
                >
                    {{ $t("additional:modules.tools.cosi.districtFinder.warnings.noDataset") }}
                </v-snackbar>
            </div>
        </CustomCard>
        <DistrictFinderFilterSpinner
            v-if="isLoading"
            class="loading-overlay"
        />
    </div>
</template>

<style lang="scss" scoped>

.chart-container {
    position: relative;
    margin: auto;
    height: 15vh;
}

h4 {
    &.active {
        font-family: $font_family_accent;
        color: $primary;
    }
}

.filter-card {
    position: relative;
    .loading-overlay {
        position: absolute;
        top: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.7);
        align-items: center;
    }
}

.hint {
    display: block;
    color: #e10019;
    margin-top: 30px;
}

.info-value {
    font-size: 16px;
    font-family: $font_family_accent;
}

.invalid {
    border: 0;
    outline: 0;
    box-shadow: inset 0 1px 2px rgba(225, 0, 25, 0.075), 0 0 0 0.25rem rgba(225, 0, 25, 0.25);
}

.data-filter {
    font-family: $font_family_accent;
}

</style>
