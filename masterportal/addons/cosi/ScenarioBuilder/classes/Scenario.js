import ScenarioFeature from "./ScenarioFeature";
import ScenarioNeighborhood from "./ScenarioNeighborhood";
import {getLayerSource} from "../../utils/layer/getLayerSource";
import Feature from "ol/Feature";
import {featuresToGeoJsonCollection} from "../../utils/features/convertToGeoJson";
import {downloadJsonToFile} from "../../utils/download";

/**
 * @description Class storing all information about a created scenario
 * @class Scenario
 * @todo Refactor! It's just a prototype!
 * @todo join modifiedFeatures and simulatedFeatures (?) is there a reason to separate them?
 */
export default class Scenario {
    /**
     * Constructor for class Scenario
     * @param {String} name the name of the scenario
     * @param {module:ol/layer/Vector} [guideLayer] the guideLayer to draw labels to
     * @param {Object} [opts={}] other attributes to set
     */
    constructor (name, guideLayer, opts = {}) {
        this.name = name;
        this.guideLayer = guideLayer;
        this.simulatedFeatures = [];
        this.modifiedFeatures = [];
        this.neighborhoods = [];
        this.isActive = opts.isActive || false;
        this.updated = new Date();

        if (opts.simulatedFeatures) {
            for (const scenarioFeature of opts.simulatedFeatures) {
                this.addFeature(scenarioFeature, this.isActive);
            }
        }
        if (opts.modifiedFeatures) {
            for (const modifiedFeature of opts.modifiedFeatures) {
                this.addModifiedFeature(modifiedFeature.feature, modifiedFeature.layer, modifiedFeature.scenarioData);
            }
        }
        if (opts.neighborhoods) {
            for (const neighborhood of opts.neighborhoods) {
                this.addNeighborhood(neighborhood, this.isActive);
            }
        }
    }

    /**
     * Adds a feature to the scenario
     * @todo use OL feature as input
     * @param {ScenarioFeature} scenarioFeature - the scenariofeature to add to the scenario
     * @param {Boolean} [renderFeature=true] - whether to render the feature on add
     * @returns {ScenarioFeature} the scenario Feature added
     */
    addFeature (scenarioFeature, renderFeature = true) {
        if (scenarioFeature?.constructor !== ScenarioFeature) {
            console.error(`Scenario.addFeature: feature must be of Type ScenarioFeature. Got ${scenarioFeature?.constructor} instead.`);
            return null;
        }

        /** @todo is this the right place? */
        scenarioFeature.scenario = this;

        if (!this.simulatedFeatures.find(item => item === scenarioFeature)) {
            this.simulatedFeatures.push(scenarioFeature);
        }
        if (renderFeature) {
            scenarioFeature.renderFeature(this.guideLayer);
        }

        this.updateScenario();
        return scenarioFeature;
    }

    /**
     * Modifies a given feature's properties and stores the changes on the scenario
     * @param {module:ol/Feature} feature - the feature to modify
     * @param {module:ol/layer/Vector} layer - the layer the feature is on
     * @param {Object} [scenarioData] - the properties belonging to the scenario
     * @returns {ScenarioFeature} the created Scenario Feature
     */
    addModifiedFeature (feature, layer, scenarioData) {
        if (feature?.constructor !== Feature) {
            console.error(`Scenario.addModifiedFeature: feature must be of Type Feature. Got ${feature?.constructor} instead.`);
            return null;
        }
        const scenarioFeature = new ScenarioFeature(feature, layer, this.guideLayer, scenarioData);

        /** @todo is this the right place? */
        scenarioFeature.scenario = this;
        scenarioFeature.linkModifiedFeatureToSource();

        this.modifiedFeatures.push(scenarioFeature);

        return scenarioFeature;
    }

    /**
     * Modifies a given feature's properties and stores the changes on the scenario
     * @param {module:ol/Feature} feature - the feature to modify
     * @param {Object} properties - the properties to change and store
     * @param {module:ol/layer/Vector} [layer] - the layer the feature is on
     * @returns {void}
     */
    modifyFeature (feature, properties, layer) {
        if (feature?.constructor !== Feature) {
            console.error(`Scenario.modifyFeature: feature must be of Type Feature. Got ${feature?.constructor} instead.`);
            return;
        }
        if (properties?.constructor !== Object) {
            console.error(`Scenario.modifyFeature: properties must be of Type Object. Got ${properties?.constructor} instead.`);
            return;
        }
        let scenarioFeature = this.getScenarioFeature(feature);

        if (!scenarioFeature) {
            if (!layer) {
                return;
            }
            scenarioFeature = this.addModifiedFeature(feature, layer);
        }
        // store the altered properties in the scenario
        scenarioFeature.setProperties(properties);
        this.updateScenario();
    }

    /**
     * Resets a modified feature to its original properties
     * @param {module:ol/Feature} feature - the feature from the map to reset
     * @param {String[]} [props] - the props to reset, resets all if none are provided
     * @param {Boolean} [purge=false] - whether to clear the stored scenarioData definitively
     * @returns {void}
     */
    resetFeature (feature, props, purge = false) {
        const scenarioFeature = this.getScenarioFeature(feature);

        if (scenarioFeature) {
            scenarioFeature.resetProperties(props, purge);
        }
        this.updateScenario();
    }

