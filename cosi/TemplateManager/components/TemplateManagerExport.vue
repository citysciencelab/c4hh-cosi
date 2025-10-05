<script>
import dayjs from "dayjs";
import {mapGetters} from "vuex";
import TemplateManagerExportProgressBar from "./TemplateManagerExportProgressBar.vue";
import PDFMaker from "../js/createPdf";
import {getTotal, getCulmulativeTotal} from "../../Dashboard/utils/operations";
import {getCenter as getCenterOfExtent} from "ol/extent";
import {startPrintProcess} from "../../../shared/js/mapfishUtils/startPrintProcess";
import {unionFeatures} from "../../../valuationPrint/js/unionFeatures";
import axios from "axios";
import {baseProportionTemplate, baseFixedTemplateForHamburg, mapfishServerConfig} from "../js/mapfishUtils";
import {Chart as ChartJS} from "chart.js";
import isObject from "@shared/js/utils/isObject";
import {fromExtent} from "ol/geom/Polygon";
import Feature from "ol/Feature.js";
import getBasicInfo from "../js/getBasicInfo";
import MapfishDialog from "../../../shared/js/mapfishUtils/mapfishDialog";
import {VChip} from "vuetify/components/VChip";
import {VChipGroup} from "vuetify/components/VChipGroup";

