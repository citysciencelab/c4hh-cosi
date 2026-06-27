<script>
import actions from "../store/actionsDashboard.js";
import {
    addCalculation,
    calculateAll,
    calculateStats,
    calculateCorrelation,
    getTotal,
    getAverage,
    getCulmulativeTotal,
    sumUpSelected,
    divideSelected,
    deleteStats,
    getCalculationId
} from "../utils/operations";
import AlertMessage from "../../shared/modules/alerts/components/AlertMessage.vue";
import composeFilename from "../../utils/composeFilename";
import DashboardChartView from "./DashboardChartView.vue";
import DashboardTimeline from "./DashboardTimeline.vue";
import DashboardToolbar from "./DashboardToolbar.vue";
import exportXlsx from "../../utils/exportXlsx";
import {generateChartForDistricts, generateChartForCorrelation, generateChartsForItems} from "../utils/chart";
import getters from "../store/gettersDashboard.js";
import IconButton from "../../../../src/shared/modules/buttons/components/IconButton.vue";
import isObject from "@shared/js/utils/isObject.js";
import {getTimestamps} from "../../utils/timeline";
import {mapActions, mapGetters, mapMutations} from "vuex";
import mutations from "../store/mutationsDashboard.js";
import {prepareTableExportWithTimeline} from "../utils/export";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList";
import TableCell from "./TableCell.vue";
import TableRowMenu from "./TableRowMenu.vue";
import ToolInfo from "../../shared/modules/toolInfo/components/ToolInfo.vue";
import {VApp} from "vuetify/components/VApp";
import {VContainer, VRow} from "vuetify/components/VGrid";
import {VDataTableVirtual} from "vuetify/components/VDataTable";
import {VIcon} from "vuetify/components/VIcon";
import {VMain} from "vuetify/components/VMain";
import {VTooltip} from "vuetify/components/VTooltip";

