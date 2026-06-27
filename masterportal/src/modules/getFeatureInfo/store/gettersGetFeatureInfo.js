import Point from "ol/geom/Point.js";
import {buffer} from "ol/extent.js";
import {createGfiFeature} from "@shared/js/utils/getWmsFeaturesByMimeType.js";
import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import gfiFeatureProvider from "@shared/js/utils/getGfiFeaturesByTileFeature.js";
import stateGetFeatureInfo from "./stateGetFeatureInfo.js";
import {getWebglFeaturesFromLayers} from "@shared/js/utils/getWebglFeaturesFromLayers.js";

/**
 * The getters for the getFeatureInfo.
 * @module modules/getFeatureInfo/store/gettersGetFeatureInfo
 */
export default {
    ...generateSimpleGetters(stateGetFeatureInfo),

    /**
     * Gets the features at the given pixel for the gfi.
     * @param {Number[]} clickPixel The pixel coordinate of the click event in 2D
     * @param {String} mode The current map mode
     * @returns {Object[]} gfi features
     */
    gfiFeaturesAtPixel: () => (clickPixel, clickCoordinate, mode) => {
        const featuresAtPixel = [];

        if (clickPixel && mode === "2D") {
            mapCollection.getMap("2D").forEachFeatureAtPixel(clickPixel, (feature, layer) => {
                if (layer?.getVisible() && layer?.get("gfiAttributes") && layer?.get("gfiAttributes") !== "ignore") {
                    if (feature.getProperties().features) {
                        feature.get("features").forEach(clusteredFeature => {
                            featuresAtPixel.push(createGfiFeature(
                                layer,
                                "",
                                clusteredFeature
                            ));
                        });
                    }
                    else {
                        featuresAtPixel.push(createGfiFeature(
                            layer,
                            "",
                            feature
                        ));
                    }
                }
            }, {
                // filter WebGL layers and look at them individually
                layerFilter: layer => layer.get("renderer") !== "WebGL",
                hitTolerance: 1
            });
            /** check WebGL Layers
            * use buffered coord instead of pixel for hitTolerance and to catch overlapping WebGL features
            */
            const map = mapCollection.getMap("2D");
            const resolution = mapCollection.getMapView("2D").getResolution();

            const webglLayers = map.getLayers().getArray()
                .filter(layer => layer.get("renderer") === "webgl");

            const webglFeatures = getWebglFeaturesFromLayers(
                map,
                webglLayers,
                layer => buffer(
                    new Point(clickCoordinate).getExtent(),
                    (layer.get("hitTolerance") || 1) * Math.sqrt(resolution)
                )
            );

            featuresAtPixel.push(...webglFeatures);
        }
        if (mode === "3D") {
            // add features from map3d
            const scene = mapCollection.getMap("3D").getCesiumScene(),
                clickFeatures = scene.drillPick({x: clickPixel[0], y: clickPixel[1]});

            clickFeatures.forEach(clickFeature => {
                if (clickFeature instanceof Cesium.Cesium3DTileFeature) {
                    const gfiFeatures = gfiFeatureProvider.getGfiFeaturesByTileFeature(clickFeature);

                    if (Array.isArray(gfiFeatures)) {
                        gfiFeatures.forEach(gfiFeature => {
                            featuresAtPixel.push(gfiFeature);
                        });
                    }
                }
                else if (clickFeature?.primitive instanceof Cesium.Billboard
                    && clickFeature.primitive.olLayer?.get("gfiAttributes")
                    && clickFeature.primitive.olLayer?.get("gfiAttributes") !== "ignore"
                ) {
                    const containedFeature = featuresAtPixel.find(gfiFeature => gfiFeature.getLayerId() === clickFeature.primitive?.olLayer.get("id") && gfiFeature.getOlFeature().getId() === clickFeature.primitive?.olFeature.getId());

                    if (!containedFeature) {
                        featuresAtPixel.push(createGfiFeature(
                            clickFeature.primitive?.olLayer,
                            "",
                            clickFeature.primitive?.olFeature
                        ));
                    }
                }
            });
        }

        return featuresAtPixel;
    },

    /**
     * Reverse the gfi features
     * @param {Object} state - the state
     * @returns {Array} reversed gfiFeatures Array from state
     */
    gfiFeaturesReverse: (state) => {
        if (state.gfiFeatures !== null && Array.isArray(state.gfiFeatures)) {
            return state.gfiFeatures.slice().reverse();
        }

        return state.gfiFeatures;
    },

    /**
     * Provides state for urlParams.
     * @param {Object} state state of the app-store.
     * @returns {Object} state for urlParams
     */
    urlParams: state => {
        const urlParamsState = Object.assign({}, state, {
            layerId: state.currentFeature ? state.currentFeature.getLayerId() : state.gfiFeatures[0].getLayerId()
        });

        urlParamsState.currentFeature = null;
        urlParamsState.gfiFeatures = [];

        return urlParamsState;
    }
};
