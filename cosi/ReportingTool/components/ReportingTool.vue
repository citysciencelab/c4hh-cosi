<script>
import dayjs from "dayjs";
import {mapGetters, mapActions} from "vuex";
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
        analysisCards: [],
        annexCards: [],
        infrastructureTableLimit: 10,
        infrastructureTableLimitEnabled: false,
        reportTitle: "",
        reportTitleMaxLength: 50,
        selectedAreasName: "",
        author: "",
        authorMaxLength: 35,
        freeHeadline: "",
        freeText: "",
        frontPageItems: [
            {
                alert: undefined,
                label: "Titelseite mit Kartenausschnitt",
                selected: true,
                value: "withoutNeuwerk"
            },
            {
                alert: "Achtung Achtung",
                label: "Titelseite mit Kartenausschnitt inkl. Neuwerk",
                selected: false,
                value: "withNeuwerk"
            },
            {
                alert: undefined,
                label: "Keine Titelseite",
                selected: false,
                value: "withoutFrontPage"
            }
        ],
        pdf: null,
        categoryInChart: [
            {"Bevölkerung": "Bevölkerung insgesamt"},
            {"Bevölkerung unter x Jahren": "Bevölkerung unter 18 Jahren"},
            {"Bevölkerung ab x Jahren": "Bevölkerung ab 65 Jahren"},
            {"Bevölkerung Migrationshintergrund": "Bevölkerung mit Migrationshintergrund"},
            {"Bevölkerung Migrationshintergrund": "Ausländer insgesamt"}
        ],
        reportLoader: false,
        selectedCategoryInChart: [],
        page: 1,
        isAllAreasSummariseChecked: false,
        statisticalYear: undefined,
        printReportView: false,
        selectedStatGroups: [],
        selectedInfrastructureData: [],
        statisticalDataCards: [],
        subjectDataCards: []
    }),
    computed: {
        ...mapGetters("Modules/Language", ["currentLocale"]),
        ...mapGetters("Modules/AccessibilityAnalysis", ["dataSets"]),
        ...mapGetters("Modules/Dashboard", ["items", "statsFeatureFilter"]),
        ...mapGetters("Modules/FeaturesList", ["featuresListItems"]),
        ...mapGetters("Modules/DistrictSelector", ["districtLevels", "selectedDistrictLevel", "selectedDistrictNames", "selectedFeatures", "initMapping"]),
        ...mapGetters("Modules/TemplateManager", ["reportName", "reportLayerIds", "reportCategories"]),
        ...mapGetters("Modules/ReportingTool", ["readmeUrl"]),
        ...mapGetters(["restServiceById", "visibleSubjectDataLayerConfigs"]),
        ...mapGetters("Maps", ["projection", "getCurrentExtent"]),

        /**
         * Gets the category mapping defined in the assets file including the current accessibility analyses.
         * @returns {Object} The category mapping object including the analyses as items.
         */
        categoryMapping () {
            const cM = categoryMapping;

            cM.analyses.find(cardType => cardType.key === "accessibilityAnalyses").items = this.dataSets;
            return cM;
        },

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
         * Gets the selected front page item.
         * @returns {Object} The selected front page item.
         */
        selectedFrontPageItem () {
            return this.frontPageItems.find(item => item.selected === true);
        }
    },
    watch: {
        featuresListItems: "preparesInfrastructureData",
        visibleSubjectDataLayerConfigs: "updateFeaturesList"
    },
    activated () {
        this.updateFeaturesList();
        this.preparesInfrastructureData();
        this.preparesStatGroups();
    },
    deactivated: () => undefined,
    methods: {
        ...mapActions("Modules/FeaturesList", ["updateFeaturesList"]),

        /**
         * Creates the report and calls the download function.
         * @returns {void}
         */
        async createReport () {
            this.reportLoader = true;
            this.pdf = new PDFMaker();
            this.pdf.resetDocContent();
            this.pdf.addHeader(this.reportTitle.trim());
            this.pdf.setAuthor(this.author.trim());
            await this.addOverViewPage(this.selectedFrontPageItem.value);
            this.addChapterStatisticalData(this.statisticalDataCards);
            await this.addChapterSubjectData(this.subjectDataCards);
            this.addChapterAnalysis(this.analysisCards);
            await this.addChapterAnnex(this.annexCards);
            this.pdf.download(this.downloadName);
            this.reportLoader = false;
        },

        /**
         * Adds the statistical data to the report.
         * @param {Object[]} cards - cards to be added in the chapter.
         * @returns {void}
         */
        addChapterStatisticalData (cards) {
            if (!cards.length) {
                this.addStatsToReport(this.items);
                return;
            }
            cards.forEach(card => {
                if (card.key === "statDataOverview") {
                    this.addStatsToReport(this.items);
                }
                else if (card.key === "statDataCharts") {
                    this.addDiagram();
                }
                else if (card.key === "heading") {
                    this.pdf.addChapter(card.value);
                }
                else if (card.key === "textArea") {
                    this.pdf.addParagraph(card.value);
                }
            });
        },

        /**
         * Adds the subject data to the report.
         * @param {Object[]} cards - cards to be added in the chapter.
         * @returns {void}
         */
        async addChapterSubjectData (cards) {
            if (!cards.length) {
                this.addTopicsToReport(this.featuresListItems);
                await this.addInfrastructureMapPageToReport(this.featuresListItems);
                return;
            }
            for (let i = 0; i < cards.length; i++) {
                const card = cards[i];

                if (card.key === "subjectDataTable") {
                    this.addTopicsToReport(this.featuresListItems);
                }
                else if (card.key === "subjectDataMap") {
                    await this.addInfrastructureMapPageToReport(this.featuresListItems);
                }
                else if (card.key === "heading") {
                    this.pdf.addChapter(card.value);
                }
                else if (card.key === "textArea") {
                    this.pdf.addParagraph(card.value);
                }
            }
        },

        /**
         * Adds the accessibility analysis to the report.
         * @param {Object[]} cards - cards to be added in the chapter.
         * @returns {void}
         */
        addChapterAnalysis (cards) {
            if (!cards.length) {
                this.addAccessibilityAnalysis(this.dataSets);
                return;
            }
            cards.forEach(card => {
                if (card.key === "accessibilityAnalyses") {
                    this.addAccessibilityAnalysis(card.items);
                }
                else if (card.key === "heading") {
                    this.pdf.addChapter(card.value);
                }
                else if (card.key === "textArea") {
                    this.pdf.addParagraph(card.value);
                }
            });
        },

        /**
         * Adds the annex to the report.
         * @param {Object[]} cards - cards to be added in the chapter.
         * @returns {void}
         */
        async addChapterAnnex (cards) {
            if (!cards.length) {
                await this.addReferencesToReport(this.items);
                return;
            }
            for (let i = 0; i < cards.length; i++) {
                const card = cards[i];

                if (card.key === "sources") {
                    await this.addReferencesToReport(card.items);
                }
                else if (card.key === "heading") {
                    this.pdf.addChapter(card.value);
                }
                else if (card.key === "textArea") {
                    this.pdf.addParagraph(card.value);
                }
            }
        },

        /**
         * Prepares the data of the accessibility analysis and adds it to the report.
         * @param {Object[]} items - Items from accessibility analysis component.
         * @returns {void}
         */
        addAccessibilityAnalysis (items) {
            this.pdf.addChapter("Analysen");

            items.forEach((analysis, idx) => {
                this.pdf.addHeadline("Erreichbarkeitsanalyse");
                this.pdf.addHeadline(analysis.inputs.title);
                if (typeof analysis.inputs.screenshot !== "undefined") {
                    this.pdf.addImageByUrl(analysis.inputs.screenshot, analysis.inputs.title + idx, {fit: [500, 500], alignment: "left"});
                }

                if (typeof analysis.inputs.screenshotLegend !== "undefined") {
                    this.pdf.addImageByUrl(analysis.inputs.screenshotLegend, idx.toString(), {fit: [300, 300], alignment: "left"});
                }
            });

        },

        /**
         * Prepares the statistical data and adds it to the report.
         * @param {Object[]} items - Items from dashboard component.
         * @returns {void}
         */
        addStatsToReport (items) {
            const itemGroups = items.map(item => item.category),
                filteredMappingByCategories = this.initMapping.filter(obj => {
                    return itemGroups.includes(obj.value);
                }),
                groupedMapping = Object.groupBy(filteredMappingByCategories, (obj) => obj.group);

            this.pdf.addChapter("Statistische Datenübersicht");
            this.pdf.addSubHeadline("Jahr: " + (this.statisticalYear || items[0].years[0]));

            this.selectedStatGroups.forEach((group) => {
                const columns = this.pdf.getColumns(["", this.areaColumnName, ...this.getStatCols(this.selectedDistrictLevel, this.selectedDistrictNames, [])]),
                    body = [columns];

                this.pdf.addHeadline(group);

                groupedMapping[group].forEach(mappingObject => {
                    const statFeature = items.find((item) => item.category === mappingObject.value),
                        lastYear = this.statisticalYear || statFeature.years[0],
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
                            this.pdf.addCell(row, value, alignment);
                        }
                        else if (index === 1) {
                            value = this.getTotal(statFeature, this.selectedDistrictLabels, lastYear, "jahr_");
                            this.pdf.addCell(row, value.toString(), alignment);
                            // toLocalString macht bei pdf make Probleme
                            // this.pdf.addCell(row, value.toLocaleString("de-DE", numberOptions), alignment);
                        }
                        else {
                            value = parseFloat(statFeature[col.text]["jahr_" + lastYear]) || "-";
                            this.pdf.addCell(row, value.toString(), alignment);
                            // toLocalString macht bei pdf make Probleme
                            // this.pdf.addCell(row, value.toLocaleString("de-DE", numberOptions), alignment);
                        }

                    });
                    body.push(row);
                });
                this.pdf.addTable(body, "*");
            });
        },
        /**
         * Builds and adds the "Quellenangaben" (data sources) section to the PDF report.
         * @param {Object[]} items - A list of report items, each expected to contain a `layerId` and optional `category`.
         * @returns {Promise<void>} Resolves once the section has been added to the PDF.
         */
        async addReferencesToReport (items) {
            const rows = [],
                headers = ["Datensatz", "datenverantwortliche Stelle", "Datenstand"],
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
            this.pdf.addLineBreak();

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
         * @param {String} frontPageValue - The selected front page option value.
         * @returns {void}
         */
        async addOverViewPage (frontPageValue) {
            if (frontPageValue === "withoutFrontPage") {
                return;
            }
            const imageName = "overviewMap",
                feature = this.selectedFeatures.length > 1 ? unionFeatures(this.selectedFeatures) : this.selectedFeatures[0],
                template = typeof feature !== "undefined" ?
                    this.getObjectCopyWithoutReference(baseProportionTemplate) :
                    this.getObjectCopyWithoutReference(baseFixedTemplateForHamburg),
                {downloadURL: overviewImageUrl, bbox} = await this.prepareImage(feature, template, this.projection.getCode(), imageName, mapfishServerConfig, "A4 Hochformat").catch(error => console.error(error)),
                headline = this.reportTitle ? this.reportTitle.trim() : "Übersichtskarte",
                {imageHeight, imageWidth} = frontPageValue === "withNeuwerk" ? {imageHeight: 400, imageWidth: 500} : {imageHeight: 500, imageWidth: 500},
                minimap = await this.addOverViewPageMinimap(template, bbox, "miniMap", "right"),
                overviewInfos = this.addDetailViewToOverviewPage();

            if (typeof overviewImageUrl !== "string") {
                return;
            }
            this.pdf.addChapter(headline);
            this.pdf.addLineBreak();
            this.pdf.addImageByUrl(overviewImageUrl, imageName, {fit: [imageWidth, imageHeight], alignment: "center"});
            this.pdf.addLineBreak();
            if (frontPageValue === "withNeuwerk") {
                this.pdf.addColumns([await this.addOverViewPageMinimap(template, [461000.14, 5973660.79, 468500.95, 5979481.62], "neuwerkMap", "left"), minimap]);
                this.pdf.addLineBreak();
                this.pdf.addColumns([overviewInfos]);
            }
            else {
                this.pdf.addColumns([overviewInfos, minimap]);
            }
            this.pdf.addLineBreak();
            this.pdf.addHeadline(this.freeHeadline);
            this.pdf.addParagraph(this.freeText);
            this.pdf.addLineBreak();
        },

        /**
         * Adds a minimap to the overview page.
         * @param {Object} template - A template for mapfish.
         * @param {Number[]} bbox - A bbox to use for the minimap as feature coordinates.
         * @param {String} imageName - The image name.
         * @param {String} alignment - The alignment of the image in the doc.
         * @returns {Promise<Object>} The image object for pdfmake.
         */
        async addOverViewPageMinimap (template, bbox, imageName, alignment) {
            template.baseLayer.map.proportion = 0.25;
            const {downloadURL: minimapImageUrl} = await this.prepareImage(
                new Feature({geometry: fromExtent(bbox)}),
                template,
                this.projection.getCode(),
                imageName,
                mapfishServerConfig,
                "rectangleTemplate"
            ).catch(error => console.error(error));

            this.pdf.addImageInstance(minimapImageUrl, imageName);
            return {image: imageName, fit: [300, 150], alignment};
        },

        /**
         * Adds infrastructure map to the page report.
         * @returns {void}
         */
        async addInfrastructureMapPageToReport (items) {
            const imageName = "infrastructureMap",
                feature = this.selectedFeatures.length > 1 ? unionFeatures(this.selectedFeatures) : this.selectedFeatures[0],
                template = typeof feature !== "undefined" ?
                    this.getObjectCopyWithoutReference(baseProportionTemplate) :
                    this.getObjectCopyWithoutReference(baseFixedTemplateForHamburg),
                reportLayerIds = items.map(item => item.layerId);

            let imageOptions = {};

            reportLayerIds.forEach(layerId => {
                if (!template.baseLayer.map.layerIds.includes(layerId)) {
                    template.baseLayer.map.layerIds.unshift(layerId);
                }
            });
            template.baseLayer.map.proportion = 0.99;
            imageOptions = await this.prepareImage(feature, template, this.projection.getCode(), imageName, mapfishServerConfig, "A4 Hochformat", 1).catch(error => console.error(error));

            if (typeof imageOptions.downloadURL !== "string") {
                return;
            }
            this.pdf.addChapter("Darstellung der Infrastrukturdaten");
            this.pdf.addLineBreak();
            this.pdf.addImageByUrl(imageOptions.downloadURL, imageName, {fit: [500, 500], alignment: "center"});
            this.pdf.addLineBreak();
        },

        /**
         * Adds a detail box.
         * @returns {Object} The detail box for pdfmake.
         */
        addDetailViewToOverviewPage () {
            const text = [],
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

            return {
                layout: "noBorders",
                table: {
                    headerRows: 1,
                    widths: ["auto"],
                    body: tableBody
                }
            };
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
         * @param {String} layoutName The layout name.
         * @param {Number} mapScaleFactor The scale factor for the map.
         * @returns {Promise<Object>} a promise which resolves an object {downloadURL, bbox}.
         */
        prepareImage (feature, baseLayer, projectionCode, imageName, serverConfig, layoutName, mapScaleFactor) {
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
                    }, undefined,
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
            const groupedTopics = Object.groupBy(topics, (topic) => topic.layerName);

            this.pdf.addChapter("Infrastrukturdaten");
            this.pdf.addLineBreak();
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
            const selectedFrontPageItem = this.frontPageItems.find(item => item.selected === true);

            selectedFrontPageItem.selected = false;
            frontPagelabel.selected = true;
        },
        /**
         * Prepares the statistical data depending on filtered data.
         * @returns {void}
         */
        preparesStatGroups () {
            const allStatGroups = Object.groupBy(this.initMapping, (obj) => obj.group);

            if (this.statsFeatureFilter.length) {
                const filtered = this.initMapping.filter(obj => {
                        return this.statsFeatureFilter.includes(obj.value);
                    }),
                    groups = Object.groupBy(filtered, (obj) => obj.group);

                this.selectedStatGroups = Object.keys(groups);
            }
            else {
                this.selectedStatGroups = Object.keys(allStatGroups);
            }
        },
        /**
         * Prepares the geospatial data.
         * @returns {void}
         */
        preparesInfrastructureData () {
            const topicName = Object.groupBy(this.featuresListItems, (topic) => topic.layerName);

            this.selectedInfrastructureData = Object.keys(topicName);
        },

        /**
         * Sets the statistical year.
         * @param {Number} year - The statistical year.
         * @returns {void}
         */
        setStatisticalYear (year) {
            this.statisticalYear = year;
        },

        /**
         * Updates the order of statistical data.
         * @param {Object[]} groups The groups in the correct order.
         * @returns {void}
         */
        updateStatGroups (groups) {
            this.selectedStatGroups = groups;
        },
        /**
         * Updates the order of the geospatial data.
         * @param {Object[]} data The layer names in the correct order.
         * @returns {void}
         */
        updateInfratsructureData (data) {
            this.selectedInfrastructureData = data;
        },

        /**
         * Sets the analysis cards.
         * @param {Object[]} cards - The analysis cards.
         * @returns {void}
         */
        setAnalysisCards (cards) {
            this.analysisCards = cards;
        },

        /**
         * Sets the annex cards.
         * @param {Object[]} cards - The annex cards.
         * @returns {void}
         */
        setAnnexCards (cards) {
            this.annexCards = cards;
        },

        /**
         * Sets the statistical data cards.
         * @param {Object[]} cards - The statistical data cards.
         * @returns {void}
         */
        setStatisticalDataCards (cards) {
            this.statisticalDataCards = cards;
        },

        /**
         * Sets the subject data cards.
         * @param {Object[]} cards - The subject data cards.
         * @returns {void}
         */
        setSubjectDataCards (cards) {
            this.subjectDataCards = cards;
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
                <v-stepper-window class="ms-0 pe-0">
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
                                v-if="selectedFrontPageItem.alert"
                                :text="selectedFrontPageItem.alert"
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
                            :groups="selectedStatGroups"
                            @set-cards="setStatisticalDataCards"
                            @set-order-of-cards="updateStatGroups"
                            @update:statistical-year="setStatisticalYear"
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
                                :groups="selectedInfrastructureData"
                                @set-cards="setSubjectDataCards"
                                @set-order-of-cards="updateInfratsructureData"
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
                            @set-cards="setAnalysisCards"
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
                            @set-cards="setAnnexCards"
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
                            :spinner-trigger="reportLoader"
                            :interaction="() => page != 1 ? props.onClick() : createReport()"
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
            <p>
                {{ $t("additional:modules.cosi.reportingTool.infoText") }}
            </p>
            <div class="mt-5 d-flex flex-column align-items-center justify-content-center">
                <FlatButton
                    id="download-report"
                    icon="bi bi-cloud-arrow-down"
                    type="button"
                    :aria-label="$t('additional:modules.cosi.reportingTool.button.downloadReport')"
                    :interaction="() => createReport()"
                    :spinner-trigger="reportLoader"
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
