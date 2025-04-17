<script>
import DrawLayout from "../../../../src/shared/modules/draw/components/DrawLayout.vue";
import DrawTypes from "../../../../src/shared/modules/draw/components/DrawTypes.vue";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import IconButton from "../../../../src/shared/modules/buttons/components/IconButton.vue";
import InputText from "../../../../src/shared/modules/inputs/components/InputText.vue";
import {mapActions, mapGetters, mapMutations} from "vuex";
import modifyInteraction from "@masterportal/masterportalapi/src/maps/interactions/modifyInteraction";
import SectionHeader from "../SectionHeader.vue";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector";

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
            currentModifyInteraction: null,
            currentScenarioData: {
                id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                name: "Neues Planungsszenario",
                simulationId: "only-planning-scenario",
                inputs: {}
            },
            layer: null,
            selectedTags: [],
            source: new VectorSource(),
            isValid: true
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
            "simulations"
        ])
    },
    watch: {
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
    mounted () {
        // Note: the layer handling still needs to be revised!
        const planningScenarioLayer = mapCollection.getMap("2D").getLayers().getArray().find(layer => layer.get("id") === "planningScenario");

        if (typeof planningScenarioLayer === "undefined") {
            this.layer = new VectorLayer({
                id: "planningScenario",
                name: "planningScenario",
                source: this.source,
                zIndex: 99999999999
            });

            mapCollection.getMap("2D").addLayer(this.layer);
        }
        else {
            this.layer = planningScenarioLayer;
            this.source = planningScenarioLayer.getSource();
        }
    },
    methods: {
        ...mapActions("Maps", ["addInteraction", "removeInteraction"]),
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
            this.deleteSource();
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
            this.currentScenarioData.scenarioFeature = {
                "type": "FeatureCollection",
                "features": features
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
                    :label="$t('additional:modules.tools.simulationTool.planningScenarioBBox')"
                    :placeholder="$t('additional:modules.tools.simulationTool.planningScenarioBBox')"
                    :type="'number'"
                />
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
                        :disabled="!isValid || !source?.getFeatures().length > 0"
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
