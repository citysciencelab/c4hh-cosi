import getAvailableYears from "../../utils/getAvailableYears";
import getIntersectionCoverage from "../../ResidentialSimulation/utils/getIntersectionCoverage";
import {getAllContainingDistricts} from "../../utils/geomUtils";
import store from "../../../../src/app-store";
import hash from "object-hash";
import uniqueId from "../../../../src/utils/uniqueId.js";

/**
 * @description Stores the scenario specific properties of a residential district feature
 * @class ScenarioNeighborhood
 */
export default class ScenarioNeighborhood {
    /**
     * Constructor for class ScenarioFeature
     * @param {module:ol/Feature} feature the OpenLayers Feature created
     * @param {module:ol/layer/Vector} layer the OpenLayers layer to render the feature on
     * @param {Object[]} districtLevels The district levels to compute the containing districts for
     */
    constructor (feature, layer, districtLevels) {
        this.feature = feature;
        this.layer = layer;
        this.active = false;
        this.activeDistrictLevels = districtLevels;
        this.scenario = null;

        this.setDefaultProperties();
        this.computeContainingDistricts(districtLevels);
    }

    /**
     * @private
     * @description sets the ID and default flags
     * @returns {void}
     */
    setDefaultProperties () {
        // flag the feature as a neighborhood
        this.feature.set("isNeighborhood", true);
        // create unique hash as ID
        this.feature.set("styleId", uniqueId());
        this.feature.setId(hash({...this.feature.getProperties(), geom: this.feature.getGeometry()}));
    }

    /**
     * Renders the feature to the map and tags it if a guidelayer is provided
     * @todo store tag on the class?
     * @param {module:ol/layer/Vector} guideLayer - the guideLayer to draw tags to
     * @returns {void}
     */
    renderFeature () {
        if (this.active) {
            return;
        }
        this.modifyDistrictStats();
        this.layer.getSource().addFeature(this.feature);
        this.active = true;
    }

    /**
     * removes the feature and the tag from the map
     * @todo remove tag directly without searching the guideLayer
     * @returns {void}
     */
    hideFeature () {
        if (!this.active) {
            return;
        }
        this.active = false;
        this.resetDistrictStats();
        this.layer.getSource().removeFeature(this.feature);
    }

    /**
     * Checks which district contains a given feature
     * and calculates how much of the neighborhood lies within each district
     * @private
     * @param {Object[]} districtLevels - the districtlevels to check
     * @returns {void}
     */
    computeContainingDistricts (districtLevels) {
        const districts = getAllContainingDistricts(districtLevels, this.feature, true);

        this.districts = districts.map(item => {
            return {
                coverage: item.district.adminFeature
                    ? getIntersectionCoverage(this.feature, item.district.adminFeature)
                    : 1,
                ...item
            };
        });
    }

    /**
     * Updates the surrounding districts' statistics based on the stats of the neighborhood
     * @todo move to district methods?
     * @returns {void}
     */
    async modifyDistrictStats () {
        for (const item of this.districts) {
            await store.dispatch("Tools/DistrictSelector/getStatsByDistrict", {
                id: item.district.getId(),
                districtLevel: this.activeDistrictLevels
                    .find(level => level.label === item.districtLevel)
            });

            // if no stats could been fetche for the district, don't try to alter it
            if (item.district.statFeatures.length === 0) {
                console.warn(`No statistics have been loaded for ${item.district.getName()}. Cannot apply neighborhood stats.`);
                continue;
            }

            this.updateStats(item);
        }

        store.dispatch("Tools/DistrictSelector/updateDistricts");
    }

    /**
     * Updates a single stats feature by district
     * @private
     * @param {Object} districtItem - the district object from DistrictSelector
     * @returns {void}
     */
    updateStats (districtItem) {
        const
            years = getAvailableYears(districtItem.district.statFeatures),
            completion = new Date(this.feature.get("year")).getFullYear();
        let year, originalVal;

        for (const datum of this.feature.get("stats") || []) {
            /**
             * @todo IT'S JUST A PROTOTYPE
             */
            if (datum.valueType === "absolute") {
                const districtDatum = districtItem.district.statFeatures.find(d => d.get("kategorie") === datum.category);

                // if a feature is missing, go on
                if (!districtDatum) {
                    continue;
                }

                for (year of years.filter(y => y >= completion)) {
                    originalVal = parseFloat(districtDatum.get("jahr_" + year));

                    if (originalVal) {
                        districtDatum.set("jahr_" + year, originalVal + Math.round(datum.value * districtItem.coverage));
                    }
                }

                // store modification date on the statsfeature
                districtDatum.set("isModified", completion);
            }
            else if (datum.relation) {
                /** @todo auto generate relative values */
            }
        }
    }

    /**
     * Resets the surrounding districts' statistics
     * and keeps only the modificatin by active neighborhoods alive
     * @returns {void}
     */
    resetDistrictStats () {
        const allModifiedDistricts = new Set(this.scenario.neighborhoods.map(neighborhood => neighborhood.districts).flat());

        for (const item of allModifiedDistricts) {
            item.district.statFeatures = item.district.originalStatFeatures.map(feature => feature.clone());
        }
        for (const neighborhood of this.scenario.neighborhoods) {
            if (neighborhood.active) {
                neighborhood.modifyDistrictStats();
            }
        }

        store.dispatch("Tools/DistrictSelector/updateDistricts");
    }

    /**
     * Replaces the map feature and rerenders the neighborhood
     * @param {module:ol/Feature} feature the OpenLayers Feature created
     * @returns {void}
     */
    setFeature (feature) {
        this.hideFeature();
        this.feature = feature;
        this.setDefaultProperties();
        this.renderFeature();
    }
}
