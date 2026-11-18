<script>
/**
 * @import { StatisticDashboardLevel } from "../types/typesStatisticDashboard"
 * @import {StatisticDashboardMapGetters, StatisticDashboardMapMutations} from "../types/helpers.js"
 */

import {and as andFilter, equalTo as equalToFilter, or as orFilter} from "ol/format/filter.js";
import {CanceledError} from "axios";
import ChartProcessor from "../js/chartProcessor.js";
import {colorbrewer} from "../js/colorbrewer.js";
import Controls from "./StatisticDashboardControls.vue";
import {convertColor} from "@shared/js/utils/convertColor.js";
import dayjs from "dayjs";
import debounce from "@shared/js/utils/debounce.js";
import FeaturesHandler from "../js/handleFeatures.js";
import FetchDataHandler from "../js/fetchData.js";
import {GeoJSON} from "ol/format.js";
import getFeature from "@shared/js/api/wfs/getFeature.js";
import getOAFFeature from "@shared/js/api/oaf/getOAFFeature.js";
import getters from "../store/gettersStatisticDashboard.js";
import getTimestepsMerged from "../js/getTimestepsMerged.js";
import GridComponent from "./StatisticGridComponent.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import isNumber from "@shared/js/utils/isNumber.js";
import isObject from "@shared/js/utils/isObject.js";
import LegendComponent from "./StatisticDashboardLegend.vue";
import {mapActions, mapGetters, mapMutations} from "vuex";
import Multiselect from "vue-multiselect";
import {openSecuredPopup} from "@shared/js/utils/openSecuredPopup.js";
import Overlay from "ol/Overlay.js";
import {pointerMove} from "ol/events/condition.js";
import {rawLayerList} from "@masterportal/masterportalapi/src/index.js";
import Select from "ol/interaction/Select.js";
import SpinnerItem from "@shared/modules/spinner/components/SpinnerItem.vue";
import StatisticDashboardDataSelection from "./StatisticDashboardDataSelection.vue";
import StatisticDashboardMapSettings from "./StatisticDashboardMapSettings.vue";
import TableComponent from "@shared/modules/table/components/TableComponent.vue";
import thousandsSeparator from "@shared/js/utils/thousandsSeparator.js";
import warnMissingSpecifics from "../js/warnMissingSpecifics.js";
import WFS from "ol/format/WFS.js";

const filterMap = {
    "Or": "OR",
    "And": "AND",
    "PropertyIsEqualTo": "=",
    "PropertyIsNotEqualTo": "<>",
    "PropertyIsLessThan": "<",
    "PropertyIsLessThanOrEqualTo": "<=",
    "PropertyIsGreaterThan": ">",
    "PropertyIsGreaterThanOrEqualTo": ">="
};