export default {
    // eslint-disable-next-line vue/multi-word-component-names
    name: "Dashboard",
    components: {
        AlertMessage,
        DashboardChartView,
        DashboardTimeline,
        DashboardToolbar,
        IconButton,
        TableCell,
        TableRowMenu,
        ToolInfo,
        VApp,
        VContainer,
        VDataTableVirtual,
        VIcon,
        VMain,
        VRow,
        VTooltip
    },
    data () {
        return {
            animationState: false,
            animationTimeout: null,
            dashboardOpen: false,
            baseColumns: [
                {
                    key: "data-table-group",
                    title: this.$t("additional:modules.tools.cosi.dashboard.groupCol")
                },
                {
                    value: "category",
                    text: this.$t("additional:modules.tools.cosi.dashboard.category"),
                    sortable: false,
                    groupable: false,
                    filter: this.filterTable
                },
                {
                    value: "menu",
                    filterable: false,
                    sortable: false,
                    groupable: false
                },
                {
                    value: "years",
                    text: this.$t("additional:modules.tools.cosi.dashboard.timestamp"),
                    filterable: false,
                    sortable: false,
                    divider: true,
                    groupable: false
                }
            ],
            search: "",
            fields: {
                A: null,
                B: null
            },
            tableOrChart: "table",
            toolOffset: 0,
            calculationData: {
                id: "",
                operation: "",
                category_A: "",
                category_B: "",
                selectedCategories: "",
                field_A: null,
                field_B: null,
                selectedItems: []
            },
            timestampSelected: null,
            valueColumns: [],
            yearSelector: "jahr_"
        };
    },
    computed: {
        ...mapGetters("Modules/Dashboard", Object.keys(getters)),
        ...mapGetters("Modules/DistrictSelector", [
            "selectedDistrictLevel",
            "selectedDistrictNames",
            "mapping",
            "loadend"
        ]),
        ...mapGetters("Modules/Language", ["currentLocale"]),
        columns () {
            return [
                ...this.baseColumns,
                ...this.valueColumns.filter(column => column.show)
            ];
        },

        /**
         * Gets the default value columns: the district columns and the aggregate colums.
         * All are set to visible by default.
         * @returns {Object[]} The default columns.
         */
        defaultValueColumns () {
            return [...this.districtColumns, ...this.aggregateColumns].map(column => ({
                ...column,
                show: true
            }));
        },
        minimizedCols () {
            return this.valueColumns.filter(col => !col.show);
        },
        /**
         * Gets the selected columns (those that are not minimized).
         * @returns {Object[]} The selected columns.
         */
        selectedColumns () {
            return this.valueColumns.filter(col => col.show);
        },
        unselectedColumnLabels () {
            return this.valueColumns.filter(col => !this.selectedColumns.includes(col)).map(col => col.text);
        },
        /**
         * Gets the items that are selected for display in the table (filtered by statsFeatureFilter).
         * @returns {Object[]} The selected items.
         */
        selectedItems () {
            return this.items.filter(item => this.statsFeatureFilter.includes(item.category));
        },

        /**
         * The mapped key from value
         * @returns {Object} the key map object
         */
        keyMap () {
            return {
                category: "Kategorie",
                group: "Gruppe",
                valueType: "Datentyp",
                timestamp: "Jahr",
                hamburg_gesamt: "Hamburg gesamt",
                total: "Gesamt",
                average: "Durchschnitt",
                orientationValue: this.getColumnHeader("orientationValue")
            };
        },

        /**
         * Gets the item currently visualizted on the map,
         * @returns {Object|undefined} The visualized item, or undefined if no item is visualized.
         */
        visualizedItem () {
            return this.items.find(item => item.visualized === true);
        }
    },

    watch: {
        calculations: "calculateAll",
        loadend () {
            if (this.loadend && this.selectedDistrictNames.length > 0) {
                this.generateTable();
                this.valueColumns = [...this.defaultValueColumns];
            }
        },
        timestampSelected () {
            this.setSelectedYear(this.timestampSelected);
        }
    },
    created () {
        const selectedDistricts = this.selectedDistrictLevel.districts.filter(district => district.isSelected === true);

        if (selectedDistricts.length) {
            this.selectedStatFeatures = selectedDistricts.map(district => district.statFeatures).flat();
            this.calculateAll();
            if (this.selectedDistrictNames.length > 0) {
                this.generateTable();
                this.timestampSelected = this.items[0].years[0];
                this.valueColumns = [...this.defaultValueColumns];
            }
        }
    },
    mounted () {
        this.$el.querySelector(".dashboard-table").style.height = window.innerHeight - 275 + "px";
    },
    methods: {
        ...mapMutations("Modules/Dashboard", Object.keys(mutations)),
        ...mapActions("Modules/Dashboard", Object.keys(actions)),
        ...mapMutations("Modules/DistrictSelector", ["addCategoryToMapping", "removeCategoryFromMapping"]),
        ...mapActions("Modules/DistrictSelector", ["updateDistricts"]),
        ...mapMutations("Modules/ColorCodeMap", ["setSelectedYear", "setVisualizationState", "setSelectedFeature"]),
        ...mapActions("Modules/ColorCodeMap", ["renderVisualization"]),
        ...mapActions("Alerting", ["addSingleAlert"]),

        /**
         * Animates data for selected feature on the map over the available years.
         * @param {Number} tempo - Value for animation playback speed in seconds.
         * @returns {void}
         */
        animationOverYears (tempo = 1) {
            if (this.animationState) {
                let current = this.visuItemYears.indexOf(this.timestampSelected) - 1;

                if (current < 0) {
                    current = this.visuItemYears.length - 1;
                }

                this.animationTimeout = setTimeout(() => {
                    window.requestAnimationFrame(() => {
                        this.timestampSelected = this.visuItemYears[current];
                        this.renderVisualization();
                        this.animationOverYears(tempo);
                    });
                }, tempo * 1000);
            }
        },

        /**
         * Returns the labels of the selected districts.
         * @param {Object[]} districts - The districts of the selected district level.
         * @returns {String[]} The labels.
         */
        getSelectedDistrictsLabels (districts) {
            const selectedDistricts = districts.filter(district => district.isSelected === true);

            return selectedDistricts.map(district => district.getLabel());
        },

        getAverageAsString (item, timestamp) {
            const average = this.getAverage(item, this.getSelectedDistrictsLabels(this.selectedDistrictLevel.districts), timestamp, this.timestampPrefix);

            return average.toLocaleString("de-DE", {maximumFractionDigits: 1});
        },

        getAverageForAllTimestamps (item) {
            return Object.fromEntries(
                item.years.map(timestamp => [
                    this.timestampPrefix + timestamp,
                    this.getAverage(item, this.getSelectedDistrictsLabels(this.selectedDistrictLevel.districts), timestamp, this.timestampPrefix)
                ])
            );
        },

        getTotalAsString (item, timestamp) {
            const total = this.getTotal(item, this.getSelectedDistrictsLabels(this.selectedDistrictLevel.districts), timestamp, this.timestampPrefix);

            return total.toLocaleString("de-DE", {maximumFractionDigits: 1});
        },

        getTotalForAllTimestamps (item) {
            return Object.fromEntries(
                item.years.map(timestamp => [
                    this.timestampPrefix + timestamp,
                    this.getTotal(item, this.getSelectedDistrictsLabels(this.selectedDistrictLevel.districts), timestamp, this.timestampPrefix)
                ])
            );
        },

        setField (field, item) {
            this.fields[field] = item;
        },

        resetFields () {
            for (const field in this.fields) {
                this.fields[field] = null;
            }
        },

        renderCharts (item) {
            const
                total = this.getTotalForAllTimestamps(item),
                average = this.getAverageForAllTimestamps(item),
                data = {
                    ...item,
                    total,
                    average
                },
                chart = generateChartForDistricts(
                    data,
                    this.selectedColumns,
                    this.selectedDistrictLevel.label,
                    this.timestampPrefix
                );

            this.channelGraphData(chart);
        },

        renderGroupedCharts () {
            if (this.selectedItems.length === 0) {
                return;
            }

            const
                datasets = this.selectedItems.map(item => ({
                    ...item,
                    total: this.getTotalForAllTimestamps(item),
                    average: this.getAverageForAllTimestamps(item)
                })),
                charts = generateChartsForItems(
                    datasets,
                    this.selectedColumns,
                    this.selectedDistrictLevel.label,
                    this.timestampPrefix
                );

            this.channelGraphData(charts);
        },

        renderScatterplot () {
            if (!(this.fields.B && this.fields.A)) {
                return;
            }

            const correlation = this.calculateCorrelation(),
                chart = generateChartForCorrelation(correlation, this.fields.B.category, this.fields.A.category);

            this.channelGraphData(chart);
        },

        onVisualizationChanged () {
            let item;

            if (this.animationState) {
                this.stopAnimation();
            }
            for (item of this.items) {
                item.visualized = false;
            }
        },

        /**
         * Returns the items that are not minimized
         * @param {Object[]}  items to be prepared
         * @returns {Object[]} prepared items
         */
        getPreparedItems (items) {
            if (!Array.isArray(items) || items.length === 0) {
                return [];
            }
            const clonedItems = JSON.parse(JSON.stringify(items));

            clonedItems.forEach(item => {
                this.minimizedCols.forEach(minCol => {
                    delete item[minCol.value];
                });
            });

            return clonedItems;
        },

        /**
         * Export the table as XLSX.
         * If a year filter is set, only the selected years will be included, otherwise all.
         * @returns {void}
         */
        async exportTable () {
            let exportedData = null,
                iniHeader = null,
                fixedHeaderStart = null,
                fixedHeaderEnd = null,
                header = null;
            const items = this.selectedItems.length > 0 ? this.selectedItems : this.items,
                preparedItems = this.getPreparedItems(items),
                selectedDistrictLabels = this.getSelectedDistrictsLabels(this.selectedDistrictLevel.districts),
                prefix = this.prefixExportFilename,
                rawData = this.prepareTableExportWithTimeline(preparedItems, selectedDistrictLabels, this.items[0].years, this.keyMap, this.selectedDistrictLevel.districts, this.timestampPrefix, this.exportGrouped, this.districtColumns),
                filename = composeFilename(this.$t("additional:modules.tools.cosi.dashboard.exportFilename", {prefix})),
                modifiedKey = [{"oldKey": "isTemp", "newKey": "eigene Berechnungen"}];

            try {
                exportedData = this.sanitizeData(JSON.parse(JSON.stringify(rawData)), [...this.excludedPropsForExport, ...this.unselectedColumnLabels]);
                iniHeader = this.exportGrouped ?
                    Object.keys(Object.values(exportedData)[0][0]) : Object.keys(exportedData[0]);
                this.selectedColumns.forEach(column => {
                    const oldIndex = iniHeader.indexOf(column.text);

                    if (oldIndex > -1) {
                        iniHeader.splice(oldIndex, 1);
                        iniHeader.push(column.text);
                    }
                });
            }
            catch (error) {
                this.addSingleAlert({
                    content: this.$t("additional:modules.tools.cosi.dashboard.tableDataParsingError"),
                    class: "Info",
                    displayClass: "info"
                });
                return;
            }

            if (!this.fixedHeader) {
                fixedHeaderStart = iniHeader.includes("Gruppe") ? ["Kategorie", "Gruppe", "Datentyp"] : ["Kategorie", "Datentyp"];
                fixedHeaderEnd = iniHeader.includes(this.getColumnHeader("orientationValue")) ? [this.getColumnHeader("orientationValue"), "Jahr"] : ["Jahr"];
                header = fixedHeaderStart.concat(iniHeader.filter((value) => {
                    return !fixedHeaderStart.includes(value) && !fixedHeaderEnd.includes(value);
                }), fixedHeaderEnd);
            }
            else {
                header = await this.getFixedHeader(this.selectedDistrictNames, this.selectedColumns);
                exportedData = this.sanitizeData(JSON.parse(JSON.stringify(exportedData)), ["Datentyp"]);
            }
            exportedData = this.getModifiedData(exportedData, modifiedKey);

            exportXlsx(header, exportedData, filename);
        },

        /**
         * Returns a fixed order header.
         * @param {String[]} selectedDistrictNames - Selected district names.
         * @param {Object[]} selectedColumns - Selected columns.
         * @returns {Promise<String[]>|String[]} The fixed header.
         */
        async getFixedHeader (selectedDistrictNames, selectedColumns) {
            if (!Array.isArray(selectedDistrictNames) || !Array.isArray(selectedColumns)) {
                return ["Kategorie", "Jahr", "Gesamt", "Durchschnitt"];
            }

            return new Promise((resolve, reject) => {
                const header = ["Kategorie", "Jahr"];

                this.getDistrictNames(selectedDistrictNames).then((districtNames) => {
                    if (Array.isArray(districtNames) && districtNames.length > 0) {

                        if (districtNames.length > 0) {
                            for (let i = 0; i < districtNames.length; i++) {
                                header.push(districtNames[i]);
                            }
                        }

                        header.push("Gesamt", "Durchschnitt");
                    }

                    this.getSelectedColumnTexts(selectedColumns).then((selectedColumnTexts) => {
                        if (Array.isArray(selectedColumnTexts) && selectedColumnTexts.length > 0) {
                            for (let i = 0; i < selectedColumnTexts.length; i++) {
                                if (!header.includes(selectedColumnTexts[i])) {
                                    header.push(selectedColumnTexts[i]);
                                }
                            }
                        }

                        if (Array.isArray(header)) {
                            resolve(header);
                        }
                        else {
                            reject("Error during generation of the header for export.");
                        }
                    });
                });
            });
        },

        /**
         * Returns an array of selected district names.
         * @param {String[]} selectedDistrictNames - Selected district names.
         * @returns {Promise<String[]>|[]} - Array of district names, or empty array.
         */
        getDistrictNames (selectedDistrictNames) {
            if (!Array.isArray(selectedDistrictNames) || selectedDistrictNames.length === 0) {
                return [];
            }

            return new Promise((resolve, reject) => {
                const header = [];

                if (selectedDistrictNames.length > 0) {
                    for (let i = 0; i < selectedDistrictNames.length; i++) {
                        header.push(selectedDistrictNames[i]);
                    }
                }
                if (header.length > 0) {
                    resolve(header);
                }
                else {
                    reject("Error during generation of the header for export.");
                }
            });
        },

        /**
         * Returns an array of selected columns texts.
         * @param {Object[]} selectedColumns - Array of selected columns objects.
         * @returns {Promise<String[]>|[]} - Array of selected columns, or empty array.
         */
        getSelectedColumnTexts (selectedColumns) {
            if (!Array.isArray(selectedColumns) || selectedColumns.length === 0) {
                return [];
            }

            return new Promise((resolve, reject) => {
                if (Array.isArray(selectedColumns) && selectedColumns.length > 0) {
                    const columnTexts = [];

                    for (let i = 0; i < selectedColumns.length; i++) {
                        columnTexts.push(selectedColumns[i].text);
                    }
                    resolve(columnTexts);
                }
                else {
                    reject("Error during generation of the header for export.");
                }
            });
        },

        /**
         * Gets modified data by changing the key
         * @param {Object[]} data - the original data.
         * @param {Object[]} modifiedKey - the modified key.
         * @returns {Object[]} the modified data.
         */
        getModifiedData (data, modifiedKey) {
            if (!Array.isArray(data) || !data.length || !Array.isArray(modifiedKey) || !modifiedKey.length) {
                return data;
            }

            modifiedKey.forEach(key => {
                if (!Object.prototype.hasOwnProperty.call(key, "oldKey") || !Object.prototype.hasOwnProperty.call(key, "newKey")) {
                    return;
                }

                for (let i = 0; i < data.length; i++) {
                    if (Object.prototype.hasOwnProperty.call(data[i], key.oldKey)) {
                        data[i][key.newKey] = data[i][key.oldKey];
                        delete data[i][key.oldKey];
                    }
                }
            });

            return data;
        },

        /**
         * Starts a calculation from the toolbar
         * @param {String} calculationName - the name of the new calculation
         * @param {"add"|"subtract"|"multiply"|"divide"|"dividePercent"|"sumUpSelected"|"divideSelected"} operation - the mathmatical operation to execute
         * @param {String} category_A - the first category
         * @param {String} category_B - the second category
         * @returns {void}
         */
        onStartCalculation (calculationName, operation, category_A, category_B) {
            const calcName = calculationName || getCalculationId({operation, category_A, category_B}),
                field_A = this.items.find(item => item.category === category_A),
                field_B = this.items.find(item => item.category === category_B),
                selectedItems = this.selectedItems.length > 0 ? this.selectedItems : this.items;

            addCalculation.call(this, operation, {field_A, field_B, selectedItems}, calcName);

            if (this.statsFeatureFilter.length > 0) {
                this.statsFeatureFilter.push(calcName);
            }
        },

        /**
         * Opens the metadata for the given item (dataset).
         * @param {Object} item - The item for (dataset) which the metadata should be opened.
         * @returns {void}
         */
        openMetadata (item) {
            const datasetConfig = rawLayerList.getLayerWhere({id: item.layerId})?.datasets[0];

            if (typeof datasetConfig !== "undefined") {
                window.open(datasetConfig.show_doc_url + datasetConfig.md_id);
            }
            else {
                console.warn("No metadata info found for layer ID:", item.layerId);
            }
        },

        /**
         * Checks if there is meta data existed in item.
         * @param {Object} item - The item for (dataset) which the metadata should be opened.
         * @returns {Boolean} True if it has meta data
         */
        checkMetadata (item) {
            return typeof rawLayerList.getLayerWhere({id: item.layerId})?.datasets[0] !== "undefined";
        },

        /**
         * @description Sanitizes the export data. Removes excluded columns.
         * @param {Object[]} json - the array of objects
         * @param {String[]} exclude - the list of keys to exclude
         * @returns {Object[]} the sanitized data
         */
        sanitizeData (json, exclude) {
            if (!exclude) {
                return json;
            }
            if (isObject(json)) {
                Object.values(json).forEach(objectsToSanitize => {
                    this.sanitizeData(objectsToSanitize, exclude);
                });
                return json;
            }
            json.forEach(column => {
                exclude.forEach(key => {
                    delete column[key];
                });
            });

            return json;
        },

        addCalculation,
        calculateAll,
        calculateStats,
        calculateCorrelation,
        sumUpSelected,
        divideSelected,
        deleteStats,
        getTotal,
        getAverage,
        prepareTableExportWithTimeline,
        getCulmulativeTotal,

        /**
         * Sets the offs et of the tool sidebar from left viewport
         * @param {Event} evt - the resizeing event
         * @returns {void}
         */
        setToolOffset (evt) {
            if (!this.active) {
                return;
            }

            if (evt) {
                this.toolOffset = window.innerWidth - evt.targetElement.clientWidth;
            }

            if (typeof this.$el.querySelector === "function") {
                if (this.$el.querySelector("#dashboard-toolbar").clientHeight > 50) {
                    this.$el.querySelector(".dashboard-table-wrapper").style.height = "calc(100% - 116px)";
                }
                else {
                    this.$el.querySelector(".dashboard-table-wrapper").style.height = "calc(100% - 80px)";
                }
            }
        },

        /**
         * Filters the table by category
         * @param {String} value - the category mapping
         * @return {Boolean} should the item be displayed?
         */
        filterTable (value) {
            if (this.statsFeatureFilter.length < 1) {
                return true;
            }
            return this.statsFeatureFilter.map(t => typeof t === "string" ? t : t.value).includes(value);
        },
        /** make sure all objects in array include all the same keys
         * @param {*} arr array of objects
         * @param {*} missingValues what to set the missing values to
         * @returns {array} same array but each item has the same keys
         */
        fillMissingKeys (arr, missingValues = "NA") {
            // Create an object with all the keys in it
            // This will return one object containing all keys the items
            const obj = arr.reduce((res, item) => ({...res, ...item})),

                // Get those keys as an array
                keys = Object.keys(obj),

                // Create an object with all keys set to the default value (0)
                def = keys.reduce((result, key) => {
                    result[key] = missingValues;
                    return result;
                }, {}),

                // Use object destrucuring to replace all default values with the ones we have
                result = arr.map((item) => ({...def, ...item}));

            return result;
        },

        /**
         * Collapses all the accordion group after loading.
         * @returns {void}
         */
        collapseAllGroups () {
            const groupStates = this.$refs["dashboard-table"]?.$vnode?.componentInstance?.openCache;

            if (groupStates) {
                for (const e in groupStates) {
                    groupStates[e] = false;
                }
            }
        },

        /**
         * Updates the timestamps in the table based on the selected years.
         * @param {String[]} selectedYears - array of years to filter timestamps
         * @returns {void}
         */
        updateTimestampsValues (selectedYears) {
            const sortedSelectedYears = selectedYears.slice(0).sort((a, b) => b - a);

            this.setTimestampsFiltered(sortedSelectedYears);
            this.items.forEach(item => {
                if (selectedYears.length === 0) {
                    item.years = [...getTimestamps(item, this.timestampPrefix)];
                }
                else {
                    item.years = sortedSelectedYears;
                }
            });
            this.timestampSelected = this.items[0].years[0];
        },

        /**
         * Starts the animation for a given item. If another item is currently visualized,
         * it deactivates the previous item and updates the visualization state.
         * @param {Object} item - The item to be animated.
         * @returns {void}
         */
        startAnimation (item) {
            if (this.visualizedItem && item.id !== this.visualizedItem.id) {
                this.visualizedItem.visualized = false; // Deaktiviere das vorherige Item
            }

            this.setSelectedFeature(item.category);
            item.visualized = true;
            this.visuItemYears = item.years;

            if (!this.animationState || (this.visualizedItem && item.id !== this.visualizedItem.id)) {
                this.setVisualizationState(true);
                this.animationState = true;
                this.animationOverYears();
            }
        },

        /**
         * Stops the animation process for the animated item.
         * @returns {void}
         */
        stopAnimation () {
            this.animationState = false;
            clearTimeout(this.animationTimeout);
            this.animationTimeout = null;
            this.timestampSelected = this.visualizedItem.years[0];
            this.visualizedItem.visualized = false;
            this.setVisualizationState(false);
            this.renderVisualization();
        }
    }
};

