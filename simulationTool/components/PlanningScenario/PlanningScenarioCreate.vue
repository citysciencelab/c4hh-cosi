<script>
import {buffer} from "ol/extent";
import ConvertStyle from "../../js/convertStyle";
import DrawLayout from "../../../../src/shared/modules/draw/components/DrawLayout.vue";
import DrawTypes from "../../../../src/shared/modules/draw/components/DrawTypes.vue";
import Feature from "ol/Feature.js";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import {fromExtent} from "ol/geom/Polygon";
import {GeoJSON} from "ol/format.js";
import IconButton from "../../../../src/shared/modules/buttons/components/IconButton.vue";
import InputText from "../../../../src/shared/modules/inputs/components/InputText.vue";
import layerCollection from "../../../../src/core/layers/js/layerCollection";
import layerFactory from "../../../../src/core/layers/js/layerFactory";
import {mapActions, mapGetters, mapMutations} from "vuex";
import modifyInteraction from "@masterportal/masterportalapi/src/maps/interactions/modifyInteraction";
import SectionHeader from "../SectionHeader.vue";

export default {
    name: "PlanningScenarioCreate",
    components: {
        DrawLayout,
        DrawTypes,
        FlatButton,
        IconButton,
        InputText,
        SectionHeader
    },
    data () {
        return {
            bufferVal: "0",
            currentModifyInteraction: null,
            currentScenarioData: {
                id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                name: "Neues Planungsszenario",
                simulationId: "only-planning-scenario",
                inputs: {}
            },
            isValid: true,
            selectedTags: [],
            source: null
        };
    },
    computed: {
        ...mapGetters("Modules/SimulationTool", [
            "currentPlanningScenarioId",
            "planningScenarioCurrentLayout",
            "planningScenarioDrawIcons",
            "planningScenarioDrawTypesMain",
            "planningScenarios",
            "planningScenarioSelectedDrawType",
            "planningScenarioSelectedDrawTypeMain",
            "planningScenarioSelectedInteraction",
            "planningScenarioStrokeRange",
            "simulationAreaStyle",
            "simulationAreaStyleInvalid",
            "simulations"
        ]),

        /**
         * Gets the maximum area that is configured in the currently selected simulation.
         * @returns {Number} The maximum area of the current simulation.
         */
        currentMaxArea () {
            return this.simulations.find(
                simulation => simulation.id === this.currentScenarioData.simulationId
            )?.maxSizeArea;
        },

        /**
         * Checks if the current maximum area is exceeded.
         * @returns {Boolean} True if the maximum area is exceeded, false otherwise.
         */
        isMaxAreaExceeded () {
            return this.source?.getFeatures()?.some(
                feature => feature.getGeometry()?.getArea() > this.currentMaxArea
            ) ?? false;
        }
    },
    watch: {
        /**
         * Is called when the current max area is exceeded or no longer exceeded.
         * Changes the style of the simulation area.
         */
        isMaxAreaExceeded () {
            const bboxFeature = this.source?.getFeatures().find(feature => feature.get("id") === "simulation-area");

            bboxFeature?.setStyle(ConvertStyle.geoJsonToOpenlayers(
                this.isMaxAreaExceeded ? this.simulationAreaStyleInvalid : this.simulationAreaStyle
            ));
        },

        /**
         * Decides if to remove edit interaction according to selected draw type.
         * @param {String} val the main selected draw type.
         */
        planningScenarioSelectedDrawTypeMain (val) {
            if (val !== "") {
                this.removeInteraction(this.currentModifyInteraction);
                this.currentModifyInteraction = null;
            }
        }
    },
    created () {
        this.source = this.getLayerSource();
    },
    unmounted () {
        this.removeInteraction(this.currentModifyInteraction);
        this.currentModifyInteraction = null;
    },
    methods: {
        ...mapActions("Maps", ["addInteraction", "removeInteraction", "zoomToExtent"]),
        ...mapMutations("Modules/SimulationTool", [
            "setCurrentPlanningComponent",
            "setCurrentPlanningScenarioId",
            "setPlanningScenarioCurrentLayout",
            "setPlanningScenarioDrawTypesMain",
            "setPlanningScenarios",
            "setPlanningScenarioSelectedDrawType",
            "setPlanningScenarioSelectedDrawTypeMain",
            "setPlanningScenarioSelectedInteraction"
        ]),

        /**
         * Adds a feature for the extent(BBOX) of the planning scenario feature.
         * @param {Object} evt - Draw event emitted by draw interaction.
         * @return {void}
         */
        addBBOX (evt) {
            const extent = buffer(evt.feature.getGeometry().getExtent(), parseFloat(this.bufferVal));

            // evt.feature.set("id", "planning-scenario-area");
            this.addBBoxFeature(extent);
            this.zoomToExtent({extent, options: {maxZoom: 7}});
        },

        /**
         * Adds a feature for the extent(BBOX = Simulation Area) and sets the style.
         * @param {Number[]} extent - the extent of BBox.
         * @return {void}
         */
        addBBoxFeature (extent) {
            const featureBBOX = new Feature({
                geometry: fromExtent(extent),
                id: "simulation-area"
            });

            this.source.addFeature(featureBBOX);
            featureBBOX.setStyle(ConvertStyle.geoJsonToOpenlayers(
                this.isMaxAreaExceeded ? this.simulationAreaStyleInvalid : this.simulationAreaStyle
            ));
        },

        /**
         * Handles click on back button.
         * @returns {void}
         */
        backToOverview () {
            this.deleteSource();
            this.setCurrentPlanningComponent("");
            this.setPlanningScenarioSelectedDrawType("");
            this.setPlanningScenarioSelectedDrawTypeMain("");
        },

        /**
         * Create the current planning scenario with data.
         * @returns {void}
         */
        create () {
            if (!this.source?.getFeatures().length) {
                return;
            }

            this.setCurrentPlanningScenarioData(this.source?.getFeatures());
            this.setPlanningScenarioSelectedDrawType("");
            this.setPlanningScenarioSelectedDrawTypeMain("");
            this.setCurrentPlanningComponent("landuse");
        },

        /**
         * Checks if a variable is a string and not empty.
         * @param {String} inputString the user input.
         * @returns {void}
         */
        checkInputString (inputString) {
            this.isValid = Boolean(typeof inputString === "string" && inputString.length);
            this.currentScenarioData.name = inputString;
        },

        /**
         * Deletes all features from the source.
         * @returns {void}
         */
        deleteSource () {
            this.source.clear();
        },

        /**
         * Edits the geometry of current source features.
         * @returns {void}
         */
        editSource () {
            this.setPlanningScenarioSelectedDrawType("");
            this.setPlanningScenarioSelectedDrawTypeMain("");
            this.setPlanningScenarioSelectedInteraction("");
            this.removeInteraction(this.planningScenarioSelectedInteraction);
            this.currentModifyInteraction = modifyInteraction.createModifyInteraction(this.source);
            this.addInteraction(this.currentModifyInteraction);
            this.modifyBBOX(this.currentModifyInteraction);
        },

        /*
         * Creates a layer if it does not yet exist and returns its source.
         * @returns {Object} A vector layer source.
         */
        getLayerSource () {
            if (typeof layerCollection.getLayerById("planning-scenario") !== "undefined") {
                return layerCollection.getLayerById("planning-scenario").getLayerSource();
            }
            const layer = layerFactory.createLayer({
                typ: "VECTORBASE",
                id: "planning-scenario",
                name: "planning-scenario",
                alwaysOnTop: true
            });

            // layer.getLayer().setStyle([this.simulationAreaStyle]);

            layerCollection.addLayer(layer);
            return layer.getLayerSource();
        },


        /**
         * Modifies the BBox after modifying the feature.
         * @param {ol/interaction/Modify} interaction The current modify interaction.
         * @return {void}
         */
        modifyBBOX (interaction) {
            if (interaction !== null) {
                this.currentModifyInteraction.on("modifystart", async () => {
                    this.removeBBoxFeature();
                });

                this.currentModifyInteraction.on("modifyend", async () => {
                    const extent = buffer(this.source.getFeatures()[0].getGeometry().getExtent(), parseFloat(this.bufferVal));

                    this.addBBoxFeature(extent);
                });
            }
        },

        /**
         * Modifies the BBox when buffer is changed.
         * @param {Number} val The buffer value.
         * @return {void}
         */
        modifyBBoxByBuffer (val) {
            this.bufferVal = parseFloat(val) >= 0 ? val : "0";

            if (!this.source.getFeatures().length) {
                return;
            }

            const scenarioFeature = this.source.getFeatures().filter(feature => feature.get("id") !== "simulation-area")[0],
                extent = scenarioFeature?.getGeometry()?.getExtent();

            if (extent) {
                this.removeBBoxFeature();
                this.addBBoxFeature(buffer(extent, parseFloat(this.bufferVal)));
            }
        },

        /**
         * Removes the bbox feature from current planning scenario layer.
         * @returns {void}
         */
        removeBBoxFeature () {
            const featureBBox = this.source.getFeatures().filter(feature => feature.get("id") === "simulation-area")[0];

            this.source.removeFeature(featureBBox);
        },

        /**
         * Resets the interaction.
         * @returns {void}
         */
        resetInteraction () {
            this.deleteSource();
            this.removeInteraction(this.currentModifyInteraction);
            this.currentModifyInteraction = null;
        },

        /**
         * Sets current planning scenario data.
         * @param {ol/Feature[]} features all features of current source
         * @returns {void}
         */
        setCurrentPlanningScenarioData (features) {
            const geoJsonFeatures = [],
                geoJsonParser = new GeoJSON();

            features.forEach(feature => {
                const geojsonFeature = geoJsonParser.writeFeatureObject(feature);

                geojsonFeature.style = ConvertStyle.openlayersToGeoJson(feature.getStyle());
                geoJsonFeatures.push(geojsonFeature);
            });

            this.currentScenarioData.scenarioFeature = {
                type: "FeatureCollection",
                features: geoJsonFeatures
            };

            this.setPlanningScenarios([...this.planningScenarios, this.currentScenarioData]);
            this.setCurrentPlanningScenarioId(this.currentScenarioData.id);
        }
    }
};

