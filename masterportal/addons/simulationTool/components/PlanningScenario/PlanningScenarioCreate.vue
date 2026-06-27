<script>
import {buffer} from "ol/extent.js";
import ConvertStyle from "../../js/convertStyle.js";
import DrawLayout from "../../../../src/shared/modules/draw/components/DrawLayout.vue";
import DrawTypes from "../../../../src/shared/modules/draw/components/DrawTypes.vue";
import Feature from "ol/Feature.js";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import {fromExtent} from "ol/geom/Polygon.js";
import IconButton from "../../../../src/shared/modules/buttons/components/IconButton.vue";
import InputText from "../../../../src/shared/modules/inputs/components/InputText.vue";
import layerCollection from "../../../../src/core/layers/js/layerCollection.js";
import layerFactory from "../../../../src/core/layers/js/layerFactory.js";
import {mapActions, mapGetters, mapMutations} from "vuex";
import modifyInteraction from "@masterportal/masterportalapi/src/maps/interactions/modifyInteraction.js";
import SectionHeader from "../SectionHeader.vue";
import convertFeatures from "../../js/convertFeatures.js";
import {getDistance} from "ol/sphere.js";
import {infrastructureLayerId} from "../../layerIds.js";

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
                dataSourceId: "default",
                inputs: {}
            },
            isValid: true,
            selectedTags: [],
            source: null,
            currentSideLength: [0, 0]
        };
    },
    computed: {
        ...mapGetters("Modules/SimulationTool", [
            "currentPlanningScenarioId",
            "dataSources",
            "planningScenarioCurrentLayout",
            "planningScenarioDrawIcons",
            "planningScenarioDrawTypesMain",
            "drawTypeLabels",
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
         * Gets the current data source configuration.
         * @returns {Object} The current data source configuration.
         */
        currentDataSource () {
            return this.dataSources.find(
                ds => ds.id === this.currentScenarioData.dataSourceId
            ) || {};
        },

        /**
         * Gets the maximum side length that is configured in the currently selected data source.
         * @returns {Number} The maximum side length of the current data source.
         */
        maxSideLengthFromConfig () {
            return this.currentDataSource?.maxSideLength ? this.currentDataSource.maxSideLength : 450;
        },

        /**
         * Checks constraints for the buffered simulation area (BBox).
         * @returns {Object} Object with constraint status.
         */
        bufferConstraintStatus () {
            if (!this.source?.getFeatures()?.length) {
                return {sideLengthExceeded: false};
            }

            try {
                const projection = mapCollection.getMapView("2D").getProjection(),
                    isMetric = projection.getUnits() === "m",
                    bboxFeature = this.source.getFeatures().find(feature => feature.get("id") === "simulation-area"),
                    sideLengthExceeded = this.checkBboxSideLengthConstraint(bboxFeature, isMetric);

                return {sideLengthExceeded};
            }
            catch (error) {
                return {sideLengthExceeded: false};
            }
        },

        /**
         * Checks if any constraint is exceeded on the buffered area.
         * @returns {Boolean} True if any constraint is exceeded.
         */
        isMaxConstraintExceeded () {
            const {sideLengthExceeded} = this.bufferConstraintStatus;

            return sideLengthExceeded;
        }
    },
    watch: {
        /**
         * Is called when the current max constraint is exceeded or no longer exceeded.
         * Changes the style of the simulation area.
         * @param {Boolean} val value if the max constraint is exceeded.
         */
        isMaxConstraintExceeded (val) {
            const bboxFeature = this.source?.getFeatures().find(feature => feature.get("id") === "simulation-area");

            bboxFeature?.setStyle(ConvertStyle.geoJsonToOpenlayers(
                val ? this.simulationAreaStyleInvalid : this.simulationAreaStyle
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
    mounted () {
        this.deleteSource();
        if (typeof layerCollection.getLayerById("planning-scenario") !== "undefined") {
            layerCollection.getLayerById("planning-scenario").getLayerSource().clear();
        }
        if (typeof layerCollection.getLayerById(infrastructureLayerId) !== "undefined") {
            layerCollection.getLayerById(infrastructureLayerId).getLayerSource().clear();
        }
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
            "setDrawTypeLabels",
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
                this.isMaxConstraintExceeded ? this.simulationAreaStyleInvalid : this.simulationAreaStyle
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
            this.resetInteraction();
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
         * Clears the current draw interaction and deletes the source.
         * @returns {void}
         */
        resetAll () {
            this.deleteSource();
            this.resetInteraction();
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
            if (this.currentModifyInteraction === null) {
                this.setPlanningScenarioSelectedDrawType("");
                this.setPlanningScenarioSelectedDrawTypeMain("");
                this.setPlanningScenarioSelectedInteraction("");
                this.removeInteraction(this.planningScenarioSelectedInteraction);
                this.currentModifyInteraction = modifyInteraction.createModifyInteraction(this.source);
                this.addInteraction(this.currentModifyInteraction);
                this.modifyBBOX(this.currentModifyInteraction);
            }
            else {
                this.removeInteraction(this.currentModifyInteraction);
                this.currentModifyInteraction = null;
            }
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
         * Prevents buffer creation if original feature exceeds side length limits.
         * @param {Number} val The buffer value.
         * @return {void}
         */
        modifyBBoxByBuffer (val) {
            const hasFeatures = this.source.getFeatures().length > 0,
                scenarioFeature = this.source.getFeatures().filter(feature => feature.get("id") !== "simulation-area")[0];

            this.bufferVal = parseFloat(val) >= 0 ? val : "0";

            if (!hasFeatures) {
                return;
            }

            if (scenarioFeature) {
                const extent = scenarioFeature.getGeometry()?.getExtent();

                if (extent) {
                    this.removeBBoxFeature();
                    this.addBBoxFeature(buffer(extent, parseFloat(this.bufferVal)));
                }
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
            this.removeInteraction(this.currentModifyInteraction);
            this.currentModifyInteraction = null;
        },

        /**
         * Sets current planning scenario data.
         * @param {ol/Feature[]} features all features of current source
         * @returns {void}
         */
        setCurrentPlanningScenarioData (features) {
            this.currentScenarioData.scenarioFeature = {
                type: "FeatureCollection",
                features: convertFeatures.openlayersToGeoJson(features)
            };

            this.setPlanningScenarios([...this.planningScenarios, this.currentScenarioData]);
            this.setCurrentPlanningScenarioId(this.currentScenarioData.id);
        },

        /**
         * Calculates the distance between two points.
         * @param {Number[]} point1 The first point [x, y].
         * @param {Number[]} point2 The second point [x, y].
         * @param {Boolean} isMetric Whether the projection is metric.
         * @returns {Number} The distance between the two points in meters.
         */
        getDistanceBetweenPoints (point1, point2, isMetric) {
            return isMetric
                ? Math.sqrt(Math.pow(point2[0] - point1[0], 2) + Math.pow(point2[1] - point1[1], 2))
                : getDistance(point1, point2);
        },

        /**
         * Checks if bbox feature exceeds side length constraint.
         * @param {ol/Feature} bboxFeature The bbox feature to check.
         * @param {Boolean} isMetric Whether the projection is metric.
         * @returns {Boolean} True if side length constraint is exceeded.
         */
        checkBboxSideLengthConstraint (bboxFeature, isMetric) {
            if (!bboxFeature || !this.maxSideLengthFromConfig) {
                return false;
            }
            this.currentSideLength = [0, 0];
            const geometry = bboxFeature.getGeometry();

            if (geometry?.getType() === "Polygon") {
                const coordinates = geometry.getCoordinates()[0],
                    height = this.getDistanceBetweenPoints(coordinates[0], coordinates[1], isMetric),
                    width = this.getDistanceBetweenPoints(coordinates[1], coordinates[2], isMetric);

                if (coordinates.length !== 5) {
                    console.warn("Expected 5 coordinates for a rectangle, but got:", coordinates.length);
                }

                this.currentSideLength = [height, width];

                if (Math.max(...this.currentSideLength) > this.maxSideLengthFromConfig) {
                    return true;
                }
            }
            return false;
        },

        /**
         * Returns the info text for the exceeded constraint, if any.
         * @returns {String} The constraint violation message.
         */
        constraintExceededInfoText () {
            const {sideLengthExceeded} = this.bufferConstraintStatus;

            if (sideLengthExceeded && this.maxSideLengthFromConfig) {
                return this.$t("additional:modules.tools.simulationTool.maxSideLengthExceeded", {
                    maxSideLengthAllowed: this.maxSideLengthFromConfig,
                    height: Math.ceil(this.currentSideLength[0] * 100) / 100,
                    width: Math.ceil(this.currentSideLength[1] * 100) / 100
                });
            }
            return "";
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
                        class="col col-3 d-flex"
                    >
                        <DrawTypes
                            :current-layout="planningScenarioCurrentLayout"
                            :draw-icons="planningScenarioDrawIcons"
                            :draw-types="planningScenarioDrawTypesMain"
                            :selected-draw-type="planningScenarioSelectedDrawType"
                            :selected-draw-type-main="planningScenarioSelectedDrawTypeMain"
                            :draw-type-labels="drawTypeLabels"
                            :selected-interaction="planningScenarioSelectedInteraction"
                            :set-selected-draw-type="setPlanningScenarioSelectedDrawType"
                            :set-selected-draw-type-main="setPlanningScenarioSelectedDrawTypeMain"
                            :set-selected-interaction="setPlanningScenarioSelectedInteraction"
                            :source="source"
                            @drawstart="resetAll"
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
                                        :interaction="resetAll"
                                        :label="$t('additional:modules.tools.simulationTool.delete')"
                                    />
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
                                        :label="$t('additional:modules.tools.simulationTool.geometryEdit')"
                                        :interaction="editSource"
                                    />
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
                    :model-value="currentScenarioData.name"
                    :class-obj="[isValid ? '': 'is-invalid']"
                    :label="$t('additional:modules.tools.simulationTool.planningScenarioDescr')"
                    :placeholder="$t('additional:modules.tools.simulationTool.planningScenarioDescr')"
                    required
                    @update:modelValue="(value) => checkInputString(value.trim())"
                />
                <div
                    v-if="!isValid"
                    class="mt-1 mb-3 invalid-info"
                >
                    {{ $t('additional:modules.tools.simulationTool.planningScenarioInvalidName') }}
                </div>
                <div class="form-floating mb-3">
                    <select
                        id="dataSourceForPlanning"
                        v-model="currentScenarioData.dataSourceId"
                        class="form-select"
                        :aria-label="$t('additional:modules.tools.simulationTool.dataSourceForPlanningScenario')"
                    >
                        <option
                            v-for="dataSource in dataSources"
                            :key="dataSource.id"
                            :value="dataSource.id"
                        >
                            {{ dataSource.title }}
                        </option>
                    </select>
                    <label for="dataSourceForPlanning">
                        {{ $t('additional:modules.tools.simulationTool.dataSourceForPlanningScenario') }}
                    </label>
                </div>
                <InputText
                    id="buffer"
                    :model-value="bufferVal"
                    :label="$t('additional:modules.tools.simulationTool.planningScenarioBBox')"
                    :placeholder="$t('additional:modules.tools.simulationTool.planningScenarioBBox')"
                    :type="'number'"
                    @update:modelValue="modifyBBoxByBuffer"
                />
                <div
                    v-if="isMaxConstraintExceeded"
                    class="alert alert-danger"
                    role="alert"
                >
                    {{ constraintExceededInfoText() }}
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
                        :disabled="!isValid || source?.getFeatures().length === 0 || isMaxConstraintExceeded"
                    />
                </div>
            </form>
        </div>
    </div>
</template>

<style lang="scss" scoped>

.planning-scenario {
    max-height: 100vh;
}
.invalid-info {
    max-width: fit-content;
    font-size: $font_size_sm;
    color: $danger;
}

</style>
