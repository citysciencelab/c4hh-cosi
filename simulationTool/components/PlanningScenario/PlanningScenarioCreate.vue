<script>
import DrawLayout from "../../../../src/shared/modules/draw/components/DrawLayout.vue";
import DrawTypes from "../../../../src/shared/modules/draw/components/DrawTypes.vue";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import IconButton from "../../../../src/shared/modules/buttons/components/IconButton.vue";
import InputText from "../../../../src/shared/modules/inputs/components/InputText.vue";
import SectionHeader from "../SectionHeader.vue";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector";
import {mapGetters, mapMutations} from "vuex";

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
            layer: null,
            selectedTags: [],
            source: new VectorSource()
        };
    },
    computed: {
        ...mapGetters("Modules/SimulationTool", [
            "planningScenarioCurrentLayout",
            "planningScenarioDrawIcons",
            "planningScenarioDrawTypesGeometrie",
            "planningScenarioDrawTypesMain",
            "planningScenarioSelectedDrawType",
            "planningScenarioSelectedDrawTypeMain",
            "planningScenarioStrokeRange",
            "selectedInteraction"
        ])
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
        ...mapMutations("Modules/SimulationTool", [
            "setPlanningScenarioCurrentLayout",
            "setPlanningScenarioSelectedDrawType",
            "setPlanningScenarioDrawTypesMain",
            "setPlanningScenarioSelectedDrawTypeMain",
            "setSelectedInteraction"
        ]),

        /**
         * Deletes all features from the source.
         * @returns {void}
         */
        deleteAlL () {
            this.source.clear();
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
                            :selected-interaction="selectedInteraction"
                            :set-selected-draw-type="setPlanningScenarioSelectedDrawType"
                            :set-selected-draw-type-main="setPlanningScenarioSelectedDrawTypeMain"
                            :set-selected-interaction="setSelectedInteraction"
                            :source="source"
                            :should-emit-events="false"
                        />
                    </div>
                    <div
                        class="col col-2"
                    >
                        <div class="row d-flex justify-content-center">
                            <IconButton
                                :class-array="['btn-primary']"
                                :aria="$t('additional:modules.tools.simulationTool.delete')"
                                icon="bi bi-trash"
                                :interaction="() => deleteAlL()"
                            />
                            <p class="delete-all text-center">
                                {{ $t('additional:modules.tools.simulationTool.delete') }}
                            </p>
                        </div>
                    </div>
                </div>
                <DrawTypes
                    v-if="planningScenarioSelectedDrawTypeMain === 'geometries'"
                    class="mt-4"
                    :current-layout="planningScenarioCurrentLayout"
                    :draw-icons="planningScenarioDrawIcons"
                    :draw-types="planningScenarioDrawTypesGeometrie"
                    :selected-draw-type="planningScenarioSelectedDrawType"
                    :set-selected-draw-type="setPlanningScenarioSelectedDrawType"
                    :source="source"
                    :should-emit-events="false"
                />
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
            <div
                class="mb-4"
            >
                <InputText
                    id="plsn-descr"
                    :label="$t('additional:modules.tools.simulationTool.planningScenarioDescr')"
                    :placeholder="$t('additional:modules.tools.simulationTool.planningScenarioDescr')"
                />
            </div>
            <div class="form-floating mb-3">
                <select
                    id="simulateForPlanning"
                    class="form-select"
                    :aria-label="$t('additional:modules.tools.simulationTool.simulateForPlanningScenario')"
                >
                    <option
                        value=""
                        selected=""
                    >
                        {{ "" }}
                    </option>
                </select>
                <label for="simulateForPlanning">
                    {{ $t('additional:modules.tools.simulationTool.simulateForPlanningScenario') }}
                </label>
            </div>
        </div>
        <div class="container">
            <div class="row">
                <FlatButton
                    id="back"
                    class="col col-md-6"
                    :aria-label="$t('additional:modules.tools.simulationTool.back')"
                    :interaction="() => ''"
                    :text="$t('additional:modules.tools.simulationTool.back')"
                />
                <FlatButton
                    id="save"
                    class="col col-md-6 offset-md-6"
                    :aria-label="$t('additional:modules.tools.simulationTool.createUrbanPlanning')"
                    :interaction="() => ''"
                    :text="$t('additional:modules.tools.simulationTool.createUrbanPlanning')"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";

.planning-scenario {
    max-height: 100vh;
}
.delete-all {
    font-size: $font_size_sm;
}

</style>
