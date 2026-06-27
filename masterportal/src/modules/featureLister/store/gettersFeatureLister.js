import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import featureListerState from "./stateFeatureLister.js";
import layerCollection from "@core/layers/js/layerCollection.js";

const simpleGetters = {
    ...generateSimpleGetters(featureListerState),

    /**
     * Returns the feature to the given index in the list of gfiFeatures.
     * Clustering is respected.
     * @param {Object} state state of this module
     * @param {Number} featureId id of the feature in the list of gfiFeatures
     * @returns {ol.feature} the feature to the given index
     */
    selectedFeature: state => featureId => {
        const gfiFeature = state.gfiFeaturesOfLayer.find(f => f.id === featureId);

        if (gfiFeature?.olFeature) {
            return gfiFeature.olFeature;
        }

        const layer = layerCollection.getLayerById(state.layer.id),
            features = layer.getLayerSource().getFeatures();

        return features.find(feat => feat.getId() === featureId)
            || features.find(feat => feat.get("features")?.find(feat_ => feat_.getId() === featureId));
    },
    /**
     * Gets a list of all property keys to show in a table header.
     * @param {Object} state state of this module
     * @param {Object} getters getters of this module
     * @param {Object} rootState root state
     * @param {Object} rootGetters root getters
     * @returns {Array} [key, value] for each property
     */
    headers: (state, getters, rootState, rootGetters) => {
        let index = 0,
            headers = [];

        if (state.gfiFeaturesOfLayer.length > 0) {
            const keySet = new Set(["id"]),
                keyToValue = {id: "id"};

            state.gfiFeaturesOfLayer.forEach(it => {
                let keys = it.getAttributesToShow();

                keys = keys === "showAll"
                    ? Object.keys(it.getProperties()).map(prop => [prop, prop])
                    : Object.entries(keys);
                keys.forEach(([key, value]) => {
                    if (!rootGetters.ignoredKeys.includes(key.toUpperCase())) {
                        keySet.add(key);
                        if (!(key in keyToValue)) {
                            keyToValue[key] = typeof value === "object" && value.name ? value.name : value;
                        }
                    }
                });
            });
            headers = Array.from(keySet).map(key => ({
                name: key === "id" ? key : keyToValue[key],
                index: index++,
                visible: key !== "id"
            }));
        }
        return headers;
    },
    /**
     * Returns the details of the selected feature for the detail view
     * @returns {Object} the details of the selected feature.
     */
    featureDetails (state, getters, rootState, rootGetters) {
        const feature = state.gfiFeaturesOfLayer.find(f => f.id === state.selectedRow.id),
            ignoredKeys = [...rootGetters.ignoredKeys, "ID"],
            valuesToFilter = ["", null, undefined];

        let attributes = Object.values(feature.getAttributesToShow());

        if (feature.getAttributesToShow() === "showAll") {
            const keys = Object.keys(state.selectedRow);

            attributes = keys.filter(key => !ignoredKeys.includes(key.toUpperCase()));
        }

        return Object.fromEntries(
            Object.entries(state.selectedRow).filter(([key, value]) => attributes.includes(key) && !valuesToFilter.includes(value)
            )
        );
    },
    /**
     * Returns the geometry type of the layer.
     * @param {Object} state state of this module
     * @returns {String} the geometry type of the layer.
     */
    getGeometryType: state => {
        if (state.layer.geometryType) {
            return state.layer.geometryType;
        }
        const layer = layerCollection.getLayerById(state.layer.id),
            features = layer.getLayerSource().getFeatures();

        if (features.length > 0) {
            return features[0].getGeometry().getType();
        }
        console.warn("Fails to highlighting feature: no geometry type for layer ", state.layer.id);
        return null;
    }
};

export default simpleGetters;
