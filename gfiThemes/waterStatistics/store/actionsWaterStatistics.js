import {convertToLocalDateLiteral} from "../js/helpers";
import getOAFFeature from "@shared/js/api/oaf/getOAFFeature.js";

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
     *
     * @returns {Promise<void>} Resolves when query handling is finished.
     */
    async queryOaf ({commit, state, dispatch}, {params}) {
        if (state.abortController) {
            state.abortController.abort();
        }

        commit("setAbortController", new AbortController());

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

        const filter = `${params.queryField} = ${params.queryValue} AND ${params.dateField} >= DATE('${startDate}') AND ${params.dateField} <= DATE('${endDate}')`;

        try {
            const statValues = await getOAFFeature.getOAFFeatureGet(
                params.url,
                params.collections,
                {
                    limit: 1000,
                    filter,
                    filterCrs: params.queryCrs,
                    properties: params.queryProperties,
                    signal: state.abortController.signal,
                    literalFilters: params.literalFilters
                }
            );

            commit("setStatisticValues", statValues);
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
    }
};

export default actions;
