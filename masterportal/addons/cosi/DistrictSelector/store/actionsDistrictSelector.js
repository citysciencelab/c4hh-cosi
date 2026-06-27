import {WFS} from "ol/format.js";
import getFeature from "@shared/js/api/wfs/getFeature.js";
import getMappingJson from "../../utils/getMappingJson.js";
import oafRequest from "../../../../src/shared/js/api/oaf/getOAFFeature.js";
import {parseFeatures} from "../utils/prepareStatsFeatures.js";
import {mapDistrictNames} from "../utils/prepareDistrictLevels.js";
import {equalTo} from "ol/format/filter";
import {nextTick} from "vue";
import Collection from "ol/Collection";

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
            layers = districtLevel.stats.layers;

        let olFeatures;

        for (let i = 0; i < districts.length; i++) {
            // check if statFeatures are already loaded
            if (districts[i].statFeatures.length === 0) {
                const districtName = mapDistrictNames(districts[i].getName(), districtLevel);

                for (let j = 0; j < layers.length; j++) {
                    if (districtLevel.stats.layers[j].typ === "WFS") {
                        const statFeatures = await getStatFeatures(districtLevel.stats.layers[j].url, {
                            featureTypes: [districtLevel.stats.layers[j].featureType],
                            srsName: rootGetters["Maps/projectionCode"],
                            propertyNames: districtLevel.propertyNameList[j],
                            filter: equalTo(districtLevel.stats.keyOfAttrName[j], districtName)
                        });

                        olFeatures = wfsFormat.readFeatures(statFeatures);
                    }
                    else if (districtLevel.stats.layers[j].typ === "OAF") {
                        const response = await oafRequest.getOAFFeatureGet(
                            districtLevel.stats.layers[j].url,
                            districtLevel.stats.layers[j].collection,
                            {
                                skipGeometry: true,
                                filter: districtLevel.stats.keyOfAttrName[j] + "='" + districtName + "'",
                                crs: "http://www.opengis.net/def/crs/EPSG/0/25832",
                                filterCrs: "http://www.opengis.net/def/crs/EPSG/0/25832"
                            }
                        );

                        olFeatures = oafRequest.readAllOAFToGeoJSON(response);
                    }
                    if (olFeatures.length > 0) {
                        await parseFeatures(olFeatures, districts[i], districtLevel);
                    }
                    else {
                        // dispatch("Alerting/addSingleAlert", {
                        //     content: "Es konnten nicht alle Datensätze vollständig geladen werden! Bitte versuchen Sie es später erneut. Sollte der Fehler weiterhin bestehen nutzen Sie bitte das Kontaktformular.",
                        //     category: "Warning",
                        //     cssClass: "warning"
                        // }, {root: true});
                    }
                }
            }
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
