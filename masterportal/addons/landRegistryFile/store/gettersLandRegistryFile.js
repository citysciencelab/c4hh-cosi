import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateLandRegistryFile from "./stateLandRegistryFile.js";
import {getSortedFeatures} from "../utils/sortFeatures.js";

const getters = {
    ...generateSimpleGetters(stateLandRegistryFile),
    /**
     * Returns the ID of the first map-selected feature that is part of the current results.
     * @param {Object} state - The Vuex state object.
     * @returns {string|number|null} The ID of the feature shown in the details, or null if none is selected.
     */
    selectedDetailFeatureId: (state, moduleGetters) => {
        const mapSelectedIds = new Set((state.mapFeaturesSelected || []).map(feature => feature.getId()));

        return moduleGetters.getSortedFeatures.find(feature => mapSelectedIds.has(feature.id))?.id ?? null;
    },
    /**
     * Returns the sorted features from the state's landRegistryFileFeatures based on the sorting configuration.
     * @param {Object} state - The Vuex state object.
     * @returns {function(): Array} - A function that returns the sorted features array, or an empty array if features are not available.
     */
    getSortedFeatures: state => {
        const {landRegistryFileFeatures: features, sorting} = state;

        if (!Array.isArray(features)) {
            return [];
        }

        // Apply sorting
        let sortedFeatures = features;

        if (sorting?.columnName && sorting.order !== "origin") {
            const sorted = getSortedFeatures(features, sorting.columnName);

            sortedFeatures = sorting.order === "asc" ? sorted : sorted.reverse();
        }

        const mapSelectedFeatureIds = (state.mapFeaturesSelected || []).map(feature => feature.getId());

        // Only reorder if selection came from map, not from table button
        if (state.selectionFromMap && mapSelectedFeatureIds?.length > 0) {
            const selectedFeatures = sortedFeatures.filter(f => mapSelectedFeatureIds.includes(f.id));
            const nonSelectedFeatures = sortedFeatures.filter(f => !mapSelectedFeatureIds.includes(f.id));

            return [...selectedFeatures, ...nonSelectedFeatures];
        }

        return sortedFeatures;
    }
};

export default getters;
