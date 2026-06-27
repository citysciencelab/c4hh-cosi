import tabVisitorTypesActions from "./tab/origins/actions.js";
import tabAgeGroupActions from "./tab/age-groups/actions.js";
import TabGendersActions from "./tab/gender/actions.js";
import apiEndpointService from "./apiEndpointService.js";

const actions = {
    ...tabVisitorTypesActions,
    ...tabAgeGroupActions,
    ...TabGendersActions,
    /**
     * Addresses the OGC-API endpoint to get aggregated values for unique visitors for the complete data collection range
     * @param {Object} state the store's state .
     * @param {Function} commit actions commit function.
     * @returns {void}
     **/
    getVisitors: async ({state, commit}) => {
        if (state.selectedLocationId && state.selectedLocationId !== "") {
            commit("setLoader", true);

            const
                response = await apiEndpointService.receiveVisitors([state.selectedLocationId]);

            // Tab "Visitors", Card: "unique daily visitors per month"
            commit("setSumVisitorsPerMonth", response[0]);

            // Tab "Visitors", Card: "unique daily visitors on a"
            commit("setAverageVisitorsPerDay", response[0]);

            // Tab "Visitors", Card: "unique weekly visitors in the year"
            commit("setVisitorsPerYear", response[0]);

            // Tab "Visitors", Dropdown: "Average of daily visitors"
            commit("setBarChartDailyData");
            commit("setLineChartDailyData");

            // Tab "Visitors", Dropdown: "Average of monthly visitors"
            commit("setBarChartMonthlyData");
            commit("setLineChartMonthlyData");

            commit("setLoader", false);
        }
    },
    /**
     * changes the selected chart data key
     * @param {Function} commit actions commit function.
     * @param {String} chartname contains dateFrom and dateTo to define daterange to be requested
     * @returns {void}
     **/
    changeChart: ({commit}, chartname) => {
        commit("setChartData", chartname);
    },
    initCurrentLocale: ({commit, rootGetters}) => {
        if (rootGetters["Modules/Language/currentLocale"] !== "") {
            commit("setCurrentLocale", rootGetters["Modules/Language/currentLocale"]);
        }
    },
    /**
     * Initializes the select interaction for the map
     * @param {Object} state state object
     * @param {Function} commit actions commit function.
     * @param {Function} dispatch mutations dispatch function.
     * @returns {void}
     **/
    initSelectInteraction ({state, commit}) {
        const map = mapCollection.getMap("2D");

        map.on("click", (e) => {
            map.forEachFeatureAtPixel(e.pixel, (feature) => {
                const selIndex = state.selectedFeatures.indexOf(feature);

                if (selIndex < 0) {
                    if (state.selectedFeatures.length === 0 || state.selectCount === 1) {
                        state.selectedFeatures.forEach((feat) => {
                            feat.setStyle(undefined);
                        });
                        feature.setStyle(state.selectStyle);
                        commit("setSelectedFeatures", [feature]);
                        commit("setSelectedLocationId", feature.get("geoid"));
                    }
                    else if (state.selectCount === 2 && state.selectedLocationId !== feature.get("geoid")) {
                        if (state.selectedFeatures.length === 1) {
                            state.selectedFeatures.push(feature);
                        }
                        else {
                            state.selectedFeatures[1].setStyle(undefined);
                            state.selectedFeatures[1] = feature;
                        }
                        feature.setStyle(state.selectStyle);
                        commit("setSelectedLocationBId", feature.get("geoid"));
                    }
                }
            }, {layerFilter: (layer) => layer.get("id") === state.gridLayerId});
        });
    },
    /**
     * Sets the layer with the given id visible
     * state.layerConfigs is watched in VpiDashboard component
     * @param {Object} state state of this component
     * @param {Function} commit actions commit function.
     * @param {String} layerId id of the layer to be set visible
     * @returns {void}
     */
    toggleLayer ({state, commit}, layerId) {
        commit("setLayerConfigs", state.layerConfigs.map(layerConfig => ({...layerConfig, layer: {visibility: layerConfig.id === layerId}})));
    }
};

export default actions;
