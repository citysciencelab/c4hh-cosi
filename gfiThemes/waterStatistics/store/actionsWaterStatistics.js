import {convertToLocalDateLiteral, guardAgainstExcelDateAutoFormat, getFilenameByDate} from "../js/helpers";
import getOAFFeature from "@shared/js/api/oaf/getOAFFeature.js";
import {convertJsonToCsv} from "@shared/js/utils/convertJsonToCsv.js";
import {createCsvBlob, downloadBlobPerNavigator, downloadBlobPerHTML5} from "@shared/modules/buttons/js/exportButtonUtils.js";
import axios from "axios";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import {getFooterSvg, getSvgHeader} from "../js/getSvg";

pdfMake.vfs = pdfFonts.vfs;

const actions = {
    /**
     * Queries statistic values from an OAF collection for a given property and date range.
     * Aborts any previous running request before starting a new one.
     *
     * @param {Object} context Vuex action context.
     * @param {Function} context.commit Vuex commit function.
     * @param {Object} context.state Vuex module state.
     * @param {Function} context.dispatch Vuex dispatch function.
     * @param {Object} payload Action payload.
     * @param {Object} payload.params Query parameters.
     * @param {string} payload.params.url OAF service URL.
     * @param {string} payload.params.collections OAF Collection name.
     * @param {string} payload.params.queryField Field name for query filter.
     * @param {string} payload.params.queryValue Value for query filter.
     * @param {string} payload.params.dateField Date field name for range filter.
     * @param {string} payload.params.queryCrs Coordinate reference system for query.
     * @param {Array} payload.params.queryProperties Properties to retrieve.
     * @param {string} [payload.params.startDate] Start date (optional, defaults to 12 months ago).
     * @param {string} [payload.params.endDate] End date (optional, defaults to today).
     * @param {Array} [payload.params.literalFilters] Additional literal filters (optional).
     * @param {string} payload.queryPurpose Purpose of the query, e.g., "downloadCsv".
     * @param {string} [payload.epsg] EPSG code for the coordinate reference system.
     *
     * @returns {Promise<void>} Resolves when query handling is finished.
     */
    async queryOaf ({commit, state, dispatch}, {params, queryPurpose, epsg}) {
        if (!queryPurpose) {
            if (state.abortController) {
                state.abortController.abort();
            }
            commit("setAbortController", new AbortController());
        }

        commit("setAbortController", new AbortController());

        commit("setDataLoading", true);

        let startDate, endDate, filter;

        if (!params.startDate && params.endDate) {
            const now = new Date(),
                start = new Date(now);

            start.setMonth(start.getMonth() - 12);

            startDate = convertToLocalDateLiteral(start);
            endDate = convertToLocalDateLiteral(params.endDate ? new Date(params.endDate) : now);
        }
        else if (!params.startDate && !params.endDate) {
            filter = `${params.queryField} = ${params.queryValue}`;
        }
        else {
            startDate = convertToLocalDateLiteral(new Date(params.startDate));
            endDate = params.endDate ? convertToLocalDateLiteral(new Date(params.endDate)) : convertToLocalDateLiteral(new Date());
        }

        if (!filter) {
            filter = `${params.queryField} = ${params.queryValue} AND ${params.dateField} >= DATE('${startDate}') AND ${params.dateField} <= DATE('${endDate}')`;
        }

        const queryParams = {
            limit: 10000,
            filter,
            filterCrs: params.queryCrs,
            properties: params.queryProperties,
            signal: state.abortController.signal,
            literalFilters: params.literalFilters
        };

        if (params.queryProperties?.includes("geom") || epsg) {
            queryParams.crs = params.queryCrs;
        }

        try {
            const statValues = await getOAFFeature.getOAFFeatureGet(
                params.url,
                params.collections,
                queryParams
            );

            switch (queryPurpose) {
                case "downloadCsv":
                    commit("setCsvData", statValues);
                    dispatch("exportStatisticValuesToCsv", {queryProperties: params.queryProperties, epsg: epsg});
                    break;
                case "getAllData": {
                    const allYears = [...new Set(statValues?.map(feature => {
                            return new Date(feature?.properties?.[params.dateField]).getFullYear();
                        }))],
                        earliestDate = new Date(statValues[0].properties[params.dateField]),
                        latestDate = new Date(statValues[statValues.length - 1].properties[params.dateField]),
                        now = new Date(),
                        twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());

                    commit("setDateRange", {
                        startDate: statValues?.[0]?.properties?.[params.dateField] ?? null,
                        endDate: statValues?.[statValues.length - 1]?.properties?.[params.dateField] ?? null,
                        allYears: allYears,
                        allMonths: [...Array(12).keys()].map(i => ({
                            value: i + 1,
                            label: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"][i]
                        })),
                        allDataStartMonth: earliestDate.getMonth() + 1,
                        endMonth: latestDate.getMonth() + 1,
                        allDataStartYear: earliestDate.getFullYear(),
                        endYear: latestDate.getFullYear(),
                        twelveMonthsAgoMonth: twelveMonthsAgo.getMonth() + 1,
                        twelveMonthsAgoYear: twelveMonthsAgo.getFullYear()
                    });

                    commit("setAllData", statValues);

                    break;
                }
                default:
                    commit("setStatisticValues", statValues);
            }
        }
        catch (error) {
            if (error?.name === "CanceledError" || error?.name === "AbortError") {
                return;
            }

            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: `Fehler beim Abrufen der Statistikwerte für ${params.queryField} : ${params.queryValue}. Bitte versuchen Sie es erneut.`
            }, {root: true});
        }
        finally {
            if (state.abortController) {
                commit("setAbortController", null);

                if (state.dataLoading && queryPurpose !== "downloadCsv") {
                    commit("setDataLoading", false);
                }
            }
        }
    },
    /**
     * Loads the OAF collection schema and stores it in the module state.
     *
     * @param {Object} context Vuex action context.
     * @param {Function} context.commit Vuex commit function.
     * @param {Function} context.dispatch Vuex dispatch function.
     * @param {Object} payload Action payload.
     * @param {Object} payload.params Schema request parameters.
     * @param {string} payload.params.url OAF service URL.
     * @param {string} payload.params.collections OAF Collection name.
     *
     * @returns {void}
     */
    queryOafSchema ({commit, dispatch}, {params}) {
        getOAFFeature.getCollectionSchema(params.url, params.collections)
            .then(schema => {
                commit("setOafSchema", schema);
            })
            .catch(error => {
                console.error(error);
                dispatch("Alerting/addSingleAlert", {
                    category: "error",
                    content: `Fehler beim Abrufen notwendiger Daten für ${params.collections}. Bitte versuchen Sie es erneut.`
                }, {root: true});
            });
    },
    /**
     * Fetches percentile data from the given URL and stores it in the module state.
     *
     * Performs an HTTP GET to payload.params.url and commits the returned
     * response.data.data via the "setPercentiles" mutation. On error the
     * exception is logged and an alert is dispatched via the Alerting module.
     *
     * @function
     * @param {Object} context - Vuex action context.
     * @param {Function} context.commit - Vuex commit function.
     * @param {Function} context.dispatch - Vuex dispatch function.
     * @param {Object} payload - Action payload.
     * @param {Object} payload.params - Parameters object.
     * @param {string} payload.params.url - Endpoint URL returning percentile JSON.
     * @returns {Promise<void>} Resolves when the request has completed and state updated.
     */
    async queryPercentiles ({commit, dispatch}, {params}) {
        try {
            const response = await axios.get(params.url);

            commit("setPercentiles", response.data.data);
        }
        catch (error) {
            console.error(error);
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: "Fehler beim Abrufen notwendiger Daten für die Grafik. Bitte versuchen Sie es erneut."
            }, {root: true});
        }
    },
    /**
     * Exports the current statistic values (OAF features) as a CSV file download.
     * Uses each feature's `properties` object as one CSV row.
     *
     * @param {Object} context Vuex action context.
     * @param {Object} context.state Vuex module state.
     * @param {Function} context.dispatch Vuex dispatch function.
     * @param {Function} context.commit Vuex commit function.
     * @param {Object} payload Action payload.
     * @param {String} payload.epsg EPSG code for the coordinate reference system (optional).
     * @returns {void}
     */
    async exportStatisticValuesToCsv ({state, dispatch, commit}, {queryProperties, epsg}) {
        // let Vue flush the DOM so the spinner actually renders before the
        // (synchronous) CSV/blob work runs
        await new Promise(resolve => setTimeout(resolve, 0));

        commit("setDataLoading", true);

        try {
            const features = Array.isArray(state.csvData) ? state.csvData : [],
                jsonData = features.map(feature => {
                    const properties = feature?.properties || {},
                        coordinates = feature?.geometry?.coordinates || {},
                        exportValues = {};

                    if (!queryProperties || queryProperties.length === 0) {
                        Object.keys(properties).forEach(key => {
                            const propertyDescription = state.oafSchema?.properties?.[key]?.title || key;

                            exportValues[propertyDescription] = guardAgainstExcelDateAutoFormat(properties[key]);
                        });
                    }
                    else {
                        queryProperties.forEach(key => {
                            const propertyDescription = state.oafSchema?.properties?.[key]?.title || key;

                            exportValues[propertyDescription] = guardAgainstExcelDateAutoFormat(properties[key]) ?? "-";
                        });
                    }

                    if (coordinates.length >= 2) {
                        exportValues["X-Koordinate"] = guardAgainstExcelDateAutoFormat(coordinates[0]);
                        exportValues["Y-Koordinate"] = guardAgainstExcelDateAutoFormat(coordinates[1]);
                        exportValues.EPSG = typeof epsg === "string" ? epsg.split(":")[1] || epsg : epsg;
                    }

                    return exportValues;
                }),
                csvText = convertJsonToCsv(jsonData, msg => dispatch("csvErrorHandler", msg, {root: true}), true);

            if (typeof csvText !== "string") {
                return;
            }

            const blob = createCsvBlob(csvText),
                filename = getFilenameByDate(),
                csvFilename = `${filename}.csv`;

            if (!downloadBlobPerNavigator(blob, csvFilename)) {
                downloadBlobPerHTML5(blob, csvFilename, msg => dispatch("csvErrorHandler", msg, {root: true}), true);
            }

            // no JS event exists for "save dialog appeared/closed" for blob
            // downloads, so keep the spinner up for a short, perceptible
            // minimum duration instead
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        catch (error) {
            dispatch("csvErrorHandler", error?.message || String(error), {root: true});
            commit("setDataLoading", false);
        }
        finally {
            commit("setDataLoading", false);
        }
    },
    /**
     * Fetches disclaimer JSON from a given URL, validates and normalizes it.
     * Only allowed block types ("p","h2") and segment types ("text","strong") are returned.
     * Returns disclaimer from state if it has already been loaded and normalized before.
     * Returns an empty array on any error.
     *
     * @param {Object} context Vuex action context.
     * @param {Function} context.commit Vuex commit function.
     * @param {Function} context.dispatch Vuex dispatch function.
     * @param {Object} payload Action payload.
     * @param {string} payload.url URL to the disclaimer JSON file.
     * @returns {Promise<Array>} Normalized blocks array.
     */
    async fetchDisclaimer ({state, commit, dispatch}, {url}) {
        if (!url || typeof url !== "string") {
            return [];
        }

        if (state.disclaimerData) {
            return state.disclaimerData;
        }

        try {
            const resp = await axios.get(url, {withCredentials: true}),
                json = resp && resp.data ? resp.data : null;

            if (!json || !Array.isArray(json.blocks)) {
                return [];
            }

            const allowedBlockTypes = new Set(["p", "h2"]),
                allowedSegmentTypes = new Set(["text", "strong"]),
                blocks = [];

            for (let i = 0; i < json.blocks.length; i++) {
                const block = json.blocks[i];

                if (!block ||
                    typeof block.type !== "string" ||
                    !allowedBlockTypes.has(block.type) ||
                    !Array.isArray(block.content)) {
                    continue;
                }

                const normalizedContent = [];

                for (let j = 0; j < block.content.length; j++) {
                    const seg = block.content[j];

                    if (!seg ||
                        typeof seg.type !== "string" ||
                        typeof seg.text !== "string" ||
                        !allowedSegmentTypes.has(seg.type)) {
                        continue;
                    }

                    // Keep plain text only; do not allow HTML in text fields
                    normalizedContent.push({
                        type: seg.type,
                        text: String(seg.text)
                    });
                }

                if (normalizedContent.length > 0) {
                    blocks.push({
                        type: block.type,
                        content: normalizedContent
                    });
                }
            }

            commit("setDisclaimerData", blocks);

            return blocks;
        }
        catch (error) {
            console.error(error);

            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: "Fehler beim Abrufen der Daten für den Haftungsausschluss. Bitte versuchen Sie es erneut."
            }, {root: true});
            return [];
        }
    },
    /**
     * Handles CSV export errors by logging a warning and dispatching an alert.
     *
     * @param {Object} context Vuex action context.
     * @param {Function} context.dispatch Vuex dispatch function.
     * @param {string} msg Error message to log and display.
     * @returns {void}
     */
    csvErrorHandler ({dispatch}, msg) {
        console.warn(msg);
        dispatch("Alerting/addSingleAlert", {
            category: "error",
            content: "Fehler beim Erzeugen der CSV-Datei. Bitte versuchen Sie es erneut."
        }, {root: true});
    },
    /**
     * Generates and downloads a PDF containing a chart image.
     * @param {Object} context Vuex action context.
     * @param {Function} context.dispatch Vuex dispatch function.
     * @param {Function} context.commit Vuex commit function.
     * @param {Object} payload Action payload.
     * @param {string} payload.imgData base64 PNG data URL of the chart.
     * @param {number} payload.width pixel width of the source canvas.
     * @param {number} payload.height pixel height of the source canvas.
     * @param {string} [payload.title] title to render above the chart image.
     * @param {boolean} [payload.useHamburgDesign] whether to apply the Hamburg design style to the PDF.
     * @param {string} [payload.logoPath] path (configured in config.json) to a text file containing the header logo as a "data:image/..." URL.
     * @returns {Promise<void>}
     */
    async addChartToPdf ({dispatch, commit}, {imgData, width, height, titleArray, useHamburgDesign, logoPath}) {
        if (!imgData) {
            return;
        }

        commit("setDataLoading", true);

        let logoImage = "";

        if (logoPath) {
            try {
                const response = await axios.get(logoPath, {responseType: "text"});

                logoImage = typeof response.data === "string" ? response.data.trim() : "";
            }
            catch (error) {
                console.error(error);
                dispatch("Alerting/addSingleAlert", {
                    category: "error",
                    content: "Fehler beim Abrufen des Logos für den PDF-Export."
                }, {root: true});
            }
        }

        const pageWidthLandscape = 842, // A4 height (842pt) becomes the page width in landscape
            pageMargin = 40, // default pdfmake margin (left + right, 40pt each side)
            pageContentWidth = pageWidthLandscape - pageMargin * 2,
            imgHeight = (height / width) * pageContentWidth,
            docDefinition = {
                pageOrientation: "landscape",
                content: [
                    {
                        columns: [
                            ...titleArray.map((title, i) => [
                                {text: title, style: "header", alignment: "center", width: "auto"},
                                i < titleArray.length - 1 ? {text: "", width: "*"} : null
                            ]).flat().filter(Boolean)
                        ]
                    },
                    {
                        image: imgData,
                        width: pageContentWidth,
                        height: imgHeight
                    },
                    {
                        text: `Erstellt am: ${new Date().toLocaleDateString()}`,
                        fontSize: 12,
                        alignment: "right",
                        margin: [0, 20, 0, 0]
                    }
                ],
                styles: {
                    header: {
                        fontSize: 16,
                        bold: true,
                        margin: [10, 20, 0, 10]
                    }
                }
            };

        docDefinition.pageMargins = [40, 70, 40, 40]; // extra top space for header logo

        // Add Header logo if logoImage was successfully resolved
        // /////////////////////
        if (logoImage) {
            docDefinition.header = () => getSvgHeader(logoImage);
        }

        // Add Footer if useHamburgDesign is true
        // /////////////////////
        if (useHamburgDesign) {
            docDefinition.footer = () => {
                return getFooterSvg();
            };
        }

        try {
            const filename = getFilenameByDate();

            pdfMake.createPdf(docDefinition).download(`${filename}.pdf`);

            // no JS event exists for "save dialog appeared/closed" for blob
            // downloads, so keep the spinner up for a short, perceptible
            // minimum duration instead
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        catch (error) {
            console.error(error);
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: "Fehler beim Erzeugen des PDF-Exports. Bitte versuchen Sie es erneut."
            }, {root: true});
        }
        finally {
            commit("setDataLoading", false);
        }
    },
    /*
     * Increase the menu sidebar width to accommodate the GFI panel.
     *
     * Determines the current menu side via the root getter "Modules/GetFeatureInfo/menuSide"
     * and stores the previous width in state.menuWidthWithoutGfi. If a previously selected
     * target width for the GFI panel exists (state.menuWidthSelectedForGfi) the function
     * commits a mutation to set the current menu width accordingly.
     *
     * @param {Object} context - Vuex action context.
     * @param {Function} context.commit - Vuex commit function.
     * @param {Function} context.rootGetters - Vuex rootGetters accessor.
     * @param {Object} context.state - Vuex module state.
     * @returns {void}
     */
    increaseSidebarWidth ({commit, rootGetters, state}) {
        const currentMenuSide = rootGetters["Modules/GetFeatureInfo/menuSide"];

        if (currentMenuSide === "secondaryMenu") {
            state.menuWidthWithoutGfi = rootGetters["Menu/currentSecondaryMenuWidth"] > 0
                ? `${rootGetters["Menu/currentSecondaryMenuWidth"] * 100}%`
                : "25%";
        }
        else {
            state.menuWidthWithoutGfi = rootGetters["Menu/currentMainMenuWidth"] > 0
                ? `${rootGetters["Menu/currentMainMenuWidth"] * 100}%`
                : "25%";
        }

        if (state.menuWidthSelectedForGfi && currentMenuSide) {
            commit("Menu/setCurrentMenuWidth", {
                side: currentMenuSide,
                width: state.menuWidthSelectedForGfi
            }, {root: true});
        }
    },
    /**
     * Reset the menu sidebar width after closing or reducing the GFI panel.
     *
     * Restores a previously saved menu width (state.menuWidthSelectedForGfi) based on the
     * current menu side. If a stored "without GFI" width exists, commits a mutation to set
     * the current menu width to that value.
     *
     * @param {Object} context - Vuex action context.
     * @param {Function} context.commit - Vuex commit function.
     * @param {Function} context.rootGetters - Vuex rootGetters accessor.
     * @param {Object} context.state - Vuex module state.
     * @returns {void}
     */
    resetSidebarWidth ({commit, rootGetters, state}) {
        const currentMenuSide = rootGetters["Modules/GetFeatureInfo/menuSide"];

        if (currentMenuSide === "secondaryMenu") {
            state.menuWidthSelectedForGfi = rootGetters["Menu/currentSecondaryMenuWidth"] > 0
                ? `${rootGetters["Menu/currentSecondaryMenuWidth"] * 100}%`
                : state.menuWidthOnStart;
        }
        else {
            state.menuWidthSelectedForGfi = rootGetters["Menu/currentMainMenuWidth"] > 0
                ? `${rootGetters["Menu/currentMainMenuWidth"] * 100}%`
                : state.menuWidthOnStart;
        }

        if (state.menuWidthWithoutGfi && currentMenuSide) {
            commit("Menu/setCurrentMenuWidth", {
                side: currentMenuSide,
                width: state.menuWidthWithoutGfi
            }, {root: true});
        }
    }
};

export default actions;
