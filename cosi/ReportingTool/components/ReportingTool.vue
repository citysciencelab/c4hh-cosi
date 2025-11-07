<script>
import dayjs from "dayjs";
import {mapGetters} from "vuex";
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
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList";
import getCswRecordById from "@shared/js/api/getCswRecordById.js";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import ToolInfo from "../../shared/modules/toolInfo/components/ToolInfo.vue";
import TagGroup from "../../shared/modules/tags/components/TagGroup.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import AlertMessage from "../../shared/modules/alerts/components/AlertMessage.vue";
import categoryMapping from "../assets/categoryMapping.json";
import ReportingToolStepItem from "./ReportingToolStepItem.vue";
import {VStepper, VStepperActions, VStepperItem, VStepperHeader, VStepperWindow, VStepperWindowItem} from "vuetify/components/VStepper";
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";

export default {
    name: "ReportingTool",
    components: {
        AlertMessage,
        FlatButton,
        InputText,
        ReportingToolStepItem,
        SwitchInput,
        TagGroup,
        ToolInfo,
        VStepper,
        VStepperActions,
        VStepperItem,
        VStepperHeader,
        VStepperWindow,
        VStepperWindowItem
    },
    data: () => ({
        infrastructureTableLimit: 10,
        infrastructureTableLimitEnabled: false,
        showProgressBar: false,
        percentage: 50,
        reportTitle: "",
        reportTitleMaxLength: 50,
        selectedAreasName: "",
        author: "",
        authorMaxLength: 35,
        freeHeadline: "",
        freeText: "",
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
        selectedCategoryInChart: [],
        page: 1,
        isAllAreasSummariseChecked: false,
        frontPageContent: [
            "Titelseite mit Kartenausschnitt",
            "Titelseite mit Kartenausschnitt inkl. Neuwerk",
            "Keine Titelseite"
        ],
        years: [
            "2024",
            "2023",
            "2022",
            "2021"
        ],
        selectedYear: [],
        printReportView: false,
        categoryMapping: categoryMapping
    }),
    computed: {
        ...mapGetters("Modules/Language", ["currentLocale"]),
        ...mapGetters("Modules/AccessibilityAnalysis", ["dataSets"]),
        ...mapGetters("Modules/Dashboard", ["items"]),
        ...mapGetters("Modules/FeaturesList", ["featuresListItems"]),
        ...mapGetters("Modules/DistrictSelector", ["districtLevels", "selectedDistrictLevel", "selectedDistrictNames", "selectedFeatures", "initMapping"]),
        ...mapGetters("Modules/TemplateManager", ["reportName", "reportLayerIds", "reportCategories"]),
        ...mapGetters("Modules/ReportingTool", ["readmeUrl"]),
        ...mapGetters(["restServiceById"]),
        ...mapGetters("Maps", ["projection", "getCurrentExtent"]),

        /**
         * Generates a file name for the report.
         * @returns {String} The file name.
         */
        downloadName () {
            const date = dayjs(new Date()).format("YYYY-MM-DD"),
                fileName = this.reportTitle ? this.reportTitle : this.reportName,
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
         * Checks if the author is valid.
         * @returns {Boolean} True if valid.
         */
        isAuthorValid () {
            return this.author.length < this.authorMaxLength;
        },
        /**
         * Checks if there is no selectable data to be included in the report.
         * @returns {Boolean} True if there is no selectable data.
         */
        noDataView () {
            return !this.selectedDistrictNames?.length
                && !this.dataSets?.length
                && !this.featuresListItems?.length;
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
        },
        /**
         * Gets an array of front page labels with their corresponding selection status.
         * Each object in the returned array contains:
         * - `label`: The label of the district level.
         * - `selected`: A boolean indicating whether the district level is currently selected.
         * @returns {Object[]} An array of objects representing front page item labels.
         */
        frontPageItems () {
            return this.frontPageContent.map(label => ({
                label: label,
                selected: this.selectedReportComponents.includes(label)
            }));
        }
    },
    mounted () {
        this.selectedReportComponents = [this.frontPageContent[0]];
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
                {func: () => this.addReferencesToReport(this.items)},
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
                    return this.reportCategories.includes(obj.value);
                }),
                groupedMapping = Object.groupBy(filteredMappingByCategories, (obj) => obj.group);

            this.pdf.addChapter("Statistische Datenübersicht");

            Object.keys(groupedMapping).forEach((group) => {
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
                            value = statFeature.category;
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
                this.pdf.addTable(body, 150);
            });
        },
        /**
         * Builds and adds the "Quellenangaben" (data sources) section to the PDF report.
         * @param {Object[]} items - A list of report items, each expected to contain a `layerId` and optional `category`.
         * @returns {Promise<void>} Resolves once the section has been added to the PDF.
         */
        async addReferencesToReport (items) {
            if (!this.controlsReportComponent("Quellenangaben")) {
                return;
            }

            const rows = [],
                headers = ["Datebsatz", "datenverantwortliche Stelle", "Datenstand"],
                list = Array.isArray(items) ? items : [],
                unified = [],
                seenCategories = new Set(),
                body = [],
                bodyWithHeader = [];

            for (const item of list) {
                const layerId = item?.layerId,
                    meta = layerId ? await this.getMetaForLayerId(layerId) : undefined;

                if (!meta) {
                    continue;
                }

                rows.push({
                    category: item?.category || "-",
                    providerName: meta?.providerName || "-",
                    date: meta?.date || "-"
                });
            }

            for (const row of rows) {
                if (!seenCategories.has(row.category)) {
                    seenCategories.add(row.category);
                    unified.push(row);
                }
            }

            this.pdf.addChapter("Quellenangaben");

            if (!unified.length) {
                this.pdf.addParagraph("Keine Quellenangaben verfügbar.");
                return;
            }

            body.push(...unified.map(r => [r.category, r.providerName, r.date]));
            bodyWithHeader.push(headers, ...body);

            this.pdf.addTable(bodyWithHeader, 180);
        },
        /**
         * Retrieves and normalizes metadata for a specific layer ID.
         * @param {string} layerId - The ID of the layer whose metadata should be retrieved.
         * @returns {Promise<{providerName: string, date: string}>}
         * Returns an object containing the provider’s name and the formatted date (MM/YYYY).
         * If metadata cannot be retrieved, returns placeholders with "-".
         */
        async getMetaForLayerId (layerId) {
            if (!layerId) {
                return {providerName: "-", date: "-"};
            }

            const raw = rawLayerList?.getLayerWhere?.({id: layerId}),
                dataset = raw?.datasets?.[0],
                cswUrl = dataset?.csw_url,
                mdId = dataset?.md_id;

            if (cswUrl && mdId) {
                try {
                    const metadata = await getCswRecordById.getRecordById(cswUrl, mdId),
                        provider = metadata?.getPublisher() || metadata?.getOwner(),
                        providerName = provider?.name || "-",
                        date = this.formatAsOf(metadata?.getRevisionDate());

                    return {providerName, date};
                }
                catch (err) {
                    return {providerName: "-", date: "-"};
                }
            }

            return {providerName: "-", date: "-"};
        },
        /**
         * Formats a date value into "MM/YYYY".
         * Accepts various input formats such as "YYYY-MM-DD", "DD.MM.YYYY", or Date objects.
         * If the date cannot be parsed, returns "-".
         * @param {string|Date} value - The input date value to format.
         * @returns {string} The formatted month/year string (e.g., "02/2024") or "-" if invalid.
         */
        formatAsOf (value) {
            if (!value) {
                return "-";
            }

            let d = dayjs(value, ["YYYY-MM-DD", "DD.MM.YYYY", "YYYY/MM/DD"], true);

            if (!d.isValid()) {
                d = dayjs(value);
            }

            if (!d.isValid()) {
                return "-";
            }

            return d.format("MM/YYYY");
        },
        /**
         * Adds the overview page to the report.
         * @returns {void}
         */
        async addOverViewPageToReport () {
            if (!this.controlsReportComponent("Titelseite mit Kartenausschnitt")) {
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

            this.reportLayerIds.forEach(layerId => {
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
                    body = [columns],
                    columnAttirbutes = ["type", "name", "address"];

                this.pdf.addHeadline(group);
                this.pdf.addParagraph(`Anzahl der ${group} im ausgewählten Gebiet: ${groupedTopics[group].length}`);

                if (topicLength <= this.infrastructureTableLimit || !this.infrastructureTableLimitEnabled) {
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

            const data = this.getChartData(this.items, this.reportCategories, this.selectedDistrictNames, this.areaColumnName, this.categoryInChart, this.initMapping),
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
         * @param {Object[]} reportCategories - the report stats categories.
         * @param {String[]} selectedDistrictNames - the selected district name in id.
         * @param {String} areaColumnName - the area name.
         * @param {Object[]} categoryInChart - the category to be used in chart.
         * @param {Object[]} mappingJson - the mapping json.
         * @returns {Object} the data.
         */
        getChartData (items, reportCategories, selectedDistrictNames, areaColumnName, categoryInChart, mappingJson) {
            const filteredMappingByCategories = mappingJson.filter(obj => {
                    return reportCategories.includes(obj.value);
                }),
                groupedMapping = this.groupBy(filteredMappingByCategories, "group"),
                categoryData = [];

            if (!Array.isArray(mappingJson) || mappingJson.length === 0 || !Array.isArray(items) || !items.length || !Array.isArray(reportCategories) || !reportCategories.length || !Array.isArray(selectedDistrictNames) || !selectedDistrictNames.length) {
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
                    if (!Object.prototype.hasOwnProperty.call(groupedMapping, key) || !reportCategories.includes(category[key])) {
                        return;
                    }

                    if (reportCategories.includes(category[key])) {
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
        },

        /**
        * Goes back to the previous step
        * @returns {void}
        */
        stepperPrev () {
            this.$refs.stepperActions.prev();
        },

        /**
        * Goes to the next step
        * @returns {void}
        */
        stepperNext () {
            this.$refs.stepperActions.next();
        },

        /**
        * Updates the page number during the steps.
        * @param {Object} event The event.
        * @returns {void}
        */
        valueChanged (event) {
            this.page = event;
        },

        /**
         * Updates the selected report components with the selected front page items.
         * @param {Object} frontPagelabel - The labels object containing information about front page items.
         * @returns {void}
         */
        updateFrontPageItems (frontPagelabel) {
            if (typeof frontPagelabel === "undefined") {
                return;
            }

            this.selectedReportComponents.forEach(v => {
                this.frontPageContent.forEach(content => {
                    if (v === content) {
                        const index = this.selectedReportComponents.indexOf(v);

                        this.selectedReportComponents.splice(index, 1);
                    }
                });
            });

            this.selectedReportComponents.push(frontPagelabel.label);
        }
    }
};
</script>

<template lang="html">
    <div class="container">
        <ToolInfo
            :url="readmeUrl"
            :locale="currentLocale"
            summary="Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum."
        />
        <div v-if="!printReportView && !noDataView">
            <h5>
                {{ $t("additional:modules.cosi.reportingTool.createReport") }}
            </h5>
            <v-stepper
                ref="stepperActions"
                class="mt-3"
                color="#3C5F94"
                non-linear
                alt-labels
                @update:modelValue="valueChanged($event)"
            >
                <v-stepper-header>
                    <v-stepper-item
                        value="1"
                        editable
                    >
                        {{ $t("additional:modules.cosi.reportingTool.generalSettings") }}
                    </v-stepper-item>

                    <v-divider />

                    <v-stepper-item
                        value="2"
                        editable
                    >
                        {{ $t("additional:modules.cosi.reportingTool.statisticalData") }}
                    </v-stepper-item>

                    <v-divider />

                    <v-stepper-item
                        value="3"
                        editable
                    >
                        {{ $t("additional:modules.cosi.reportingTool.subjectData") }}
                    </v-stepper-item>

                    <v-divider />

                    <v-stepper-item
                        value="4"
                        editable
                    >
                        {{ $t("additional:modules.cosi.reportingTool.analyses") }}
                    </v-stepper-item>

                    <v-divider />

                    <v-stepper-item
                        value="5"
                        editable
                    >
                        {{ $t("additional:modules.cosi.reportingTool.annex") }}
                    </v-stepper-item>
                </v-stepper-header>
                <v-stepper-window>
                    <v-stepper-window-item
                        value="1"
                    >
                        <h5>
                            {{ "1. " + $t("additional:modules.cosi.reportingTool.generalReportInformation") }}
                        </h5>
                        <form>
                            <InputText
                                id="report-title"
                                v-model="reportTitle"
                                :label="$t('additional:modules.cosi.reportingTool.label.title')"
                                :placeholder="$t('additional:modules.cosi.reportingTool.label.title')"
                                max-length="50"
                            />
                            <InputText
                                id="report-author"
                                v-model="author"
                                :label="$t('additional:modules.cosi.reportingTool.label.author')"
                                :placeholder="$t('additional:modules.cosi.reportingTool.label.author')"
                                max-length="35"
                            />
                            <TagGroup
                                class="mb-3"
                                :items="frontPageItems"
                                :label="$t('additional:modules.cosi.reportingTool.label.frontPage')"
                                @update:selected-items="updateFrontPageItems"
                            />
                            <AlertMessage
                                v-if="selectedReportComponents.includes('Titelseite mit Kartenausschnitt inkl. Neuwerk')"
                                :text="$t('additional:modules.cosi.reportingTool.alert.infoFrontPage')"
                                type="info"
                            />
                            <h6 class="mt-4 mb-3">
                                {{ $t("additional:modules.cosi.reportingTool.addAdditionalInformation") }}
                            </h6>
                            <InputText
                                id="freetext-headline"
                                v-model="freeHeadline"
                                :label="$t('additional:modules.cosi.reportingTool.label.headline')"
                                :placeholder="$t('additional:modules.cosi.reportingTool.label.headline')"
                                max-length="50"
                            />
                            <InputText
                                id="freetext-text"
                                v-model="freeText"
                                :label="$t('additional:modules.cosi.reportingTool.label.freetext')"
                                :placeholder="$t('additional:modules.cosi.reportingTool.label.freetext')"
                                html-type="textarea"
                                max-length="1000"
                            />
                        </form>
                    </v-stepper-window-item>
                    <v-stepper-window-item value="2">
                        <ReportingToolStepItem
                            v-if="selectedDistrictNames?.length"
                            :card-mapping="categoryMapping?.statData"
                            :title="'2. ' + $t('additional:modules.cosi.reportingTool.statisticalData')"
                            :nothing-selected-text="$t('additional:modules.cosi.reportingTool.alert.noStatisticalDataSelected')"
                        />
                        <AlertMessage
                            v-else
                            :text="$t('additional:modules.cosi.reportingTool.alert.noStatisticalData')"
                            type="noData"
                        />
                    </v-stepper-window-item>
                    <v-stepper-window-item
                        value="3"
                    >
                        <template
                            v-if="featuresListItems?.length"
                        >
                            <SwitchInput
                                id="reporting-tool-infrastructure-limit-switch"
                                class="mb-3"
                                :label="$t('additional:modules.cosi.reportingTool.label.infrastructureTableLimitEnabled')"
                                :aria="$t('additional:modules.cosi.reportingTool.label.infrastructureTableLimitEnabled')"
                                :checked="infrastructureTableLimitEnabled"
                                :interaction="evt => infrastructureTableLimitEnabled = evt.target.checked"
                            />
                            <InputText
                                v-if="infrastructureTableLimitEnabled"
                                id="infrastructure-table-limit-input"
                                v-model="infrastructureTableLimit"
                                type="number"
                                class="mb-3"
                                :label="$t('additional:modules.cosi.reportingTool.label.infrastructureTableLimit')"
                                :placeholder="$t('additional:modules.cosi.reportingTool.label.infrastructureTableLimit')"
                            />
                            <ReportingToolStepItem
                                :card-mapping="categoryMapping?.subjectData"
                                :title="'3. ' + $t('additional:modules.cosi.reportingTool.subjectData')"
                                :nothing-selected-text="$t('additional:modules.cosi.reportingTool.alert.noSubjectDataSelected')"
                            />
                        </template>
                        <AlertMessage
                            v-else
                            :text="$t('additional:modules.cosi.reportingTool.alert.noSubjectData')"
                            type="noData"
                        />
                    </v-stepper-window-item>
                    <v-stepper-window-item
                        value="4"
                    >
                        <ReportingToolStepItem
                            v-if="dataSets?.length"
                            :card-mapping="categoryMapping?.analyses"
                            :title="'4. ' + $t('additional:modules.cosi.reportingTool.analyses')"
                            :nothing-selected-text="$t('additional:modules.cosi.reportingTool.alert.noAnalysesSelected')"
                        />
                        <AlertMessage
                            v-else
                            :text="$t('additional:modules.cosi.reportingTool.alert.noAnalyses')"
                            type="noData"
                        />
                    </v-stepper-window-item>
                    <v-stepper-window-item
                        value="5"
                    >
                        <ReportingToolStepItem
                            :card-mapping="categoryMapping?.annex"
                            :title="'5. ' + $t('additional:modules.cosi.reportingTool.annex')"
                        />
                    </v-stepper-window-item>
                </v-stepper-window>
                <v-stepper-actions
                    :class="page == 1 ? 'd-flex flex-column-reverse align-items-center justify-content-center' : ''"
                    @click:next="stepperNext"
                    @click:prev="stepperPrev"
                >
                    <template #prev="{ props }">
                        <FlatButton
                            id="confirmButtonFirst"
                            :icon="page != 1 ? 'bi-arrow-left' : 'bi bi-printer'"
                            type="button"
                            :aria-label="page != 1 ? $t('additional:modules.cosi.reportingTool.button.back') : $t('additional:modules.cosi.reportingTool.button.printNow')"
                            :text="page != 1 ? $t('additional:modules.cosi.reportingTool.button.back') : $t('additional:modules.cosi.reportingTool.button.printNow')"
                            :interaction="() => page != 1 ? props.onClick() : []"
                        />
                    </template>
                    <template #next="{ props }">
                        <FlatButton
                            id="confirmButton"
                            :icon="page != 5 ? 'bi-arrow-right' : 'bi bi-play'"
                            type="button"
                            :aria-label="page != 5 ? $t('additional:modules.cosi.reportingTool.button.confirmAndNext') : $t('additional:modules.cosi.reportingTool.button.generateReport')"
                            :text="page != 5 ? $t('additional:modules.cosi.reportingTool.button.confirmAndNext') : $t('additional:modules.cosi.reportingTool.button.generateReport')"
                            :interaction="() => page != 5 ? props.onClick() : printReportView = true"
                        />
                    </template>
                </v-stepper-actions>
            </v-stepper>
        </div>
        <AlertMessage
            v-else-if="noDataView"
            :text="$t('additional:modules.cosi.reportingTool.alert.noDataAlert')"
            type="noData"
        />
        <div v-else>
            <h5>
                {{ $t("additional:modules.cosi.reportingTool.createReport") }}
            </h5>
            <p>
                {{ $t("additional:modules.cosi.reportingTool.infoText") }}
            </p>
            <div class="mt-5 d-flex flex-column align-items-center justify-content-center">
                <FlatButton
                    id="download-report"
                    icon="bi bi-cloud-arrow-down"
                    type="button"
                    :aria-label="$t('additional:modules.cosi.reportingTool.button.downloadReport')"
                    :text="$t('additional:modules.cosi.reportingTool.button.downloadReport')"
                />
                <FlatButton
                    id="back-report"
                    icon="bi bi-pencil"
                    type="button"
                    :aria-label="$t('additional:modules.cosi.reportingTool.button.backToEditView')"
                    :text="$t('additional:modules.cosi.reportingTool.button.backToEditView')"
                />
                <FlatButton
                    id="new-report"
                    icon="bi bi-arrow-clockwise"
                    type="button"
                    :aria-label="$t('additional:modules.cosi.reportingTool.button.createNewReport')"
                    :text="$t('additional:modules.cosi.reportingTool.button.createNewReport')"
                    :interaction="() => printReportView = false"
                />
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    .v-stepper-header, .v-sheet {
        box-shadow: none;
    }
    .v-stepper-header {
        --stepper-item-avatar-background: $secondary;
    }
    .v-stepper-item--selected .v-stepper-item__avatar.v-avatar, .v-stepper-item--complete .v-stepper-item__avatar.v-avatar {
        background: $secondary;
    }
    .v-stepper-item--selected {
        color: $secondary;
        font-family: $font_family_accent;
    }
    .v-stepper--alt-labels .v-stepper-item {
        flex-basis: 150px;
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
