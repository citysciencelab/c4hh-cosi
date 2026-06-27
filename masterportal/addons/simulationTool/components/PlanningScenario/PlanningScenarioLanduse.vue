<script>
import ConvertFeature from "../../js/convertFeatures.js";
import ConvertStyle from "../../js/convertStyle.js";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import getBBOXGeometry from "../shared/js/getBBoxGeometry.js";
import getOAFFeature from "../../../../src/shared/js/api/oaf/getOAFFeature.js";
import isObject from "../../../../src/shared/js/utils/isObject.js";
import layerCollection from "../../../../src/core/layers/js/layerCollection.js";
import layerFactory from "../../../../src/core/layers/js/layerFactory.js";
import ListGroup from "../shared/components/ListGroup.vue";
import {mapActions, mapGetters, mapMutations} from "vuex";
import NavTab from "../../../../src/shared/modules/tabs/components/NavTab.vue";
import {Select} from "ol/interaction.js";
import {singleClick} from "ol/events/condition.js";
import SpinnerItem from "../../../../src/shared/modules/spinner/components/SpinnerItem.vue";
import SwitchInput from "../../../../src/shared/modules/checkboxes/components/SwitchInput.vue";
import {infrastructureLayerId} from "../../layerIds.js";

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
            featuresByInput: [],
            featureLayerId: "planning-scenario-landuse",
            highlightFeatureId: "",
            schema: null
        };
    },
    computed: {
        ...mapGetters("Modules/SimulationTool", [
            "currentEditableInput",
            "currentPlanningScenarioId",
            "currentPlanningComponent",
            "dataSources",
            "landuseActiveTab",
            "planningScenarios",
            "simulations",
            "simulationAreaStyle",
            "simulationAreaStyleInvalid",
            "planningScenarioCurrentLayout",
            "planningScenarioHighlightFeatureStyle",
            "planningScenarioSelectInteraction"
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
            return this.currentDataSource?.inputs?.crs;
        },

        /**
         * Gets the data source config object that is set for the current planning scenario.
         * @returns {Object} The current data source config.
         */
        currentDataSource () {
            return this.dataSources.find(ds => ds.id === this.planningScenario.dataSourceId);
        },

        /**
         * Gets all simulation inputs marked as editable.
         * @returns {Object} An inputs object containing only the editable inputs.
         */
        editableInputs () {
            if (!this.currentDataSource?.inputs) {
                return {};
            }

            return Object.fromEntries(
                Object.entries(this.currentDataSource.inputs).filter(([, value]) => {
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
         * Gets the source of the current editable input.
         * @returns {Object} The source of the current editable input.
         */
        getInputSource () {
            return this.editableInputs[this.currentEditableInput]?.source;
        },

        /**
         * Gets the mapped properties.
         * @return {Object} The mapped properties.
         */
        getPropertiesMapping () {
            return this.editableInputs[this.currentEditableInput]?.propertiesMapping;
        },

        /**
         * Gets the shown properties of the feature in the list
         * @return {String[]} The shown properties.
         */
        getPropertiesToShow () {
            return this.editableInputs[this.currentEditableInput]?.propertiesToShow;
        },

        /**
         * Checks if there is empty feature in scenario.
         * @return {Boolean} true if there is empty feature.
         */
        isEmptyFeature () {
            let isEmpty = false;

            Object.keys(this.editableInputs).forEach(key => {
                if (typeof this.planningScenario?.inputs[key]?.features === "undefined" || !this.planningScenario?.inputs[key]?.features.length) {
                    isEmpty = true;
                }
            });

            return isEmpty;
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
        },

        /**
         * Gets the property to be sorted by.
         * @return {String} The property to be sorted by.
         */
        sortBy () {
            return this.editableInputs[this.currentEditableInput]?.sortBy;
        }
    },
    watch: {
        async currentEditableInput (newValue) {
            this.updateFeatures(newValue);
            if (typeof this.getInputSource !== "undefined") {
                this.schema = await getOAFFeature.getCollectionSchema(this.getInputSource.url, this.getInputSource?.collection);
            }
        },

        /**
         * Sets different style of simulation area if there are no features.
         * @param {Boolean} val if there is empty feature.
         */
        isEmptyFeature: {
            handler (val) {
                const simulationAreaFeature = layerCollection.getLayerById("planning-scenario").getLayerSource().getFeatures().filter(feature => feature.get("id") === "simulation-area")[0];

                simulationAreaFeature?.setStyle(ConvertStyle.geoJsonToOpenlayers(
                    val ? this.simulationAreaStyleInvalid : this.simulationAreaStyle
                ));
            },
            immediate: true
        }
    },
    created () {
        this.setSelectInteraction();
    },
    async mounted () {
        if (!this.planningScenario) {
            return;
        }
        this.planningScenario.inputs ??= {};
        this.planningScenario.inputs.crs = this.currentCrs;

        this.initializeShowExistingItems();

        if (this.currentEditableInput === "") {
            this.setCurrentEditableInput(Object.keys(this.editableInputs)[0]);
        }
        if (typeof this.getInputSource !== "undefined") {
            this.schema = await getOAFFeature.getCollectionSchema(this.getInputSource.url, this.getInputSource?.collection);
        }

        if (!this.planningScenario.featuresLoaded) {
            try {
                await this.fetchFeatures(
                    this.planningScenario, this.editableInputs, getBBOXGeometry(this.planningScenario), this.currentCrs
                );

                this.planningScenario.featuresLoaded = true;
            }
            catch (error) {
                console.warn(error);
            }
        }
        if (this.isShowToggleChecked) {
            this.addScenarioFeatures(this.planningScenario.scenarioFeature.features);
            this.updateFeatures(this.currentEditableInput);
        }
    },
    unmounted () {
        if (this.currentPlanningComponent !== "newLanduse") {
            this.clearFeatures();
            layerCollection.getLayerById("planning-scenario").getLayerSource().clear();
            layerCollection.getLayerById(infrastructureLayerId)?.getLayerSource().clear();
            this.removeInteraction(this.planningScenarioSelectInteraction);
        }
    },
    methods: {
        ...mapActions("Maps", ["addInteraction", "removeInteraction"]),
        ...mapMutations("Modules/SimulationTool", [
            "setCurrentEditableInput",
            "setCurrentPlanningComponent",
            "setCurrentInputName",
            "setLanduseActiveTab",
            "setPlanningScenarios",
            "setPlanningScenarioSelectInteraction"
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

            const layerSource = layerCollection.getLayerById("planning-scenario").getLayerSource(),
                olFeatures = ConvertFeature.geoJsonToOpenlayers(features);

            layerSource.addFeatures(olFeatures);
        },

        /**
         * Removes all features and the current planning scenario and opens the planning scenario create component.
         * @returns {void}
         */
        cancel () {
            const filteredScenarios = this.planningScenarios?.filter(item => item.id !== this.planningScenario?.id);

            this.setPlanningScenarios(filteredScenarios);
            layerCollection.getLayerById("planning-scenario").getLayerSource().clear();
            layerCollection.getLayerById(infrastructureLayerId)?.getLayerSource().clear();
            this.removeInteraction(this.planningScenarioSelectInteraction);
            this.clearFeatures();
            this.setCurrentPlanningComponent("create");
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

                    scenario.inputs[inputKey] = {
                        type: "FeatureCollection",
                        features: await getOAFFeature.getOAFFeatureGet(input.source.url, input.source.collection, {
                            limit: 100,
                            filter,
                            filterCrs: crs,
                            crs
                        })
                    };
                }
            }
        },

        /**
         * Gets the features of an input.
         * @param {String} key - The key of the input.
         * @returns {Object[]} An array of geojson features.
         */
        getInputFeatures (key) {
            return this.planningScenario?.inputs[key]?.features;
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
         * Ensures that the showExistingItems object in the planning scenario
         * is initialized if it has not been set previously.
         * @returns {void}
         */
        initializeShowExistingItems () {
            if (isObject(this.planningScenario.showExistingItems)) {
                return;
            }
            this.planningScenario.showExistingItems = {};
            if (!isObject(this.editableInputs)) {
                return;
            }
            Object.keys(this.editableInputs).forEach(input => {
                this.planningScenario.showExistingItems[input] = true;
            });
        },

        /**
         * Parses the given GeoJSON features to openlayers features and adds them to the source.
         * @param {GeoJSON[]} features - An array of GeoJSON features.
         * @returns {void}
         */
        parseAndAddFeatures (features) {
            layerCollection.getLayerById(infrastructureLayerId)?.getLayerSource().clear();
            const olFeatures = ConvertFeature.geoJsonToOpenlayers(features);

            if (this.isShowToggleChecked) {
                this.getLayerSource().addFeatures(olFeatures);
            }
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
            this.updateFeatures(this.currentEditableInput);
        },

        /**
         * Saves the planning scenario and reset the highlight features.
         * @returns {void}
         */
        save () {
            this.setCurrentPlanningComponent("");
        },

        /**
         * Sets a feature attribute of the current editable input.
         * @param {String|Number} value - The value to be set.
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

            this.updateFeatures(this.currentEditableInput);
        },

        /**
         * Sets the style of a feature of the current editable input.
         * @param {ol/Feature} olFeature - The feature.
         * @returns {void}
         */
        setFeatureStyle (olFeature) {
            const foundFeature = this.getInputFeatures(this.currentEditableInput).find(feature => feature.id === olFeature.getId());

            if (foundFeature && foundFeature.style) {
                const olStyle = ConvertStyle.geoJsonToOpenlayers(foundFeature.style);

                olFeature.setStyle(olStyle);
            }
            else {
                olFeature.setStyle(null);
            }
        },

        /**
         * Sets the highlight feature in select.
         * @param {ol/Feature} feature - The feature.
         * @returns {void}
         */
        setHighlightFeature (feature) {
            this.planningScenarioSelectInteraction.getFeatures().clear();
            this.planningScenarioSelectInteraction.getFeatures().push(feature);
            this.highlightFeatureId = feature?.getId();
        },

        /**
         * Sets the select interaction (non-reactive state), adds it a "change:active" listener and adds it to the map.
         * @returns {void}
         */
        setSelectInteraction () {
            this.setPlanningScenarioSelectInteraction(new Select({
                layers: (layer) => {
                    return layer.get("id") === this.featureLayerId;
                },
                style: ConvertStyle.geoJsonToOpenlayers(this.planningScenarioHighlightFeatureStyle),
                addCondition: singleClick,
                hitTolerance: 5
            }));

            if (typeof this.planningScenarioSelectInteraction !== "undefined") {
                this.planningScenarioSelectInteraction.on("select", event => {
                    const currentFeature = event.selected[0];

                    if (this.planningScenarioSelectInteraction.getFeatures().getLength() > 1) {
                        this.planningScenarioSelectInteraction.getFeatures().clear();
                        this.planningScenarioSelectInteraction.getFeatures().push(currentFeature);
                    }

                    this.highlightFeatureId = currentFeature.getId();

                    this.$nextTick(() => {
                        const el = document.getElementById(this.highlightFeatureId);

                        if (el) {
                            el.focus();
                            el.scrollIntoView({behavior: "smooth", block: "center"});
                        }
                    });

                    if (currentFeature.get("created")) {
                        this.setLanduseActiveTab("created");
                    }
                    else {
                        this.setLanduseActiveTab("existing");
                    }
                });
                this.addInteraction(this.planningScenarioSelectInteraction);
            }
        },

        /**
         * Toggles the visibility of the planning scenario layer.
         * @param {Event} event - The event object.
         * @returns {void}
         */
        toggleFeatureLayerVisibilty (event) {
            this.planningScenario.showExistingItems[this.currentEditableInput] = event.target.checked;

            this.updateFeatures(this.currentEditableInput);
        },

        /**
         * Updates the features for the given input.
         * @param {String} editableInput - The key of the input to update features for.
         * @returns {void}
         */
        updateFeatures (editableInput) {
            const featuresOfInput = this.getInputFeatures(editableInput);

            if (!featuresOfInput) {
                return;
            }
            this.clearFeatures();
            this.parseAndAddFeatures(featuresOfInput);
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
                        v-for="(value, key) in editableInputs"
                        :key="key"
                        class="form-check form-check-inline"
                    >
                        <input
                            :id="key"
                            :value="key"
                            class="form-check-input"
                            type="radio"
                            :checked="key === currentEditableInput"
                            @input="setCurrentEditableInput(key)"
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
                        id="feature-tabs"
                        class="nav nav-tabs nav-justified mt-3 d-flex"
                        role="tablist"
                    >
                        <NavTab
                            id="existing-tab"
                            :active="landuseActiveTab === 'existing'"
                            :target="'#existing'"
                            :label="'additional:modules.tools.simulationTool.existingFeatures'"
                        />
                        <NavTab
                            id="created-tab"
                            :active="landuseActiveTab === 'created'"
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
                    class="tab-pane"
                    :class="[landuseActiveTab === 'existing' ? 'active' : '']"
                    role="tabpanel"
                    aria-labelledby="existing-tab"
                    tabindex="0"
                >
                    <div
                        class="alert alert-warning mb-3"
                        role="alert"
                    >
                        <span class="text-muted">
                            {{ $t("additional:modules.tools.simulationTool.noteNoLiability") }}
                        </span>
                    </div>
                    <ListGroup
                        :highlight-feature-id="highlightFeatureId"
                        :item-list="existingFeaturesByInput"
                        :item-schema="schema"
                        :list-key="currentEditableInput"
                        :properties-mapping="getPropertiesMapping"
                        :shown-properties="getPropertiesToShow"
                        :sort-by="sortBy"
                        @removeFeature="removeFeature"
                        @setFeatureAttribute="setFeatureAttribute"
                        @setFeatureStyle="setFeatureStyle"
                        @setHighlightFeature="setHighlightFeature"
                    />
                </div>
                <div
                    id="created"
                    class="tab-pane"
                    :class="[landuseActiveTab === 'created' ? 'active' : '']"
                    role="tabpanel"
                    aria-labelledby="created-tab"
                    tabindex="0"
                >
                    <ListGroup
                        :highlight-feature-id="highlightFeatureId"
                        :item-list="createdFeaturesByInput"
                        :item-schema="schema"
                        :list-key="currentEditableInput"
                        :properties-mapping="getPropertiesMapping"
                        :shown-properties="getPropertiesToShow"
                        :sort-by="sortBy"
                        @removeFeature="removeFeature"
                        @setFeatureAttribute="setFeatureAttribute"
                        @setFeatureStyle="setFeatureStyle"
                        @setHighlightFeature="setHighlightFeature"
                    />
                </div>
            </div>
            <div
                v-if="isLoaded && isEmptyFeature"
                class="alert alert-danger"
                role="alert"
            >
                {{ $t('additional:modules.tools.simulationTool.planningScenarioEmptyFeature') }}
            </div>
            <div
                v-if="isLoaded"
                class="position-sticky bottom-0 bg-body z-2 p-3 d-flex justify-content-between"
            >
                <FlatButton
                    class="m-3"
                    :text="currentEditableInput === 'buildings' ? $t('additional:modules.tools.simulationTool.newBuilding') : $t('additional:modules.tools.simulationTool.newRoad')"
                    icon="bi-pencil-square"
                    :interaction="() => [setCurrentPlanningComponent('newLanduse'), setCurrentInputName(currentEditableInput)]"
                />
                <FlatButton
                    class="m-3"
                    :text="!isEmptyFeature ? $t('additional:modules.tools.simulationTool.planningScenarioSave') : $t('additional:modules.tools.simulationTool.planningScenarioCancel')"
                    :interaction="() => !isEmptyFeature ? save() : cancel()"
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

.tab-content {
    z-index: 0;
}
</style>
