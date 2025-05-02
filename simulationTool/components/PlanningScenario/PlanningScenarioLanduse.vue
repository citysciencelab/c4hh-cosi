<script>
import ConvertStyle from "../../js/convertStyle";
import {Style} from "ol/style.js";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import {GeoJSON} from "ol/format.js";
import getOAFFeature from "../../../../src/shared/js/api/oaf/getOAFFeature";
import isObject from "../../../../src/shared/js/utils/isObject";
import layerCollection from "../../../../src/core/layers/js/layerCollection";
import layerFactory from "../../../../src/core/layers/js/layerFactory";
import ListGroup from "../shared/ListGroup.vue";
import {mapGetters, mapMutations} from "vuex";
import NavTab from "../../../../src/shared/modules/tabs/components/NavTab.vue";
import SpinnerItem from "../../../../src/shared/modules/spinner/components/SpinnerItem.vue";
import SwitchInput from "../../../../src/shared/modules/checkboxes/components/SwitchInput.vue";
import {Stroke} from "ol/style";

export default {
    name: "PlanningScenarioLanduse",
    components: {
        FlatButton,
        ListGroup,
        NavTab,
        SpinnerItem,
        SwitchInput
    },
    data () {
        return {
            currentEditableInput: "",
            featuresByInput: [],
            featureLayerId: "planning-scenario-landuse"
        };
    },
    computed: {
        ...mapGetters("Modules/SimulationTool", [
            "currentPlanningScenarioId",
            "planningScenarios",
            "simulations",
            "simulationAreaStyle",
            "planningScenarioCurrentLayout",
            "planningScenarioHighlightFeatureStyle"
        ]),

        /**
         * Filters all features of the current input that are marked as created.
         * @return {ol/Feature[]} Array of created features.
         */
        createdFeaturesByInput () {
            return this.featuresByInput.filter(feature => feature.get("created") === true) || [];
        },

        /**
         * Gets the crs configured in the current simulation.
         * @returns {String} The current crs.
         */
        currentCrs () {
            return this.currentSimulation?.inputs?.crs;
        },

        /**
         * Gets the simulation config object that is set for the current planning scenario.
         * @returns {Object} The current simulation config.
         */
        currentSimulation () {
            return this.simulations.find(sim => sim.id === this.planningScenario.simulationId);
        },

        /**
         * Gets all simulation inputs marked as editable.
         * @returns {Object} An inputs object containing only the editable inputs.
         */
        editableInputs () {
            if (!this.currentSimulation?.inputs) {
                return undefined;
            }

            return Object.fromEntries(
                Object.entries(this.currentSimulation.inputs).filter(([, value]) => {
                    return value.editable;
                })
            );
        },

        /**
         * Filters all features of the current input that are marked as not created.
         * @return {ol/Feature[]} Array of created buildings in the current scenario.
         */
        existingFeaturesByInput () {
            return this.featuresByInput.filter(feature => {
                const attribute = feature.get("created");

                return attribute === undefined || attribute === false;
            });
        },

        /**
         * Gets if the features of planning scenario are loaded.
         * @return {Boolean} true if the features are loaded.
         */
        isLoaded () {
            return this.planningScenario.featuresLoaded;
        },

        /**
         * Gets the currently selected planning scenario.
         * @return {Object} The current planning scenario.
         */
        planningScenario () {
            return this.planningScenarios.find(scenario => scenario.id === this.currentPlanningScenarioId);
        },

        /**
         * Gets the shown properties of the feature in the list
         * @return {String[]} The shown properties.
         */
        getPropertiesToShow () {
            return this.editableInputs[this.currentEditableInput]?.propertiesToShow;
        },

        /**
         * Checks if the value for the currentEditableInput is true which results in a checked toggle.
         * @returns {Boolean} true if the toggle is checked.
         */
        isShowToggleChecked () {
            if (isObject(this.planningScenario?.showExistingItems)) {
                return this.planningScenario?.showExistingItems[this.currentEditableInput] ?? false;
            }
            return false;
        }
    },

    watch: {
        currentEditableInput (newValue) {
            this.updateFeatures(newValue);
        }
    },

    async mounted () {
        if (!this.planningScenario) {
            return;
        }
        if (!isObject(this.planningScenario.showExistingItems)) {
            this.planningScenario.showExistingItems = {};
            Object.keys(this.editableInputs).forEach(input => {
                this.planningScenario.showExistingItems[input] = true;
            });
        }
        this.currentEditableInput = Object.keys(this.editableInputs)[0];

        if (!this.planningScenario.featuresLoaded) {
            try {
                await this.fetchFeatures(
                    this.planningScenario, this.editableInputs, this.getBBOXGeometry(this.planningScenario), this.currentCrs
                );

                this.planningScenario.featuresLoaded = true;
            }
            catch (error) {
                console.warn(error);
            }
        }
        if (this.planningScenario.showExistingItems[this.currentEditableInput] === true) {
            this.addScenarioFeatures(this.planningScenario.scenarioFeature.features);
            this.updateFeatures();
        }
        // layerCollection.getLayerById(this.featureLayerId)?.getLayer()?.setVisible(this.planningScenario.showExistingItems[this.currentEditableInput]);
    },
    unmounted () {
        this.clearFeatures();
        layerCollection.getLayerById("planning-scenario").getLayerSource().clear();
    },
    methods: {
        ...mapMutations("Modules/SimulationTool", [
            "setCurrentPlanningComponent",
            "setCurrentInputName"
        ]),

        /**
         * Adds the scenario features to its layer.
         * @param {GeoJSON[]} features - An array of GeoJSON features.
         * @returns {void}
         */
        addScenarioFeatures (features) {
            if (!features) {
                return;
            }

            const geoJsonParser = new GeoJSON(),
                layerSource = layerCollection.getLayerById("planning-scenario").getLayerSource();

            features.forEach(feature => {
                const olFeature = geoJsonParser.readFeature(feature);

                olFeature.setStyle(ConvertStyle.geoJsonToOpenlayers(feature.style));
                layerSource.addFeature(olFeature);
            });
        },

        /**
         * Removes all features from the source.
         * @returns {void}
         */
        clearFeatures () {
            if (this.getLayerSource().getFeatures().length) {
                this.getLayerSource().clear(true);
            }
        },

        /**
         * Performs GET-Requests for all editable oaf inputs and sets the features in the scenario parameter object.
         * @param {Object} scenario The planning scenario for which the features are to be loaded.
         * @param {Object} inputs Config object from simulation containing input types and sources.
         * @param {ol/Geometry/Polygon} bboxGeometry - The polygon geometry of the bbox.
         * @param {String} crs The crs for the simulation.
         * @return {void}
         */
        async fetchFeatures (scenario, inputs, bboxGeometry, crs) {
            const entries = Object.entries(inputs);

            for (let i = 0; i < entries.length; i++) {
                const [inputKey, input] = entries[i];

                if (input?.source?.type === "oaf") {
                    const filter = getOAFFeature.getOAFGeometryFilter(bboxGeometry, "geometry", "intersects");

                    scenario.inputs[inputKey] = {};
                    scenario.inputs[inputKey].features = await getOAFFeature.getOAFFeatureGet(input.source.url, input.source.collection, 100, filter, crs, crs);
                }
            }
        },

        /**
         * Gets the bounding box of the passed scenario.
         * @param {Object} scenario - The current scenario.
         * @returns {ol/Geometry/Polygon} The BBOX geometry.
         */
        getBBOXGeometry (scenario) {
            const simulationAreaFeature = scenario.scenarioFeature?.features.find(feature => {
                return feature.properties?.id === "simulation-area";
            });

            if (!simulationAreaFeature) {
                return undefined;
            }

            return new GeoJSON().readFeature(simulationAreaFeature).getGeometry();
        },

        /**
         * Gets the features of an input.
         * @param {String} key - The key of the input.
         * @returns {Object[]} An array of geojson features.
         */
        getInputFeatures (key) {
            return this.planningScenario?.inputs[key].features;
        },

        /*
         * Creates a layer if it does not yet exist and returns its source.
         * @returns {ol/source/Vector} A vector source.
         */
        getLayerSource () {
            if (typeof layerCollection.getLayerById(this.featureLayerId) !== "undefined") {
                return layerCollection.getLayerById(this.featureLayerId).getLayerSource();
            }
            const layer = layerFactory.createLayer({
                typ: "VECTORBASE",
                id: this.featureLayerId,
                name: this.featureLayerId,
                alwaysOnTop: true
            });

            layerCollection.addLayer(layer);
            return layer.getLayerSource();
        },

        /**
         * Parses the given GeoJSON features to openlayers features and adds them to the source.
         * @param {GeoJSON[]} features - An array of GeoJSON features.
         * @returns {void}
         */
        parseAndAddFeatures (features) {
            const geoJsonParser = new GeoJSON();

            features.forEach(feature => {
                const olFeature = geoJsonParser.readFeature(feature);

                olFeature.setId(feature.id);

                if (feature.style === "") {
                    olFeature.setStyle(new Style());
                }
                else if (isObject(feature.style)) {
                    olFeature.setStyle(new Style({
                        stroke: new Stroke({
                            color: feature.style.strokeColor,
                            width: feature.style.strokeWidth
                        })
                    }));
                }
                else {
                    olFeature.setStyle(null);
                }

                this.getLayerSource().addFeature(olFeature);
            });

            this.featuresByInput = this.getLayerSource().getFeatures();
        },

        /**
         * Removes a feature from the current editable input.
         * @param {String} id - The id of the feature to be removed.
         * @returns {void}
         */
        removeFeature (id) {
            this.planningScenario.inputs[this.currentEditableInput].features = this.getInputFeatures(this.currentEditableInput).filter(feature => {
                return feature.id !== id;
            });
            this.updateFeatures();
        },

        /**
         * Saves the planning scenario and reset the highlight features.
         * @returns {void}
         */
        save () {
            this.setHighlightFeature();
            this.setCurrentPlanningComponent("");
        },

        /**
         * Sets a feature attribute of the current editable input.
         * @param {String} value - The value to be set.
         * @param {String} key - The key of the attribute to be set.
         * @param {String} id - The id of the feature to be updated.
         * @returns {void}
         */
        setFeatureAttribute (value, key, id) {
            this.getInputFeatures(this.currentEditableInput).map(feature => {
                if (feature.id === id) {
                    feature.properties[key] = value;
                }
                return feature;
            });
            this.updateFeatures();
        },

        /**
         * Sets the style of a feature of the current editable input.
         * @param {ol/style/Style} style - The style to be set.
         * @param {String} id - The id of the feature to be updated.
         * @returns {void}
         */
        setFeatureStyle (style, id) {
            this.getInputFeatures(this.currentEditableInput).map(feature => {
                if (feature.id === id) {
                    feature.style = style === null ? null : "";
                }
                return feature;
            });
            this.updateFeatures();
        },

        /**
         * Sets the highlight feature with style.
         * @param {String} id - The id of the feature..
         * @returns {void}
         */
        setHighlightFeature (id) {
            this.getInputFeatures(this.currentEditableInput).map(feature => {
                if (feature.style !== "") {
                    if (feature.id === id) {
                        feature.style = this.planningScenarioHighlightFeatureStyle;
                    }
                    else {
                        feature.style = null;
                    }
                }
                return feature;
            });
            this.updateFeatures();
        },

        /*
         * Toggles the visibility of the planning scenario layer.
         * @param {Event} event - The event object.
         * @returns {void}
         */
        toggleFeatureLayerVisibilty (event) {
            this.planningScenario.showExistingItems[this.currentEditableInput] = event.target.checked;

            this.updateFeatures();
        },

        /**
         * Updates the features of the current input.
         * @returns {void}
         */
        updateFeatures (newInput) {
            const featuresOfInput = this.getInputFeatures(newInput || this.currentEditableInput);

            if (!featuresOfInput) {
                return;
            }
            this.clearFeatures();
            if (this.planningScenario.showExistingItems[this.currentEditableInput] === true) {
                this.parseAndAddFeatures(featuresOfInput);
            }
        }
    }
};

