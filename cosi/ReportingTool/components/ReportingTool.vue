<script>
import AlertMessage from "../../shared/modules/alerts/components/AlertMessage.vue";
import axios from "axios";
import {computed, markRaw} from "vue";
import dayjs from "dayjs";
import {mapGetters, mapActions, mapMutations} from "vuex";
import PDFMaker from "../js/createPdf";
import {getTotal, getCulmulativeTotal} from "../../Dashboard/utils/operations";
import {getCenter as getCenterOfExtent} from "ol/extent";
import {startPrintProcess} from "../../../shared/js/mapfishUtils/startPrintProcess";
import {unionFeatures} from "../../../valuationPrint/js/unionFeatures";
import {baseProportionTemplate, baseFixedTemplateForHamburg, mapfishServerConfig} from "../js/mapfishUtils";
import {Chart as ChartJS} from "chart.js";
import isObject from "@shared/js/utils/isObject";
import {fromExtent} from "ol/geom/Polygon";
import Feature from "ol/Feature.js";
import getBasicInfo from "../js/getBasicInfo";
import layerCollection from "@core/layers/js/layerCollection.js";
import MapfishDialog from "../../../shared/js/mapfishUtils/mapfishDialog";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList";
import getCswRecordById from "@shared/js/api/getCswRecordById.js";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import ToolInfo from "../../shared/modules/toolInfo/components/ToolInfo.vue";
import TagGroup from "../../shared/modules/tags/components/TagGroup.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import categoryMapping from "../assets/categoryMapping.json";
import ReportingToolStepItem from "./ReportingToolStepItem.vue";
import {VDivider} from "vuetify/components/VDivider";
import {VStepper, VStepperActions, VStepperItem, VStepperHeader, VStepperWindow, VStepperWindowItem} from "vuetify/components/VStepper";
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";
import {uniqueId} from "@shared/js/utils/uniqueId";

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
        VDivider,
        VStepper,
        VStepperActions,
        VStepperItem,
        VStepperHeader,
        VStepperWindow,
        VStepperWindowItem
    },
    provide () {
        return {
            selectedLevels: computed({
                /**
                 * Gets the selected district levels for the report.
                 * @returns {String[]} The selected district levels.
                 */
                get: () => this.selectedLevels,
                /*
                 * Sets the selected district levels for the report.
                 * @param {String[]} value - The new selected district levels.
                 * @return {void}
                 */
                set: (value) => {
                    this.selectedLevels = value;
                }
            }),
            shouldAreasSummedUp: computed({
                /**
                 * Gets whether areas should be summed up.
                 * @returns {Boolean} True if areas should be summed up.
                 */
                get: () => this.shouldAreasSummedUp,
                /**
                 * Sets whether areas should be summed up.
                 * @param {Boolean} value - The new value.
                 */
                set: (value) => {
                    this.shouldAreasSummedUp = value;
                }
            })
        };
    },
    data: () => ({
        analysisCards: undefined,
        annexCards: undefined,
        author: "",
        authorMaxLength: 35,
        reportTitle: "",
        reportTitleMaxLength: 50,
        freeHeadline: "",
        freeText: "",
        frontPageOptions: [
            {selected: true, value: "withoutNeuwerk"},
            {selected: false, value: "withNeuwerk"},
            {selected: false, value: "withoutFrontPage"}
        ],
        pdf: null,
        categoryInChart: [
            {"Bevölkerung": "Bevölkerung insgesamt"},
            {"Bevölkerung bis unter 26 Jahre": "Bevölkerung unter 18 Jahre"},
            {"Bevölkerung ab 56 Jahre": "Bevölkerung 65 Jahre und älter"},
            {"Bevölkerung Migrationshintergrund": "Bevölkerung mit Migrationshintergrund"},
            {"Bevölkerung Migrationshintergrund": "Ausländische Bevölkerung"}
        ],
        infrastructureTableLimit: 10,
        infrastructureTableLimitEnabled: false,
        selectedCategoryInChart: [],
        page: 1,
        printReportView: false,
        selectedLevels: undefined,
        selectedInfrastructureData: [],
        selectedStatGroups: [],
        shouldAreasSummedUp: true,
        statisticalDataCards: [],
        statisticalYear: undefined,
        subjectDataCards: [],
        stepperRerenderKey: 0,
        selectedAreasName: "",
        transportTypeMapping: {
            "driving-car": "Auto",
            "foot-walking": "Gehen",
            "cycling-regular": "Fahrrad",
            "wheelchair": "Rollstuhl"
        },
        modeMapping: {
            "point": "Referenzpunkten",
            "facility": "Einrichtungen",
            "route": "Route"
        },
        showError: false
    }),
    computed: {
        ...mapGetters("Modules/Language", ["currentLocale"]),
        ...mapGetters("Modules/Legend", ["legends"]),
        ...mapGetters("Modules/AccessibilityAnalysis", ["dataSets"]),
        ...mapGetters("Modules/Dashboard", ["items", "statsFeatureFilter"]),
        ...mapGetters("Modules/FeaturesList", ["featuresListItems"]),
        ...mapGetters("Modules/DistrictSelector", ["districtLevels", "selectedDistrictLevel", "selectedDistrictNames", "selectedFeatures", "initMapping"]),
        ...mapGetters("Modules/TemplateManager", ["reportName"]),
        ...mapGetters("Modules/ReportingTool", ["infrastructureTableLimitConfig", "infrastructureTableLimitEnabledConfig", "readmeUrl", "reportLoader"]),
        ...mapGetters(["restServiceById", "visibleSubjectDataLayerConfigs"]),
        ...mapGetters("Maps", ["projection", "getCurrentExtent"]),

        frontPageItems () {
            return this.mapFrontPageOptions(this.frontPageOptions);
        },
        frontPageItemsForEmptySelection () {
            return this.mapFrontPageOptions(this.frontPageItemsForEmptyDistrictSelection);
        },
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
         * Gets frontpageitems with required selection status for the case that no districts are selected.
         * @returns {Object[]} Array of frontpageitems.
         */
        frontPageItemsForEmptyDistrictSelection () {
            return this.frontPageOptions.map(item => ({
                ...item,
                selected: item.value === "withoutFrontPage"
            }));
        },
        /**
         * Gets the column name for the export based on entered selected areas name.
         * @returns {String} the column name to use for the selected area.
         */
        areaColumnName () {
            return this.selectedAreasName ? this.selectedAreasName.trim() : this.$t("additional:modules.cosi.reportingTool.label.selectedAreasName");
        },

        /**
         * Checks if the report title is valid.
         * @returns {Boolean} True if valid.
         */
        isReportTitleValid () {
            return this.reportTitle.length < this.reportTitleMaxLength;
        },

        /**
         * Gets the initial analysis cards.
         * @returns {Object[]} the initial analysis cards.
         */
        initialAnalysisCards () {
            if (!Array.isArray(this.dataSets) || !this.dataSets.length) {
                return [];
            }

            const cards = [],
                cardType = this.categoryMapping.analyses.find(al => al.key === "accessibilityAnalyses");

            cardType.items.forEach(item => {
                cards.push({...cardType, name: item.inputs.title, id: uniqueId("reporting-tool-card-")});
            });

            return cards;
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
         * Checks whether subject data are selected at all.
         * @returns {Boolean} True if there are subject data features selected.
         */
        hasSubjectDataSelected () {
            return Array.isArray(this.featuresListItems) && this.featuresListItems.length > 0;
        },

        /**
         * Determines whether the subject data map is effectively selected and active.
         * @returns {boolean} True if the subject data map is selected and active.
         */
        isSubjectDataMapSelected () {
            return Array.isArray(this.subjectDataCards)
                && this.subjectDataCards.some(card => card?.key === "subjectDataMap"
                    && card?.active !== false
                    && card?.value !== false
                );
        },

        /**
         * Legend (and the legend card in annex) should only be available if subject data are shown on the map.
         * @returns {Boolean} True if legend should be included in the report.
         */
        shouldIncludeLegendInReport () {
            return this.hasSubjectDataSelected && this.isSubjectDataMapSelected;
        },

        /**
         * Gets the annex card mapping and removes the legend option if it must not be available.
         * @returns {Object[]} The (optionally filtered) annex card mapping.
         */
        annexCardMapping () {
            if (!Array.isArray(categoryMapping?.annex)) {
                return [];
            }

            return this.shouldIncludeLegendInReport
                ? categoryMapping.annex
                : categoryMapping.annex.filter(cardType => cardType.key !== "legend");
        },

        /**
         * Gets the selected front page item.
         * @returns {Object} The selected front page item.
         */
        selectedFrontPageItem () {
            const items = this.selectedDistrictNames.length > 0
                ? this.frontPageItems
                : this.frontPageItemsForEmptySelection;

            return items.find(item => item.selected === true) || {};
        }
    },
    watch: {
        featuresListItems: "preparesInfrastructureData",
        visibleSubjectDataLayerConfigs: "updateFeaturesList",
        shouldIncludeLegendInReport: {
            handler (newVal) {
                if (!Array.isArray(this.annexCards)) {
                    return;
                }

                const hasLegend = this.annexCards.some(c => c.key === "legend");

                if (newVal && !hasLegend) {
                    const mapping = categoryMapping.annex.find(c => c.key === "legend");

                    if (mapping) {
                        this.annexCards.unshift({...mapping, id: uniqueId("reporting-tool-card-")});
                    }
                }
                else if (!newVal && hasLegend) {
                    this.annexCards = this.annexCards.filter(c => c.key !== "legend");
                }
            },
            immediate: true
        }
    },
    created () {
        this.infrastructureTableLimit = this.infrastructureTableLimitConfig;
        this.infrastructureTableLimitEnabled = this.infrastructureTableLimitEnabledConfig;
    },
    mounted () {
        this.switchThroughStepperItems();
    },
    activated () {
        this.updateFeaturesList();
        this.preparesInfrastructureData();
        this.preparesStatGroups();

        if (typeof this.selectedLevels === "undefined") {
            this.selectedLevels = this.districtLevels.map(level => level.label).slice(1);
        }
    },
    deactivated: () => undefined,
    methods: {
        ...mapActions("Modules/FeaturesList", ["updateFeaturesList"]),
        ...mapMutations("Modules/ReportingTool", ["setReportLoader"]),

        /**
         * Maps the front page options to UI items with translated labels and optional alerts.
         * @param {Object[]} options - Front page options.
         * @returns {Object[]} UI items for TagGroup.
         */
        mapFrontPageOptions (options) {
            if (!Array.isArray(options)) {
                return [];
            }

            return options.map(option => {
                const baseKey = "additional:modules.cosi.reportingTool.frontPage." + option.value,
                    label = this.$t(baseKey + ".label"),
                    alertKey = baseKey + ".alert",
                    alert = option.value === "withNeuwerk" ? this.$t(alertKey) : undefined;

                return {
                    ...option,
                    label,
                    alert
                };
            });
        },

        /**
         * Creates the PDF report and triggers the download.
         * The PDFMaker instance is wrapped with `markRaw` to prevent Vue from
         * applying reactivity. This is required because pdfmake uses internal
         * non-configurable properties (e.g. `_layoutEngine`) which are incompatible
         * with Vue proxies.
         *
         * @async
         * @returns {Promise<void>} Resolves when the report has been created and downloaded.
         */
        async createReport () {
            this.showError = false;
            this.setReportLoader(true);
            try {
                this.pdf = markRaw(new PDFMaker());
                this.pdf.resetDocContent();
                this.pdf.addHeader(this.reportTitle.trim());
                this.pdf.setAuthor(this.author.trim());
                if (this.selectedDistrictNames.length > 0) {
                    await this.addOverViewPage(this.selectedFrontPageItem.value);
                    this.addChapterStatisticalData(this.statisticalDataCards);
                }
                if (this.featuresListItems.length > 0) {
                    await this.addChapterSubjectData(this.subjectDataCards);
                }
                if (Array.isArray(this.analysisCards)) {
                    this.addChapterAnalysis(this.analysisCards);
                }
                else {
                    this.addChapterAnalysis(this.initialAnalysisCards);
                }
                await this.addChapterAnnex(this.annexCards);

                this.pdf.download(this.downloadName);
            }
            catch (error) {
                this.showError = true;
                console.error("Fehler beim Erstellen des PDFs:", error);
            }
            finally {
                this.setReportLoader(false);
            }
        },

        /**
         * Normalizes legend entries from the legend store to a stable format.
         *
         * Supported input formats:
         * - string (URL/DataURL)
         * - object with {label|name|title, graphic, imageScale}
         *
         * @param {Object} legendObj - Legend object from the store.
         * @returns {{label: string, graphic: string, imageScale: number}[]} Normalized legend entries.
         */
        getLegendEntries (legendObj) {
            const defaultImageScale = 1,
                entries = Array.isArray(legendObj?.legend) ? legendObj.legend : [];

            return entries
                .map(entry => {
                    if (typeof entry === "string") {
                        return {label: "", graphic: entry, imageScale: defaultImageScale};
                    }

                    const label = entry?.name ?? "",
                        graphic = entry?.graphic ?? null,
                        imageScale = Number.isFinite(entry?.imageScale) ? entry.imageScale : defaultImageScale;

                    return {label, graphic, imageScale};
                })
                .filter(item => typeof item.graphic === "string" && item.graphic.length > 0);
        },

        /**
         * Adds a legend section to the PDF using the active legends from the Legend store.
         * A new legend page is created and all legend entries are rendered in sorted order.
         *
         * @async
         * @returns {Promise<void>} Resolves when the legend page and entries are added.
         */
        async addLegendFromStore () {
            const defaultLayerTitlePrefix = "Layer ",
                legends = Array.isArray(this.legends) ? this.legends : [],
                sortedLegends = legends.slice().sort((a, b) => (a?.position ?? 0) - (b?.position ?? 0));

            if (legends.length === 0) {
                return;
            }

            this.pdf.addLegendPage();

            for (let layerIndex = 0; layerIndex < sortedLegends.length; layerIndex++) {
                const legendObj = sortedLegends[layerIndex],
                    title = legendObj?.name || `${defaultLayerTitlePrefix}${layerIndex + 1}`,
                    entries = this.getLegendEntries(legendObj);

                this.pdf.addHeadline(title);

                if (entries.length === 0) {
                    this.pdf.addParagraph(this.$t("additional:modules.cosi.reportingTool.noLegendAvailable"));
                    this.pdf.addLineBreak();
                    continue;
                }

                for (let entryIndex = 0; entryIndex < entries.length; entryIndex++) {
                    const entry = entries[entryIndex];

                    await this.addLegendEntryToPdf(entry.graphic, entry.label, layerIndex, entryIndex, entry.imageScale);
                }

                this.pdf.addLineBreak();
            }
        },
        /**
         * Adds a single legend entry (icon + label) to the PDF content.
         *
         * @async
         * @param {string} graphic - Legend graphic as URL or DataURL.
         * @param {string} label - Label shown next to the icon.
         * @param {number} layerIndex - Index of the layer in the legend list.
         * @param {number} entryIndex - Index of the legend entry within the layer.
         * @param {number} [imageScale=1] - Optional scale factor from the legend store.
         * @returns {Promise<void>} Resolves when the legend entry has been added.
         */
        async addLegendEntryToPdf (graphic, label, layerIndex, entryIndex, imageScale = 1) {
            const baseIconSize = 26,
                minEffectiveScale = 0.85,
                maxEffectiveScale = 1.1,
                minIconSize = 12,
                svgExtraSize = 4,
                iconColumnExtraWidth = 14,
                textFontSize = 10,
                textLineHeight = 1.1,
                textMargin = [4, 6, 0, 0],
                rowMargin = [0, 2, 0, 2],
                imageKeyPrefix = "legend-",
                svgDataUrlPrefix = "data:image/svg+xml",
                imageDataUrlPrefix = "data:image/",
                httpUrlRegex = /^https?:\/\//,
                scale = Number.isFinite(imageScale) ? imageScale : 1,
                effectiveScale = Math.max(minEffectiveScale, Math.min(maxEffectiveScale, scale)),
                size = Math.max(minIconSize, Math.round(baseIconSize * effectiveScale)),
                svgSize = size + svgExtraSize,
                imageKey = `${imageKeyPrefix}${layerIndex}-${entryIndex}`,
                isString = typeof graphic === "string",
                isSvgDataUrl = isString && graphic.startsWith(svgDataUrlPrefix),
                isAnyImageDataUrl = isString && graphic.startsWith(imageDataUrlPrefix),
                isHttpUrl = isString && httpUrlRegex.test(graphic);

            if (!this.pdf.images) {
                this.pdf.images = {};
            }

            let iconNode = null;

            if (isSvgDataUrl) {
                const svg = this.decodeSvgDataUrl(graphic);

                if (svg) {
                    iconNode = {svg, width: svgSize, height: svgSize};
                }
            }
            else if (isAnyImageDataUrl) {
                this.pdf.images[imageKey] = graphic;
                iconNode = {image: imageKey, width: size, height: size};
            }
            else if (isHttpUrl) {
                const lowerUrl = graphic.toLowerCase(),
                    isLikelySvgUrl = lowerUrl.includes(".svg") || lowerUrl.includes("image/svg");

                try {
                    if (isLikelySvgUrl) {
                        const svgText = await this.fetchSvgText(graphic);

                        if (svgText) {
                            iconNode = {svg: svgText, width: svgSize, height: svgSize};
                        }
                    }
                    else {
                        const dataUrl = await this.fetchAsDataUrl(graphic);

                        if (typeof dataUrl === "string" && dataUrl.startsWith(imageDataUrlPrefix)) {
                            this.pdf.images[imageKey] = dataUrl;
                            iconNode = {image: imageKey, width: size, height: size};
                        }
                    }
                }
                catch (error) {
                    this.pdf.addParagraph(this.$t("additional:modules.cosi.reportingTool.legendLoadFailed"));
                    return;
                }
            }

            if (!iconNode) {
                this.pdf.addParagraph(this.$t("additional:modules.cosi.reportingTool.legendLoadFailed"));
                return;
            }

            this.pdf.content.push({
                table: {
                    widths: [baseIconSize + iconColumnExtraWidth, "*"],
                    body: [[
                        iconNode,
                        {text: label || "", fontSize: textFontSize, lineHeight: textLineHeight, margin: textMargin}
                    ]]
                },
                layout: "noBorders",
                margin: rowMargin
            });
        },

        /**
         * Decodes an SVG DataURL into a raw SVG string.
         * The payload may be percent-encoded and will be decoded if possible.
         *
         * @param {string} dataUrl - SVG DataURL (e.g. "data:image/svg+xml;charset=utf-8,<svg ...>").
         * @returns {string|null} The decoded SVG string, or `null` if the DataURL is invalid.
         */
        decodeSvgDataUrl (dataUrl) {
            const isString = typeof dataUrl === "string",
                commaIndex = isString ? dataUrl.indexOf(",") : -1,
                hasPayload = commaIndex !== -1,
                payload = hasPayload ? dataUrl.slice(commaIndex + 1) : null;

            if (!hasPayload) {
                return null;
            }

            try {
                return decodeURIComponent(payload);
            }
            catch (error) {
                return payload;
            }
        },

        /**
         * Fetches an SVG file from a URL and returns its raw text content.
         *
         * @async
         * @param {string} url - The URL pointing to an SVG resource.
         * @returns {Promise<string|null>} Resolves with the SVG text content or `null` on failure.
         */
        async fetchSvgText (url) {
            try {
                const {data, status} = await axios.get(url, {
                    responseType: "text"
                });

                return status === 200 ? data : null;
            }
            catch (error) {
                console.error("[Legend] SVG fetch failed:", url, error);
                return null;
            }
        },

        /**
         * Fetches an image from a URL and converts it into a DataURL.
         *
         * @async
         * @param {string} url - The URL of the image resource.
         * @returns {Promise<string|null>} Resolves with the image as DataURL or `null` on failure.
         */
        async fetchAsDataUrl (url) {
            try {
                const {data: blob} = await axios.get(url, {
                    responseType: "blob"
                });

                return new Promise((resolve, reject) => {
                    const reader = new FileReader();

                    reader.onload = () => resolve(reader.result);
                    reader.onerror = (error) => {
                        console.error("[Legend] FileReader failed:", error);
                        reject(error);
                    };

                    reader.readAsDataURL(blob);
                });
            }
            catch (error) {
                console.error("[Legend] Image fetch failed:", url, error);
                return null;
            }
        },

        /**
         * Gets the page orientation for the PDF based on the number of statistical columns.
         * @returns {string} Returns landscape if there are 6 or more columns, otherwise portrait.
         */

        getPageOrientation () {
            const cols = this.getStatCols(this.selectedDistrictLevel, this.selectedDistrictNames, []);

            return cols.length >= 6 ? "landscape" : "portrait";
        },

        /**
         * Adds the statistical data to the report.
         * @param {Object[]} cards - cards to be added in the chapter.
         * @returns {void}
         */
        addChapterStatisticalData (cards) {
            if (!cards.length) {
                return;
            }
            if (this.getPageOrientation() === "portrait") {
                this.pdf.addSectionHeadline("Statistische Daten");
            }
            let contentAdded = false;

            for (let i = 0; i < cards.length; i++) {
                const card = cards[i];

                if (card.key === "statDataOverview") {
                    this.addStatsToReport(this.items);
                    contentAdded = true;
                }
                else if (card.key === "statDataCharts") {
                    this.addDiagram(contentAdded);
                    contentAdded = true;
                }
                else if (card.key === "heading") {
                    this.pdf.addChapter(card.value);
                    contentAdded = true;
                }
                else if (card.key === "textArea") {
                    this.pdf.addParagraph(card.value);
                    contentAdded = true;
                }
            }
        },

        /**
         * Adds the subject data to the report.
         * @param {Object[]} cards - cards to be added in the chapter.
         * @returns {void}
         */
        async addChapterSubjectData (cards) {
            if (!cards.length) {
                return;
            }
            this.pdf.addSectionHeadline("Fachdaten", {pageOrientation: "portrait", pageBreak: "before"});
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
                return;
            }
            this.pdf.addSectionHeadline("Analyse", {pageBreak: "before", pageOrientation: "portrait"});

            let analysisCount = 0;

            cards.forEach(card => {
                if (card.key === "accessibilityAnalyses") {
                    const analysis = card.items.find(item => item.inputs.title === card.name),
                        needsPageBreak = analysisCount > 0;

                    this.addAccessibilityAnalysis(analysis, needsPageBreak);

                    analysisCount++;
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
            if (cards.length === 0) {
                return;
            }
            const sortedItems = [];

            this.selectedStatGroups.forEach((group) => {
                this.items.forEach(item => {
                    if (item.group === group) {
                        if (this.statsFeatureFilter.length === 0 || this.statsFeatureFilter.includes(item.category)) {
                            sortedItems.push(item);
                        }
                    }
                });
            });

            if (!Array.isArray(cards)) {
                await this.addReferencesToReport(sortedItems);
                return;
            }
            this.pdf.addSectionHeadline("Anhang", {pageBreak: "before", pageOrientation: "portrait"});

            for (let i = 0; i < cards.length; i++) {
                const card = cards[i];

                if (card.key === "legend") {
                    if (this.shouldIncludeLegendInReport) {
                        await this.addLegendFromStore();
                    }
                }

                if (card.key === "sources") {
                    await this.addReferencesToReport(sortedItems);
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
         * @param {Object} analysis - Analysis from accessibility analysis component.
         * @param {Boolean} needsPageBreak - Indicates whether a page break should be inserted before the chapter.
         * @returns {void}
         */
        addAccessibilityAnalysis (analysis, needsPageBreak) {
            const inputs = {"Verkehrsmittel": this.transportTypeMapping[analysis.inputs.transportType],
                [analysis.inputs.scaleUnit === "time" ? "Zeit" : "Entfernung"]: analysis.inputs[analysis.inputs.scaleUnit] + " min",
                ... analysis.inputs.useTravelTimeIndex && {
                    "Reisezeitindex": analysis.inputs.travelTimeIndex,
                    "Tageszeit": analysis.inputs.travelTime + ":00 Uhr"},
                "Einwohner": analysis.inputs.einwohner
            };

            if (needsPageBreak) {
                this.pdf.addChapter({text: "Erreichbarkeitsanalyse", pageBreak: "before"});
            }
            else {
                this.pdf.addChapter("Erreichbarkeitsanalyse");
            }

            this.pdf.addSubHeadline(analysis.inputs.title);

            this.pdf.addBoxLayout(this.addDetailAnalysisInfo(inputs));
            this.pdf.addLineBreak();

            if (analysis.inputs.mode === "facility") {
                const text = analysis.inputs.selectionCards;

                this.pdf.addHeadline("Erreichbarkeit ab " + this.modeMapping[analysis.inputs.mode]);

                text.forEach(val => {
                    this.pdf.addBulletPoints(val.text);
                });
            }

            if (typeof analysis.inputs.screenshot !== "undefined") {
                this.pdf.addImageByUrl(analysis.inputs.screenshot, analysis.inputs.title, {fit: [500, 500], alignment: "left"}, analysis.inputs.mode !== "facility" ? "Erreichbarkeit ab " + this.modeMapping[analysis.inputs.mode] : "");
            }

            if (typeof analysis.inputs.screenshotLegend !== "undefined") {
                this.pdf.addLineBreak();
                this.pdf.addImageByUrl(analysis.inputs.screenshotLegend, analysis.inputs.title + "-legend", {width: 300, alignment: "left"}, null, false);
            }

        },
        /**
         * Returns the input value and label, which are displayed one below the other.
         * @param {Object} inputs - The input values of the Accessibility Analysis.
         * @returns {Object[]} The input values.
         */
        addDetailAnalysisInfo (inputs) {
            const row = [];

            Object.entries(inputs).forEach(([key, val]) => {
                row.push({
                    stack: [
                        {text: val, bold: true, alignment: "center", fontSize: 12},
                        {text: key, alignment: "center", fontSize: 11}
                    ]
                });
            });

            return [row];
        },

        /**
         * Formats a value safely for usage in pdfmake table cells.
         * @param {*} value - The value to format.
         * @param {Intl.NumberFormatOptions} [numberOptions={}]
         * @param {string} [locale="de-DE"]
         * @returns {string} Safe string value for pdfmake.
         */
        formatPdfCellValue (value, numberOptions = {}, locale = "de-DE") {
            try {
                if (value === null || value === undefined) {
                    return "";
                }

                if (Number.isFinite(value)) {
                    return value.toLocaleString(locale, numberOptions);
                }

                return String(value);
            }
            catch (error) {
                return String(value ?? "");
            }
        },

        /**
         * Prepares the statistical data and adds it to the report.
         * @param {Object[]} items - Items from dashboard component.
         * @returns {void}
         */
        addStatsToReport (items) {
            const itemGroups = items.map(item => item.category),
                filteredMappingByCategories = this.initMapping.filter(obj => itemGroups.includes(obj.value)),
                groupedMapping = Object.groupBy(filteredMappingByCategories, (obj) => obj.group),
                pdf = this.pdf,
                printedYear = this.statisticalYear || items[0].years[0],
                selectedDistrictLabels = this.getSelectedDistrictLabels(this.selectedDistrictLevel.districts, this.selectedDistrictNames);

            let additionalPara = {pageOrientation: "portrait"};

            if (this.getPageOrientation() === "landscape") {
                additionalPara = {pageOrientation: "landscape", pageBreak: "before"};
                this.pdf.addSectionHeadline("Statistische Daten", additionalPara);
            }

            pdf.addChapter({text: "Statistische Datenübersicht"});
            pdf.addSubHeadline("Jahr: " + printedYear);
            pdf.addLineBreak();

            this.selectedStatGroups.forEach((group) => {
                const districtCols = this.getStatCols(this.selectedDistrictLevel, this.selectedDistrictNames, []),
                    columns = [group, ...districtCols],
                    body = [columns];

                groupedMapping[group].forEach(mappingObject => {
                    if (this.statsFeatureFilter.length > 0 && !this.statsFeatureFilter.includes(mappingObject.value)) {
                        return;
                    }
                    const statFeature = items.find((item) => item.category === mappingObject.value),
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
                            pdf.addCell(row, value, alignment);
                        }
                        else if (index === 1 && this.shouldAreasSummedUp) {
                            value = this.getTotal(statFeature, selectedDistrictLabels, printedYear, "jahr_");
                            pdf.addCell(row, this.formatPdfCellValue(value, numberOptions), alignment);
                        }
                        else {
                            value = parseFloat(statFeature[col]["jahr_" + printedYear]) || "-";
                            pdf.addCell(row, this.formatPdfCellValue(value, numberOptions), alignment);
                        }

                    });
                    body.push(row);
                });

                pdf.addTable(body, "*");
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
         * Gets the labels of the selected districts.
         * These are the identifiers used in the dashboard (e.g. "Bergedorf (Bezirk)" instead of "Bergedorf")
         * @param {Object[]} districts - The district objects.
         * @param {String[]} districtNames - The names of the selected districts.
         * @returns {String[]} The labels of the selected districts.
         */
        getSelectedDistrictLabels (districts, districtNames) {
            return districts
                .filter(dist => districtNames.includes(dist.getName()))
                .map(dist => dist.getLabel());
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
                        provider = metadata?.getContact() || metadata?.getOwner() || metadata?.getPublisher(),
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
                {imageHeight, imageWidth} = frontPageValue === "withNeuwerk" ? {imageHeight: 400, imageWidth: 510} : {imageHeight: 500, imageWidth: 500},
                imageOptions = frontPageValue === "withNeuwerk" ? {width: imageWidth, height: imageHeight, alignment: "center"} : {fit: [imageWidth, imageHeight], alignment: "center"},
                minimap = await this.addOverViewPageMinimap(template, bbox, "miniMap", "right"),
                overviewInfos = this.addDetailViewToOverviewPage();

            if (typeof overviewImageUrl !== "string") {
                return;
            }
            this.pdf.addMainHeading(headline);
            this.pdf.addLineBreak();
            this.pdf.addImageByUrl(overviewImageUrl, imageName, imageOptions);
            this.pdf.addLineBreak();
            if (frontPageValue === "withNeuwerk") {
                this.pdf.addColumns([await this.addOverViewPageMinimap(template, [461000.14, 5973660.79, 468500.95, 5979481.62], "neuwerkMap", "left"), minimap], 10);
                this.pdf.addLineBreak();
                this.pdf.addColumns([overviewInfos]);
            }
            else {
                this.pdf.addColumns([overviewInfos, minimap]);
            }

            if (this.freeHeadline.trim() !== "" || this.freeText.trim() !== "") {
                this.pdf.addLineBreak();
                this.pdf.addChapter(this.freeHeadline);
                this.pdf.addParagraph(this.freeText);
                this.pdf.addLineBreak();
            }
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
            template.baseLayer.map.style.color = [228, 26, 28, 1];
            const {downloadURL: minimapImageUrl} = await this.prepareImage(
                new Feature({geometry: fromExtent(bbox)}),
                template,
                this.projection.getCode(),
                imageName,
                mapfishServerConfig,
                "rectangleTemplate"
            ).catch(error => console.error(error));

            this.pdf.addImageInstance(minimapImageUrl, imageName);
            return {
                table: {
                    body: [[
                        {
                            image: imageName,
                            fit: [300, 150],
                            alignment
                        }
                    ]]
                },
                layout: {
                    hLineWidth: () => 1,
                    vLineWidth: () => 1,
                    hLineColor: () => "#868686",
                    vLineColor: () => "#868686",
                    paddingLeft: () => 0,
                    paddingRight: () => 0,
                    paddingTop: () => 0,
                    paddingBottom: () => 0
                }
            };
        },

        /**
         * Adds infrastructure map to the page report.
         * @returns {void}
         */
        async addInfrastructureMapPageToReport (items) {
            const imageName = "infrastructureMap",
                feature = layerCollection.getLayerById("subject-area").getLayerSource().getFeatures()[0],
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

            template.baseLayer.map.style.color = [235, 138, 62, 1];
            imageOptions = await this.prepareImage(feature, template, this.projection.getCode(), imageName, mapfishServerConfig, "A4 Hochformat", 1).catch(error => console.error(error));

            if (typeof imageOptions.downloadURL !== "string") {
                return;
            }
            this.pdf.addLineBreak();
            this.pdf.addImageByUrl(imageOptions.downloadURL, imageName, {fit: [500, 500], alignment: "center"}, "Kartendarstellung");
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
                text.push({text: `${data.label}: `, bold: true, fontSize: 11});
                text.push({text: `${data.value}\n`, fontSize: 10, margin: [8, 5, 0, 0]});
            });
            tableBody[0][0].text = text;

            return {
                stack: [
                    this.pdf.getHeadline("Ausgewählte Gebiete"),
                    {
                        layout: "noBorders",
                        table: {
                            headerRows: 1,
                            widths: ["auto"],
                            body: tableBody
                        }
                    }
                ]
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
         * The method traverses through the given district level and all its
         * reference levels to collect the required column names.
         * @param {Object} districtLevel - The current district level object.
         * @param {String[]} districtNames - The names of the selected districts for the current level.
         * @param {String[]} columns - The accumulated column names.
         * @param {Boolean} [isRoot=true] - Indicates whether this is the initial call (root level).
         * @returns {String[]} The complete list of column headers for the export.
         */
        getStatCols (districtLevel, districtNames, columns, isRoot = true) {
            const districts = districtLevel.displayAll
                    ? districtLevel.districts
                    : districtLevel.districts.filter(dist => districtNames.includes(dist.getName())),
                refDistrictNames = [];

            let refDistrictName;

            for (const district of districts) {
                const levelIsSelected = this.selectedLevels.includes(districtLevel.label);

                let includeLevelCols;

                if (this.shouldAreasSummedUp) {
                    includeLevelCols = !isRoot && levelIsSelected;
                }
                else if (isRoot) {
                    includeLevelCols = true;
                }
                else {
                    includeLevelCols = levelIsSelected;
                }

                if (includeLevelCols) {
                    const isSingleSelectionAtRoot = !this.shouldAreasSummedUp && isRoot && districts.length === 1;

                    columns.push(isSingleSelectionAtRoot ? district.getName() : district.getLabel());
                }

                refDistrictName = district.getReferencDistrictName();

                if (refDistrictName) {
                    refDistrictNames.push(refDistrictName);
                }
            }

            if (districtLevel.referenceLevel) {
                this.getStatCols(districtLevel.referenceLevel, refDistrictNames, columns, false);
            }

            if (this.shouldAreasSummedUp && isRoot) {
                return [this.areaColumnName, ...columns];
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

            this.pdf.addChapter({text: "Auflistung", pageOrientation: "portrait"});
            this.pdf.addLineBreak();
            this.selectedInfrastructureData.forEach(group => {
                const topicLength = groupedTopics[group].length,
                    columns = this.pdf.getColumns(["Typ der Einrichtung", "Name", "Adresse"], []),
                    body = [columns],
                    columnAttirbutes = ["type", "name", "address"];

                this.pdf.addHeadline(group);
                this.pdf.addParagraph(`Es sind ${groupedTopics[group].length} ${group} im ausgewählten Gebiet vorhanden.`,
                    [{text: `${groupedTopics[group].length}`, color: "#3C5F94", bold: true}, {text: `${group}`, color: "#3C5F94", bold: true}]);

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
                else {
                    this.pdf.addParagraph(`Hinweis: Bei mehr als ${this.infrastructureTableLimit} Einrichtungen wird keine Fachdaten-Tabelle dargestellt.`,
                        [{text: `Hinweis: Bei mehr als ${this.infrastructureTableLimit} Einrichtungen wird keine Fachdaten-Tabelle dargestellt.`, color: "#868686"}]);
                }
            });
        },

        /**
         * Add diagram to report
         * @param {Boolean} [needsPageBreak = true] - Indicates whether a page break should be inserted before the chapter.
         * @returns {void}
         */
        addDiagram (needsPageBreak = true) {
            const data = this.getChartData(this.items, this.selectedDistrictNames, this.areaColumnName, this.categoryInChart, this.initMapping),
                imageArr = [];

            if (!Array.isArray(data) || !data.length) {
                return;
            }

            for (let i = 0; i < data.length; i++) {
                imageArr.push(this.getChartImage(data[i]));
            }

            if (imageArr.length) {
                const chapterConfig = {text: "Datenvisualisierung", pageOrientation: "portrait"};

                if (needsPageBreak) {
                    chapterConfig.pageBreak = "before";
                }
                this.pdf.addChapter(chapterConfig);
                imageArr.forEach((image, index) => {
                    this.pdf.addHeadline(Object.keys(this.selectedCategoryInChart[index])[0]);
                    this.pdf.addParagraph(Object.values(this.selectedCategoryInChart[index])[0]);
                    this.pdf.addImageByUrl(undefined, image, {width: 500, alignment: "center"}, null, false);
                    this.pdf.addLineBreak(5);
                });
            }
        },

        /**
         * Gets the chart image as Base64 format.
         * @param {Object} data - the chart data.
         * @returns {string} the toBase64Image image string.
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

            return new ChartJS(document.getElementById("canvas").getContext("2d"), {
                type: "line",
                data: data,
                options: {
                    animation: false
                }
            }).toBase64Image();
        },

        /**
         * Gets the data for chart.
         * @param {Object[]} items - Items from dashboard component.
         * @param {String[]} selectedDistrictNames - the selected district name in id.
         * @param {String} areaColumnName - the area name.
         * @param {Object[]} categoryInChart - the category to be used in chart.
         * @param {Object[]} mappingJson - the mapping json.
         * @returns {Object} the data.
         */
        getChartData (items, selectedDistrictNames, areaColumnName, categoryInChart, mappingJson) {
            const filteredMappingByCategories = mappingJson.filter(obj => {
                    return this.selectedStatGroups.includes(obj.group);
                }),
                groupedMapping = this.groupBy(filteredMappingByCategories, "group"),
                categoryData = [];

            if (!Array.isArray(mappingJson) || mappingJson.length === 0 || !Array.isArray(items) || !items.length || !Array.isArray(selectedDistrictNames) || !selectedDistrictNames.length) {
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
                    if (!Object.prototype.hasOwnProperty.call(groupedMapping, key)) {
                        return;
                    }
                    const innerObj = {},
                        statFeature = items.find((item) => item.category === category[key]);

                    statFeature.years.sort((a, b) => a - b);
                    innerObj[key] = category[key];
                    this.selectedCategoryInChart.push(innerObj);
                    statFeature.years.forEach(year => {
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
         * Updates the selected report components with the selected front page items.
         * @param {Object} frontPagelabel - The labels object containing information about front page items.
         * @returns {void}
         */
        updateFrontPageItems (selectedItems) {
            const selectedItem = Array.isArray(selectedItems) ? selectedItems[0] : selectedItems;

            if (!selectedItem || typeof selectedItem.value === "undefined") {
                return;
            }
            this.frontPageOptions.forEach(item => {
                item.selected = item.value === selectedItem.value;
            });
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
         * Resets all settings to default values.
         * @returns {void}
         */
        resetAllSettings () {
            this.reportTitle = "";
            this.author = "";
            this.frontPageItems.forEach(item => {
                item.selected = false;
            });
            this.frontPageItems[0].selected = true;
            this.frontPageItems = [...this.frontPageItems];
            this.freeHeadline = "";
            this.freeText = "";
            this.statisticalYear = undefined;
            this.infrastructureTableLimit = this.infrastructureTableLimitConfig;
            this.infrastructureTableLimitEnabled = this.infrastructureTableLimitEnabledConfig;
            this.selectedLevels = this.districtLevels.map(level => level.label).slice(1);
            this.shouldAreasSummedUp = true;

            this.page = 1;
            this.stepperRerenderKey++;
            this.printReportView = false;
            this.switchThroughStepperItems();
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
         * Switches through the steps awaiting the next tick after each switch.
         * @returns {Promise<void>} Resolves once the stepper items have been switched through.
         */
        async switchThroughStepperItems () {
            await this.$nextTick();
            this.page = 1;
            await this.$nextTick();
            this.page = 2;
            await this.$nextTick();
            this.page = 3;
            await this.$nextTick();
            this.page = 4;
            await this.$nextTick();
            this.page = 5;
            await this.$nextTick();
            this.page = 1;
            await this.$nextTick();
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
        },
        /**
         * Closes the error message if it is visible.
         * @returns {void}
         */
        resetError () {
            this.showError = false;
        }
    }
};
</script>

<template lang="html">
    <div class="container">
        <ToolInfo
            :url="readmeUrl"
            :locale="currentLocale"
            :summary="$t('additional:modules.cosi.reportingTool.toolInfoText')"
        />
        <div
            v-show="!printReportView && !noDataView"
            :key="stepperRerenderKey"
        >
            <v-stepper
                ref="stepperActions"
                v-model="page"
                class="mt-3"
                color="#3C5F94"
                non-linear
                alt-labels
            >
                <v-stepper-header>
                    <v-stepper-item
                        :value="1"
                        :disabled="reportLoader"
                        editable
                    >
                        {{ $t("additional:modules.cosi.reportingTool.generalSettings") }}
                    </v-stepper-item>

                    <v-divider />

                    <v-stepper-item
                        :value="2"
                        :disabled="reportLoader"
                        editable
                    >
                        {{ $t("additional:modules.cosi.reportingTool.statisticalData") }}
                    </v-stepper-item>

                    <v-divider />

                    <v-stepper-item
                        :value="3"
                        :disabled="reportLoader"
                        editable
                    >
                        {{ $t("additional:modules.cosi.reportingTool.subjectData") }}
                    </v-stepper-item>

                    <v-divider />

                    <v-stepper-item
                        :value="4"
                        :disabled="reportLoader"
                        editable
                    >
                        {{ $t("additional:modules.cosi.reportingTool.analyses") }}
                    </v-stepper-item>

                    <v-divider />

                    <v-stepper-item
                        :value="5"
                        :disabled="reportLoader"
                        editable
                    >
                        {{ $t("additional:modules.cosi.reportingTool.annex") }}
                    </v-stepper-item>
                </v-stepper-header>
                <v-stepper-window class="ms-3 pe-0">
                    <v-stepper-window-item :value="1">
                        <h5>
                            {{ "1. " + $t("additional:modules.cosi.reportingTool.generalReportInformation") }}
                        </h5>
                        <form>
                            <InputText
                                id="report-title"
                                v-model="reportTitle"
                                :disabled="reportLoader"
                                :label="$t('additional:modules.cosi.reportingTool.label.title')"
                                :placeholder="$t('additional:modules.cosi.reportingTool.label.title')"
                                max-length="50"
                            />
                            <InputText
                                id="report-author"
                                v-model="author"
                                :disabled="reportLoader"
                                :label="$t('additional:modules.cosi.reportingTool.label.author')"
                                :placeholder="$t('additional:modules.cosi.reportingTool.label.author')"
                                max-length="35"
                            />
                            <TagGroup
                                class="mb-3"
                                :disabled="reportLoader || selectedDistrictNames.length === 0"
                                :items="selectedDistrictNames.length > 0 ? frontPageItems : frontPageItemsForEmptySelection"
                                :label="$t('additional:modules.cosi.reportingTool.label.frontPage')"
                                @update:selected-items="updateFrontPageItems"
                            />
                            <AlertMessage
                                v-if="selectedFrontPageItem && selectedFrontPageItem.alert"
                                :text="selectedFrontPageItem.alert"
                                type="info"
                            />
                            <h6 class="mt-4 mb-3">
                                {{ $t("additional:modules.cosi.reportingTool.addAdditionalInformation") }}
                            </h6>
                            <InputText
                                id="freetext-headline"
                                v-model="freeHeadline"
                                :disabled="reportLoader"
                                :label="$t('additional:modules.cosi.reportingTool.label.headline')"
                                :placeholder="$t('additional:modules.cosi.reportingTool.label.headline')"
                                max-length="50"
                            />
                            <InputText
                                id="freetext-text"
                                v-model="freeText"
                                :disabled="reportLoader"
                                :label="$t('additional:modules.cosi.reportingTool.label.freetext')"
                                :placeholder="$t('additional:modules.cosi.reportingTool.label.freetext')"
                                html-type="textarea"
                                max-length="1000"
                            />
                        </form>
                    </v-stepper-window-item>
                    <v-stepper-window-item :value="2">
                        <ReportingToolStepItem
                            v-if="selectedDistrictNames?.length"
                            v-model:selected-areas-name="selectedAreasName"
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
                    <v-stepper-window-item :value="3">
                        <div v-show="featuresListItems?.length">
                            <ReportingToolStepItem
                                :card-mapping="categoryMapping?.subjectData"
                                :title="'3. ' + $t('additional:modules.cosi.reportingTool.subjectData')"
                                :nothing-selected-text="$t('additional:modules.cosi.reportingTool.alert.noSubjectDataSelected')"
                                :groups="selectedInfrastructureData"
                                @set-cards="setSubjectDataCards"
                                @set-order-of-cards="updateInfratsructureData"
                            >
                                <template #additional-settings>
                                    <div
                                        v-if="subjectDataCards.length !== 0"
                                        class="d-flex flex-column align-items-center mb-3"
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
                                            :min="1"
                                            type="number"
                                            class="col-11 mb-3"
                                            :label="$t('additional:modules.cosi.reportingTool.label.infrastructureTableLimit')"
                                            :placeholder="$t('additional:modules.cosi.reportingTool.label.infrastructureTableLimit')"
                                        />
                                    </div>
                                </template>
                            </ReportingToolStepItem>
                        </div>
                        <AlertMessage
                            v-show="!featuresListItems?.length"
                            :text="$t('additional:modules.cosi.reportingTool.alert.noSubjectData')"
                            type="noData"
                        />
                    </v-stepper-window-item>
                    <v-stepper-window-item :value="4">
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
                    <v-stepper-window-item :value="5">
                        <ReportingToolStepItem
                            :card-mapping="annexCardMapping"
                            :nothing-selected-text="$t('additional:modules.cosi.reportingTool.alert.noAnnexSelected')"
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
                        <AlertMessage
                            v-if="page === 1 && showError"
                            :text="$t('additional:modules.cosi.reportingTool.alert.errorDuringPrinting')"
                            :closeable="true"
                            type="error"
                        />
                        <FlatButton
                            id="confirmButtonFirst"
                            :icon="page != 1 ? 'bi-arrow-left' : 'bi bi-printer'"
                            type="button"
                            :aria-label="page != 1 ? $t('additional:modules.cosi.reportingTool.button.back') : $t('additional:modules.cosi.reportingTool.button.printNow')"
                            :spinner-trigger="reportLoader"
                            :disabled="reportLoader"
                            :text="page != 1 ? $t('additional:modules.cosi.reportingTool.button.back') : $t('additional:modules.cosi.reportingTool.button.printNow')"
                            :interaction="() => page != 1 ? props.onClick() : createReport()"
                        />
                    </template>
                    <template #next="{ props }">
                        <FlatButton
                            id="confirmButton"
                            :icon="page != 5 ? 'bi-arrow-right' : 'bi bi-play'"
                            type="button"
                            :aria-label="page != 5 ? $t('additional:modules.cosi.reportingTool.button.confirmAndNext') : $t('additional:modules.cosi.reportingTool.button.generateReport')"
                            :disabled="reportLoader"
                            :text="page != 5 ? $t('additional:modules.cosi.reportingTool.button.confirmAndNext') : $t('additional:modules.cosi.reportingTool.button.generateReport')"
                            :interaction="() => {page != 5 ? props.onClick() : printReportView = true, resetError()}"
                        />
                    </template>
                </v-stepper-actions>
            </v-stepper>
        </div>
        <AlertMessage
            v-if="noDataView"
            :text="$t('additional:modules.cosi.reportingTool.alert.noDataAlert')"
            type="noData"
        />
        <div v-if="printReportView">
            <h5>
                {{ $t("additional:modules.cosi.reportingTool.finishingUpReport") }}
            </h5>
            <p v-html="$t('additional:modules.cosi.reportingTool.infoText')" />
            <div class="mt-5 d-flex flex-column align-items-center justify-content-center">
                <FlatButton
                    id="download-report"
                    icon="bi bi-cloud-arrow-down"
                    type="button"
                    :aria-label="$t('additional:modules.cosi.reportingTool.button.downloadReport')"
                    :interaction="() => createReport()"
                    :spinner-trigger="reportLoader"
                    :disabled="reportLoader"
                    :text="$t('additional:modules.cosi.reportingTool.button.downloadReport')"
                />
                <AlertMessage
                    v-if="showError"
                    :text="$t('additional:modules.cosi.reportingTool.alert.errorDuringPrinting')"
                    :closeable="true"
                    type="error"
                />
                <FlatButton
                    id="back-report"
                    icon="bi bi-pencil"
                    type="button"
                    :aria-label="$t('additional:modules.cosi.reportingTool.button.backToEditView')"
                    :disabled="reportLoader"
                    :text="$t('additional:modules.cosi.reportingTool.button.backToEditView')"
                    :interaction="() => {printReportView = false, resetError()}"
                />
                <FlatButton
                    id="new-report"
                    icon="bi bi-arrow-clockwise"
                    type="button"
                    :aria-label="$t('additional:modules.cosi.reportingTool.button.createNewReport')"
                    :disabled="reportLoader"
                    :text="$t('additional:modules.cosi.reportingTool.button.createNewReport')"
                    :interaction="() => {resetAllSettings(), resetError()}"
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