export default {
    name: "StatisticDashboard",
    components: {
        Controls,
        GridComponent,
        IconButton,
        LegendComponent,
        Multiselect,
        SpinnerItem,
        StatisticDashboardDataSelection,
        StatisticDashboardMapSettings,
        TableComponent
    },
    data () {
        return {
            abortController: new AbortController(),
            tableData: [],
            chosenTableData: [],
            testFixedData: {
                items: []
            },
            selectMode: "column",
            showHeader: true,
            sortable: true,
            loadedFilterData: false,
            loadedReferenceData: false,
            regions: [],
            allRegions: [],
            selectedLevelRegionNameAttribute: [],
            dates: [],
            sortedRows: [],
            currentChart: {},
            chartCounts: 0,
            showGrid: false,
            referenceFeatures: {},
            selectedColumn: undefined,
            colorArrayDifference: ["#E28574", "#89C67F"],
            legendValue: [],
            showNoLegendData: false,
            showLimitView: false,
            selectedFilteredRegions: [],
            allFilteredRegions: [],
            numberOfColouredBars: 3,
            diagramType: undefined,
            sideMenuWidth: undefined,
            canvasSize: undefined,
            statisticsData: undefined,
            chartData: undefined,
            noDataInColumn: undefined,
            featureWithoutValue: false,
            referenceSubTitle: "",
            fixedColumn: undefined,
            fixedRow: undefined,
            exportTableData: {},
            hoverInteraction: null,
            overlay: null,
            maxDecimalPlaces: 2,
            showMapLabels: true,
            showMapTooltips: true
        };
    },
    computed: {
        .../** @type {StatisticDashboardMapGetters} */ (mapGetters)("Modules/StatisticDashboard", [
            "categories",
            "selectedStatisticsKeys",
            "selectedRegions",
            "timeStepsFilter",
            "selectedDates",
            "selectedStatistics",
            "data",
            "chartTableToggle",
            "chosenStatisticName",
            "selectedRegionsValues",
            "selectedReferenceData",
            "flattenedRegions",
            "selectedDates",
            "selectedDatesValues",
            "numberOfClasses",
            "allowPositiveNegativeClasses",
            "classificationMode",
            "decimalPlaces",
            "stepValues",
            "legendData",
            "selectedLevel",
            "selectedLevelName",
            "showAggregatedView",
            "minNumberOfClasses",
            "maxNumberOfClasses",
            "selectableColorPalettes",
            "selectedColorPaletteIndex",
            "colorPalette",
            "opacity",
            "colorScheme",
            "lineLimit",
            "barLimit",
            "levelTitle",
            "subtitle",
            "addTotalCount",
            "isFeatureLoaded",
            "downloadFilename"
        ]),
        ...mapGetters("Maps", ["projection"]),

        /**
         * Checks if all filter settings are set.
         * @returns {boolean} true if all filter settings are set, false otherwise.
         */
        areAllFilterSettingsSet () {
            return this.selectedRegions.length > 0 &&
                this.selectedDates.length > 0 &&
                this.selectedStatisticsKeys.length > 0;
        },
        /**
         * Gets the statistics data for the currently chosen statistic name.
         * If a region is selected as reference, it filters out that region from the statistics data.
         * @returns {Object} The statistics data for the chosen statistic name.
         */
        statisticForStepValues () {
            if (!isObject(this.statisticsData?.[this.chosenStatisticName])) {
                return {};
            }
            if (this.selectedReferenceData?.type === "region") {
                return Object.fromEntries(Object.entries(this.statisticsData[this.chosenStatisticName])
                    .filter(([regionName]) => regionName !== this.selectedReferenceData.value)
                );
            }
            return this.statisticsData[this.chosenStatisticName];
        },

        /**
         * Gets the names of the selected statistics.
         * @returns {String[]} The names.
         */
        selectedStatisticsNames () {
            return Object.values(this.selectedStatistics).map(statistic => statistic?.name);
        },
        /**
         * Gets the Descriptions of the selected statistics.
         * @returns {Object[]} The Descriptions.
         */
        controlDescription () {
            if (!this.hasDescription(this.selectedStatistics)) {
                return [];
            }
            return this.setDescriptionsOfSelectedStatistics(this.selectedStatistics);
        },
        /**
         * Checks if the chart should be shown.
         * @returns {Boolean} true if it should shows the chart, false otherwise.
         */
        showChart () {
            return this.chartTableToggle === "chart";
        },
        /**
         * Checks if the table should be shown.
         * @returns {Boolean} true if it should shows the table, false otherwise.
         */
        showTable () {
            return this.chartTableToggle === "table";
        },
        /**
         * Checks if the map settings should be shown.
         * @returns {Boolean} true if it should shows the map settings, false otherwise.
         */
        showMap () {
            return this.chartTableToggle === "map";
        },
        /**
         * Returns the statisticName of chart.
         * @returns {String[]} the statistic name.
         */
        statisticNameOfChart () {
            return typeof this.chosenStatisticName === "string" && this.chosenStatisticName !== "" ? [this.chosenStatisticName] : this.selectedStatisticsNames;
        }
    },
    watch: {
        selectedReferenceData (val) {
            if (this.selectedRegionsValues.length && this.selectedDates.length) {
                this.checkFilterSettings(this.selectedRegionsValues, getters.selectedDatesValues(null, {selectedDates: this.selectedDates}), val);
            }
        },
        /**
         * Watches for changes in selected dates and calls checkFilterSettings.
         * @returns {void}
         */
        selectedDates () {
            if (this.showLimitView) {
                this.updateLimitedData();
            }
            this.checkFilterSettings(this.selectedRegionsValues, this.selectedDatesValues, this.selectedReferenceData);
        },
        /**
         * Watches for changes in selected region values and calls checkFilterSettings.
         * @returns {void}
         */
        selectedRegionsValues () {
            if (this.flattenedRegions?.length) {
                this.flattenedRegions[this.flattenedRegions.length - 1].selectedValues = this.selectedRegions;
            }

            if (this.showLimitView) {
                this.updateLimitedData();
            }
            this.checkFilterSettings(this.selectedRegionsValues, this.selectedDatesValues, this.selectedReferenceData);
        },
        /**
         * Watches for changes in selected statistic keys and calls checkFilterSettings.
         * @returns {void}
         */
        selectedStatisticsKeys () {
            if (this.showLimitView) {
                this.updateLimitedData();
            }
            this.checkFilterSettings(this.selectedRegionsValues, this.selectedDatesValues, this.selectedReferenceData);
        },
        /**
         Creates an overview and updates a chart when the overview is left.
         * @returns {void}
         */
        showGrid () {
            if (this.showGrid) {
                this.handleChartData(
                    this.selectedStatisticsNames,
                    this.selectedRegionsValues,
                    this.selectedDatesValues,
                    this.chartData,
                    this.selectedReferenceData?.type
                );
            }
            else {
                this.$nextTick(() => {
                    this.setStepValues(
                        FeaturesHandler.getStepValue(
                            this.statisticForStepValues,
                            this.numberOfClasses,
                            this.selectedColumn,
                            this.classificationMode,
                            this.allowPositiveNegativeClasses,
                            this.decimalPlaces
                        )
                    );
                    this.handleChartData(
                        this.statisticNameOfChart,
                        this.selectedRegionsValues,
                        this.selectedDatesValues,
                        this.chartData,
                        this.selectedReferenceData?.type
                    );
                });
            }
        },
        /**
         * Updates the table and the chart data when the chosen statistic name changes.
         * @param {String} statisticName - The new value of `chosenStatisticName`.
         */
        chosenStatisticName (statisticName) {
            this.$nextTick(() => {
                this.chosenTableData = this.getTableData(this.statisticsData, statisticName);
                if (!this.statisticsData) {
                    return;
                }
                this.setStepValues(
                    FeaturesHandler.getStepValue(
                        this.statisticForStepValues,
                        this.numberOfClasses,
                        this.selectedColumn,
                        this.classificationMode,
                        this.allowPositiveNegativeClasses,
                        this.decimalPlaces
                    )
                );
                this.handleChartData(
                    this.statisticNameOfChart,
                    this.selectedRegionsValues,
                    this.selectedDatesValues,
                    this.chartData,
                    this.selectedReferenceData?.type
                );
            });
        },
        /**
         * Adjusts the chosen statistic name and filtered regions based on the new selection.
         * @param {string[]} val The new value of `selectedStatisticsNames`.
         */
        selectedStatisticsNames (val) {
            if (val.length && !val.includes(this.chosenStatisticName)) {
                this.setChosenStatisticName(val[0]);
                this.selectedFilteredRegions = this.selectedFilteredRegions.filter(name => this.selectedRegionsValues.includes(name));
            }

            if (!val.length) {
                this.chosenTableData = [];
                this.setChosenStatisticName("");
            }
        },
        legendData: {
            handler (val) {
                this.legendValue = FeaturesHandler.getLegendValue(val, this.decimalPlaces, this.featureWithoutValue);
            },
            deep: true
        },

        classificationMode (val) {
            if (val === "custom") {
                return;
            }
            this.setStepValues(
                FeaturesHandler.getStepValue(
                    this.statisticForStepValues,
                    this.numberOfClasses,
                    this.selectedColumn,
                    val,
                    this.allowPositiveNegativeClasses,
                    this.decimalPlaces
                ));
            this.setColorPalette(this.createColorPalette());
        },

        allowPositiveNegativeClasses (val) {
            this.setStepValues(
                FeaturesHandler.getStepValue(
                    this.statisticForStepValues,
                    this.numberOfClasses,
                    this.selectedColumn,
                    this.classificationMode,
                    val,
                    this.decimalPlaces
                )
            );
        },

        numberOfClasses (val, oldVal) {
            if (this.classificationMode === "custom" && val > oldVal) {
                return;
            }
            else if (this.classificationMode === "custom") {
                this.setStepValues(this.stepValues.slice(0, val));
                return;
            }
            this.setStepValues(FeaturesHandler.getStepValue(
                this.statisticForStepValues,
                val,
                this.selectedColumn,
                this.classificationMode,
                this.allowPositiveNegativeClasses,
                this.decimalPlaces
            ));
            this.setColorPalette(this.createColorPalette());
        },

        selectedColorPaletteIndex () {
            this.setColorPalette(this.createColorPalette());
        },

        opacity () {
            this.updateAfterLegendChange();
        },

        /**
         * Watches for changes in the selected level name. Resets old level and loads the new level data.
         * @returns {void}
         */
        selectedLevelName () {
            this.resetLevel();
            this.initializeData(this.selectedLevel);
        },

        stepValues (val, oldVal) {
            if (val?.length !== oldVal?.length || val.some((value, index) => value !== oldVal[index])) {
                this.updateAfterLegendChange();
            }
        },

        colorPalette (value, oldValue) {
            if (oldValue.length) {
                this.updateAfterLegendChange();
            }
        },
        chartTableToggle (val) {
            if (val === "table" && isObject(this.statisticsData) && Object.keys(this.statisticsData).length && this.chosenStatisticName === "") {
                this.chosenTableData = this.getTableData(this.statisticsData, this.chosenStatisticName);
            }
        },
        /**
         * Redraws the map style when the labels are switched on or off.
         * @returns {void}
         */
        showMapLabels () {
            this.updateAfterLegendChange();
        },
        /**
         * Activates or deactivates the hover tooltip on the map.
         * @param {Boolean} value true if tooltips should be shown.
         * @returns {void}
         */
        showMapTooltips (value) {
            this.hoverInteraction?.setActive(value);
            if (!value) {
                this.overlay?.setPosition(undefined);
                this.clearHoverInfo();
            }
        }
    },
    async created () {
        const isLevelAlreadySelected = Boolean(this.selectedLevelName);

        if (!isLevelAlreadySelected) {
            this.setSelectedLevelName(this.data[0]?.levelName);
        }
        if (this.showAggregatedView) {
            warnMissingSpecifics(this.data);
        }
        this.layer = await this.addNewLayerIfNotExists({layerName: "statistic-dashboard"});
        this.addHoverInteraction();
        if (isLevelAlreadySelected) {
            this.initializeData(this.selectedLevel);
        }
    },
    deactivated () {
        document.getElementById("mp-menu-secondaryMenu").style.width = this.sideMenuWidth;
        this.removeHoverInteraction();
    },
    activated () {
        document.getElementById("mp-menu-secondaryMenu").style.width = "47vw";
        if (this.layer && !this.hoverInteraction) {
            this.addHoverInteraction();
        }
    },
    mounted () {
        this.sideMenuWidth = document.getElementById("mp-menu-secondaryMenu").style.width;

        if (this.minNumberOfClasses < 2) {
            this.setMinNumberOfClasses(2);
        }
        if (this.maxNumberOfClasses < 3 || this.maxNumberOfClasses <= this.minNumberOfClasses) {
            this.setMaxNumberOfClasses(Math.max(3, this.minNumberOfClasses + 1));
        }
        if (this.numberOfClasses < this.minNumberOfClasses) {
            this.setNumberOfClasses(this.minNumberOfClasses);
        }
        else if (this.numberOfClasses > this.maxNumberOfClasses) {
            this.setNumberOfClasses(this.maxNumberOfClasses);
        }
        this.checkFilterSettings(this.selectedRegionsValues, this.selectedDatesValues, this.selectedReferenceData);
    },
    beforeUnmount () {
        this.removeHoverInteraction();
        this.abortController.abort();
    },
    methods: {
        .../** @type {StatisticDashboardMapMutations} */ (mapMutations)("Modules/StatisticDashboard", [
            "setLegendData",
            "setDescriptionsOfSelectedStatistics",
            "setChosenStatisticName",
            "setStepValues",
            "setColorPalette",
            "setSelectedLevelName",
            "setMinNumberOfClasses",
            "setMaxNumberOfClasses",
            "setNumberOfClasses",
            "setSelectedReferenceValueTag",
            "setChartTableToggle",
            "setLevelTitle",
            "setReferenceData",
            "setFlattenedRegions",
            "setSelectedCategories",
            "setSelectedRegions",
            "setSelectedDates",
            "setSelectedReferenceData",
            "setSelectedStatisticsKeys",
            "setSelectedSpecificsTags",
            "setSelectableColorPalettes",
            "setTimeStepsFilter",
            "setIsFeatureLoaded"
        ]),
        ...mapActions("Maps", ["addNewLayerIfNotExists"]),
        ...mapActions("Menu", ["changeCurrentComponent"]),
        thousandsSeparator,

        /**
         * Downloads the currently rendered chart as a PNG file.
         * @returns {void}
         */
        downloadCurrentChart () {
            const canvas = this.$el.querySelector("canvas");

            canvas.toBlob((blob) => {
                const link = document.createElement("a");

                link.href = URL.createObjectURL(blob);
                link.download = this.generateDownloadName();
                link.click();

                URL.revokeObjectURL(link.href);
            }, "image/png");
        },

        /**
         * Generates a filename based on the chart title and current date.
         * @returns {string} The filename.
         */
        generateDownloadName () {
            const title = this.statisticNameOfChart[0],
                  date = dayjs().format("YYYY-MM-DD");

            return `${title}-${date}.png`;
        },

        /**
         * Loads the exportable table data by processing the statistics data using the downloadData function.
         * @returns {void}
         */
        loadTableExportData () {
            this.downloadData((data) => {
                if (data) {
                    this.exportTableData = data;
                }
                else {
                    this.exportTableData = {};
                }
            });
        },
        /**
         * Prepares and downloads the statistic data.
         * @param {Function} onsuccess The function which is called when the data is ready to download.
         * @returns {void}
         */
        downloadData (onsuccess) {
            if (typeof onsuccess !== "function") {
                return;
            }

            if (!isObject(this.statisticsData)) {
                onsuccess(null);
                return;
            }

            const csv = {},
                  csvHeader = [""],
                  csvSubHeader = ["Gebiet"];
            let elements = [];

            Object.entries(this.statisticsData).forEach(([statisticName, statisticValues]) => {
                const statisticAreaNames = Object.keys(statisticValues),
                      statisticTimeLabels = Object.keys(statisticValues[statisticAreaNames[0]]).reverse(),
                      amount = statisticTimeLabels.length;

                csvSubHeader.push(...statisticTimeLabels);
                for (let i = 0; i < amount; i++) {
                    csvHeader.push(statisticName);
                }
                statisticAreaNames.forEach(statisticAreaName => {
                    if (!Array.isArray(csv[statisticAreaName])) {
                        csv[statisticAreaName] = [];
                    }
                    const statisticTimeValues = Object.values(statisticValues[statisticAreaName]).reverse();

                    csv[statisticAreaName].push(...statisticTimeValues);
                });
            });
            elements = Object.entries(csv).map(([area, values]) => [area, ...values]);

            onsuccess([csvHeader, csvSubHeader, ...elements]);
        },

        /**
         * Performs necessary updates after the user has made changes in legend settings.
         * @returns {void}
         */
        updateAfterLegendChange () {
            if (this.selectedStatisticsNames?.length) {
                this.updateFeatureStyle(
                    this.selectedColumn,
                    this.selectedReferenceData);
            }
        },

        /**
         * Gets the unique values for the inputs of the filter for the given level.
         * @param {Object} level The level to get the unique values for.
         * @param {Object} level.mappingFilter The mapping object which holds the configuration of the time attribute and region name attribute.
         * @param {Object} level.timeAttribute The config object for the time attribute.
         * @param {String} level.timeAttribute.attrName The attrName of the time attribute.
         * @param {String} level.timeAttribute.inputFormat The format of the incoming date.
         * @param {String} level.timeAttribute.outputFormat The format in which the date should be displayed to the user.
         * @param {Object} level.regionNameAttribute The config object of the region name attribute.
         * @param {String} level.regionNameAttribute.attrName The attrName of the region name attribute.
         * @returns {Object} An object with the time and region attrName as key and an unique value list as value.
         */
        async getUniqueValuesForLevel (level) {
            if (!isObject(level) || !isObject(level.mappingFilter) || !isObject(level.mappingFilter.timeAttribute) || !isObject(level.mappingFilter.regionNameAttribute)) {
                return {};
            }
            const layerIds = Array.isArray(level.layerId) ? level.layerId : [level.layerId],
                  timeAttribute = level.mappingFilter.timeAttribute.attrName,
                  timeInputFormat = level.mappingFilter.timeAttribute.inputFormat,
                  timeOutputFormat = level.mappingFilter.timeAttribute.outputFormat,
                  regionNameAttributes = level.mappingFilter.regionNameAttribute.attrName,
                  allLayerUniqueValues = await Promise.all(layerIds.map((layerId, index) => {
                      const regionNameAttribute = Array.isArray(regionNameAttributes) ? regionNameAttributes[index] : regionNameAttributes;

                      return FetchDataHandler.getUniqueValues(layerId, [timeAttribute, regionNameAttribute], timeInputFormat, timeOutputFormat);
                  })),
                  uniqueValues = {};

            allLayerUniqueValues.forEach(layerUniqueValues => {
                Object.entries(layerUniqueValues || {}).forEach(([attributeName, values]) => {
                    uniqueValues[attributeName] = {...uniqueValues[attributeName], ...values};
                });
            });

            return uniqueValues;
        },

        /**
         * Get the direction of the bar chart.
         * @param {String[]} regions - The selected regions for the statistic(s).
         * @param {String|Boolean} differenceMode - Indicates the difference mode('date' or 'region') ohterwise false.
         * @returns {String} horizontal or vertical.
         */
        getChartDirection (regions, differenceMode) {
            const regionsLength = differenceMode === false ? regions.length : regions.length - 1,
                  chartDirectionValue = this.selectedLevel?.chartDirectionValue ? this.selectedLevel?.chartDirectionValue : 5;

            return regionsLength < chartDirectionValue ? "vertical" : "horizontal";
        },

        /**
         * Gets all regions list with all option
         * @param {String[]} regions The regions.
         * @returns {Object[]} All regions
         */
        getAllRegions (regions) {
            const result = [];

            if (!Array.isArray(regions) || !regions.length) {
                return [];
            }

            result.push({value: regions, title: "Alle Gebiete"});

            regions.forEach(region => {
                result.push({value: region, title: region});
            });

            return result;
        },
        /**
         * Sets the sorted rows.
         * @param {Array[]} value - An array of arrays of sorted rows.
         * @returns {void}
         */
        setSortedRows (value) {
            this.sortedRows = value;
        },
        /**
         * Checks if there is a reference value for the regions or dates and merges them.
         * @param {String[]} regions - The selected regions for the statistic(s).
         * @param {String[]} dates - The selected dates for the statistic(s).
         * @param {Object} referenceData - The selected reference data.
         * @returns {void}
         */
        checkFilterSettings (regions, dates, referenceData) {
            if (!this.areAllFilterSettingsSet) {
                this.handleReset();
                return;
            }
            if (!isObject(referenceData)) {
                this.handleFilterSettings(regions, dates, false);
                return;
            }
            if (typeof referenceData.value === "string") {
                const regionsWithReference = JSON.parse(JSON.stringify(regions));

                if (!regionsWithReference.includes(referenceData.value)) {
                    regionsWithReference.push(referenceData.value);
                }
                this.handleFilterSettings([...new Set(regionsWithReference)], dates, "region");
            }
            else if (isObject(referenceData.value) && typeof referenceData.value.title === "string") {
                dates.push(referenceData.value.value);
                this.handleFilterSettings(regions, [...new Set(dates)], "date");
            }
        },

        /**
         * Returns the color palette for choropleth map and legend.
         * @returns {Number[][]} - An array of rgb arrays containing the color palette.
         */
        createColorPalette () {
            const key = this.selectableColorPalettes[this.selectedColorPaletteIndex].key,
                  hexPalette = colorbrewer[key][this.numberOfClasses],
                  palette = hexPalette.map(color => convertColor(color, "rgb"));

            return palette;
        },

        /**
         * Updates the features displayed on the map and their styles.
         * @param {String} date - The chosen date from the column.
         * @param {Object} [selectedReferenceData] - The selected reference data.
         * @returns {void}
         */
        updateFeatureStyle (date, selectedReferenceData) {
            const regionNameAttribute = this.getSelectedLevelRegionNameAttributeInDepth(this.selectedLevel?.mappingFilter?.regionNameAttribute).attrName;

            this.layer.setStyle(FeaturesHandler.getStyleFunction(
                this.statisticsData?.[this.chosenStatisticName],
                this.colorPalette.map(v => [...v, this.opacity]),
                date,
                regionNameAttribute,
                this.stepValues,
                selectedReferenceData?.type === "region" ? selectedReferenceData.value : null,
                this.colorScheme.referenceRegion,
                {showLabels: this.showMapLabels, formatValue: this.formatMapValue}
            ));

            if (isObject(this.statisticsData?.[this.chosenStatisticName])) {
                this.featureWithoutValue = Object.values(this.statisticsData[this.chosenStatisticName]).some(
                    regionValue => !isNumber(regionValue[date])
                );
            }

            this.setLegendData({
                "color": this.colorPalette.map(v => [...v, this.opacity]),
                "value": this.stepValues
            });
        },

        /**
         * Formats a statistic value for the map label.
         * @param {Number} value The raw value.
         * @returns {String} The formatted value or "-" if there is none.
         */
        formatMapValue (value) {
            if (typeof value !== "number" || isNaN(value)) {
                return "-";
            }
            return new Intl.NumberFormat(i18next.language, {maximumFractionDigits: this.maxDecimalPlaces}).format(value);
        },

        /**
         * Updates the created reference tag.
         * @param {String} date the selected date
         * @param {Object} selectedLevel the selected level
         * @param {Object} referenceFeatures the selected region reference
         * @returns {void}
         */
        updateReferenceTag (date, selectedLevel, referenceFeatures) {
            if (typeof date !== "undefined" && isObject(selectedLevel) && isObject(referenceFeatures)) {
                const selectedLevelDateAttribute = this.getSelectedLevelDateAttribute(selectedLevel);

                if (isObject(selectedLevelDateAttribute)) {
                    Object.entries(referenceFeatures).forEach(([key, val]) => {
                        const formattedDate = dayjs(key).format(selectedLevelDateAttribute.outputFormat);

                        if (formattedDate === date) {
                            this.setSelectedReferenceValueTag(val);
                        }
                    });
                }
            }
        },

        /**
         * Set the selected table column.
         * @param {String} value - The selected column (date).
         * @returns {void}
         */
        setSelectedColumn (value) {
            if (this.selectedReferenceData?.type === "region") {
                this.updateReferenceTag(value, this.selectedLevel, this.referenceFeatures);
            }

            this.selectedColumn = value;
            this.noDataInColumn = undefined;

            if (this.classificationMode === "custom") {
                this.noDataInColumn =
                    FeaturesHandler.getStatisticValuesByDate(this.statisticsData[this.chosenStatisticName], this.selectedColumn).length === 0;
                this.updateAfterLegendChange();
                return;
            }

            this.setStepValues(
                FeaturesHandler.getStepValue(
                    this.statisticForStepValues,
                    this.numberOfClasses,
                    this.selectedColumn,
                    this.classificationMode,
                    this.allowPositiveNegativeClasses,
                    this.decimalPlaces
                )
            );
        },

        /**
         * Formats the filter expression based on if isDateAttribute is true.
         * @param {String|Number} expression The expression to format.
         * @param {Boolean} isDateAttribute The flag to decide wether formatted as date or not.
         * @returns {String} the formatted expression.
         */
        formatFilterExpression (expression, isDateAttribute) {
            if (typeof expression === "undefined" || typeof isDateAttribute !== "boolean") {
                return expression;
            }
            let formattedExpression = "";

            if (isDateAttribute) {
                formattedExpression = `DATE('${expression}')`;
            }
            else {
                formattedExpression = typeof expression === "string" ? `'${expression}'` : `${expression}`;
            }
            return formattedExpression;
        },
        /**
         * Parses an existing ol filter into an OAF filter string.
         * @param {ol/format/Filter} filter The filter to parse.
         * @returns {String} The parsed oaf filter string.
         */
        parseOLFilterToOAF (filter) {
            if (!filter || !isObject(filterMap)) {
                return "";
            }
            const operator = filterMap[filter?.tagName_],
                  dateAttributeName = this.getSelectedLevelDateAttribute(this.selectedLevel)?.attrName;
            let parsedFilter = "";

            if (!Array.isArray(filter?.conditions)) {
                if (filter?.expression && filter?.propertyName && operator) {
                    return `${filter.propertyName} ${operator} ${this.formatFilterExpression(filter.expression, filter.propertyName === dateAttributeName)}`;
                }
                return parsedFilter;
            }
            filter.conditions.forEach((condition, idx) => {
                if (Object.prototype.hasOwnProperty.call(condition, "conditions")) {
                    parsedFilter += `(${this.parseOLFilterToOAF(condition, filterMap)})`;
                    if (idx < filter.conditions.length - 1) {
                        parsedFilter += ` ${operator} `;
                    }
                    return;
                }
                parsedFilter += `${condition.propertyName} ${filterMap[condition.tagName_]} `;
                parsedFilter += this.formatFilterExpression(condition.expression, condition.propertyName === dateAttributeName);
                if (idx < filter.conditions.length - 1) {
                    parsedFilter += ` ${operator} `;
                }
            });
            return parsedFilter;
        },

        /**
         * Handles the filter settings and starts a POST request based on given settings.
         * @param {String[]} regions - The selected regions for the statistic(s).
         * @param {String[]} dates - The selected dates for the statistic(s).
         * @param {String|Boolean} differenceMode - Indicates the difference mode('date' or 'region') ohterwise false.
         * @returns {void}
         */
        async handleFilterSettings (regions, dates, differenceMode) {
            if (!this.selectedLevel) {
                return;
            }
            this.handleReset();
            this.setIsFeatureLoaded(false);

            for (const [index, layerId] of this.selectedLevel.layerId.entries()) {
                const selectedLayer = this.getRawLayerByLayerId(layerId),
                      selectedLayerGfiAttributes = selectedLayer.gfiAttributes,
                      selectedStatistics = Object.values(this.selectedStatistics).filter(statistic => Object.prototype.hasOwnProperty.call(selectedLayerGfiAttributes || {}, statistic.key)),
                      statsKeys = selectedStatistics.map(statistic => statistic.key),
                      selectedLevelRegionNameAttribute = this.getSelectedLevelRegionNameAttributeInDepth(this.selectedLevel.mappingFilter.regionNameAttribute),
                      selectedLevelDateAttribute = this.getSelectedLevelDateAttribute(this.selectedLevel),
                      payload = {
                          featureTypes: [selectedLayer.featureType],
                          featureNS: selectedLayer.featureNS,
                          srsName: this.projection.getCode(),
                          propertyNames: [...statsKeys, selectedLevelRegionNameAttribute.attrName[index], selectedLevelDateAttribute.attrName, this.selectedLevel.geometryAttribute[index]],
                          filter: this.getFilter(regions, dates, selectedLevelRegionNameAttribute.attrName[index])
                      };

                let response = null,
                    statFeatures = [];

                if (selectedLayer.typ === "WFS") {
                    response = await getFeature.getFeaturePOST(selectedLayer.url, payload, error => {
                        console.error(error);
                    });
                    const loadedFeatures = new WFS().readFeatures(response);

                    this.layer.getSource().addFeatures(loadedFeatures);
                    statFeatures = new GeoJSON().writeFeaturesObject(loadedFeatures).features;
                }
                else if (selectedLayer.typ === "OAF") {
                    payload.propertyNames.splice(payload.propertyNames.indexOf(this.selectedLevel.geometryAttribute[index]), 1);
                    try {
                        statFeatures = await getOAFFeature.getOAFFeatureGet(
                            selectedLayer.url,
                            selectedLayer.collection,
                            {
                                signal: this.abortController.signal,
                                filter: this.parseOLFilterToOAF(payload.filter),
                                filterCrs: this.selectedLevel.oafRequestCRS,
                                crs: this.selectedLevel.oafRequestCRS,
                                propertyNames: payload.propertyNames,
                                limit: 10000,
                                skipGeometry: true
                            }
                        );
                    }
                    catch (error) {
                        if (!(error instanceof CanceledError)) {
                            console.error(error);
                        }
                        return;
                    }
                }
                this.statisticsData = Object.assign({}, this.statisticsData, this.prepareStatisticsData(statFeatures, statsKeys, regions, dates, selectedLevelDateAttribute, selectedLevelRegionNameAttribute.attrName[index], differenceMode));
                if (typeof differenceMode === "string") {
                    this.chartData = this.getChartDataOutOfDifference(statFeatures, statsKeys, regions, dates, selectedLevelDateAttribute, selectedLevelRegionNameAttribute.attrName[index], differenceMode);
                }
                else {
                    this.chartData = this.statisticsData;
                }
            }
            this.setIsFeatureLoaded(true);

            if (differenceMode) {
                this.referenceFeatures = {};
            }
            this.prepareData(regions, dates, differenceMode);

        },

        /**
         * Prepares and sets the data.
         * @param {String[]} regions - The regions of the statistic wanted.
         * @param {String[]} dates - The dates of the statistic wanted.
         * @param {String|Boolean} differenceMode - Indicates the difference mode('date' or 'region') otherwise false.
         * @returns {void}
         */
        async prepareData (regions, dates, differenceMode) {
            this.tableData = this.getTableData(this.statisticsData);
            this.chosenTableData = this.getTableData(this.statisticsData, this.chosenStatisticName);
            this.chartCounts = this.selectedStatisticsNames.length;

            this.handleChartData(this.statisticNameOfChart, regions, dates, this.chartData, differenceMode);

            this.selectedColumn ||= this.timeStepsFilter.find(v => v.value === dates[0])?.title;
            if (this.selectedStatisticsNames.length && this.classificationMode !== "custom") {
                this.setStepValues(
                    FeaturesHandler.getStepValue(
                        this.statisticForStepValues,
                        this.numberOfClasses,
                        this.selectedColumn,
                        this.classificationMode,
                        this.allowPositiveNegativeClasses,
                        this.decimalPlaces
                    )
                );
                this.setColorPalette(this.createColorPalette());
            }
            else if (this.selectedStatisticsNames.length) {
                this.updateFeatureStyle(
                    this.selectedColumn,
                    this.selectedReferenceData);
            }
            this.showNoLegendData = !this.selectedStatisticsNames.length;
            if (this.selectedColumn) {
                this.$nextTick(() => {
                    this.updateReferenceTag(this.selectedColumn, this.selectedLevel, this.referenceFeatures);
                });
            }
        },
        /**
         * Adds a hover interaction to the map to display info overlay when hovering over a feature.
         * @returns {void}
         */
        addHoverInteraction () {
            const map = mapCollection.getMap("2D"),
                  debouncedUpdateInfo = debounce(feature => {
                      this.updateHoverInfo(feature);
                  }, 200),
                  debouncedClearInfo = debounce(() => {
                      this.overlay?.setPosition(undefined);
                      this.clearHoverInfo();
                  }, 200);

            if (!map || !this.$refs.hoverInfoOverlay) {
                return;
            }

            this.removeHoverInteraction();

            this.overlay = new Overlay({
                element: this.$refs.hoverInfoOverlay,
                positioning: "bottom-left",
                stopEvent: false,
                offset: [10, 10]
            });

            map.addOverlay(this.overlay);

            this.hoverInteraction = new Select({
                condition: pointerMove,
                layers: [this.layer],
                style: null
            });
            this.hoverInteraction.setActive(this.showMapTooltips);

            map.addInteraction(this.hoverInteraction);

            this.hoverInteraction.on("select", (event) => {
                if (event.selected.length > 0) {
                    const feature = event.selected[0],
                          coordinate = event.mapBrowserEvent.coordinate;

                    this.overlay.setPosition(coordinate);

                    debouncedUpdateInfo(feature);
                }
                else {
                    debouncedClearInfo();
                }
            });
        },

        /**
         * Removes the hover interaction and the info overlay from the map.
         * @returns {void}
         */
        removeHoverInteraction () {
            const map = mapCollection.getMap("2D");

            if (!map) {
                return;
            }
            if (this.hoverInteraction) {
                map.removeInteraction(this.hoverInteraction);
                this.hoverInteraction = null;
            }
            if (this.overlay) {
                map.removeOverlay(this.overlay);
                this.overlay = null;
            }
        },
        /**
         * Updates the hover overlay to show the region name and one statistic value.
         * @param {ol/Feature} feature - The hovered feature.
         * @returns {void}
         */
        updateHoverInfo (feature) {
            if (!feature || typeof feature.get !== "function") {
                this.clearHoverInfo();
                return;
            }

            const {selectedLevel, statisticsData, chosenStatisticName, selectedColumn, $refs, getSelectedLevelRegionNameAttributeInDepth, maxDecimalPlaces} = this,
                  regionNameAttribute = getSelectedLevelRegionNameAttributeInDepth(selectedLevel?.mappingFilter?.regionNameAttribute).attrName,
                  region = feature.get(regionNameAttribute),
                  statName = chosenStatisticName,
                  statisticData = statisticsData?.[statName],
                  rawValue = statisticData?.[region]?.[selectedColumn],
                  groupSeparator = Intl.NumberFormat(i18next.language).formatToParts(1000.1).find(part => part.type === "group").value,
                  decimalSeparator = Intl.NumberFormat(i18next.language).formatToParts(1000.1).find(part => part.type === "decimal").value,
                  overlayEl = $refs.hoverInfoOverlay,
                  titleEl = document.createElement("strong"),
                  lineEl = document.createElement("div"),
                  labelEl = document.createElement("span"),
                  valueEl = document.createElement("span");

            let formattedValue = rawValue;

            if (typeof rawValue === "number" || (typeof rawValue === "string" && (/^[\d.,]+$/).test(rawValue))) {
                if (typeof maxDecimalPlaces === "number" && !isNaN(rawValue)) {
                    formattedValue = Number(parseFloat(rawValue).toFixed(maxDecimalPlaces));
                }
                formattedValue = thousandsSeparator(formattedValue, groupSeparator, decimalSeparator, true);
            }

            if (!region) {
                this.clearHoverInfo();
                return;
            }

            if (!overlayEl) {
                return;
            }

            overlayEl.innerHTML = "";
            overlayEl.style.display = "block";

            titleEl.textContent = region;
            labelEl.textContent = `${statName}:`;
            valueEl.textContent = formattedValue ?? "Keine Daten vorhanden!";

            lineEl.appendChild(labelEl);
            lineEl.appendChild(valueEl);

            overlayEl.appendChild(titleEl);
            overlayEl.appendChild(lineEl);
        },
        /**
         * Clears the hover overlay content and hides it.
         * @returns {void}
         */
        clearHoverInfo () {
            if (this.$refs.hoverInfoOverlay) {
                this.$refs.hoverInfoOverlay.style.display = "none";
                this.$refs.hoverInfoOverlay.innerHTML = "";
            }
        },
        /**
         * Handles chart data and resets the showGrid property.
         * @param {String[]} filteredStatistics The statistics.
         * @param {String[]} regions The regions.
         * @param {String[]} dates The dates.
         * @param {Object} preparedData The prepared data.
         * @param {String|Boolean} differenceMode - Indicates the difference mode('date' or 'region') ohterwise false.
         * @returns {void}
         */
        handleChartData (filteredStatistics, regions, dates, preparedData, differenceMode) {
            const directionBarChart = this.getChartDirection(regions, differenceMode);

            this.showGrid = false;

            if (filteredStatistics.length > 1) {
                this.prepareGridCharts(filteredStatistics, preparedData, directionBarChart, differenceMode, dates.length >= 2 && !differenceMode || dates.length >= 3 || dates.length === 2 && differenceMode === "region");
            }

            else if (regions.length >= 1 && preparedData?.[filteredStatistics[0]]) {
                this.$nextTick(() => {
                    if (dates.length >= 2 && !differenceMode || dates.length >= 3 || dates.length === 2 && differenceMode === "region") {
                        this.prepareChartData(filteredStatistics[0], preparedData[filteredStatistics[0]], undefined, "line", differenceMode);
                        return;
                    }
                    this.prepareChartData(filteredStatistics[0], preparedData[filteredStatistics[0]], undefined, "bar", directionBarChart, differenceMode);
                });
            }
        },
        /**
         * Prepares the charts for the grid and also creates canvas elements for each chart to render on.
         * @param {String[]} filteredStatistics The statistics.
         * @param {Object} preparedData The prepared data.
         * @param {String[]} direction - Direction of bar chart.
         * @param {String|Boolean} differenceMode - Indicates the difference mode('date' or 'region') ohterwise false.
         * @param {Boolean} renderAsLine Flag to render line charts. Default is false.
         * @returns {void}
         */
        prepareGridCharts (filteredStatistics, preparedData, direction, differenceMode, renderAsLine = false) {
            this.showGrid = true;

            this.$nextTick(() => {
                filteredStatistics.forEach((statistic, idx) => {
                    const ctx = document.createElement("canvas"),
                          chartContainer = this.$refs[`chart${idx + 1}`];

                    if (!chartContainer) {
                        return;
                    }

                    if (chartContainer.hasChildNodes()) {
                        chartContainer.childNodes[0].remove();
                    }
                    chartContainer.appendChild(ctx);

                    if (renderAsLine) {
                        this.prepareChartData(statistic, preparedData[statistic], ctx, "line", undefined, differenceMode, true);
                        return;
                    }
                    this.prepareChartData(statistic, preparedData[statistic], ctx, "bar", direction, differenceMode, true);
                });
            });
        },
        /**
         * Prepares the chart and also handles the destruction of previous charts.
         * @param {String} topic The topic of the chart.
         * @param {Object} preparedData The data.
         * @param {HTMLElement} canvas The canvas to render the chart on.
         * @param {String} type The type. Can be bar or line.
         * @param {String} direction The direction of the bar chart.
         * @param {String|Boolean} differenceMode - Indicates the difference mode('date' or 'region') ohterwise false.
         * @param {Boolean} renderSimple true if should be rendered as simple chart because its in the grid. Default is false.
         * @param {Boolean} renderToModal true if chart is rendered in modal. Default is false
         * @returns {void}
         */
        prepareChartData (topic, preparedData, canvas, type, direction, differenceMode, renderSimple = false, renderToModal = false) {
            const canvasTmp = canvas || document.createElement("canvas"),
                  uniqueTopic = renderToModal ? `modal-${topic}` : topic;

            if (!canvas && this.$refs.chartContainer) {
                if (this.$refs.chartContainer.hasChildNodes()) {
                    this.$refs.chartContainer.childNodes[0].remove();
                }
                this.$refs.chartContainer.style.height = typeof this.canvasSize !== "undefined" && type === "bar" ? this.canvasSize : "";
                this.$refs.chartContainer.appendChild(canvasTmp);
            }
            this.diagramType = type;
            this.currentChart[uniqueTopic] = {};
            if (type === "line") {
                if (this.lineLimit !== null && preparedData && Object.keys(preparedData)?.length > this.lineLimit) {
                    if (!this.showLimitView) {
                        this.currentChart[uniqueTopic].chart = ChartProcessor.createLineChart(topic, this.limitingDataForChart(preparedData, 3), canvasTmp, this.colorScheme.lineCharts, renderSimple);
                    }
                    else {
                        this.currentChart[uniqueTopic].chart = ChartProcessor.createLineChart(topic, this.getNewLimitedData(this.selectedFilteredRegions, preparedData), canvasTmp, this.colorScheme.lineCharts, renderSimple);
                    }

                }
                else {
                    this.showLimitView = false;
                    this.currentChart[uniqueTopic].chart = ChartProcessor.createLineChart(topic, preparedData, canvasTmp, this.colorScheme.lineCharts, renderSimple);
                }
            }
            else if (type === "bar") {
                if (this.barLimit !== null && preparedData && Object.keys(preparedData)?.length > this.barLimit) {
                    if (typeof differenceMode === "string") {
                        this.currentChart[uniqueTopic].chart = ChartProcessor.createBarChart(topic, !this.showLimitView ? this.limitingDataForChart(preparedData, this.barLimit) : this.getNewLimitedData(this.allFilteredRegions, preparedData), direction, canvasTmp, differenceMode, false, renderSimple, this.colorArrayDifference);
                    }
                    else {
                        this.currentChart[uniqueTopic].chart = ChartProcessor.createBarChart(topic, !this.showLimitView ? this.limitingDataForChart(preparedData, this.barLimit) : this.getNewLimitedData(this.allFilteredRegions, preparedData), direction, canvasTmp, differenceMode, this.numberOfColouredBars, renderSimple, ["#DCE2F3", "#d3d3d3"]);
                    }
                }
                else {
                    this.showLimitView = false;
                    if (typeof differenceMode === "string") {
                        this.currentChart[uniqueTopic].chart = ChartProcessor.createBarChart(topic, preparedData, direction, canvasTmp, differenceMode, false, renderSimple, this.colorArrayDifference);
                    }
                    else {
                        this.currentChart[uniqueTopic].chart = ChartProcessor.createBarChart(topic, preparedData, direction, canvasTmp, differenceMode, false, renderSimple);
                    }
                }
                if (renderSimple) {
                    this.currentChart[uniqueTopic].chart.canvas.addEventListener("mousemove", (e) => {
                        ChartProcessor.setTooltips(e, this.currentChart[uniqueTopic].chart, direction);
                    });
                    this.currentChart[uniqueTopic].chart.canvas.addEventListener("mouseout", (e) => {
                        ChartProcessor.removeTooltips(e);
                    });
                }
            }
        },
        /**
         * Limiting the number of data for charts.
         * @param {Object} data The data.
         * @param {Number} number Number of data in the chart.
         * @returns {Object} The trimmed data.
         */
        limitingDataForChart (data, number) {
            const limitData = Object.fromEntries(Object.entries(data).slice(0, number));

            this.selectedFilteredRegions = this.diagramType === "line" ? Object.keys(limitData) : Object.keys(limitData).slice(0, 3);
            this.allFilteredRegions = Object.keys(limitData);
            this.showLimitView = true;

            return limitData;
        },
        /**
         * Adds the selected region to chart data.
         * @param {Array} region The selected region.
         * @returns {void}
         */
        addSelectedFilteredRegions (region) {
            if (this.allFilteredRegions.length > this.barLimit && this.diagramType === "bar") {
                this.updateChartSize();
            }

            this.selectedFilteredRegions.unshift(region);
            this.allFilteredRegions = this.allFilteredRegions.filter(item => item !== region);
            this.allFilteredRegions.unshift(region);
            this.numberOfColouredBars = this.selectedFilteredRegions.length;
            this.handleChartData(this.statisticNameOfChart, this.diagramType === "line" ? this.selectedFilteredRegions : this.allFilteredRegions, this.selectedDatesValues, this.chartData, this.selectedReferenceData?.type);
        },
        /**
         * Increases the canvas size by 45 pixels.
         * @returns {void}
         */
        updateChartSize () {
            const chart = document.querySelector(".chart-container"),
                  totalBars = this.allFilteredRegions.length,
                  chartHeight = 400,
                  newHeight = (totalBars - this.barLimit) * 45 + chartHeight;

            this.canvasSize = chart.style.height = newHeight + "px";
        },
        /**
         * Remove the selected region.
         * @param {String} region The selected region.
         * @returns {void}
         */
        removeRegion (region) {
            if (this.diagramType === "line") {
                this.selectedFilteredRegions = this.selectedFilteredRegions.filter(item => item !== region);
                this.handleChartData(this.statisticNameOfChart, this.selectedFilteredRegions, this.selectedDatesValues, this.chartData, this.selectedReferenceData?.type);
            }
            else if (this.diagramType === "bar") {
                const index = this.allFilteredRegions.indexOf(region);

                this.selectedFilteredRegions = this.selectedFilteredRegions.filter(item => item !== region);
                this.allFilteredRegions.push(this.allFilteredRegions.splice(index, 1)[0]);
                this.numberOfColouredBars = this.selectedFilteredRegions.length;
                this.handleChartData(this.statisticNameOfChart, this.allFilteredRegions, this.selectedDatesValues, this.chartData, this.selectedReferenceData?.type);
            }
        },
        /**
         * Returns only the data from the selected regions.
         * @param {String} region The selected region.
         * @param {String} preparedData The data.
         * @returns {Object} The new data.
         */
        getNewLimitedData (selectedRegions, preparedData) {
            const limitedData = selectedRegions.filter(key => Object.keys(preparedData).includes(key)).reduce((obj, key) => {
                obj[key] = preparedData[key];
                return obj;
            }, {});

            return limitedData;
        },
        /**
         * Update limit view when the filter settings change.
         * @returns {void}
         */
        updateLimitedData () {
            this.selectedFilteredRegions = this.selectedFilteredRegions.filter(name => this.selectedRegionsValues.includes(name));
            this.numberOfColouredBars = this.selectedFilteredRegions.length;
        },
        /**
         * Gets the filter based on given regions and dates array.
         * Gets an Or Filter if one of them has more than one entry.
         * Gets an And Filter if both of them has entries.
         * Gets an EqualTo Filter if one of them has only one entry.
         * @param {String[]} regions The regions.
         * @param {String[]} dates The dates.
         * @param {String} regionAttrName The attribute name of the region.
         * @returns {ol/format/filter} The filter.
         */
        getFilter (regions, dates, regionAttrName) {
            if (!Array.isArray(regions) || !Array.isArray(dates)) {
                return undefined;
            }
            const dateAttrName = this.getSelectedLevelDateAttribute(this.selectedLevel)?.attrName,
                  tmpFlattenedRegions = [...this.flattenedRegions].reverse(),
                  allRegions = this.flattenedRegions.find(region => !Object.prototype.hasOwnProperty.call(region, "child"))?.values;

            if (regions.length === allRegions.length) {
                if (dates.length === this.dates.length) {
                    return undefined;
                }
                if (tmpFlattenedRegions.length <= 1) {
                    return this.getFilterForList(dates, dateAttrName);
                }
                for (let i = 0; i < tmpFlattenedRegions.length; i++) {
                    const nextRegion = tmpFlattenedRegions[i];

                    if (nextRegion.selectedValues.length !== nextRegion.values.length) {
                        return andFilter(this.getFilterForList(dates, dateAttrName), this.getFilterForList(nextRegion.selectedValues.map(selectedValue => selectedValue.title), nextRegion.attrName[0]));
                    }
                }
            }
            else if (dates.length === this.dates.length) {
                return this.getFilterForList(regions, regionAttrName);
            }
            return andFilter(this.getFilterForList(dates, dateAttrName), this.getFilterForList(regions, regionAttrName));
        },
        /**
         * Gets the filter for given list and property.
         * If given list has more than one entry the function returns an
         * Or Filter otherwise an EqualTo Filter.
         * @param {String[]} list The list to create a filter for.
         * @param {String} propertyName The propertyName to create a filter for.
         * @returns {ol/format/filter} The filter.
         */
        getFilterForList (list, propertyName) {
            if (!Array.isArray(list) || typeof propertyName !== "string") {
                return undefined;
            }

            const filterArray = list.map(entry => equalToFilter(propertyName, entry));

            return filterArray.length > 1 ? orFilter(...filterArray) : filterArray[0];
        },

        /**
         * Gets the data for the table from the prepared statistics.
         * @param {Object} statisticsData - Prepared statistical data.
         * @param {undefined|String|String[]} statisticName - The chosen statistic name.
         * @returns {Object[]} Data for table with header and items or empty array.
         */
        getTableData (statisticsData, statisticName = undefined) {
            const headers = [],
                  data = [];

            if (typeof statisticName !== "undefined" && !isObject(statisticsData) || !Object.keys(statisticsData).length) {
                return [];
            }

            if (statisticName === "" && Object.keys(statisticsData).length) {
                this.setChosenStatisticName(Object.keys(statisticsData)[0]);
            }

            Object.keys(statisticsData).forEach(statData => {
                const items = [];

                if (typeof statisticName === "string" && statisticName !== "" && statData !== statisticName) {
                    return;
                }

                Object.entries(statisticsData[statData]).forEach(([region, years]) => {
                    if (headers.length === 0) {
                        headers.push({name: "Gebiet", index: 0});
                        Object.keys(years).reverse().forEach((year, idx) => {
                            headers.push({name: year, index: idx + 1});
                        });
                    }

                    Object.keys(years).forEach(year => {
                        if (!isNumber(years[year])) {
                            years[year] = "-";
                        }
                    });
                    items.push({Gebiet: region, ...years});

                });

                data.push({
                    headers,
                    items
                });
            });

            this.$nextTick(() => {
                this.loadTableExportData();
            });

            return data;
        },

        /**
         * Prepares the statistical data from the features.
         * @param {ol/Feature[]} features - The features.
         * @param {String[]} statistics - The key to the statistic whose value is being looked for.
         * @param {String[]} regions - The regions of the statistic wanted.
         * @param {String[]} dates - The dates of the statistic wanted.
         * @param {String} dateAttribute - The configured date attribute.
         * @param {String} regionAttribute - The configured region attribute.
         * @param {String|Boolean} differenceMode - Indicates the difference mode('date' or 'region') ohterwise false.
         * @returns {Object} The prepared statistical data.
         */
        prepareStatisticsData (features, statistics, regions, dates, dateAttribute, regionAttribute, differenceMode) {
            if (!this.selectedLevel) {
                return {};
            }
            const regionKey = regionAttribute,
                  dateKey = dateAttribute.attrName,
                  refRegionValues = {},
                  refDateValues = {},
                  data = {};

            if (!differenceMode || typeof differenceMode === "undefined") {
                this.fixedColumn = undefined;
                this.fixedRow = undefined;
            }

            statistics.forEach(statsKey => {
                const stat = this.selectedStatistics[statsKey].name;

                data[stat] = {};
                refRegionValues[stat] = {};
                refDateValues[stat] = {};
                regions.forEach(region => {
                    data[stat][region] = {};
                    dates.forEach(date => {
                        if (date === this.selectedReferenceData?.value?.value || typeof date === "undefined") {
                            return;
                        }
                        const formatedDate = dayjs(date).format(dateAttribute.outputFormat);

                        data[stat][region][formatedDate] = NaN;
                    });
                });
                features.forEach(feature => {
                    const region = feature.properties[regionKey],
                          date = feature.properties[dateKey],
                          formatedDate = dayjs(date).format(dateAttribute.outputFormat),
                          value = parseFloat(feature?.properties[statsKey]);

                    if (differenceMode === "region" && region === this.selectedReferenceData?.value) {
                        refRegionValues[stat][formatedDate] = value;
                        this.fixedRow = {name: this.selectedReferenceData?.value, title: i18next.t("common:modules.statisticDashboard.reference.region")};
                        this.fixedColumn = undefined;
                    }
                    else if (differenceMode === "date" && date === this.selectedReferenceData?.value?.value) {
                        refDateValues[stat][region] = value;
                        this.fixedColumn = {name: this.selectedReferenceData?.value?.title, index: 1, title: i18next.t("common:modules.statisticDashboard.reference.year")};
                        this.fixedRow = undefined;
                    }
                    else {
                        refRegionValues[stat][region] = undefined;
                    }

                    if (data[stat][region]) {
                        data[stat][region][formatedDate] = value;
                    }
                });
            });

            if (differenceMode === "region") {
                for (const stat in data) {
                    for (const region in data[stat]) {
                        for (const date in data[stat][region]) {
                            region !== this.fixedRow.name ? data[stat][region][date] -= refRegionValues[stat][date] : data[stat][region][date];
                            this.referenceFeatures[date] ??= refRegionValues[stat][date];
                        }
                    }
                }
            }
            if (differenceMode === "date") {
                for (const stat in data) {
                    for (const region in data[stat]) {
                        for (const date in data[stat][region]) {
                            date !== this.fixedColumn.name ? data[stat][region][date] -= refDateValues[stat][region] : data[stat][region][date];
                        }
                    }
                }
            }

            return data;
        },

        /**
         * Prepares the statistical data from the features.
         * @param {ol/Feature[]} features - The features.
         * @param {String[]} statistics - The key to the statistic whose value is being looked for.
         * @param {String[]} regions - The regions of the statistic wanted.
         * @param {String[]} dates - The dates of the statistic wanted.
         * @param {String} dateAttribute - The configured date attribute.
         * @param {String} regionAttribute - The configured region attribute.
         * @param {String|Boolean} differenceMode - Indicates the difference mode('date' or 'region') ohterwise false.
         * @returns {Object} The prepared statistical data.
         */
        getChartDataOutOfDifference (features, statistics, regions, dates, dateAttribute, regionAttribute, differenceMode) {
            const regionKey = regionAttribute,
                  dateKey = dateAttribute.attrName,
                  refRegionValues = {},
                  refDateValues = {},
                  data = {};

            statistics.forEach(statsKey => {
                if (!this.selectedLevel) {
                    return;
                }
                const stat = this.selectedLevel.mappingFilter.statisticsAttributes[statsKey].name;

                data[stat] = {};
                refRegionValues[stat] = {};
                refDateValues[stat] = {};
                regions.forEach(region => {
                    if (region === this.selectedReferenceData?.value) {
                        return;
                    }
                    data[stat][region] = {};
                    dates.forEach(date => {
                        if (date === this.selectedReferenceData?.value?.value || typeof date === "undefined") {
                            return;
                        }
                        const formatedDate = dayjs(date).format(dateAttribute.outputFormat);

                        data[stat][region][formatedDate] = NaN;
                    });
                });
                features.forEach(feature => {
                    const region = feature.properties[regionKey],
                          date = feature.properties[dateKey],
                          formatedDate = dayjs(date).format(dateAttribute.outputFormat),
                          value = parseFloat(feature?.properties[statsKey]);

                    if (differenceMode === "region" && region === this.selectedReferenceData?.value) {
                        refRegionValues[stat][formatedDate] = value;
                    }
                    else if (differenceMode === "date" && date === this.selectedReferenceData?.value?.value) {
                        refDateValues[stat][region] = value;
                    }
                    else if (data[stat][region]) {
                        data[stat][region][formatedDate] = value;
                    }
                });
            });

            if (differenceMode === "region") {
                for (const stat in data) {
                    for (const region in data[stat]) {
                        for (const date in data[stat][region]) {
                            data[stat][region][date] -= refRegionValues[stat][date];
                            this.referenceFeatures[date] ??= refRegionValues[stat][date];
                        }
                    }
                }
            }
            if (differenceMode === "date") {
                for (const stat in data) {
                    for (const region in data[stat]) {
                        for (const date in data[stat][region]) {
                            data[stat][region][date] -= refDateValues[stat][region];
                        }
                    }
                }
            }

            return data;
        },

        /**
         * Gets the currently selected layer by the given level.
         * @param {String} layerId The layer id.
         * @returns {Object} The layer.
         */
        getRawLayerByLayerId (layerId) {
            return rawLayerList.getLayerWhere({id: layerId}) || {};
        },

        /**
         * Gets the region attribute object by the given level.
         * @param {Object} level The level object.
         * @returns {Object} The region attribute object.
         */
        getSelectedLevelRegionNameAttribute (level) {
            return level?.mappingFilter?.regionNameAttribute || {};
        },

        /**
         * Gets the last child object in the region hierarchy.
         * @param {Object} region - The region hierarchy.
         * @returns {Object} The deepest child.
         */
        getSelectedLevelRegionNameAttributeInDepth (region) {
            if (typeof region === "undefined") {
                return {};
            }

            let child;

            if (!Object.prototype.hasOwnProperty.call(region, "child")) {
                child = region;
            }
            if (Object.prototype.hasOwnProperty.call(region, "child")) {
                child = this.getSelectedLevelRegionNameAttributeInDepth(region.child);
            }
            return child;
        },

        /**
         * Gets the date attribute by the given level.
         * @param {Object} level The level object.
         * @returns {Object} The time attribute object.
         */
        getSelectedLevelDateAttribute (level) {
            return level?.mappingFilter?.timeAttribute || {};
        },

        /**
         * Gets the statistic attributes by the given level.
         * @param {Object} level The level object.
         * @returns {Object} The statistics attribute object.
         */
        getSelectedLevelStatisticsAttributes (level) {
            return level?.mappingFilter.statisticsAttributes || {};
        },

        /**
         * Sets the active view (table, chart or map).
         * @param {String} view The view to show: "table", "chart" or "map".
         * @returns {void}
         */
        toggleChartTable (view) {
            this.setChartTableToggle(view);
        },

        /**
         * Reset tables and charts.
         * @returns {void}
         */
        handleReset () {
            this.abortController.abort();
            this.abortController = new AbortController();
            this.layer?.setStyle(null);
            this.tableData = [];

            if (this.$refs.chartContainer && this.$refs.chartContainer.hasChildNodes()) {
                this.$refs.chartContainer.childNodes[0].remove();
            }

            this.currentChart = {};
            this.showGrid = false;
            this.legendValue = [];
            this.showNoLegendData = false;
            this.showLimitView = false;
            this.diagramType = undefined;
            this.selectedFilteredRegions = [];
            this.chosenTableData = [];
            this.statisticsData = undefined;
            this.canvasSize = undefined;
            this.numberOfColouredBars = 3;
        },
        /**
         * Checks if at least one description is present in the statistics.
         * @param {Object} statistics - The selected statistics.
         * @returns {Boolean} true if a description is present.
         */
        hasDescription (statistics) {
            let isDescriptionAvailable = false;

            Object.values(statistics).forEach(stat => {
                if (Object.prototype.hasOwnProperty.call(stat, "description")) {
                    isDescriptionAvailable = true;
                }
            });
            return isDescriptionAvailable;
        },
        /**
         * Sets the title and the content of the descriptions of the selected statistics.
         * @param {Object} statistics - The selected statistics.
         * @returns {Object[]} The descriptions.
         */
        setDescriptionsOfSelectedStatistics (statistics) {
            const descriptions = [];

            Object.values(statistics).map(statistic => {
                return descriptions.push({"title": statistic?.name, "content": statistic?.description !== undefined ? statistic?.description : "Diese Satistik enthält keine Beschreibung."});
            });
            return descriptions;
        },
        /**
         * Gets the metadata link.
         * @returns {String} Empty if no metadata was found - otherwise it returns the url.
         */
        getMetadataLink () {
            if (!isObject(this.selectedLevel)) {
                return "";
            }
            const currentLayer = this.getRawLayerByLayerId(this.selectedLevel.layerId);

            if (!isObject(currentLayer) || !Array.isArray(currentLayer.datasets) || !isObject(currentLayer.datasets[0])
                || !currentLayer.datasets[0].show_doc_url || typeof currentLayer.datasets[0].md_id === "undefined") {
                return "";
            }

            return `${currentLayer.datasets[0].show_doc_url}${currentLayer.datasets[0].md_id}`;
        },
        /**
         * Opens the metadata in a new tab.
         * @returns {void}
         */
        openMetadata () {
            const metadataUrl = this.getMetadataLink();

            if (!metadataUrl) {
                return;
            }
            openSecuredPopup(metadataUrl, "_blank");
        },
        /**
         * Initializes the data from selected level.
         * @param {StatisticDashboardLevel} selectedLevel - The selected level object
         * @returns {void}
         */
        async initializeData (selectedLevel) {
            if (!isObject(selectedLevel)) {
                return;
            }

            this.setLevelTitle(selectedLevel.levelTitle
                ?? this.getRawLayerByLayerId(selectedLevel.layerId?.[0])?.datasets?.[0]?.md_name);

            const uniqueValues = await this.getUniqueValuesForLevel(selectedLevel),
                  selectedLevelDateAttribute = this.getSelectedLevelDateAttribute(selectedLevel);

            this.selectedLevelRegionNameAttribute = this.getSelectedLevelRegionNameAttribute(selectedLevel);
            if (uniqueValues[this.selectedLevelRegionNameAttribute?.attrName?.[0]] && uniqueValues[selectedLevelDateAttribute?.attrName]) {
                this.regions = Object.keys(uniqueValues[this.selectedLevelRegionNameAttribute.attrName[0]]).sort((a, b) => b - a);
                this.selectedLevelRegionNameAttribute.values = this.regions.map(val => {
                    return {
                        value: val,
                        title: val
                    };
                });
                this.allRegions = this.getAllRegions(this.regions);
                this.dates = Object.keys(uniqueValues[selectedLevelDateAttribute.attrName]);
                this.setTimeStepsFilter(getTimestepsMerged(selectedLevel?.timeStepsFilter, uniqueValues[selectedLevelDateAttribute.attrName], selectedLevelDateAttribute.inputFormat, selectedLevelDateAttribute.outputFormat));
            }

            this.loadedFilterData = true;
            this.loadedReferenceData = true;

            if (!this.flattenedRegions.length) {
                this.flattenRegionHierarchy(this.selectedLevelRegionNameAttribute);
            }
            this.setReferenceData({
                "date": getTimestepsMerged(undefined, uniqueValues[selectedLevelDateAttribute?.attrName], selectedLevelDateAttribute?.inputFormat, selectedLevelDateAttribute?.outputFormat),
                "region": await this.getRegionsOptionsForLastChild()
            });
            this.prepareLayer();
        },

        /**
         * Fetches the region options for the last child in the flattened region hierarchy.
         * @returns {Promise<string[]>} The list of options for the region dropdown.
         */
        async getRegionsOptionsForLastChild () {
            if (!this.flattenedRegions.length) {
                return [];
            }
            const lastChild = this.flattenedRegions.at(-1),
                  selectedLayers = this.selectedLevel?.layerId?.map(id => rawLayerList.getLayerWhere({id})).filter(isObject);

            if (lastChild?.values?.length) {
                return lastChild.values;
            }
            if (!Array.isArray(selectedLayers)) {
                return [];
            }
            const uniqueObject = Object.assign({}, ...await Promise.all(selectedLayers.map(
                selectedLayer => getOAFFeature.getUniqueValuesByScheme(selectedLayer.url, selectedLayer.collection, [lastChild.attrName])
            )));

            return !isObject(uniqueObject[lastChild.attrName]) ? [] : Object.keys(uniqueObject[lastChild.attrName]);
        },

        /**
         * Prepares the layer by fetching features from the OAF endpoint and adding them to the layer source.
         * @returns {void}
         */
        async prepareLayer () {
            if (!Array.isArray(this.selectedLevel?.layerId) || this.getRawLayerByLayerId(this.selectedLevel.layerId[0])?.typ === "WFS") {
                return;
            }

            this.layer.getSource().clear();
            this.layer.setStyle(null);

            await Promise.all(this.selectedLevel.layerId.map(async (layerId, index) => {
                const regionKey = this.getSelectedLevelRegionNameAttributeInDepth(
                          this.selectedLevel.mappingFilter.regionNameAttribute
                      ).attrName?.[index],
                      rawLayer = this.getRawLayerByLayerId(layerId),
                      featureStream = getOAFFeature.getOAFFeatureStream(`${rawLayer.url}/collections/${rawLayer.collection}/items`, {
                          crs: this.selectedLevel.oafRequestCRS,
                          properties: `${regionKey},${this.selectedLevel.geometryAttribute[index]}`,
                          ...this.selectedLevel.geomRequestParams
                      }),
                      features = [];

                for await (const feature of featureStream) {
                    features.push(feature);
                }
                this.layer.getSource().addFeatures(features);
            }));
        },

        /**
         * For the template flats the region hierarchy into a list of objects.
         * In addition, the attributes 'values' and 'selectedValues' are set on the region objects.
         * @param {Object} regions - Represents the hierarchy of the regions.
         * @returns {void}
         */
        flattenRegionHierarchy (region) {
            region.selectedValues = [];
            region.loadingDataCounter = 0;
            this.flattenedRegions.push(region);

            if (Object.prototype.hasOwnProperty.call(region, "child")) {
                region.child.values = [];
                this.flattenRegionHierarchy(region.child);
            }
        },
        /**
         * Resets to the original status
         * @returns {void}
         */
        resetLevel () {
            this.loadedFilterData = false;
            this.loadedReferenceData = false;
            this.regions = [];
            this.allRegions = [];
            this.dates = [];
            this.setTimeStepsFilter([]);
            this.showLimitView = false;
            this.diagramType = undefined;
            this.selectedFilteredRegions = [];
            this.showLineLimitView = false;
            this.setFlattenedRegions([]);
            this.setSelectedCategories([]);
            this.setSelectedStatisticsKeys([]);
            this.setSelectedSpecificsTags({});
            this.setSelectedRegions([]);
            this.setSelectedDates([]);
            this.setSelectedReferenceData(undefined);
            this.handleReset();
        },

        /**
         * Gets the total prop.
         * @param {Boolean} addTotalCount - if the total count should be added.
         * @returns {Object} the total props for table component.
         */
        getTotalProp (addTotalCount) {
            return {
                enabled: addTotalCount,
                rowTitle: true,
                hintText: this.$t("common:modules.statisticDashboard.totalHint")
            };
        },

        /**
         * Resets all the filter
         * @returns {void}
         */
        resetAll () {
            this.setSelectedCategories([]);
            this.setSelectedStatisticsKeys([]);
            this.setSelectedSpecificsTags({});
            this.setSelectedRegions([]);
            this.setSelectedDates([]);
            this.setSelectedReferenceData(undefined);
            this.setFlattenedRegions([]);
            this.flattenRegionHierarchy(this.selectedLevelRegionNameAttribute);
            this.handleReset();
        },

        /**
         * Sets the subtitle of table.
         * @param {String} val - the subtile of table.
         * @returns {void}
         */
        setTableSubtitle (val) {
            this.referenceSubTitle = val;
        },
        /**
         * Handles the grid view.
         * @param {Boolean} val - true if the grid should show.
         * @returns {void}
         */
        handleGrid (val) {
            this.showGrid = val;
        }

    }
};
</script>

