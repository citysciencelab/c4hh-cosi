import {WFS} from "ol/format.js";
import getFeature from "@shared/js/api/wfs/getFeature.js";
import getMappingJson from "../../utils/getMappingJson.js";
import oafRequest from "../../../../src/shared/js/api/oaf/getOAFFeature.js";
import {parseFeatures} from "../utils/prepareStatsFeatures.js";
import loadLocalStatFeatures from "../utils/loadLocalStatFeatures.js";
import {mapDistrictNames} from "../utils/prepareDistrictLevels.js";
import {equalTo} from "ol/format/filter";
import {nextTick} from "vue";
import Collection from "ol/Collection";
import i18next from "i18next";

/**
 * Loads the statistical features of a single stats layer for a single district.
 * @param {Object} params - the parameters.
 * @param {Object} params.districtLevel - The district level the layer belongs to.
 * @param {Number} params.index - The index of the layer within districtLevel.stats.
 * @param {String} params.districtName - The district to load the features for.
 * @param {Function} params.getStatFeatures - Function for WFS GetFeature-Request via Post.
 * @param {String} params.srsName - The projection code of the map.
 * @param {module:ol/format/WFS} params.wfsFormat - The format to read WFS responses with.
 * @returns {Promise<module:ol/Feature[]>} The features, empty for an unsupported layer type.
 */
async function loadStatLayerFeatures ({districtLevel, index, districtName, getStatFeatures, srsName, wfsFormat}) {
    const layer = districtLevel.stats.layers[index],
        keyOfAttrName = districtLevel.stats.keyOfAttrName[index];

    if (layer.typ === "WFS") {
        const statFeatures = await getStatFeatures(layer.url, {
            featureTypes: [layer.featureType],
            srsName: srsName,
            propertyNames: districtLevel.propertyNameList[index],
            filter: equalTo(keyOfAttrName, districtName)
        });

        return wfsFormat.readFeatures(statFeatures);
    }
    if (layer.typ === "OAF") {
        const response = await oafRequest.getOAFFeatureGet(layer.url, layer.collection, {
            skipGeometry: true,
            filter: keyOfAttrName + "='" + districtName + "'",
            crs: "http://www.opengis.net/def/crs/EPSG/0/25832",
            filterCrs: "http://www.opengis.net/def/crs/EPSG/0/25832"
        });

        return oafRequest.readAllOAFToGeoJSON(response);
    }
    if (layer.typ === "GeoJSON") {
        // Self-hosted derived statistics (portal/cosi/tools/), e.g. the Sozialmonitoring
        // index aggregated to Stadtteil level. Fetched once and filtered in memory -
        // see loadLocalStatFeatures.
        return loadLocalStatFeatures(layer.url, keyOfAttrName, districtName);
    }

    // Unsupported layer type - an empty result, never the previous layer's features.
    return [];
}

