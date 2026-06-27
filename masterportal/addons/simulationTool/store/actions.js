import {GeoJSON} from "ol/format.js";
import isObject from "../../../src/shared/js/utils/isObject.js";
import {extractEventCoordinates} from "../../../src/shared/js/utils/extractEventCoordinates.js";
import layerCollection from "../../../src/core/layers/js/layerCollection.js";
import ConvertStyle from "../js/convertStyle.js";
import layerFactory from "../../../src/core/layers/js/layerFactory.js";
import {infrastructureLayerId} from "../layerIds.js";

export default {
    /**
     * Add files and parse them into planning scenarios.
     * @param {Object} param.dispatch the dispatch
     * @param {Object[]} files the imported files.
     * @returns {void}
     */
    addFile ({dispatch}, files) {
        Array.from(files).forEach(file => {
            const reader = new FileReader();

            reader.readAsText(file);
            reader.onload = async f => {
                dispatch("parseScenarioFromImport", f?.target?.result);
            };
        });
    },
    // async fetchProviders ({commit}) {
    //     commit("setProvidersLoading", true);
    //     console.log(Config.simulationApiUrl);
    //     try {
    //         const response = await fetch(`${Config.simulationApiUrl}/processes/providers`, {
    //             headers: {
    //                 "content-type": "application/json"
    //             }
    //         }).then((res) => res.json());

    //         commit("setProviders", response);
    //     }
    //     catch (error) {
    //         console.error(error);
    //     }
    //     finally {
    //         commit("setProvidersLoading", false);
    //     }
    // },

    async fetchProcesses ({commit, getters, rootGetters}) {
        let additionalHeaders = {};

        if (rootGetters["Modules/Login/loggedIn"]) {
            additionalHeaders = {
                Authorization: `Bearer ${rootGetters["Modules/Login/accessToken"]}`
            };
        }

        commit("setProcessesLoading", true);

        try {
            const response = await fetch(`${getters.simulationApiUrl}/processes/`, {
                headers: {
                    "content-type": "application/json",
                    ...additionalHeaders
                }
            }).then((res) => res.json());

            commit("setProcesses", response.processes);
        }
        catch (error) {
            console.error(error);
        }
        finally {
            commit("setProcessesLoading", false);
        }

    },

    async fetchJobs ({commit, getters, rootGetters}) {
        let additionalHeaders = {};

        if (rootGetters["Modules/Login/loggedIn"]) {
            additionalHeaders = {
                Authorization: `Bearer ${rootGetters["Modules/Login/accessToken"]}`
            };
        }

        commit("setJobsLoading", true);

        try {
            const response = await fetch(
                `${getters.simulationApiUrl}/jobs/?include_ensembles`,
                {
                    headers: {
                        "content-type": "application/json",
                        ...additionalHeaders
                    }
                }).then((res) => res.json());

            commit("setJobs", response.jobs);
        }
        catch (error) {
            console.error(error);
        }
        finally {
            commit("setJobsLoading", false);
        }

    },

    /**
     * Checks if the content is in valid format.
     * @param {Object} param.dispatch the dispatch
     * @param {Object} val single scenario content.
     * @returns {Boolean} true if the content is in right format.
     */
    isFormatValid ({dispatch}, val) {
        if (!isObject(val)) {
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: i18next.t("additional:modules.tools.simulationTool.planningScenarioWrongFormat")
            }, {root: true});
            return false;
        }
        else if (typeof val.id === "undefined") {
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: i18next.t("additional:modules.tools.simulationTool.planningScenarioWrongFormat") + "<br>" + i18next.t("additional:modules.tools.simulationTool.planningScenarioMissedKey", {key: "id"})
            }, {root: true});
            return false;
        }
        else if (typeof val.name === "undefined") {
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: i18next.t("additional:modules.tools.simulationTool.planningScenarioWrongFormat") + "<br>" + i18next.t("additional:modules.tools.simulationTool.planningScenarioMissedKey", {key: "name"})
            }, {root: true});
            return false;
        }
        else if (typeof val.inputs === "undefined" || (typeof val.inputs.buildings === "undefined" && typeof val.inputs.roads === "undefined")) {
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: i18next.t("additional:modules.tools.simulationTool.planningScenarioWrongFormat") + "<br>" + i18next.t("additional:modules.tools.simulationTool.planningScenarioMissedKey", {key: "inputs"})
            }, {root: true});
            return false;
        }
        else if (typeof val.scenarioFeature === "undefined" || (typeof val.scenarioFeature.type === "undefined" || typeof val.scenarioFeature.features === "undefined")) {
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: i18next.t("additional:modules.tools.simulationTool.planningScenarioWrongFormat") + "<br>" + i18next.t("additional:modules.tools.simulationTool.planningScenarioMissedKey", {key: "scenarioFeature"})
            }, {root: true});
            return false;
        }

        return true;
    },

    /**
     * Increments the job status change counter.
     * @param {Object} context.commit the commit
     * @param {Object} context.getters the getters
     * @return {void}
     */
    jobStatusChanged ({commit, getters}) {
        commit("setOnJobStatusChange", getters.onJobStatusChange + 1);
    },

    // async fetchEnsembles ({commit, getters, rootGetters}) {
    //     if (!rootGetters["Modules/Login/loggedIn"]) {
    //         return;
    //     }

    //     commit("setEnsemblesLoading", true);

    //     try {
    //         const response = await fetch(
    //             `${getters.simulationApiUrl}/ensembles/`,
    //             {
    //                 headers: {
    //                     "content-type": "application/json",
    //                     Authorization: `Bearer ${rootGetters["Modules/Login/accessToken"]}`
    //                 }
    //             }).then((res) => res.json());

    //         // TODO: this might changed in the backend
    //         commit("setEnsembles", response);
    //     }
    //     catch (error) {
    //         console.error(error);
    //     }
    //     finally {
    //         commit("setEnsemblesLoading", false);
    //     }

    // }

    // async deleteEnsembleById ({commit, rootGetters}, ensembleId) {
    //     if (!rootGetters["Modules/Login/loggedIn"]) {
    //         return;
    //     }

    //     commit("setEnsemblesLoading", true);

    //     try {
    //         const response = await fetch(`${Config.simulationApiUrl}/ensembles/${ensembleId}`, {
    //             method: "DELETE",
    //             headers: {
    //                 "Content-Type": "application/json",
    //                 Authorization: `Bearer ${rootGetters["Modules/Login/accessToken"]}`
    //             }
    //         });

    //         if (!response.ok) {
    //             throw new Error("Failed to delete ensemble");
    //         }

    //         console.log(`Ensemble ${ensembleId} successfully deleted.`);
    //     }
    //     catch (error) {
    //         console.error(error);
    //     }
    //     finally {
    //         commit("setEnsemblesLoading", false);
    //     }
    // },

    // async fetchUserDetails ({state, commit, rootGetters}, user_id) {
    //     if (!rootGetters["Modules/Login/loggedIn"]) {
    //         return null;
    //     }

    //     if (state.userDetailsCache[user_id]) {
    //         return state.userDetailsCache[user_id];
    //     }

    //     const fetchPromise = (async () => {
    //         const accessToken = rootGetters["Modules/Login/accessToken"],
    //             response = await fetch(`${Config.simulationApiUrl}/users/${user_id}/details`, {
    //                 headers: {
    //                     "Content-Type": "application/json",
    //                     Authorization: `Bearer ${accessToken}`
    //                 }
    //             }),
    //             result = await response.json();

    //         if (!response.ok) {
    //             throw new Error(result);
    //         }

    //         commit("setUserDetailsCache", {
    //             ...state.userDetailsCache,
    //             [user_id]: result
    //         });
    //         return result;
    //     })();

    //     commit("setUserDetailsCache", {
    //         ...state.userDetailsCache,
    //         [user_id]: fetchPromise
    //     });

    //     return fetchPromise;
    // }

    /**
     * Parses the file content into planning scenarios.
     * @param {Object} param.commit the commit
     * @param {Object} param.getters the getters
     * @param {Object} param.dispatch the dispatch
     * @param {String} content the imported file content.
     * @returns {void}
     */
    async parseScenarioFromImport ({commit, getters, dispatch}, content) {
        if (typeof content !== "string") {
            return;
        }

        const parsedContent = JSON.parse(content);

        for (const val of parsedContent) {
            const isValid = await dispatch("isFormatValid", val);

            if (isValid) {
                if (!getters.planningScenarios.some(scenario => scenario.id === val.id)) {
                    commit("setPlanningScenarios", [...getters.planningScenarios, val]);
                    if (getters.currentPlanningScenarioId === val.id) {
                        commit("setCurrentPlanningScenarioId", "");
                    }
                    dispatch("Alerting/addSingleAlert", {
                        category: "info",
                        content: i18next.t("additional:modules.tools.simulationTool.planningScenarioImported", {id: val.id, name: val.name})
                    }, {root: true});
                }
                else {
                    dispatch("Alerting/addSingleAlert", {
                        category: "warning",
                        content: i18next.t("additional:modules.tools.simulationTool.planningScenarioAlreadyExisted", {id: val.id, name: val.name})
                    }, {root: true});
                }
            }
        }
    },

    /**
     * Updates the layer with the scenario features.
     * @param {Object} param.getters the getters.
     * @returns {void}
     */
    updateFeatures ({getters}) {
        const currentPlanningScenario = getters.planningScenarios.find(scenario => scenario.id === getters.currentPlanningScenarioId),
            geoJsonParser = new GeoJSON(),
            layerSource = layerCollection.getLayerById("planning-scenario") ? layerCollection.getLayerById("planning-scenario").getLayerSource() : null;

        let layerSourceForObjects = null;

        if (!layerCollection.getLayerById(infrastructureLayerId)) {
            const layer = layerFactory.createLayer({
                typ: "VECTORBASE",
                id: infrastructureLayerId,
                name: infrastructureLayerId
            });

            layer.layer.setZIndex(9999997);

            layerCollection.addLayer(layer);
        }
        layerSourceForObjects = layerCollection.getLayerById(infrastructureLayerId).getLayerSource();

        if (layerSource) {
            layerSource.clear();
        }
        layerSourceForObjects.clear(true);

        if (!currentPlanningScenario || !currentPlanningScenario.scenarioFeature || !currentPlanningScenario.scenarioFeature.features) {
            return;
        }

        currentPlanningScenario.scenarioFeature.features.forEach(feat => {
            const olFeature = geoJsonParser.readFeature(feat);

            olFeature.setStyle(ConvertStyle.geoJsonToOpenlayers(feat.style));
            layerSource.addFeature(olFeature);
        });
        currentPlanningScenario.inputs.buildings.features.forEach(building => {
            const olFeature = geoJsonParser.readFeature(building);

            layerSourceForObjects.addFeature(olFeature);
        });
        currentPlanningScenario.inputs.roads.features.forEach(road => {
            const olFeature = geoJsonParser.readFeature(road);

            layerSourceForObjects.addFeature(olFeature);
        });
    },

    /**
     * Zooms to the features.
     * @param {Object} param.dispatch the dispatch.
     * @param {Object} param.getters the getters.
     * @returns {void}.
     */
    zoomToFeature ({dispatch, getters}) {
        const currentPlanningScenario = getters.planningScenarios.find(scenario => scenario.id === getters.currentPlanningScenarioId),
            olFeatures = currentPlanningScenario ? new GeoJSON().readFeatures(currentPlanningScenario?.scenarioFeature) : [],
            coordinate = olFeatures.length > 0 ? extractEventCoordinates(olFeatures[0].getGeometry().getExtent()) : null;

        if (coordinate) {
            dispatch("Maps/zoomToExtent", {extent: coordinate, options: {maxZoom: 7}}, {root: true});
        }
    }
};