<template lang="html">
    <div
        id="modules-statisticDashboard"
        class="static-dashboard"
    >
        <h5 class="mb-3">
            {{ $t(levelTitle ?? subtitle) }}
        </h5>
        <StatisticDashboardDataSelection
            class
            @reset-all="resetAll"
        />
        <div class="row justify-content-between">
            <div class="col-md-12 d-flex align-items-center">
                <IconButton
                    v-if="getMetadataLink()"
                    :aria="$t('common:modules.statisticDashboard.headings.mrhstatisticsTooltip')"
                    :title="$t('common:modules.statisticDashboard.headings.mrhstatisticsTooltip')"
                    icon="bi-info-circle"
                    :interaction="() => openMetadata()"
                    :class-array="['info', 'btn', 'btn-light', 'btn-sm', 'ms-1', 'mt-0']"
                />
            </div>
        </div>
        <hr class="mt-3 mb-0">
        <Controls
            v-if="loadedReferenceData"
            :descriptions="controlDescription"
            class="mb-3"
            @show-chart-table="toggleChartTable"
            @set-table-subtitle="setTableSubtitle"
            @show-charts-in-grid="handleGrid"
        />
        <div
            v-else
            class="statistic-dashboard-loading d-flex flex-column align-items-center my-4"
        >
            <SpinnerItem />
            <span class="mt-2">
                {{ $t('common:modules.statisticDashboard.loadingData') }}
            </span>
        </div>

        <div
            v-if="!isFeatureLoaded"
            class="text-center"
        >
            <SpinnerItem />
        </div>
        <div
            v-if="!statisticsData && isFeatureLoaded"
            class="row justify-content-center my-3"
        >
            <div
                class="col col-md-9 d-flex align-items-center justify-content-center mt-2 alert alert-secondary info-text"
                role="alert"
            >
                <i class="bi bi-info-circle me-4" />
                {{ $t("common:modules.statisticDashboard.infoTextNoData") }}
            </div>
        </div>
        <div v-show="showTable">
            <div
                v-if="tableData.length === 1 && referenceSubTitle !== ''"
                class="statistic-name col col-auto mb-3 text-center"
            >
                <span>{{ chosenStatisticName }}</span>
                <span class="text-center">
                    <span> - {{ $t('common:modules.statisticDashboard.reference.difference') }}</span>
                    <br>
                    <span class="statistic-name-subtitle col col-auto">{{ referenceSubTitle }}</span>
                </span>
            </div>
            <TableComponent
                v-for="(data, index) in chosenTableData"
                :key="index"
                :title="tableData.length <= 1 && referenceSubTitle === '' ? chosenStatisticName : ''"
                :export-data="exportTableData"
                :export-file-name="downloadFilename"
                :downloadable="true"
                :data="data"
                :fixed-column-with-order="fixedColumn"
                :fixed-row="fixedRow"
                :fixed-bottom-data="testFixedData"
                :total-prop="getTotalProp(addTotalCount, chosenStatisticName)"
                :select-mode="selectMode"
                :show-header="showHeader"
                :dynamic-column-table="true"
                :font-size="'small'"
                :sortable="sortable"
                :enable-settings="true"
                :max-decimal-places="maxDecimalPlaces"
                sort-by-numeric-value
                @set-sorted-rows="setSortedRows"
                @column-selected="setSelectedColumn"
            />
        </div>
        <div
            v-show="showChart"
            class="position-relative"
        >
            <div
                v-if="showLimitView"
                class="filtered-areas"
            >
                <div class="row justify-content-center my-3">
                    <div
                        class="col col-md-9 d-flex align-items-center justify-content-center mt-2 alert alert-secondary info-text"
                        role="alert"
                    >
                        <i class="bi bi-info-circle me-4" />
                        {{ $t("common:modules.statisticDashboard.infoText") }}
                    </div>
                </div>
                <div class="row justify-content-center mb-4 mx-4">
                    <label
                        class="col-form-label-sm"
                        for="line-limit-search"
                    >
                        {{ $t("common:modules.statisticDashboard.label.area") }}
                    </label>
                    <Multiselect
                        id="line-limit-search"
                        :model-value="selectedFilteredRegions"
                        :multiple="true"
                        :options="selectedRegionsValues"
                        :searchable="true"
                        :close-on-select="false"
                        :clear-on-select="true"
                        class="col col-12"
                        :show-labels="false"
                        :limit="3"
                        :limit-text="count => count + ' ' + $t('common:modules.statisticDashboard.label.more')"
                        :allow-empty="false"
                        :placeholder="$t('common:modules.statisticDashboard.reference.placeholder')"
                        @select="addSelectedFilteredRegions"
                        @remove="removeRegion"
                    >
                        <template #clear>
                            <div class="multiselect__clear">
                                <i class="bi bi-search" />
                            </div>
                        </template>
                        <template #tag="{ option, remove }">
                            <button
                                class="multiselect__tag"
                                :class="option"
                                @click="remove(option)"
                                @keypress="remove(option)"
                            >
                                {{ option }}
                                <i class="bi bi-x" />
                            </button>
                        </template>
                    </Multiselect>
                </div>
            </div>
            <div
                v-if="!showGrid"
                class="position-absolute donwload-icon end-0 mt-2 me-2"
            >
                <IconButton
                    :aria="$t('common:modules.statisticDashboard.downloadDiagram')"
                    icon="bi bi-download"
                    :interaction="() => downloadCurrentChart()"
                    :class-array="['btn-light', 'mb-0']"
                />
            </div>
            <div
                v-if="!showGrid"
                ref="chartContainer"
                class="chart-container"
            />
            <GridComponent
                v-else
                :charts-count="chartCounts"
                :titles="selectedStatisticsNames"
                @show-charts-in-grid="handleGrid"
            >
                <template
                    #chartContainers="props"
                >
                    <div
                        :id="'chart' + props.chartId"
                        :ref="'chart' + props.chartId"
                    />
                </template>
            </GridComponent>
        </div>
        <template v-if="showMap && statisticsData">
            <StatisticDashboardMapSettings
                v-model:show-labels="showMapLabels"
                v-model:show-tooltips="showMapTooltips"
            />
            <div v-if="classificationMode !== 'custom'">
                <h5 class="mb-3 mt-3">
                    {{ $t('common:modules.statisticDashboard.legend.previewLegend') + ' - ' + chosenStatisticName }}
                </h5>
                <div class="row mb-2 ms-2">
                    <div
                        v-for="legendObj in legendValue"
                        :key="legendObj.name"
                        class="row layer"
                    >
                        <div class="col">
                            <img
                                :alt="legendObj.name"
                                :src="legendObj.graphic"
                                class="legend-img col-3 col-xs px-0 py-0 left"
                            >
                            <span
                                class="col col-xs legend-names px-0 ms-1"
                            >
                                {{ legendObj.name }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <LegendComponent class="mt-3" />
        </template>
        <div
            id="tooltip"
            ref="hoverInfoOverlay"
            class="hover-overlay"
        />
    </div>
</template>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>

<style lang="scss" scoped>

.hover-overlay {
    position: absolute;
    display: none;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid #ddd;
    padding: 8px 12px;
    border-radius: 6px;
    pointer-events: none;
    white-space: nowrap;
    font-size: 13px;
    color: #333;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: opacity 0.2s ease;
  }

hr {
    clear: both;
}

.btn-pb {
    padding-bottom: 2px;
}

img {
    width: 30px;
}
.more-statistics {
    display: none;
}
.legend-names {
    font-size: 12px;
}
.legend-img {
    border-radius: 50%;
    width: 15px;
}
.info-text {
    font-size: $font_size_sm;
    margin-top: 15px;
}
.chart-container {
    min-height: 60vh;

}
.btn-light {
    background: $light_grey;
        &:hover {
            background: $light_blue;
    }
        &:active {
            background: $dark_blue
    }
}

.statistic-name {
    font-family: $font_family_accent;
    font-size: $font_size_big;
}

.statistic-name-subtitle {
    font-family: $font_family_accent;
    font-size: $font_size_sm;
    display: block;
}

.static-dashboard .multiselect__tags {
    padding-left: 25px;
}
.static-dashboard .multiselect__clear {
    position: absolute;
    top: 12px;
    left:20px;
}

.donwload-icon {
    top: -10px;
}
</style>
