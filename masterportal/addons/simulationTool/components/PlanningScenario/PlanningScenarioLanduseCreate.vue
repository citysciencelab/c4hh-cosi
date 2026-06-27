<script>
import ConvertFeature from "../../js/convertFeatures.js";
import ConvertStyle from "../../js/convertStyle.js";
import DrawLayout from "../../../../src/shared/modules/draw/components/DrawLayout.vue";
import DrawTypes from "../../../../src/shared/modules/draw/components/DrawTypes.vue";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import getOAFFeature from "../../../../src/shared/js/api/oaf/getOAFFeature.js";
import IconButton from "../../../../src/shared/modules/buttons/components/IconButton.vue";
import layerCollection from "../../../../src/core/layers/js/layerCollection.js";
import layerFactory from "../../../../src/core/layers/js/layerFactory.js";
import ListGroup from "../shared/components/ListGroup.vue";
import modifyInteraction from "@masterportal/masterportalapi/src/maps/interactions/modifyInteraction.js";
import {mapActions, mapGetters, mapMutations} from "vuex";
import SectionHeader from "../SectionHeader.vue";
import {uniqueId} from "../../../../src/shared/js/utils/uniqueId.js";

export default {
    name: "PlanningScenarioLanduseCreate",
    components: {
        DrawLayout,
        DrawTypes,
        FlatButton,
        IconButton,
        ListGroup,
        SectionHeader
    },
    data () {
        return {
            createdFeatures: [],
            currentModifyInteraction: null,
            schema: null,
            source: null
        };
    },
    computed: {
        ...mapGetters("Modules/SimulationTool", [
            "currentPlanningScenarioId",
            "currentEditableInput",
            "currentInputName",
            "dataSources",
            "drawTypeLabels",
            "landuseCurrentLayout",
            "landuseRoadDrawIcons",
            "landuseRoadDrawTypesMain",
            "planningScenarioDrawIcons",
            "planningScenarioDrawTypesMain",
            "planningScenarioHighlightFeatureStyle",
            "planningScenarioSelectedDrawType",
            "planningScenarioSelectedDrawTypeMain",
            "planningScenarioSelectedInteraction",
            "planningScenarioSelectInteraction",
            "planningScenarioStrokeRange",
            "planningScenarios"
        ]),

        /**
         * Gets the data source config object that is set for the current planning scenario.
         * @returns {Object} The current simulation config.
         */
        currentDataSource () {
            return this.dataSources.find(dataSource => dataSource.id === this.planningScenario.dataSourceId);
        },

        /**
         * Gets all current data source inputs marked as editable.
         * @returns {Object} An inputs object containing only the editable inputs.
         */
        editableInputs () {
            if (!this.currentDataSource?.inputs) {
                return undefined;
            }

            return Object.fromEntries(
                Object.entries(this.currentDataSource.inputs).filter(([, value]) => {
                    return value.editable;
                })
            );
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
         * Gets the currently selected planning scenario.
         * @return {Object} The current planning scenario.
         */
        planningScenario () {
            return this.planningScenarios.find(scenario => scenario.id === this.currentPlanningScenarioId);
        }
    },
    async mounted () {
        this.schema = await getOAFFeature.getCollectionSchema(this.getInputSource.url, this.getInputSource?.collection);
        this.source = this.getLayerSource();
        this.createdFeatures = this.getLayerSource().getFeatures().filter(feature => feature.get("created") === true);
        this.removeInteraction(this.planningScenarioSelectInteraction);
    },
    methods: {
        ...mapActions("Maps", ["addInteraction", "removeInteraction"]),
        ...mapMutations("Modules/SimulationTool", [
            "setLanduseActiveTab",
            "setLanduseCurrentLayout",
            "setCurrentPlanningComponent",
            "setDrawTypeLabels",
            "setPlanningScenarioDrawType",
            "setplanningScenarioDrawTypesMain",
            "setPlanningScenarioSelectedDrawType",
            "setPlanningScenarioSelectedDrawTypeMain",
            "setPlanningScenarioSelectedInteraction"
        ]),

        /**
         * Adds a feature to the current editable input of the planning scenario.
         * @param {Object} evt - Draw event emitted by draw interaction.
         * @return {void}
         */
        addInputFeature (evt) {
            const olFeature = this.setFeatureProperties(evt.feature, this.getPropertiesToShow),
                geojsonFeature = ConvertFeature.openlayersToGeoJson([olFeature])[0];

            this.createdFeatures = this.getLayerSource().getFeatures().filter(feature => feature.get("created") === true).concat(evt.feature);
            this.getInputFeatures(this.currentEditableInput).push(geojsonFeature);
        },

        /**
         * Navigates back to the "landuse" component and resets various states related to the planning scenario.
         * @return {void}
         */
        backToLanduse () {
            this.setLanduseActiveTab("created");
            this.setCurrentPlanningComponent("landuse");
            this.setPlanningScenarioSelectedDrawType("");
            this.setPlanningScenarioSelectedDrawTypeMain("");
            this.setPlanningScenarioSelectedInteraction("");
            this.removeInteraction(this.currentModifyInteraction);
            this.currentModifyInteraction = null;
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
         * Edits the geometry of current source features.
         * @returns {void}
         */
        editSource () {
            if (this.currentModifyInteraction === null) {
                this.setPlanningScenarioSelectedDrawType("");
                this.setPlanningScenarioSelectedDrawTypeMain("");
                this.setPlanningScenarioSelectedInteraction("");
                this.removeInteraction(this.planningScenarioSelectedInteraction);
                this.currentModifyInteraction = modifyInteraction.createModifyInteraction(this.source);
                this.currentModifyInteraction.on("modifyend", this.updateGeometry);
                this.addInteraction(this.currentModifyInteraction);
            }
            else {
                this.removeInteraction(this.currentModifyInteraction);
                this.currentModifyInteraction = null;
            }
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
         * @returns {Object} A vector layer source.
         */
        getLayerSource () {
            if (typeof layerCollection.getLayerById("planning-scenario-landuse") !== "undefined") {
                return layerCollection.getLayerById("planning-scenario-landuse").getLayerSource();
            }
            const layer = layerFactory.createLayer({
                typ: "VECTORBASE",
                id: "planning-scenario-landuse",
                name: "planning-scenario-landuse",
                alwaysOnTop: true
            });

            layerCollection.addLayer(layer);

            return layer.getLayerSource();
        },

        /**
         * Removes a feature from the current editable input and from the layer source.
         * Updates the `createdFeatures` array to include only features marked as "created" in the layer source.
         * @param {String} id - The id of the feature to be removed.
         * @returns {void}
         */
        removeFeature (id) {
            this.planningScenario.inputs[this.currentEditableInput].features = this.getInputFeatures(this.currentEditableInput).filter(feature => {
                return feature.id !== id;
            });

            this.getLayerSource().removeFeature(this.getLayerSource().getFeatureById(id));
            this.createdFeatures = this.getLayerSource().getFeatures().filter(feature => feature.get("created") === true);
        },

        /**
         * Sets a feature attribute of the current editable input.
         * @param {String} value - The value to be set.
         * @param {String} key - The key of the attribute to be set.
         * @param {String} id - The id of the feature to be updated.
         * @returns {void}
         */
        setFeatureAttribute (value, key, id) {
            const foundFeature = this.getInputFeatures(this.currentEditableInput).find(feature => feature.id === id);

            if (foundFeature) {
                foundFeature.properties[key] = value;
            }
        },

        /**
         * Sets properties for a given feature, initializing them with empty values
         * and adding specific attributes like "created" and a unique ID.
         * @param {ol/Feature} feature - The feature object to set properties for.
         * @param {String[]} propertiesToShow - An array of property names to set on the feature.
         * @returns {ol/Feature} The updated feature object with initialized properties.
         */
        setFeatureProperties (feature, propertiesToShow) {
            const uniqId = parseInt(uniqueId(), 10);

            if (!this.getInputFeatures(this.currentEditableInput).length) {
                feature.set("created", true);
                feature.setId(uniqId);
                feature.set("id", uniqId);

                return feature;
            }

            propertiesToShow.forEach(property => {
                if (feature.getProperties()[property] === undefined) {
                    feature.set(property, null);
                }
            });
            feature.set("created", true);
            feature.setId(uniqId);
            feature.set("id", uniqId);

            return feature;
        },

        /**
         * Sets the style of the given OpenLayers feature based on the corresponding feature's style
         * from the input features of the current editable input.
         * @param {ol/Feature} olFeature - The OpenLayers feature whose style needs to be set.
         * @returns {void}
         */
        setFeatureStyle (olFeature) {
            const foundFeature = this.getInputFeatures(this.currentEditableInput).find(feature => feature.id === olFeature.getId());

            if (foundFeature && foundFeature.style) {
                const olStyle = ConvertStyle.geoJsonToOpenlayers(foundFeature.style);

                olFeature.setStyle(olStyle);
            }
        },

        /**
         * Updates the geometry of the features in the current editable input
         * based on the modified features from the event from the modify interaction.
         * @param {Object} evt - The event object containing modified features.
         * @returns {void}
         */
        updateGeometry (evt) {
            evt.features.forEach((feature) => {
                const geometry = feature.getGeometry().getCoordinates(),
                    geojsonFeatures = this.getInputFeatures(this.currentEditableInput),
                    featureIndex = geojsonFeatures.findIndex(f => f.id === feature.getId());

                if (featureIndex !== -1) {
                    geojsonFeatures[featureIndex].geometry.coordinates = geometry;
                }
            });
        }
    }
};

</script>

<template>
    <div class="vh-100 overflow-y-auto">
        <SectionHeader
            :title="$t(`additional:modules.tools.simulationTool.create${currentInputName}`)"
        />
        <h5 class="mb-3">
            {{ $t(`additional:modules.tools.simulationTool.draw${currentInputName}`) }}
        </h5>
        <div
            id="draw-types"
            class="mb-5"
        >
            <div
                id="draw-types"
                class="mb-2"
            >
                <div
                    class="row"
                >
                    <div
                        v-if="source !== null"
                        class="col col-3"
                    >
                        <DrawTypes
                            :current-layout="landuseCurrentLayout"
                            :draw-icons="currentInputName === 'roads' ? landuseRoadDrawIcons : planningScenarioDrawIcons"
                            :draw-types="currentInputName === 'roads' ? landuseRoadDrawTypesMain : planningScenarioDrawTypesMain"
                            :draw-type-labels="drawTypeLabels"
                            :selected-draw-type="planningScenarioSelectedDrawType"
                            :selected-draw-type-main="planningScenarioSelectedDrawTypeMain"
                            :selected-interaction="planningScenarioSelectedInteraction"
                            :set-selected-draw-type="setPlanningScenarioSelectedDrawType"
                            :set-selected-draw-type-main="setPlanningScenarioSelectedDrawTypeMain"
                            :set-selected-interaction="setPlanningScenarioSelectedInteraction"
                            :source="source"
                            @drawend="addInputFeature"
                        />
                    </div>
                    <div class="col col-4">
                        <div class="row d-flex">
                            <div
                                v-if="source?.getFeatures().length"
                                class="col col-5"
                            >
                                <div class="row d-flex justify-content-center">
                                    <IconButton
                                        :class-array="[
                                            'btn-primary',
                                            currentModifyInteraction !== null ? 'active': '',
                                        ]"
                                        :aria="$t('additional:modules.tools.simulationTool.geometryEdit')"
                                        icon="bi bi-tools"
                                        :interaction="editSource"
                                        :label="$t('additional:modules.tools.simulationTool.geometryEdit')"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    id="draw-layouts"
                    class="mb-5"
                >
                    <DrawLayout
                        v-if="planningScenarioSelectedDrawType !== '' && planningScenarioSelectedDrawTypeMain !== ''"
                        :current-layout="landuseCurrentLayout"
                        :selected-draw-type="planningScenarioSelectedDrawType"
                        :set-current-layout="setLanduseCurrentLayout"
                        :stroke-range="planningScenarioStrokeRange"
                    />
                </div>
                <ListGroup
                    :item-list="createdFeatures"
                    :item-schema="schema"
                    :list-key="currentEditableInput"
                    :properties-mapping="getPropertiesMapping"
                    :shown-properties="getPropertiesToShow"
                    @removeFeature="removeFeature"
                    @setFeatureAttribute="setFeatureAttribute"
                    @setFeatureStyle="setFeatureStyle"
                />
                <div
                    class="position-sticky bottom-0 bg-body z-3 p-3 d-flex justify-content-between"
                >
                    <FlatButton
                        id="back"
                        :aria-label="$t('additional:modules.tools.simulationTool.back')"
                        :text="$t('additional:modules.tools.simulationTool.back')"
                        :interaction="backToLanduse"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
</style>