export default {
    name: "TemplateManagerExport",
    components: {
        TemplateManagerExportProgressBar,
        VChip,
        VChipGroup
    },
    props: {
        templateName: {
            type: String,
            required: false,
            default: ""
        },
        templateStatsCategories: {
            type: Array,
            required: false,
            default: () => []
        },
        templateLayerIds: {
            type: Array,
            required: false,
            default: () => []
        }
    },
    data: () => ({
        tagsOptionalComponents: [
            "Titelblatt inkl. Kartenausschnitt",
            "statistische Datenübersicht",
            "Datenvisualisierung"
        ],
        tagsInfrastructureData: [
            "Auflistung",
            "Kartendarstellung der Infrastrukturdaten"
        ],
        showProgressBar: false,
        percentage: 50,
        reportTitle: "",
        reportTitleMaxLength: 50,
        selectedAreasName: "",
        selectedAreasNameMaxLength: 20,
        author: "",
        authorMaxLength: 35,
        pdf: null,
        categoryInChart: [
            {"Bevölkerung": "Bevölkerung insgesamt"},
            {"Bevölkerung unter x Jahren": "Bevölkerung unter 18 Jahren"},
            {"Bevölkerung ab x Jahren": "Bevölkerung ab 65 Jahren"},
            {"Bevölkerung Migrationshintergrund": "Bevölkerung mit Migrationshintergrund"},
            {"Bevölkerung Migrationshintergrund": "Ausländer insgesamt"}
        ],
        progressValue: 0,
        selectedReportComponents: [],
        selectedCategoryInChart: []
    }),
    computed: {
        ...mapGetters("Modules/Language", ["currentLocale"]),
        ...mapGetters("Modules/Dashboard", ["items"]),
        ...mapGetters("Modules/FeaturesList", ["featuresListItems"]),
        ...mapGetters("Modules/DistrictSelector", ["districtLevels", "selectedDistrictLevel", "selectedDistrictNames", "selectedFeatures", "initMapping"]),
        ...mapGetters(["restServiceById"]),
        ...mapGetters("Maps", ["projection", "getCurrentExtent"]),

        /**
         * Generates a file name for the report.
         * @returns {String} The file name.
         */
        downloadName () {
            const date = dayjs(new Date()).format("YYYY-MM-DD"),
                fileName = this.reportTitle ? this.reportTitle : this.templateName,
                prepareName = fileName.replace(/(?:\.(?![^.]+$)|[^\w.])+/g, "-");

            return prepareName + "-" + date + ".pdf";
        },
        /**
         * Gets the column name for the export based on entered selected areas name.
         * @returns {String} the column name to use for the selected area.
         */
        areaColumnName () {
            return this.selectedAreasName ? this.selectedAreasName.trim() : "Ausgewähltes Gebiet";
        },

        /**
         * Checks if the report title is valid.
         * @returns {Boolean} True if valid.
         */
        isReportTitleValid () {
            return this.reportTitle.length < this.reportTitleMaxLength;
        },

        /**
         * Checks if the selected areas name is valid.
         * @returns {Boolean} True if valid.
         */
        isSelectedAreasNameValid () {
            return this.selectedAreasName.length < this.selectedAreasNameMaxLength;
        },

        /**
         * Checks if the author is valid.
         * @returns {Boolean} True if valid.
         */
        isAuthorValid () {
            return this.author.length < this.authorMaxLength;
        },
        /**
         * Gets the labels of the selected districts.
         * These are the identifiers used in the dashboard (e.g. "Bergedorf (Bezirk)" instead of "Bergedorf")
         * @returns {String[]} The labels of the selected districts.
         */
        selectedDistrictLabels () {
            return this.selectedDistrictLevel.districts
                .filter(dist => this.selectedDistrictNames.includes(dist.getName()))
                .map(dist => dist.getLabel());
        }
    },
    mounted () {
        this.selectedReportComponents = [...this.tagsOptionalComponents, ...this.tagsInfrastructureData];
    },
    methods: {
        /**
         * Registers the steps for the progress of the export.
         * @returns {void}
         */
        registerProgressSteps () {
            this.progressSteps = [
                {func: () => this.pdf.resetDocContent()},
                {func: () => this.pdf.addHeader(this.reportTitle.trim())},
                {func: () => this.pdf.setAuthor(this.author.trim())},
                {func: async () => this.addOverViewPageToReport(), handleProgressByThemSelves: true},
                {func: () => this.addStatsToReport(this.items)},
                {func: () => this.addTopicsToReport(this.featuresListItems)},
                {func: async () => this.addDiagram()},
                {func: async () => this.addInfrastructureMapPageToReport(), handleProgressByThemSelves: true}
            ];
        },
        /**
         * Show the view with the progress bar.
         * If the progress bar is displayed, the template import should not be shown.
         * @param {Boolean} val - if the progress bar should be shown.
         * @returns {void}
         */
        manageProgressBarView (val) {
            this.showProgressBar = val;
            this.$emit("toggleTemplateImport", !this.showProgressBar);
            if (val) {
                this.createReport();
            }
        },
        /**
         * Returns true or false, depending on whether the component was selected by the user or not.
         * @param {String} component - The name of the component.
         * @returns {Boolean} - True if the component was selected.
         */
        controlsReportComponent (component) {
            return this.selectedReportComponents.includes(component);
        },

        /**
         * Gets the progress value for each step.
         * @returns {Number} the progress value.
         */
        getProgressValuePerStep () {
            return Math.round(100 / this.progressSteps.length);
        },

        /**
         * Creates the report and calls the download function.
         * @returns {void}
         */
        async createReport () {
            this.progressValue = 0;
            this.pdf = new PDFMaker();

            this.pdf.resetDocContent();
            this.registerProgressSteps();
            for (let i = 0; i < this.progressSteps.length; i++) {
                await this.progressSteps[i].func();
                if (i === this.progressSteps.length - 1) {
                    this.progressValue = 100;
                }
                else if (this.progressSteps[i].handleProgressByThemSelves !== true) {
                    this.progressValue += this.getProgressValuePerStep();
                }
            }
            this.pdf.download(this.downloadName);
        },

        /**
         * Prepares the statistical data and adds it to the report.
         * @param {Object[]} items - Items from dashboard component.
         * @returns {void}
         */
        async addStatsToReport (items) {
            if (!this.controlsReportComponent("statistische Datenübersicht")) {
                return;
            }
            const filteredMappingByCategories = this.initMapping.filter(obj => {
                    return this.templateStatsCategories.includes(obj.value);
                }),
                groupedMapping = Object.groupBy(filteredMappingByCategories, (obj) => obj.group);

            this.pdf.addChapter("Statistische Datenübersicht");

            Object.keys(groupedMapping).forEach((group, idx) => {
                const columns = this.pdf.getColumns(["", this.areaColumnName, ...this.getStatCols(this.selectedDistrictLevel, this.selectedDistrictNames, [])]),
                    body = [columns];

                this.pdf.addHeadline(group);

                groupedMapping[group].forEach(mappingObject => {
                    const statFeature = items.find((item) => item.category === mappingObject.value),
                        lastYear = statFeature.years[0],
                        row = [];

                    columns.forEach((col, index) => {
                        const numberOptions = statFeature.valueType === "relative" ? {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1
                        } : {};

                        let value,
                            alignment = "right";

                        if (index === 0) {
                            alignment = "left";
                            if (idx === 8) {
                                value = statFeature.category.slice(0, 24);
                            }
                            else {
                                value = statFeature.category;
                            }
                        }
                        else if (index === 1) {
                            value = this.getTotal(statFeature, this.selectedDistrictLabels, lastYear, "jahr_");
                        }
                        else {
                            value = parseFloat(statFeature[col.text]["jahr_" + lastYear]) || "-";
                        }
                        this.pdf.addCell(row, value.toLocaleString("de-DE", numberOptions), alignment);
                    });
                    body.push(row);
                });
                this.pdf.addTable(body, 120);
            });
        },

        /**
         * Adds the overview page to the report.
         * @returns {void}
         */
        async addOverViewPageToReport () {
            if (!this.controlsReportComponent("Titelblatt inkl. Kartenausschnitt")) {
                return;
            }
            const imageName = "overviewMap",
                feature = this.selectedFeatures.length > 1 ? unionFeatures(this.selectedFeatures) : this.selectedFeatures[0],
                template = typeof feature !== "undefined" ?
                    this.getObjectCopyWithoutReference(baseProportionTemplate) :
                    this.getObjectCopyWithoutReference(baseFixedTemplateForHamburg),
                availableProgressForThisStep = this.getProgressValuePerStep() / 2,
                initialProgressValue = this.progressValue,
                {downloadURL: overviewImageUrl, bbox} = await this.prepareImage(feature, template, this.projection.getCode(), imageName, mapfishServerConfig, () => {
                    if (this.progressValue < (initialProgressValue + availableProgressForThisStep)) {
                        this.progressValue += 1;
                    }
                }, "A4 Hochformat").catch(error => console.error(error)),
                headline = this.reportTitle ? this.reportTitle.trim() : "Übersichtskarte";

            if (typeof overviewImageUrl !== "string") {
                return;
            }
            this.pdf.addChapterHeadline(headline);
            this.pdf.addImageByUrl(overviewImageUrl, imageName, {fit: [500, 500], alignment: "center"});
            this.pdf.addLineBreak();
            await this.addDetailViewToOverviewPage(template, bbox, () => {
                if (this.progressValue < initialProgressValue + (availableProgressForThisStep * 2)) {
                    this.progressValue += 1;
                }
            });

            this.progressValue = initialProgressValue + (availableProgressForThisStep * 2);
        },

        /**
         * Adds infrastructure map to the page report.
         * @returns {void}
         */
        async addInfrastructureMapPageToReport () {
            if (!this.controlsReportComponent("Kartendarstellung der Infrastrukturdaten")) {
                return;
            }
            const imageName = "infrastructureMap",
                feature = this.selectedFeatures.length > 1 ? unionFeatures(this.selectedFeatures) : this.selectedFeatures[0],
                template = typeof feature !== "undefined" ?
                    this.getObjectCopyWithoutReference(baseProportionTemplate) :
                    this.getObjectCopyWithoutReference(baseFixedTemplateForHamburg),
                initialProgressValue = this.progressValue,
                availableProgressForThisStep = this.getProgressValuePerStep();
            let imageOptions = {};

            this.templateLayerIds.forEach(layerId => {
                if (!template.baseLayer.map.layerIds.includes(layerId)) {
                    template.baseLayer.map.layerIds.unshift(layerId);
                }
            });
            template.baseLayer.map.proportion = 0.99;
            imageOptions = await this.prepareImage(feature, template, this.projection.getCode(), imageName, mapfishServerConfig, () => {
                if (this.progressValue < (initialProgressValue + availableProgressForThisStep)) {
                    this.progressValue += 1;
                }
            }, "A4 Hochformat", 1).catch(error => console.error(error));

            if (typeof imageOptions.downloadURL !== "string") {
                return;
            }
            this.pdf.addChapter("Darstellung der Infrastrukturdaten");
            this.pdf.addImageByUrl(imageOptions.downloadURL, imageName, {fit: [500, 500], alignment: "center"});
            this.pdf.addLineBreak();
        },

        /**
         * Adds a detail box and a detail view for the overview page.
         * @param {Object} template A template for mapfish.
         * @param {Number[]} bbox A bbox to use for the overviewmap as feature coordinates.
         * @param {Function} progressHandler Function to handle the print progress.
         * @returns {void}
         */
        async addDetailViewToOverviewPage (template, bbox, progressHandler) {
            template.baseLayer.map.proportion = 0.25;
            const {downloadURL: minimapImageUrl} = await this.prepareImage(
                    new Feature({geometry: fromExtent(bbox)}),
                    template, this.projection.getCode(),
                    "miniMap",
                    mapfishServerConfig,
                    progressHandler,
                    "rectangleTemplate"
                ).catch(error => console.error(error)),
                text = [],
                tableBody = [[
                    {
                        margin: [0, 4, 0, 4]
                    }
                ]],
                infoData = getBasicInfo.getOverviewBasicInfo(this.selectedDistrictLevel);

            infoData.forEach(data => {
                text.push({text: `${data.label}: `, bold: true});
                text.push(`${data.value}\n`);
            });
            tableBody[0][0].text = text;

            this.pdf.addImageInstance(minimapImageUrl, "miniMap");
            this.pdf.addColumns([
                {
                    table: {
                        headerRows: 1,
                        widths: [200],
                        body: tableBody
                    }
                },
                {image: "miniMap", fit: [300, 150], alignment: "right"}
            ]);
        },

        /**
         * Creates the mapfish dialog and sets mapfishData
         * @return {void}
         */
        async createMapfishDialog () {
            const mapConf = await this.getMapConf(this.parcel[0], this.config?.specification),
                legends = this.getLegends(this.config?.legends),
                pdfPageNames = this.preparePDFPageNames(this.pdfPages),
                attributes = this.getAttributes(mapConf, legends, pdfPageNames);

            this.mapfishData = {
                "layout": "A4 Hochformat",
                attributes,
                "outputFilename": "Ausdruck",
                "uniqueIdList": [],
                "visibleLayerIds": ["19969"],
                "outputFormat": "pdf"
            };
        },

        /**
         * Prepares an image on mapfish and resolves an object with an url to that image and its bbox.
         * Rejects if an error occurs.
         * @param {ol/Feature} feature An feature to display on the image.
         * @param {Object} baseLayer The configuration for the base layer to use.
         * @param {String} projectionCode The projection code.
         * @param {String} imageName The image name.
         * @param {Object} serverConfig The config of which mapfish server and template to use.
         * @param {String} serverConfig.template The name of the template.
         * @param {String} serverConfig.name The name of the mapfish server (most of the time mapfish or mapfish_qs).
         * @param {Function} handleOngoing Function to handle the ongoing process of creating the image.
         * @param {String} layoutName The layout name.
         * @param {Number} mapScaleFactor The scale factor for the map.
         * @returns {Promise<Object>} a promise which resolves an object {downloadURL, bbox}.
         */
        prepareImage (feature, baseLayer, projectionCode, imageName, serverConfig, handleOngoing, layoutName, mapScaleFactor) {
            const extent = feature?.getGeometry()?.getExtent(),
                baseLayerName = Object.keys(baseLayer)[0],
                // mapfishDialog = createMapfishDialog(
                //     typeof feature !== "undefined" ? {
                //         center: getCenterOfExtent(extent),
                //         extent,
                //         feature,
                //         featureList: [feature],
                //         geometry: feature?.getGeometry()
                //     } : undefined,
                //     {},
                //     baseLayer,
                //     "",
                //     projectionCode,
                //     imageName,
                //     layoutName,
                //     mapScaleFactor
                // );

                mapfishDialogInstance = new MapfishDialog(
                    {},
                    baseLayer,
                    "",
                    projectionCode,
                    layoutName,
                    imageName,
                    mapScaleFactor
                );

            return mapfishDialogInstance.create(typeof feature !== "undefined" ? {
                center: getCenterOfExtent(extent),
                extent,
                feature,
                featureList: [feature],
                geometry: feature?.getGeometry()
            } : undefined).then(mapfishDialog => {
                mapfishDialog.attributes.map = mapfishDialog.attributes[`${baseLayerName}.map`];
                delete mapfishDialog.attributes[`${baseLayerName}.map`];
                delete mapfishDialog.attributes.legend;

                return new Promise((resolve, reject) => {
                    return startPrintProcess(this.restServiceById(serverConfig.name).url, "png", serverConfig.template, mapfishDialog, (url, payload) => {
                        return axios.post(url, payload);
                    }, handleOngoing,
                    error => {
                        reject(error);
                    },
                    downloadURL => {
                        resolve({downloadURL, bbox: mapfishDialog.attributes.map.bbox});
                    }, 0);
                });
            });

        },

        /**
         * Runs recursively through the district levels to get the names of the higher level districts.
         * @param {Object} districtLevel - The district level to which the district names belong.
         * @param {String[]} districtNames - The names of the needed districts.
         * @param {String[]} columns - The names of the columns.
         * @returns {String[]} The names of the columns
         */
        getStatCols (districtLevel, districtNames, columns) {
            const districts = districtLevel.displayAll
                    ? districtLevel.districts
                    : districtLevel.districts.filter(dist => districtNames.includes(dist.getName())),
                refDistrictNames = [];
            let refDistrictName, district;

            for (district of districts) {
                if (districtLevel.label !== this.selectedDistrictLevel.label) {
                    columns.push(district.getLabel());
                }

                refDistrictName = district.getReferencDistrictName();

                if (refDistrictName) {
                    refDistrictNames.push(refDistrictName);
                }
            }
            if (districtLevel.referenceLevel) {
                this.getStatCols(districtLevel.referenceLevel, refDistrictNames, columns);
            }

            return columns;
        },
        getCulmulativeTotal,
        getTotal,

        /**
         * Prepares the geospatial data and adds it to the report.
         * @param {Object[]} topics - Items from FeaturesList Component.
         * @returns {void}
         */
        addTopicsToReport (topics) {
            if (!this.controlsReportComponent("Auflistung")) {
                return;
            }
            const groupedTopics = Object.groupBy(topics, (topic) => topic.layerName);

            this.pdf.addChapter("Infrastrukturdaten");
            Object.keys(groupedTopics).forEach(group => {
                const topicLength = groupedTopics[group].length,
                    columns = this.pdf.getColumns(["Typ der Einrichtung", "Name", "Adresse"], []),
                    body = topicLength <= 10 ? [columns] : [],
                    columnAttirbutes = ["type", "name", "address"];

                this.pdf.addHeadline(group);
                this.pdf.addParagraph(`Anzahl der ${group} im ausgewählten Gebiet: ${groupedTopics[group].length}`);

                if (topicLength <= 10) {
                    groupedTopics[group].forEach(topic => {
                        const row = [];

                        columnAttirbutes.forEach((attribute) => {
                            this.pdf.addCell(row, topic[attribute], "left");
                        });
                        body.push(row);
                    });
                    this.pdf.addTable(body, 120);
                }
            });
        },

        /**
         * Add diagram to report
         * @returns {void}
         */
        async addDiagram () {
            if (!this.controlsReportComponent("Datenvisualisierung")) {
                return;
            }

            const data = this.getChartData(this.items, this.templateStatsCategories, this.selectedDistrictNames, this.areaColumnName, this.categoryInChart, this.initMapping),
                imageArr = [];

            if (!Array.isArray(data) || !data.length) {
                return;
            }

            for (let i = 0; i < data.length; i++) {
                imageArr.push(await this.getChartImage(data[i]));
            }

            if (imageArr.length) {
                this.pdf.addChapter("Datenvisualisierung");

                imageArr.forEach((image, index) => {
                    this.pdf.addHeadline(Object.keys(this.selectedCategoryInChart[index])[0]);
                    this.pdf.addParagraph(Object.values(this.selectedCategoryInChart[index])[0]);
                    this.pdf.addImageByUrl(undefined, image, {width: 500, alignment: "center"});
                    this.pdf.addLineBreak(5);
                });
            }
        },

        /**
         * Gets the chart image as Base64 format.
         * @param {Object} data - the chart data.
         * @returns {Promise<string>} the toBase64Image image string.
         */
        getChartImage (data) {
            const oldCanvasElement = document.getElementById("canvas"),
                canvasElement = document.createElement("canvas");

            if (oldCanvasElement !== null) {
                oldCanvasElement.parentElement.removeChild(oldCanvasElement);
            }

            canvasElement.id = "canvas";
            canvasElement.style.cssText = "display: none";
            document.body.appendChild(canvasElement);
            ChartJS.defaults.font.size = 22;

            return new Promise((resolve) => {
                setTimeout(() => {
                    const chartDiagram = new ChartJS(document.getElementById("canvas").getContext("2d"), {
                        type: "line",
                        data: data,
                        options: {
                            animation: {
                                onComplete: function () {
                                    resolve(chartDiagram.toBase64Image());
                                }
                            }
                        }
                    });
                }, 0);
            });
        },

        /**
         * Gets the data for chart.
         * @param {Object[]} items - Items from dashboard component.
         * @param {Object[]} templateStatsCategories - the template stats categories.
         * @param {String[]} selectedDistrictNames - the selected district name in id.
         * @param {String} areaColumnName - the area name.
         * @param {Object[]} categoryInChart - the category to be used in chart.
         * @param {Object[]} mappingJson - the mapping json.
         * @returns {Object} the data.
         */
        getChartData (items, templateStatsCategories, selectedDistrictNames, areaColumnName, categoryInChart, mappingJson) {
            const filteredMappingByCategories = mappingJson.filter(obj => {
                    return templateStatsCategories.includes(obj.value);
                }),
                groupedMapping = this.groupBy(filteredMappingByCategories, "group"),
                categoryData = [];

            if (!Array.isArray(mappingJson) || mappingJson.length === 0 || !Array.isArray(items) || !items.length || !Array.isArray(templateStatsCategories) || !templateStatsCategories.length || !Array.isArray(selectedDistrictNames) || !selectedDistrictNames.length) {
                return categoryData;
            }

            this.selectedCategoryInChart = [];

            categoryInChart.forEach(category => {
                if (!isObject(category)) {
                    return;
                }

                const labels = [],
                    data = [];

                Object.keys(category).forEach(key => {
                    if (!Object.prototype.hasOwnProperty.call(groupedMapping, key) || !templateStatsCategories.includes(category[key])) {
                        return;
                    }

                    if (templateStatsCategories.includes(category[key])) {
                        const innerObj = {};

                        innerObj[key] = category[key];
                        this.selectedCategoryInChart.push(innerObj);
                    }

                    const statFeature = items.find((item) => item.category === category[key]);

                    statFeature.years.reverse().forEach(year => {
                        const value = this.getTotal(statFeature, selectedDistrictNames, year, "jahr_");

                        labels.push(year);
                        data.push(value);
                    });
                });

                if (data.length) {
                    categoryData.push(
                        {
                            labels: labels,
                            datasets: [
                                {
                                    label: areaColumnName,
                                    data: data,
                                    borderColor: "rgba(25, 118, 210, 1)",
                                    borderWidth: 4
                                }
                            ]
                        }
                    );
                }
            });

            return categoryData;
        },

        /**
         * This is a alternative function of Object.groupBy.
         * Object.groupBy is not recognized before node v21.0.0, but we use currently v20.x.x,
         * Later if the node version is upddated, this function should be replaced of Object.groupBy.
         * @param {Object[]} obj - objects in array.
         * @param {String} key - the key to group by.
         * @returns {Object} the grouped by object.
         */
        groupBy (obj, key) {
            return obj.reduce((rv, x) => {
                (rv[x[key]] = rv[x[key]] || []).push(x);
                return rv;
            }, {});
        },

        /**
         * Get the given object as copy without reference of the given object.
         * @param {Object} obj The object.
         * @returns {Object} the object as copy.
         */
        getObjectCopyWithoutReference (obj) {
            return JSON.parse(JSON.stringify(obj));
        }
    }
};
</script>