</script>

<template lang="html">
    <div>
        <v-app
            id="dashboard-wrapper"
            absolute
        >
            <v-main>
                <ToolInfo
                    :url="readmeUrl"
                    :locale="currentLocale"
                    :is-open="false"
                />
                <AlertMessage
                    v-if="selectedDistrictNames.length === 0"
                    :text="$t('additional:modules.tools.cosi.dashboard.alertMessageNoData')"
                    type="noData"
                />
                <v-container
                    v-if="selectedDistrictNames.length"
                    fluid
                >
                    <DashboardToolbar
                        v-model:setting-items="valueColumns"
                        item-title="text"
                        :stats-feature-filter="statsFeatureFilter"
                        :download-disabled="tableOrChart === 'chart'"
                        @setStatsFeatureFilter="setStatsFeatureFilter"
                        @exportTable="exportTable"
                        @showView="tableOrChart = $event"
                        @setTimestampsValues="updateTimestampsValues"
                        @start-calculation="onStartCalculation"
                    />
                    <v-row
                        v-if="tableOrChart === 'table'"
                        class="dashboard-table-wrapper"
                    >
                        <v-data-table-virtual
                            ref="dashboard-table"
                            :headers="columns"
                            :items="items"
                            :group-by="[{key: 'groupIndex', order: 'asc'}]"
                            :items-per-page="-1"
                            :search="search"
                            hide-default-footer
                            fixed-header
                            class="dashboard-table"
                            @hook:mounted="collapseAllGroups"
                        >
                            <!-- Header for years selector -->
                            <template #[`header.years`]>
                                <div>
                                    {{ $t('additional:modules.tools.cosi.dashboard.timestamp') }}
                                </div>
                            </template>
                            <!-- Header for districts -->
                            <template
                                v-for="district in valueColumns"
                                #[`header.${district.value}`]
                            >
                                <div
                                    :key="district.value"
                                    class="district-header"
                                >
                                    {{ district.text }}
                                </div>
                            </template>
                            <!-- Column Group -->
                            <template
                                #[`group-header`]="{ item,
                                                     //eslint-disable-next-line vue/no-template-shadow
                                                     columns ,
                                                     toggleGroup, isGroupOpen }"
                            >
                                <tr>
                                    <th
                                        :colspan="columns.length"
                                        class="text-start"
                                    >
                                        <v-icon @click="toggleGroup(item)">
                                            {{ isGroupOpen(item) ? 'mdi-minus' : 'mdi-plus' }}
                                        </v-icon>
                                        {{ items.find(i => i.groupIndex === item.value).group }}
                                    </th>
                                </tr>
                            </template>
                            <!-- Column Menu -->
                            <template #[`item.menu`]="{ item }">
                                <TableRowMenu
                                    :item="item"
                                    @visualizationChanged="onVisualizationChanged"
                                />
                            </template>
                            <template #[`item.category`]="{ item }">
                                <div class="d-flex align-items-center fs-6">
                                    <span
                                        :class="item.visualized ? 'is-selected' : ''"
                                    >{{ item.category }}</span>
                                    <IconButton
                                        v-if="checkMetadata(item)"
                                        :id="item.id"
                                        :class-array="['btn-light', 'fs-5', 'ms-1']"
                                        :aria="$t('common:modules.layerTree.infosAndLegend')"
                                        :icon="'bi-info-circle'"
                                        :interaction="() => openMetadata(item)"
                                    />
                                </div>
                                <DashboardTimeline
                                    v-if="item.years.length > 1"
                                    :item="item"
                                    :animation-state="animationState"
                                    @startAnimation="startAnimation"
                                    @stopAnimation="stopAnimation"
                                />
                            </template>
                            <!-- Column Year-->
                            <template #[`item.years`]="{ item }">
                                <div class="text-end">
                                    <template v-if="item.expanded">
                                        <ul class="timeline">
                                            <li
                                                v-for="year in item.years"
                                                :key="year"
                                            >
                                                <small class="timestamp">{{ year }}</small>
                                            </li>
                                        </ul>
                                    </template>
                                    <template v-else>
                                        <span><small class="timestamp">{{ timestampSelected }}</small></span>
                                    </template>
                                </div>
                            </template>
                            <!-- Columns of all Districts -->
                            <template
                                v-for="district in districtColumns"
                                #[`item.${district.value}`]="{ item }"
                            >
                                <TableCell
                                    :key="district.value"
                                    :item="item"
                                    :header="district"
                                    :current-timestamp="timestampSelected"
                                    :timestamp-prefix="timestampPrefix"
                                    :current-locale="'de-DE'"
                                    :tooltip-offset="toolOffset"
                                    :trend-colors="trendColors"
                                />
                            </template>
                            <!-- Columns for total data -->
                            <template #[`item.total`]="{ item, header }">
                                <TableCell
                                    v-if="item.total"
                                    :item="item"
                                    :header="header"
                                    :current-timestamp="timestampSelected"
                                    :timestamp-prefix="timestampPrefix"
                                    :current-locale="'de-DE'"
                                    :tooltip-offset="toolOffset"
                                    :trend-colors="trendColors"
                                />
                                <v-tooltip
                                    v-else
                                    bottom
                                    :nudge-top="60"
                                >
                                    <template #activator="{ props }">
                                        <div
                                            class="text-end"
                                            v-bind="props"
                                        >
                                            <template v-if="item.expanded">
                                                <ul class="timeline">
                                                    <li
                                                        v-for="year in item.years"
                                                        :key="year"
                                                    >
                                                        {{ getTotalAsString(item, year) }}
                                                    </li>
                                                </ul>
                                            </template>
                                            <template v-else>
                                                <span>{{ getTotalAsString(item, timestampSelected) }}</span>
                                            </template>
                                        </div>
                                    </template>
                                    <span>{{ $t('additional:modules.tools.cosi.dashboard.totalCol') }} {{ item.expanded ? '' : `(${timestampSelected})` }}</span>
                                </v-tooltip>
                            </template>
                            <!-- Columns for aggregated data -->
                            <template #[`item.average`]="{ item, header }">
                                <TableCell
                                    v-if="item.average"
                                    :item="item"
                                    :header="header"
                                    :current-timestamp="timestampSelected"
                                    :timestamp-prefix="timestampPrefix"
                                    :current-locale="'de-DE'"
                                    :tooltip-offset="toolOffset"
                                    :trend-colors="trendColors"
                                />
                                <v-tooltip
                                    v-else
                                    bottom
                                    :nudge-top="60"
                                >
                                    <template #activator="{ props }">
                                        <div
                                            class="text-end"
                                            v-bind="props"
                                        >
                                            <template v-if="item.expanded">
                                                <ul class="timeline">
                                                    <li
                                                        v-for="year in item.years"
                                                        :key="year"
                                                    >
                                                        {{ getAverageAsString(item, year) }}
                                                    </li>
                                                </ul>
                                            </template>
                                            <template v-else>
                                                {{ getAverageAsString(item, timestampSelected) }}
                                            </template>
                                        </div>
                                    </template>
                                    <span>{{ $t('additional:modules.tools.cosi.dashboard.avgCol') }} {{ item.expanded ? '' : `(${timestampSelected})` }}</span>
                                </v-tooltip>
                            </template>
                        </v-data-table-virtual>
                    </v-row>
                    <DashboardChartView
                        v-else-if="tableOrChart === 'chart'"
                    />
                </v-container>
            </v-main>
        </v-app>
    </div>
