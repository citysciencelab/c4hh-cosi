import layerCollection from "@core/layers/js/layerCollection.js";
import zIndexManager from "@core/layers/js/zIndexManager.js";
import {treeSubjectsKey} from "@shared/js/utils/constants.js";
import store from "@appstore/index.js";
import {resetRenderListeners} from "@shared/js/utils/resetRenderListeners.js";

export default {
    windowWidthChanged ({commit, dispatch, state, getters, rootGetters}) {
        if (getters.windowWidth !== window.innerWidth) {
            commit("setWindowWidth");

            if (!getters.minWidth && rootGetters["Modules/LayerSwiper/active"]) {
                dispatch("toggleSwiper", state.timeSlider.currentLayerId + state.layerAppendix);
            }
        }
    },
    /**
     * Watch the visible layers in layerConfig.
     * Starts and ends wmsTime when time layer is activated/deactivated
     * @param {Object} context the vuex context
     * @param {Object} context.commit the commit
     * @param {Object} context.state the state
     * @param {Object} context.rootGetters the rootGetters
     * @returns {void}
     */
    watchVisibleLayerConfig ({commit, state, rootGetters}) {
        rootGetters.visibleLayerConfigs.forEach(visLayer => {
            if (visLayer.typ === "WMS" && visLayer.time) {
                commit("setTimeSliderActive", {
                    active: true,
                    currentLayerId: visLayer.id,
                    playbackDelay: visLayer.time?.playbackDelay || 1
                });
                commit("setVisibility", true);
            }
        });
        store.watch((_, getters) => getters.visibleLayerConfigs, layerConfig => {
            if (!state.timeSlider.active) {
                layerConfig.forEach(element => {
                    if (element.typ === "WMS" && element.time && !rootGetters["Modules/CompareMaps/active"]) {
                        commit("setTimeSliderActive", {
                            active: true,
                            currentLayerId: element.id,
                            playbackDelay: element.time?.playbackDelay || 1
                        });
                        commit("setVisibility", true);
                    }
                });
            }
            else if (state.timeSlider.active) {
                const currentLayerConf = rootGetters.layerConfigById(state.timeSlider.currentLayerId),
                    visLayerConf = layerConfig.find(layerConf => layerConf.id === currentLayerConf?.id),
                    layerSwiperActive = rootGetters["Modules/LayerSwiper/active"];

                if (!visLayerConf && !layerSwiperActive) {
                    commit("setTimeSliderActive", {
                        active: false,
                        currentLayerId: "",
                        objects: [],
                        playbackDelay: 1,
                        playing: false
                    });
                    commit("setVisibility", false);
                }
            }
        }, {deep: true});
    },
    /**
     * Deactivates the LayerSwiper: resets render listeners on both layers and clears the swiper state.
     * @param {Object} context the vuex context
     * @param {Object} context.commit the commit
     * @param {Object} context.state the state
     * @returns {void}
     */
    deactivateLayerSwiper ({commit, state}) {
        const secondLayerId = state.timeSlider.currentLayerId + state.layerAppendix;

        resetRenderListeners(layerCollection.getLayerById(secondLayerId));
        resetRenderListeners(layerCollection.getLayerById(state.timeSlider.currentLayerId));
        commit("Modules/LayerSwiper/setActive", false, {root: true});
        commit("Modules/LayerSwiper/setSourceLayerId", null, {root: true});
        commit("Modules/LayerSwiper/setTargetLayerId", null, {root: true});
    },
    /**
     * Toggles the LayerSwiper.
     * If the LayerSwiper is deactivated, the second layer is deactivated and removed from the ModelList.
     * @param {Object} context the vuex context
     * @param {Object} context.commit the commit
     * @param {Object} context.state the state
     * @param {Object} context.getters the getters
     * @param {Object} context.dispatch the dispatch
     * @param {String} id Id of the Layer that should be toggled.
     * @returns {void}
     */
    async toggleSwiper ({commit, state, getters, dispatch, rootGetters}, id) {
        const wasLayerSwiperActive = rootGetters["Modules/LayerSwiper/active"];

        commit("Modules/LayerSwiper/setActive", !wasLayerSwiperActive, {root: true});

        const isSecondLayer = id.endsWith(state.layerAppendix),
            baseLayerId = isSecondLayer ? id.replace(state.layerAppendix, "") : id,
            secondId = baseLayerId + state.layerAppendix,
            layerId = wasLayerSwiperActive ? secondId : baseLayerId,
            layer = layerCollection.getLayerById(layerId),
            dimensionValue = layer?.getLayerSource?.().getParams?.()[getters.defaultDimensionName] ?? getters.defaultValue;

        if (!wasLayerSwiperActive) {
            const {name, time, url, level, layers, version, parentId, gfiAttributes, featureCount} = layer.attributes,
                originalZIndex = layer.attributes.zIndex,
                secondLayerZIndex = typeof originalZIndex === "number" ? originalZIndex + 1 : undefined;

            if (typeof secondLayerZIndex === "number") {
                const allLayerConfigs = rootGetters.allLayerConfigs.filter(config => zIndexManager.hasNumericZIndex(config));

                dispatch("updateLayerConfigZIndex", {
                    layerContainer: allLayerConfigs,
                    maxZIndex: originalZIndex
                }, {root: true});
            }

            commit("Modules/LayerSwiper/setSourceLayerId", baseLayerId, {root: true});
            commit("Modules/LayerSwiper/setTargetLayerId", secondId, {root: true});

            if (!layerCollection.getLayerById(secondId)) {
                await dispatch("addLayerToLayerConfig", {
                    layerConfig: {
                        id: secondId,
                        name: name + "_second",
                        showInLayerTree: true,
                        typ: "WMS",
                        type: "layer",
                        visibility: true,
                        time,
                        url,
                        level,
                        layers,
                        version,
                        parentId,
                        legendURL: "ignore",
                        gfiAttributes: gfiAttributes,
                        featureCount: featureCount,
                        zIndex: secondLayerZIndex
                    },
                    parentKey: treeSubjectsKey
                }, {root: true});
                if (typeof secondLayerZIndex === "number") {
                    dispatch("replaceByIdInLayerConfig", {
                        layerConfigs: [{
                            id: secondId,
                            layer: {
                                id: secondId,
                                zIndex: secondLayerZIndex
                            }
                        }]
                    }, {root: true});
                }
            }
            else {
                dispatch("replaceByIdInLayerConfig", {
                    layerConfigs: [{
                        id: secondId,
                        layer: {
                            id: secondId,
                            visibility: true,
                            showInLayerTree: true,
                            zIndex: secondLayerZIndex
                        }
                    }]
                }, {root: true});
            }

            const secondLayer = layerCollection.getLayerById(secondId);

            secondLayer?.updateTime?.(secondId, getters.defaultDimensionName, dimensionValue);
        }
        else {
            const targetLayer = layerCollection.getLayerById(secondId),
                sourceLayer = layerCollection.getLayerById(baseLayerId),
                remainingLayer = isSecondLayer ? sourceLayer : targetLayer,
                remainingDimensionValue = remainingLayer?.getLayerSource?.().getParams?.()[getters.defaultDimensionName] ?? dimensionValue;

            resetRenderListeners(targetLayer);
            resetRenderListeners(sourceLayer);

            if (!isSecondLayer && sourceLayer) {
                const {transparency} = layer?.attributes || {};

                sourceLayer.updateTime?.(baseLayerId, getters.defaultDimensionName, dimensionValue);

                dispatch("replaceByIdInLayerConfig", {
                    layerConfigs: [{
                        id: baseLayerId,
                        layer: {
                            id: baseLayerId,
                            transparency: transparency
                        }
                    }]
                }, {root: true});
            }

            if (remainingDimensionValue) {
                commit("setTimeSliderDefaultValue", remainingDimensionValue);
            }

            dispatch("replaceByIdInLayerConfig", {
                layerConfigs: [{
                    id: secondId,
                    layer: {
                        id: secondId,
                        visibility: false,
                        showInLayerTree: false,
                        zIndex: layer?.attributes?.zIndex
                    }
                }]
            }, {root: true});

            commit("Modules/LayerSwiper/setSourceLayerId", null, {root: true});
            commit("Modules/LayerSwiper/setTargetLayerId", null, {root: true});
        }
    }
};
