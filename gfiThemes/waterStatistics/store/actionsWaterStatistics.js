import {convertToLocalDateLiteral, guardAgainstExcelDateAutoFormat, pad} from "../js/helpers";
import getOAFFeature from "@shared/js/api/oaf/getOAFFeature.js";
import {convertJsonToCsv} from "@shared/js/utils/convertJsonToCsv.js";
import {createCsvBlob, downloadBlobPerNavigator, downloadBlobPerHTML5} from "@shared/modules/buttons/js/exportButtonUtils.js";
import axios from "axios";

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
            limit: 1000,
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
                now = new Date(),
                filename = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`,
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
    }
};

export default actions;