const actions = {
    /**
     * Loads the statistical features for the given districts.
     * @param {Object} store - The vuex store.
     * @param {Function} store.commit - Function to commit a mutation.
     * @param {Function} store.dispatch - Function to dispatch an action.
     * @param {Object} store.rootGetters - The global getters.
     * @param {Object} payload - The payload for this action.
     * @param {Number[]} payload.districtLevel - The district level to which the districts belong.
     * @param {String[]} payload.districts - The districts for which the statistical features are loaded.
     * @param {Function} payload.getStatFeatures - Function for WFS GetFeature-Request via Post.
     * @param {Boolean} [payload.recursive=true] - Should reference districts be loaded automatically?.
     * @returns {void}
     */
    async loadStatFeatures ({dispatch, rootGetters}, {districtLevel, districts, getStatFeatures = getFeature.getFeaturePOST, recursive = true}) {
        const wfsFormat = new WFS(),
            layers = districtLevel.stats.layers,
            // Names of the stats layers that could not be loaded at all, reported once
            // at the end instead of per district x layer.
            failedLayers = new Set();

        let olFeatures;

        for (let i = 0; i < districts.length; i++) {
            // check if statFeatures are already loaded
            if (districts[i].statFeatures.length === 0) {
                const districtName = mapDistrictNames(districts[i].getName(), districtLevel);

                for (let j = 0; j < layers.length; j++) {
                    try {
                        olFeatures = await loadStatLayerFeatures({
                            districtLevel,
                            index: j,
                            districtName,
                            getStatFeatures,
                            srsName: rootGetters["Maps/projectionCode"],
                            wfsFormat
                        });
                    }
                    catch (error) {
                        // A single unreachable collection must not abort the run. The
                        // requests are sequential and the whole chain was unguarded, so one
                        // timing-out Hamburg dataset skipped every remaining layer, every
                        // remaining district AND the closing updateDistricts() that tells
                        // the Dashboard its data is ready - the Dashboard then stayed empty
                        // even for the datasets that had loaded fine.
                        olFeatures = [];
                        failedLayers.add(layers[j].name || layers[j].id);
                        console.error(`loadStatFeatures: ${layers[j].id} failed for ${districtName}`, error);
                    }
                    if (olFeatures.length > 0) {
                        await parseFeatures(olFeatures, districts[i], districtLevel);
                    }
                }
            }
        }

        if (failedLayers.size > 0) {
            // Partially loaded statistics look exactly like real ones ("this district has
            // no data") - say so rather than let an outage pass for a finding.
            dispatch("Alerting/addSingleAlert", {
                category: i18next.t("common:modules.alerting.categories.warning"),
                content: i18next.t("additional:modules.cosi.districtSelector.statsLoadingFailed", {
                    level: districtLevel.label,
                    datasets: [...failedLayers].join(", ")
                })
            }, {root: true});
        }

        // loading reference Districts recursively
        if (districtLevel.referenceLevel !== null && recursive) {
            const referenceLevel = districtLevel.referenceLevel,
                // reference names of the districts
                refNames = districts.map(district => {
                    return mapDistrictNames(district.getReferencDistrictName(), districtLevel.referenceLevel);
                }),
                // reference districts
                refDistricts = referenceLevel.districts.filter(district => {
                    return refNames.includes(mapDistrictNames(district.getName(), referenceLevel));
                });

            await dispatch("loadStatFeatures", {
                districts: referenceLevel.label === "Hamburg" ? referenceLevel.districts : refDistricts,
                districtLevel: referenceLevel,
                getStatFeatures: getFeature.getFeaturePOST
            });
        }
        else {
            await dispatch("updateDistricts");
        }
    },

    setDistrictsByName ({getters, commit}, {districtNames, fromExternal = true, zoomToExtent = true}) {
        const districtFeatures = getters.selectedDistrictLevel.districts,
            newSelection = districtFeatures.filter(dist => districtNames.includes(dist.getName())),
            adminFeatures = newSelection.map(dist => dist.adminFeature),
            collection = new Collection(adminFeatures);

        collection.set("fromExternal", fromExternal);
        collection.set("zoomToExtent", zoomToExtent);
        commit("setSelectedDistrictsCollection", collection);
    },

    /**
     * Gets all statistical features for the given district.
     * @param {Object} store - The vuex store.
     * @param {Function} store.dispatch - Function to dispatch an action.
     * @param {Object} payload - The payload for this action.
     * @param {String} payload.id - The id of the district.
     * @param {Object} payload.districtLevel - The level the district belongs to.
     * @returns {module:ol/Feature[]} The statistical features.
     */
    async getStatsByDistrict ({dispatch}, {id, districtLevel}) {
        const foundDistrict = districtLevel.districts.find(district => district.getId() === id);

        // Return stats if already stored
        if (foundDistrict.statFeatures.length > 0) {
            return foundDistrict.statFeatures;
        }

        await dispatch("loadStatFeatures", {
            districts: [foundDistrict],
            districtLevel: districtLevel,
            getStatFeatures: getFeature.getFeaturePOST,
            recursive: false
        });

        return foundDistrict.statFeatures;
    },

    /**
     * triggers an lifecycle update event by altering the state for one tick
     * @param {Object} store - The vuex store.
     * @param {Function} store.commit - Function to dispatch an action.
     * @returns {void}
     */
    async updateDistricts ({commit}) {
        commit("setLoadend", false);
        await nextTick();
        commit("setLoadend", true);
    },

    /**
     * Loads the mapping of statistical categories from portalconfigs.
     * @param {Object} state - the DistrictSelector store state
     * @returns {void}
     */
    async loadMapping ({state, commit}) {
        if (state.mapping === null) {
            const mapping = await getMappingJson();

            commit("setMapping", mapping);
        }
    }
};

export default actions;