</script>

<template>
    <div class="planning-scenario">
        <SectionHeader
            :title="$t('additional:modules.tools.simulationTool.planningScenarioCreate')"
            icon="bi bi-person-fill"
        />
        <h5 class="mb-3">
            {{ $t('additional:modules.tools.simulationTool.planingAreaDraw') }}
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
                        class="col col-3"
                    >
                        <DrawTypes
                            :current-layout="planningScenarioCurrentLayout"
                            :draw-icons="planningScenarioDrawIcons"
                            :draw-types="planningScenarioDrawTypesMain"
                            :selected-draw-type="planningScenarioSelectedDrawType"
                            :selected-draw-type-main="planningScenarioSelectedDrawTypeMain"
                            :selected-interaction="planningScenarioSelectedInteraction"
                            :set-selected-draw-type="setPlanningScenarioSelectedDrawType"
                            :set-selected-draw-type-main="setPlanningScenarioSelectedDrawTypeMain"
                            :set-selected-interaction="setPlanningScenarioSelectedInteraction"
                            :source="source"
                            @drawstart="resetInteraction"
                            @drawend="addBBOX"
                        />
                    </div>
                    <div class="col col-4">
                        <div class="row d-flex">
                            <div class="col col-4">
                                <div class="row d-flex justify-content-center">
                                    <IconButton
                                        :class-array="['btn-primary']"
                                        :aria="$t('additional:modules.tools.simulationTool.delete')"
                                        icon="bi bi-trash"
                                        :interaction="() => deleteSource()"
                                    />
                                    <p class="delete-all text-center">
                                        {{ $t('additional:modules.tools.simulationTool.delete') }}
                                    </p>
                                </div>
                            </div>
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
                                    />
                                    <p class="edit text-center">
                                        {{ $t('additional:modules.tools.simulationTool.geometryEdit') }}
                                    </p>
                                </div>
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
                    :current-layout="planningScenarioCurrentLayout"
                    :selected-draw-type="planningScenarioSelectedDrawType"
                    :set-current-layout="setPlanningScenarioCurrentLayout"
                    :stroke-range="planningScenarioStrokeRange"
                />
            </div>
            <form>
                <InputText
                    id="plsn-descr"
                    :value="currentScenarioData.name"
                    :class-obj="[isValid ? '': 'is-invalid']"
                    :label="$t('additional:modules.tools.simulationTool.planningScenarioDescr')"
                    :placeholder="$t('additional:modules.tools.simulationTool.planningScenarioDescr')"
                    :input="(value) => checkInputString(value.trim())"
                    required
                />
                <div
                    v-if="!isValid"
                    class="mt-1 mb-3 invalid-info"
                >
                    {{ $t('additional:modules.tools.simulationTool.planningScenarioInvalidName') }}
                </div>
                <div class="form-floating mb-3">
                    <select
                        id="simulateForPlanning"
                        v-model="currentScenarioData.simulationId"
                        class="form-select"
                        :aria-label="$t('additional:modules.tools.simulationTool.simulateForPlanningScenario')"
                    >
                        <option
                            v-for="simulation in simulations"
                            :key="simulation.id"
                            :value="simulation.id"
                        >
                            {{ simulation.title }}
                        </option>
                    </select>
                    <label for="simulateForPlanning">
                        {{ $t('additional:modules.tools.simulationTool.simulateForPlanningScenario') }}
                    </label>
                </div>
                <InputText
                    id="buffer"
                    :input="modifyBBoxByBuffer"
                    :label="$t('additional:modules.tools.simulationTool.planningScenarioBBox')"
                    :placeholder="$t('additional:modules.tools.simulationTool.planningScenarioBBox')"
                    :type="'number'"
                    :value="bufferVal"
                />
                <div
                    v-if="isMaxAreaExceeded"
                    class="alert alert-danger"
                    role="alert"
                >
                    {{ $t('additional:modules.tools.simulationTool.maxAreaExceeded', {maxArea: currentMaxArea}) }}
                </div>
                <div
                    class="d-flex justify-content-between"
                >
                    <FlatButton
                        id="back"
                        :aria-label="$t('additional:modules.tools.simulationTool.back')"
                        :interaction="backToOverview"
                        :text="$t('additional:modules.tools.simulationTool.back')"
                    />
                    <FlatButton
                        id="save"
                        :aria-label="$t('additional:modules.tools.simulationTool.createUrbanPlanning')"
                        :interaction="() => create()"
                        :text="$t('additional:modules.tools.simulationTool.createUrbanPlanning')"
                        :disabled="!isValid || !source?.getFeatures().length > 0 || isMaxAreaExceeded"
                    />
                </div>
            </form>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";

.planning-scenario {
    max-height: 100vh;
}
.delete-all, .edit {
    font-size: $font_size_sm;
}
.invalid-info {
    max-width: fit-content;
    font-size: $font_size_sm;
    color: $danger;
}

</style>