</script>

<template>
    <div class="vh-100 overflow-y-auto">
        <h4 class="text-decoration-underline mt-3">
            {{ $t("additional:modules.tools.simulationTool.landuseTitle") }}
        </h4>
        <div class="d-flex flex-column rounded shadow mt-4">
            <div class="position-sticky mt-2 mx-3 top-0 z-2 bg-body">
                <h5>{{ planningScenario?.name }}</h5>
                <hr>
                <div class="d-flex">
                    <div
                        v-for="(value, key, index) in editableInputs"
                        :key="key"
                        class="form-check form-check-inline"
                    >
                        <input
                            :id="key"
                            v-model="currentEditableInput"
                            :value="key"
                            class="form-check-input"
                            type="radio"
                            :checked="index === 0"
                        >
                        <label
                            class="form-check-label"
                            :for="key"
                        >
                            {{ value.label }}
                        </label>
                    </div>
                    <div class="form-check form-switch">
                        <SwitchInput
                            id="showExistingItems"
                            :label="$t('additional:modules.tools.simulationTool.showExisting', {items: $t(`additional:modules.tools.simulationTool.${currentEditableInput}`)})"
                            :aria="$t('additional:modules.tools.simulationTool.showExisting', {items: $t(`additional:modules.tools.simulationTool.${currentEditableInput}`)})"
                            :interaction="toggleFeatureLayerVisibilty"
                            :checked="isShowToggleChecked"
                        />
                    </div>
                </div>
                <div id="building-tabs-container">
                    <ul
                        class="nav nav-tabs nav-justified mt-3 d-flex"
                        role="tablist"
                    >
                        <NavTab
                            id="existing-tab"
                            :active="true"
                            :target="'#existing'"
                            :label="'additional:modules.tools.simulationTool.existingFeatures'"
                        />
                        <NavTab
                            id="created-tab"
                            :active="false"
                            :target="'#created'"
                            :label="'additional:modules.tools.simulationTool.createdFeatures'"
                        />
                    </ul>
                </div>
            </div>
            <div
                v-if="isLoaded"
                class="tab-content m-3"
            >
                <div
                    id="existing"
                    class="tab-pane active"
                    role="tabpanel"
                    aria-labelledby="existing-tab"
                    tabindex="0"
                >
                    <ListGroup
                        :item-list="existingFeaturesByInput"
                        :list-key="currentEditableInput"
                        :shown-properties="getPropertiesToShow"
                        @removeFeature="removeFeature"
                        @setFeatureAttribute="setFeatureAttribute"
                        @setFeatureStyle="setFeatureStyle"
                        @setHighlightFeature="setHighlightFeature"
                    />
                </div>
                <div
                    id="created"
                    class="tab-pane"
                    role="tabpanel"
                    aria-labelledby="created-tab"
                    tabindex="0"
                >
                    <ListGroup
                        :item-list="createdFeaturesByInput"
                        :list-key="currentEditableInput"
                        :shown-properties="getPropertiesToShow"
                        @removeFeature="removeFeature"
                        @setFeatureAttribute="setFeatureAttribute"
                        @setFeatureStyle="setFeatureStyle"
                    />
                </div>
            </div>
            <div
                v-if="isLoaded"
                class="position-sticky bottom-0 bg-body z-2 p-3 d-flex justify-content-between"
            >
                <FlatButton
                    class="m-3"
                    :secondary="true"
                    :text="currentEditableInput === 'buildings' ? $t('additional:modules.tools.simulationTool.newBuilding') : $t('additional:modules.tools.simulationTool.newRoad')"
                    icon="bi-pencil-square"
                    :interaction="() => [setCurrentPlanningComponent('newLanduse'), setCurrentInputName(currentEditableInput)]"
                />
                <FlatButton
                    class="m-3"
                    :text="$t('additional:modules.tools.simulationTool.planningScenarioSave')"
                    :interaction="() => save()"
                />
            </div>
            <div
                v-if="!isLoaded"
                class="is-loading"
            >
                <SpinnerItem />
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import "~mixins";
@import "~variables";

.height-input {
    width: 6em;
}

#building-tabs-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 10px;
}

.nav-tabs {
    display: contents;
    li {
        list-style: none;
    }
    .nav-item {
        flex: 1;
    }
}

.is-loading {
    position: absolute;
    top: 0;
    left: 0;
    width: calc(100% - 65px);
    height: 100%;
    background: rgba(255, 255, 255, 0.3);
    text-align: center;
    align-content: center;
}

</style>
