
import {generateSimpleGetters} from "@shared/js/utils/generators";
import stateFeaturesList from "./stateFeaturesList";
import layerCollection from "@core/layers/js/layerCollection";

export default {
    ...generateSimpleGetters(stateFeaturesList),

    checkDisabledFeatures: state => function (layer) {
        return state.disabledFeatureItems.filter(item => item.layerId === layer.get("id"));
    },

    getActiveVectorLayerList: (state, getters) => {
        const layerList = layerCollection.getOlLayers().filter(layer => layer.getVisible());

        return layerList.filter(layer => getters.flatActiveVectorLayerIdList.includes(layer.get("id")));
    },

    selectedFeatures (state, {selectedFeatureItems}) {
        return selectedFeatureItems.map(item => item.feature);
    },
    featuresList (state, {featuresListItems}) {
        return featuresListItems.map(item => item.feature);
    },
    featureItemByAttributes: (state, {featuresListItems}) => attrs => {
        return featuresListItems.find(item => {
            for (const key in attrs) {
                if (item.feature.get(key) !== attrs[key]) {
                    return false;
                }
            }
            return true;
        });
    },
    featureByAttribute: (state, {featureItemByAttributes}) => attrs => {
        return featureItemByAttributes(attrs)?.feature;
    },
    activeVectorLayerList (state, {flatActiveVectorLayerIdList}) {
        const layerList = layerCollection.getOlLayers().filter(layer => layer.getVisible());

        return layerList.filter(layer => flatActiveVectorLayerIdList.includes(layer.get("id")));
    },
    activeLayerMapping (state, {mapping}) {
        const layerList = layerCollection.getOlLayers().filter(layer => layer.getVisible()),
            activeLayerList = layerList.map(layer => layer.get("id"));

        return mapping.reduce((groups, group) => {
            const groupLayers = group.layer.filter(layer => activeLayerList.includes(layer.layerId));

            if (groupLayers.length > 0) {
                return [...groups,
                    {
                        group: group.group,
                        layer: groupLayers
                    }
                ];
            }
            return groups;
        }, []);
    },

    /**
     * Create and return an items array with headers for grouped v-select.
     * @param {Object} state - The FeatureList state.
     * @param {Object} getters - The FeatureList getters.
     * @param {Object[]} getters.activeLayerMapping - The mapped active layer by opendata category.
     * @returns {Object[]} .
     * @see {@link  https://vuetifyjs.com/en/api/v-select/#props-items}
     */
    groupActiveLayer (state, {activeLayerMapping}) {
        const items = [];

        activeLayerMapping.forEach(group => {
            items.push({header: group.group, title: group.group, type: "subheader"});
            group.layer.forEach(layer => {
                items.push({value: layer, text: layer.id, title: layer.id});
            });
        });
        return items;
    },
    flatLayerMapping (state, {mapping}) {
        return mapping.reduce((list, group) => {
            return [...list, ...group.layer.map(l => ({...l, group: group.group}))];
        }, []);
    },
    flatActiveVectorLayerIdList (state, {activeLayerMapping}) {
        return activeLayerMapping.reduce((list, group) => {
            return [...list, ...group.layer.map(l => l.layerId)];
        }, []);
    },
    flatActiveLayerMapping (state, {activeLayerMapping}) {
        return activeLayerMapping.reduce((list, group) => {
            return [...list, ...group.layer.map(l => ({...l, group: group.group}))];
        }, []);
    },
    layerMapById: (state, {flatActiveLayerMapping}) => id => flatActiveLayerMapping.find(l => l.layerId === id),
    isFeatureDisabled: (state, {disabledFeatureItems}) => feature => disabledFeatureItems.filter(item => item.feature === feature).length > 0,
    isFeatureActive: (state, {isFeatureDisabled}) => feature => {
        return ((typeof feature.style_?.getImage() !== "undefined" && feature.style_?.getImage() !== null) || (typeof feature.style_?.getStroke() !== "undefined" && feature.style_?.getStroke() !== null) || (typeof feature.style_?.getFill() !== "undefined" && feature.style_?.getFill() !== null)) && !isFeatureDisabled(feature);
    }
};
