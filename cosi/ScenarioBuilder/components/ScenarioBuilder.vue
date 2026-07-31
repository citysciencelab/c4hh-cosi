<script>
import {addSimulationTag, clearGuideLayer, featureTagStyleMod, featureTagStyle, removeSimulationTag} from "../utils/guideLayer";
import layerCollection from "@core/layers/js/layerCollection";
import layerFactory from "@core/layers/js/layerFactory";
import {mapGetters, mapActions, mapMutations} from "vuex";
import mutations from "../store/mutationsScenarioBuilder";
import ScenarioBuilderManager from "./ScenarioBuilderManager.vue";
import ScenarioBuilderPlanner from "./ScenarioBuilderPlanner.vue";
import ToolInfo from "../../shared/modules/toolInfo/components/ToolInfo.vue";

export default {
    name: "ScenarioBuilder",

    components: {
        ToolInfo,
        ScenarioBuilderManager,
        ScenarioBuilderPlanner
    },

    provide () {
        return {
            addFeatureToScenario: this.addFeatureToScenario,
            removeFeatureFromScenario: this.removeFeatureFromScenario,
            toggleCurrentView: this.toggleCurrentView
        };
    },

    data () {
        return {
            // The current view of the ScenarioBuilder component. It can be either 'manager' or 'planner'.
            currentView: "manager",
            guideLayer: null,
            // The layer that holds the features of the active scenario.
            scenarioLayer: null
        };
    },

    computed: {
        ...mapGetters("Modules/ScenarioBuilder", ["activeScenarioCard"])
    },

    watch: {
        activeScenarioCard (newCard) {
            if (newCard) {
                this.updateLayer();
            }
        }
    },

    async created () {
        this.scenarioLayer = this.getLayerById("active-scenario");
        this.getLayerById("active-scenario").getLayer().setVisible(true);
        this.getLayerById("active-scenario").getLayer().setZIndex(10);
        await this.createGuideLayer();
    },

    methods: {
        ...mapMutations("Modules/ScenarioBuilder", Object.keys(mutations)),
        ...mapActions("Maps", ["addNewLayerIfNotExists"]),

        /**
         * Adds a feature to the scenario layer and tags it for simulation.
         * @param {Feature} feature - The feature to be added to the scenario.
         */
        addFeatureToScenario (feature) {
            this.scenarioLayer.getLayerSource().addFeature(feature);
            addSimulationTag(feature, this.guideLayer);
        },

        /**
         * Clears all features from the scenario layer and removes any associated guide layer features.
         * @returns {void}
         */
        clearFeaturesFromScenario () {
            this.scenarioLayer.getLayerSource().clear();
            clearGuideLayer(this.guideLayer);
        },

        /**
         * Gets a layer by its ID from the layer collection. If the layer does not exist,
         * it creates a new vector-based layer with the specified ID, adds it to the layer collection,
         * and then returns the newly created layer.         *
         * @param {string} id - The unique identifier of the layer to get or create.
         * @returns {Object} The layer object corresponding to the given ID.
         */
        getLayerById (id) {
            if (typeof layerCollection.getLayerById(id) !== "undefined") {
                return layerCollection.getLayerById(id);
            }
            const layer = layerFactory.createLayer({
                typ: "VECTORBASE",
                id: id,
                name: id,
                alwaysOnTop: true,
                visibility: true
            });

            layerCollection.addLayer(layer);
            return layer;
        },

        /**
         * @description create a guide layer used for additional info to display on the map
         * @returns {void}
         */
        async createGuideLayer () {
            const newLayer = await this.addNewLayerIfNotExists({layerName: this.id + "_layer"});

            newLayer.setVisible(true);
            newLayer.setStyle(function (feature) {
                if (feature.get("isModified") && !feature.get("isSimulation")) {
                    return [featureTagStyleMod(feature)];
                }
                return [featureTagStyle(feature)];
            });
            newLayer.setZIndex(15);
            this.guideLayer = newLayer;

            return newLayer;
        },

        /**
         * Removes a feature from the scenario layer and un-tags it from the guide layer.
         * @param {Feature} feature - The feature to be removed from the scenario.
         */
        removeFeatureFromScenario (feature) {
            this.scenarioLayer.getLayerSource().removeFeature(feature);
            removeSimulationTag(feature, this.guideLayer);
        },

        /**
         * Toggles the current view between 'manager' and 'planner'.
         * @param {string} view - The view to switch to.
         * @returns {void}
         */
        toggleCurrentView (view) {
            this.currentView = view;
        },

        /**
         *
         * @return {void}
         */
        updateLayer () {
            const {title, objects} = this.activeScenarioCard,
                  layer = this.scenarioLayer.getLayer(),
                  features = objects.map(obj => obj.feature);

            this.scenarioLayer.set("name", title);
            layer.set("name", title);

            this.clearFeaturesFromScenario();

            features.forEach(feature => {
                this.addFeatureToScenario(feature);
            });
        }
    }
};
</script>

<template lang="html">
    <div id="scenario-builder">
        <ToolInfo />
        <ScenarioBuilderManager
            v-if="currentView === 'manager'"
        />
        <ScenarioBuilderPlanner
            v-else-if="currentView === 'planner'"
        />
    </div>
</template>
