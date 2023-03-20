import {getLayerSource} from "../../utils/layer/getLayerSource";
import {createVectorLayerMappingObject} from "../utils/getVectorlayerMapping";

const actions = {
    /**
     * @description dis-/enables a feature in the map
     * @param {Function} store.dispatch - Function to dispatch an action.
     * @param {Function} store.commit - Function to commit a mutation.
     * @param {Object} store.rootGetters - the root store's getters
     * @param {Object} featureItem - The featureItem to dis-/enable
     * @returns {void}
     */
    toggleFeatureDisabled ({dispatch, commit, rootGetters}, featureItem) {
        const
            layerById = rootGetters["Maps/getLayerById"],
            layer = layerById({layerId: featureItem.layerId}),
            source = getLayerSource(layer);

        // remove all highlightings to avoid undefined errors on the map
        dispatch("Maps/removeHighlightFeature", null, {root: true});
        if (layer) {
            let scenarioFeature;

            if (featureItem.isModified || featureItem.isSimulation) {
                scenarioFeature = rootGetters["Tools/ScenarioBuilder/activeScenario"]?.getScenarioFeature(featureItem.feature);
            }

            if (!featureItem.enabled) {
                if (scenarioFeature) {
                    scenarioFeature.hideFeature();
                }
                else {
                    source.removeFeature(featureItem.feature);
                }

                commit("addDisabledFeatureItem", featureItem);
            }
            else {
                if (scenarioFeature) {
                    scenarioFeature.renderFeature();
                }
                else {
                    source.addFeature(featureItem.feature);
                }
                commit("removeDisabledFeatureItem", featureItem);
            }
        }
    },
    /**
     * @description adds a layer to the mapping on runtime
     * @param {Function} store.commit - Function to commit a mutation.
     * @param {Object} store.getters - the featuresList getters
     * @param {Object} layer - The layer object to add
     * @returns {void}
     */
    addVectorlayerToMapping ({commit, getters}, layer) {
        const {mapping} = getters,
            layerMap = createVectorLayerMappingObject(layer);

        let group = mapping.find(x => x.group === layer.group || x.group === layer.parendId),
            _mapping = mapping;

        if (group) {
            group.layer.push(layerMap);
        }
        else {
            group = {
                group: layer.group,
                layer: [
                    layerMap
                ]
            };
            _mapping = [..._mapping, group];
        }

        commit("setMapping", [..._mapping]);
    },
    /**
     * @description removes a layer from the mapping on runtime
     * @param {Function} store.commit - Function to commit a mutation.
     * @param {Object} store.getters - the featuresList getters
     * @param {Object} layerMap - The mappingObj to remove
     * @returns {void}
     */
    removeVectorLayerFromMapping ({commit, getters}, layerMap) {
        const {mapping} = getters;
        let _mapping = [...mapping];

        for (const group of _mapping) {
            group.layer = group.layer.filter(el => el !== layerMap);

            if (group.layer.length === 0) {
                _mapping = _mapping.filter(el => el !== group);
            }
        }

        commit("setMapping", _mapping);
    }
};

export default actions;
