import Cluster from "ol/source/Cluster";
import {getContainingDistrictForFeature} from "../../utils/geomUtils";
import getFeatureStyle from "../../utils/features/getFeatureStyle";
import {getLayerSource} from "../../utils/layer/getLayerSource";
import getVectorlayerMapping, {createVectorLayerMappingObject} from "../utils/getVectorlayerMapping";
import layerCollection from "@core/layers/js/layerCollection";
import setGeomAttributes from "../../utils/features/setGeomAttributes";
import {toRaw} from "vue";

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
        const layer = layerCollection.getLayerById(featureItem.layerId),
            source = layer.layerSource.constructor === Cluster ? layer.layerSource.getSource() : layer.layerSource;

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
                    source.removeFeature(toRaw(featureItem.feature));
                }

                commit("addDisabledFeatureItem", featureItem);
            }
            else {
                if (scenarioFeature) {
                    scenarioFeature.renderFeature();
                }
                else {
                    source.addFeature(toRaw(featureItem.feature));
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
    },

    /**
     * Reads the active vector layers, constructs the list of table items and writes them to the store.
     * Finds the containing district from districtSelector for each feature
     * @todo connect to other features and statistics to build location score
     * @param {string} senderName name of component trying to update the featuresList (optional, passed to updateFeaturesList event)
     * @returns {void}
     */
    updateFeaturesList ({state, getters, commit, rootGetters, dispatch}) {
        commit("setMapping", getVectorlayerMapping(rootGetters.layerConfig.subjectlayer)); // needed for initialization as well as to force cached vuex getters to recompute

        if (typeof rootGetters["Modules/DistrictSelector/selectedDistrictLevel"] === "undefined") {
            return;
        }

        if (!getters.groupActiveLayer.length) {
            commit("setFeaturesListItems", []);
            return;
        }

        commit("setFeaturesListItems", []);

        getters.getActiveVectorLayerList.forEach(vectorLayer => {
            getLayerSource(vectorLayer).once("featuresloadend", () => {
                dispatch("updateFeaturesList");
            });

            const features = getLayerSource(vectorLayer)?.getFeatures() || [],
                // only features that can be seen on the map
                visibleFeatures = features.filter(feature => {
                    const isActive = getters.isFeatureActive(feature, vectorLayer);

                    return isActive;
                }),
                layerMap = getters.layerMapById(vectorLayer.get("id")),
                layerStyleFunction = vectorLayer.getStyleFunction?.(),
                selectedDistrictLevel = rootGetters["Modules/DistrictSelector/selectedDistrictLevel"],
                disabledFeatures = getters.checkDisabledFeatures(vectorLayer);

            let selectedDistricts = selectedDistrictLevel.districts.filter(dist => dist.isSelected === true);

            if (disabledFeatures.length > 0) {
                disabledFeatures.forEach(feature => {
                    if (state.featuresListItems.find(item => item.getId() !== feature.getId())) {
                        commit("appendFeaturesListItems", feature);
                    }
                });
            }
            if (selectedDistricts.length === 0) {
                selectedDistricts = selectedDistrictLevel.districts;
            }
            visibleFeatures.forEach(feature => {
                /**
                 * Set area attributes for polygons, where they are not set in the dataset
                 * @todo should go somewhere else...
                 */
                setGeomAttributes(feature, state.geomAttributes);
                const addressArray = layerMap.addressField.map(field => feature.get(field)),
                    address = addressArray.length === 3 ? `${addressArray[0]} ${addressArray[1]}, ${addressArray[2]}` : addressArray.join(", ");

                commit("appendFeaturesListItems", {
                    key: feature.getId(),
                    name: feature.get(layerMap.keyOfAttrName),
                    style: getFeatureStyle(feature, layerStyleFunction),
                    district: getContainingDistrictForFeature(selectedDistricts, feature, false),
                    group: layerMap.group,
                    layerName: layerMap.id,
                    layerId: layerMap.layerId,
                    gfiAttributes: vectorLayer.values_.gfiAttributes,
                    type: feature.get(layerMap.categoryField),
                    address,
                    feature: feature,
                    enabled: true,
                    isSimulation: feature.get("isSimulation") || false,
                    isModified: feature.get("isModified") || false,
                    ...Object.fromEntries(layerMap.numericalValues.map(field => [field.id, feature.get(field.id)])),
                    ...Object.fromEntries(layerMap.additionalValues.map(field => [field.id, feature.get(field.id)]))
                });
            });
        });
    }
};

export default actions;
