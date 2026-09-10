import {getWmsFeaturesByMimeType} from "@shared/js/utils/getWmsFeaturesByMimeType.js";
import {getVisibleWmsLayersAtResolution} from "../../../../src/modules/getFeatureInfo/js/getLayers.js";
import {treeSubjectsKey} from "@shared/js/utils/constants.js";

export default {
    /**
     * collects features for the gfi.
     * @param {Object} param store context
     * @param {Object} param.commit the commit
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.rootGetters the rootGetters
     * @returns {void}
     */
    collectGfiFeatures ({commit, dispatch, rootGetters}) {
        const clickCoordinate = rootGetters["Maps/clickCoordinate"],
            resolution = rootGetters["Maps/resolution"],
            projection = rootGetters["Maps/projection"],
            gfiWmsLayerList = getVisibleWmsLayersAtResolution(resolution, rootGetters.visibleSubjectDataLayerConfigs.concat(rootGetters.visibleBaselayerConfigs)).filter(layer => {
                return layer.get("gfiAttributes") !== "ignore";
            });

        if (!clickCoordinate) {
            // happens on use of plugin remoteInterface to open GFI
            console.warn("No click coordinate set for GetFeatureInfo.");
            return null;
        }

        return Promise.allSettled(gfiWmsLayerList.map(layer => {
            const gfiParams = {
                INFO_FORMAT: layer.get("infoFormat"),
                FEATURE_COUNT: layer.get("featureCount")
            };
            let url = layer.getSource().getFeatureInfoUrl(clickCoordinate, resolution, projection, gfiParams);

            const sourceStyles = layer.getSource().getParams?.()?.STYLES;

            if (!sourceStyles && url.indexOf("STYLES") && url.indexOf("STYLES=&") === -1) {
                url = url.replace(/STYLES=.*?&/g, "STYLES=&");
            }
            return getWmsFeaturesByMimeType(layer, url);
        }))
            .then((results) => {
                const rejected = [],
                    fulfilled = results.filter((result, index) => {
                        if (result.status === "rejected") {
                            console.error(result.reason);
                            rejected.push(index);
                            return false;
                        }
                        return true;
                    });

                if (rejected.length) {
                    const errorLayers = rejected.reduce(
                        (accumulator, index) => `${accumulator}<li>${gfiWmsLayerList[index].get("name")}</li>`,
                        ""
                    );

                    dispatch(
                        "Alerting/addSingleAlert",
                        i18next.t("common:modules.getFeatureInfo.errorMessageLayers", {
                            layers: errorLayers,
                            interpolation: {escapeValue: false}}
                        ), {root: true}
                    );
                }

                return fulfilled.map(({value}) => value);
            })
            .then(gfiFeatures => {
                const mode = rootGetters["Maps/mode"];
                let allGfiFeatures = [].concat(...gfiFeatures);

                allGfiFeatures.sort((a, b) => {
                    const zIndexA = rootGetters.layerConfigById(a.getLayerId())?.zIndex || 0,
                        zIndexB = rootGetters.layerConfigById(b.getLayerId())?.zIndex || 0;

                    if (zIndexA < zIndexB) {
                        return -1;
                    }
                    else if (zIndexA > zIndexB) {
                        return 1;
                    }
                    return 0;
                });
                if (mode === "3D") {
                    allGfiFeatures = allGfiFeatures.reverse();
                }
                // only commit if features found
                if (allGfiFeatures.length > 0) {
                    commit("setGfiFeatures", allGfiFeatures);
                }
                else {
                    commit("setGfiFeatures", null);
                }
            })
            .catch(error => {
                if (error.message.includes("The request is not allowed")) {
                    console.warn(error);
                }
                else {
                    dispatch("Alerting/addSingleAlert", i18next.t("common:modules.getFeatureInfo.errorMessage"), {root: true});
                }
            });
    },
    /**
     * Removes a layer from the layer config.
     * @param {Object} context - The vuex context.
     * @param {String} layerId - The layer id.
     * @returns {void}
     */
    removeLayerFromLayerConfig ({rootState, commit}, layerId) {
        if (rootState.layerConfig?.[treeSubjectsKey]) {
            const updatedElements = rootState.layerConfig[treeSubjectsKey].elements.filter(element => element.id !== layerId);

            commit("setLayerConfigByParentKey", {
                layerConfigs: {elements: updatedElements},
                parentKey: treeSubjectsKey
            }, {root: true});
        }
    }
};