<template lang="html">
    <div class="container">
        <div class="row">
            <h5 class="col col-md-12 bold-headline py-0">
                {{ $t("additional:modules.tools.cosi.templateManager.exportFromTemplate") }}
            </h5>
            <h5 class="text-primary col col-md-12 pt-1">
                {{ templateName }}
            </h5>
            <form
                v-if="!showProgressBar"
                class="col col-md-12 mb-3 mt-0"
            >
                <div class="export-title mb-3">
                    <label
                        for="form-title"
                        class="form-label mb-0"
                    >
                        {{ $t("additional:modules.tools.cosi.templateManager.label.title") }}
                    </label>
                    <input
                        id="form-title"
                        v-model="reportTitle"
                        type="text"
                        class="form-control"
                        maxlength="50"
                    >
                    <span
                        v-if="!isReportTitleValid"
                        class="hint"
                    >
                        {{ `${$t("additional:modules.tools.cosi.templateManager.errors.invalidReportTitle", {reportTitleMaxLength})}` }}
                    </span>
                </div>
                <div class="export-areas mb-3">
                    <label
                        for="form-selected-areas"
                        class="form-label mb-0"
                    >
                        {{ $t("additional:modules.tools.cosi.templateManager.label.selectedAreas") }}
                    </label>
                    <input
                        id="form-selected-areas"
                        v-model="selectedAreasName"
                        type="text"
                        class="form-control"
                        :maxlength="selectedAreasNameMaxLength"
                    >
                    <span
                        v-if="!isSelectedAreasNameValid"
                        class="hint"
                    >
                        {{ `${$t("additional:modules.tools.cosi.templateManager.errors.invalidSelectedAreasName", {selectedAreasNameMaxLength})}` }}
                    </span>
                </div>
                <div class="export-author mb-3">
                    <label
                        for="form-author"
                        class="form-label mb-0"
                    >
                        {{ $t("additional:modules.tools.cosi.templateManager.label.author") }}
                    </label>
                    <input
                        id="form-author"
                        v-model="author"
                        type="text"
                        class="form-control"
                        maxlength="35"
                    >
                    <span
                        v-if="!isAuthorValid"
                        class="hint"
                    >
                        {{ `${$t("additional:modules.tools.cosi.templateManager.errors.invalidAuthor", {authorMaxLength})}` }}
                    </span>
                </div>
                <fieldset>
                    <h5 class="bold-headline">
                        {{ $t("additional:modules.tools.cosi.templateManager.optionalComponents") }}
                    </h5>
                    <v-chip-group
                        v-model="selectedReportComponents"
                        column
                        multiple
                    >
                        <v-chip
                            v-for="tag in tagsOptionalComponents"
                            :key="tag"
                            :value="tag"
                            variant="outlined"
                            filter
                        >
                            {{ tag }}
                        </v-chip>
                    </v-chip-group>
                    <h6 class="bold-headline mt-3">
                        {{ $t("additional:modules.tools.cosi.templateManager.infrastructureData") }}
                    </h6>
                    <v-chip-group
                        v-model="selectedReportComponents"
                        column
                        multiple
                    >
                        <v-chip
                            v-for="feature in tagsInfrastructureData"
                            :key="feature"
                            :value="feature"
                            variant="outlined"
                            filter
                        >
                            {{ feature }}
                        </v-chip>
                    </v-chip-group>
                </fieldset>
                <div
                    class="row mt-3"
                >
                    <i
                        class="pe-0 bi bi-info-circle"
                    />
                    <p>
                        {{ $t("additional:modules.tools.cosi.templateManager.infrastructureHint") }}
                    </p>
                </div>
                <button
                    class="btn btn-outline lh-1 fs-5 mt-5"
                    @click.prevent="manageProgressBarView(true)"
                >
                    <i
                        class="bi bi-play-circle pe-2"
                    />
                    {{ $t("additional:modules.tools.cosi.templateManager.generateReport") }}
                </button>
            </form>
            <TemplateManagerExportProgressBar
                v-else
                :download-name="downloadName"
                :progress="progressValue"
                @closeProgressBar="manageProgressBarView(false)"
            />
        </div>
    </div>
</template>

<style scoped lang="scss">
    .v-chip--active {
        background-color: #DCE2F3;
    }
    .bold-headline {
        color: $dark_blue;
        font-family: $font_family_accent;
    }
    .btn-outline {
        border-color: $light_blue;
        color: $light_blue;
    }
    .btn-outline:hover {
            cursor: pointer;
            background-color: $light_blue;
            color: $white;
    }

    .hint {
        display: block;
        color: $danger;
        margin-top: 4px;
    }
</style>

<style lang="scss">
    .v-chip.v-size--default {
        font-size: 12px;
        height: 25px;
    }

    .v-chip .v-icon {
        font-size: 18px;
    }
</style>