    /**
     * Resets all modified features to their original state
     * @returns {void}
     */
    resetAllFeatures () {
        let item;

        for (item of this.getAllFeatures()) {
            item.resetProperties();
        }
        this.updateScenario();
    }

    /**
     * Resets all modified districts and removes neighborhoods from the map
     * @returns {void}
     */
    resetAllDistricts () {
        let item;

        for (item of this.neighborhoods) {
            item.hideFeature();
        }
        this.updateScenario();
    }

    /**
     * Resets all modified features of a layer to their original state
     * @param {module:ol/layer/Vector} layer - the layer to reset
     * @param {String[]} [props] - the props to reset, resets all if none are provided
     * @param {Boolean} [purge=false] - whether to clear the stored scenarioData definitively
     * @returns {void}
     */
    resetFeaturesByLayer (layer, props, purge = false) {
        const scenarioFeatures = this.getScenarioFeaturesByLayer(layer);
        let item;

        for (item of scenarioFeatures) {
            item.resetProperties(props, purge);
        }
        this.updateScenario();
    }

    /**
     * Adds a neighborhood to the scenario
     * Adds its stats to the surrounding districts
     * @todo use OL feature as input
     * @param {ScenarioFeature} scenarioNeighborhood - the neighborhood to add to the scenario
     * @param {Boolean} [renderNeighborhood] - whether to render the neighborhood on add
     * @returns {ScenarioFeature} the scenario Neighborhood added
     */
    addNeighborhood (scenarioNeighborhood, renderNeighborhood = true) {
        if (scenarioNeighborhood.constructor !== ScenarioNeighborhood) {
            console.error(`Scenario.addNeighborhood: neighborhood must be of Type ScenarioNeighborhood. Got ${scenarioNeighborhood?.constructor} instead.`);
            return null;
        }

        scenarioNeighborhood.scenario = this;
        this.neighborhoods.push(scenarioNeighborhood);

        if (renderNeighborhood) {
            scenarioNeighborhood.renderFeature();
        }

        this.updateScenario();
        return scenarioNeighborhood;
    }

    /**
     * Hides all features in the scenario from the map
     * @returns {void}
     */
    hideScenario () {
        let item;

        this.isActive = false;
        this.resetAllFeatures();
        this.resetAllDistricts();
        for (item of this.simulatedFeatures) {
            item.hideFeature();
        }
        this.updateScenario();
    }

    /**
     * Clears the current scenario
     * @returns {void}
     */
    prune () {
        this.hideScenario();
        this.simulatedFeatures = [];
        this.modifiedFeatures = [];
        this.neighborhoods = [];
    }

    /**
     * Clears the scenario's neighborhoods
     * @returns {void}
     */
    pruneSimulatedFeatures () {
        let item;

        for (item of this.simulatedFeatures) {
            item.hideFeature();
        }

        this.simulatedFeatures = [];
        this.updateScenario();
    }

    /**
     * Clears the scenario's neighborhoods
     * @returns {void}
     */
    pruneNeighborhoods () {
        this.resetAllDistricts();
        this.neighborhoods = [];
    }

    /**
     * Removes a given neighborhood from the scenario
     * @param {module:ol/Feature} feature - the feature in the map
     * @returns {void}
     */
    removeNeighborhood (feature) {
        const neighborhood = this.getNeighborhood(feature);

        if (neighborhood) {
            neighborhood.hideFeature();
            this.neighborhoods = this.neighborhoods.filter(item => item !== neighborhood);
        }
        this.updateScenario();
    }

    /**
     * Removes a given feature from the scenario
     * @param {module:ol/Feature} feature - the feature in the map
     * @returns {void}
     */
    removeSimulatedFeature (feature) {
        const scenarioFeature = this.getScenarioFeature(feature);

        if (scenarioFeature) {
            scenarioFeature.hideFeature();
            this.simulatedFeatures = this.simulatedFeatures.filter(item => item !== scenarioFeature);
        }
        this.updateScenario();
    }

    /**
     * Restores all features of the current scenario
     * @returns {void}
     */
    restore () {
        this.isActive = true;

        for (const item of this.simulatedFeatures) {
            if (!getLayerSource(item.layer)
                .getFeatures()
                .find(feature => feature === item.feature)) {
                item.renderFeature(this.guideLayer);
            }
            item.restoreScenarioProperties();
        }
        for (const item of this.modifiedFeatures) {
            item.restoreScenarioProperties();
        }
        for (const item of this.neighborhoods) {
            item.renderFeature();
        }
        this.updateScenario();
    }

    /**
     * Returns all simulated or modified features of the scenario as a single list
     * @returns {ScenarioFeature[]} all simulated an modified features in the scenario
     */
    getAllFeatures () {
        return [
            ...this.simulatedFeatures,
            ...this.modifiedFeatures
        ];
    }