</template>

<style lang="scss">

#dashboard-wrapper {
    .v-container {
        padding: 0 16px;
    }
    .v-application__wrap {
        min-height: inherit;
    }
    .name-input {
        .v-snack__wrapper {
            min-width: 40vw;
        }
    }

    .dashboard-table {
        .v-table__wrapper {
            overflow-x: auto;
            overflow-y: auto;
            > table > thead > tr > th {
                padding-left: 5px;
                padding-right: 5px;
            }
        }
        .v-data-table__td {
            padding: map-get($spacers, 2);
            .is-selected {
                color: $secondary;
                font-family: $font_family_accent;
            }
        }

        thead {
            .district-header {
                position: relative;
                > div {
                    min-width: 100px;
                }
                .v-selection-control__input {
                    width: 30px;
                    height: 30px;
                    border-radius: 30px;
                }

            }
            .v-input {
                font-size: unset;
                min-width: 100px;
                label {
                    font-size: 11px;
                    font-weight: 700;
                    word-break: normal;
                    text-align: left;
                    i {
                        font-size: 20px;
                    }
                }
            }
        }

        th.minimized {
            .v-input {
                display: none;
            }
        }

        td {
            vertical-align: top;

            div.text-end {
                text-align: right;
            }
            ul.timeline {
                list-style: none;
                li {
                    text-align: right;
                }
            }
            .timestamp {
                color: $dark_blue;
            }
            .no-wrap {
                white-space: nowrap;
            }
            .modified {
                color: red;
            }
            .minimized {
                overflow: hidden;
                width: 20px;
                display: none;
            }
        }
    }
}
</style>
