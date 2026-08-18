import {convertToLocalDateLiteral, guardAgainstExcelDateAutoFormat} from "../js/helpers";
import getOAFFeature from "@shared/js/api/oaf/getOAFFeature.js";
import {convertJsonToCsv} from "@shared/js/utils/convertJsonToCsv.js";
import {createCsvBlob, downloadBlobPerNavigator, downloadBlobPerHTML5} from "@shared/modules/buttons/js/exportButtonUtils.js";

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
        if (state.abortController) {
            state.abortController.abort();
        }

        commit("setAbortController", new AbortController());

        commit("setDataLoading", true);

        let startDate, endDate;

        if (!params.startDate) {
            const now = new Date(),
                start = new Date(now);

            start.setMonth(start.getMonth() - 12);

            startDate = convertToLocalDateLiteral(start);
            endDate = convertToLocalDateLiteral(now);
        }
        else {
            startDate = convertToLocalDateLiteral(new Date(params.startDate));
            endDate = convertToLocalDateLiteral(new Date(params.endDate));
        }

        const filter = `${params.queryField} = ${params.queryValue} AND ${params.dateField} >= DATE('${startDate}') AND ${params.dateField} <= DATE('${endDate}')`,
            queryParams = {
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
                    dispatch("exportStatisticValuesToCsv", {epsg: epsg});
                    break;
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
    async exportStatisticValuesToCsv ({state, dispatch, commit}, {epsg}) {
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

                    Object.keys(properties).forEach(key => {
                        const propertyDescription = state.oafSchema?.properties?.[key]?.title || key;

                        exportValues[propertyDescription] = guardAgainstExcelDateAutoFormat(properties[key]);
                    });

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
                filename = now.toISOString().replace(/[-:T]/g, "").split(".")[0].replace(/^(\d{8})/, "$1_"),
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
        }
        finally {
            commit("setDataLoading", false);
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