    /**
     * Returns all simulated features of the scenario as a single list
     * @returns {ScenarioFeature[]} all simulated an modified features in the scenario
     */
    getSimulatedFeatures () {
        return [...this.simulatedFeatures];
    }

    /**
     * Returns all modified features of the scenario as a single list
     * @returns {ScenarioFeature[]} all simulated an modified features in the scenario
     */
    getModifiedFeatures () {
        return [...this.modifiedFeatures];
    }

    /**
     * Returns the ScenarioFeature for a given map feature
     * @param {module:ol/Feature} feature - the OL map feature
     * @param {String} [type] - "simulated" or "modified" or undefined
     * @returns {ScenarioFeature} the scenarioFeature and its scenario specific properties
     */
    getScenarioFeature (feature, type) {
        if (type === "simulated") {
            return this.getSimulatedScenarioFeature(feature);
        }
        if (type === "modified") {
            return this.getModifiedScenarioFeature(feature);
        }

        return this.simulatedFeatures.find(item => item.feature === feature) || this.modifiedFeatures.find(item => item.feature === feature);
    }

    /**
     * Returns the simulated ScenarioFeature for a given map feature
     * @param {module:ol/Feature} feature - the OL map feature
     * @returns {ScenarioFeature} the scenarioFeature and its scenario specific properties
     */
    getSimulatedScenarioFeature (feature) {
        return this.simulatedFeatures.find(item => item.feature === feature);
    }

    /**
     * Returns the modified ScenarioFeature for a given map feature
     * @param {module:ol/Feature} feature - the OL map feature
     * @returns {ScenarioFeature} the scenarioFeature and its scenario specific properties
     */
    getModifiedScenarioFeature (feature) {
        return this.modifiedFeatures.find(item => item.feature === feature);
    }

    /**
     * Returns the ScenarioNeighborhood for a given map feature
     * @param {module:ol/Feature} feature - the OL map feature
     * @returns {ScenarioNeighborhood} the ScenarioNeighborhood and its scenario specific properties
     */
    getNeighborhood (feature) {
        return this.neighborhoods.find(item => item.feature === feature);
    }

    /**
     * Returns all ScenarioNeighborhoods in the scenario
     * @returns {ScenarioNeighborhood[]} the ScenarioNeighborhood and its scenario specific properties
     */
    getNeighborhoods () {
        return [...this.neighborhoods];
    }

    /**
     * Returns all ScenarioFeatures belonging to a specified layer
     * @param {module:ol/layer/Vector} layer - the layer to check
     * @param {String} [type] - "simulated" or "modified" or undefined
     * @returns {ScenarioFeature[]} the scenarioFeatures of a layer
     */
    getScenarioFeaturesByLayer (layer, type) {
        if (type === "simulated") {
            return this.getSimulatedScenarioFeaturesByLayer(layer);
        }
        if (type === "modified") {
            return this.getModifiedScenarioFeaturesByLayer(layer);
        }

        return [
            ...this.simulatedFeatures.filter(item => item.layer === layer),
            ...this.modifiedFeatures.filter(item => item.layer === layer)
        ];
    }

    /**
     * Returns all simulated ScenarioFeatures belonging to a specified layer
     * @param {module:ol/layer/Vector} layer - the layer to check
     * @returns {ScenarioFeature[]} the scenarioFeatures of a layer
     */
    getSimulatedScenarioFeaturesByLayer (layer) {
        return this.simulatedFeatures.filter(item => item.layer === layer);
    }

    /**
     * Returns all modified ScenarioFeatures belonging to a specified layer
     * @param {module:ol/layer/Vector} layer - the layer to check
     * @returns {ScenarioFeature[]} the scenarioFeatures of a layer
     */
    getModifiedScenarioFeaturesByLayer (layer) {
        return this.modifiedFeatures.filter(item => item.layer === layer);
    }

    /**
     * Exports simulated features as geoJson
     * @returns {void}
     */
    exportScenarioFeatures () {
        const geojson = featuresToGeoJsonCollection(
            this.simulatedFeatures.map(scenarioFeature => scenarioFeature.feature)
        );

        downloadJsonToFile(geojson, this.name + "_Simulierte_Einrichtungen.json");
    }


    /**
     * Exports simulated features as geoJson
     * @returns {void}
     */
    exportScenarioNeighborhoods () {
        const geojson = featuresToGeoJsonCollection(
            this.neighborhoods.map(scenarioFeature => scenarioFeature.feature)
        );

        downloadJsonToFile(geojson, this.name + "_Simulierte_Wohnquartiere.json");
    }

    /**
     * Exports simulated features as geoJson
     * @returns {void}
     */
    exportScenario () {
        const geojson = featuresToGeoJsonCollection(
            [
                ...this.getAllFeatures().map(item => item.feature),
                ...this.getNeighborhoods().map(item => item.feature)
            ]
        );

        downloadJsonToFile(geojson, this.name + "_Szenario.json");
    }

    /**
     * stores last update
     * @returns {void}
     */
    updateScenario () {
        this.updated = new Date();
    }

    /**
     * Returns last update time
     * @returns {Date} the last update
     */
    getUpdated () {
        return this.updated;
    }
}
