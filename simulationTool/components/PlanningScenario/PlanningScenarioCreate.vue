<script>
import DrawLayout from "../../../../src/shared/modules/draw/components/DrawLayout.vue";
import DrawTypes from "../../../../src/shared/modules/draw/components/DrawTypes.vue"
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import InputText from "../../../../src/shared/modules/inputs/components/InputText.vue";
import Multiselect from "vue-multiselect";
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
        InputText,
        Multiselect,
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
        ])
    }
};

</script>

<template>
    <div class="planungs-scenarion">
        <SectionHeader
            :title="$t('additional:modules.tools.simulationTool.planningScenarioCreate')"
            icon="bi bi-person-fill"
        />
        <div
            id="draw-types"
            class="mb-5"
        >
            <div
                id="draw-types"
                class="mb-5"
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
                class="d-grid"
            >
                <label
                    class="pt-2"
                    for="plsn-descr"
                    tabindex="0"
                    :aria-label="$t('additional:modules.tools.simulationTool.planningScenarioDescr')"
                >
                    <span>{{ $t('additional:modules.tools.simulationTool.planningScenarioDescr') }}</span>
                </label>
                <InputText
                    id="'plsn-descr'"
                    :label="$t('additional:modules.tools.simulationTool.planningScenarioDescr')"
                    :placeholder="$t('additional:modules.tools.simulationTool.planningScenarioDescr')"
                />
            </div>
            <div
                class="d-grid"
            >
                <label
                    class="pt-2"
                    for="bez-pl"
                    tabindex="0"
                    :aria-label="$t('additional:modules.tools.simulationTool.simulateForPlanningScenario')"
                >
                    <span>{{ $t('additional:modules.tools.simulationTool.simulateForPlanningScenario') }}</span>
                </label>
                <multiselect
                    v-model="selectedTags"
                    :placeholder="$t('additional:modules.tools.simulationTool.planningScenario')"
                    :aria-label="$t('additional:modules.tools.simulationTool.planningScenario')"
                    label="name"
                    track-by="code"
                    :options="[]"
                    :multiple="true"
                />
            </div>
        </div>
        <div class="d-flex">
            <button
                id="save"
                tabindex="0"
                class="btn btn-primary"
                type="button"
                :title="$t('additional:modules.tools.simulationTool.createUrbanPlanning')"
                :aria-label="$t('additional:modules.tools.simulationTool.createUrbanPlanning')"
            >
                {{ $t('additional:modules.tools.simulationTool.createUrbanPlanning') }}
            </button>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.planungs-scenarion {
    max-height: 100vh;
    overflow-y: auto;
}

.button-wrapper {
    padding: 0.25rem !important;
    width: 82px;
    height: 86px;
    font-size: 12px;
    text-align: center;
    button {
        margin-left: 6px;
        font-size: 1.2rem;
    }
}

.sub-header {
    padding: 0 0 10px 15px;
    font-size: 14px;
    font-weight: 400;
}

.colorPicker {
    width: 20px;
    height: 3px;
}

.frame-width-font {
    font-size: 12px;
}

</style>
