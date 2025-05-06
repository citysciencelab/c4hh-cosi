<script>
import DrawLayout from "../../../../src/shared/modules/draw/components/DrawLayout.vue";
import DrawTypes from "../../../../src/shared/modules/draw/components/DrawTypes.vue";
import IconButton from "../../../../src/shared/modules/buttons/components/IconButton.vue";
import layerCollection from "../../../../src/core/layers/js/layerCollection";
import layerFactory from "../../../../src/core/layers/js/layerFactory";
import modifyInteraction from "@masterportal/masterportalapi/src/maps/interactions/modifyInteraction";
import {mapActions, mapGetters, mapMutations} from "vuex";
import SectionHeader from "../SectionHeader.vue";

export default {
    name: "PlanningScenarioLanduseCreate",
    components: {
        DrawLayout,
        DrawTypes,
        IconButton,
        SectionHeader
    },
    data () {
        return {
            source: null,
            currentModifyInteraction: null
        };
    },
    computed: {
        ...mapGetters("Modules/SimulationTool", [
            "currentInputName",
            "landuseCurrentLayout",
            "landuseRoadDrawIcons",
            "landuseRoadDrawTypesMain",
            "planningScenarioDrawIcons",
            "planningScenarioDrawTypesMain",
            "planningScenarioSelectedDrawType",
            "planningScenarioSelectedDrawTypeMain",
            "planningScenarioSelectedInteraction",
            "planningScenarioStrokeRange"
        ])
    },
    mounted () {
        this.source = this.getLayerSource();
    },
    methods: {
        ...mapActions("Maps", ["addInteraction", "removeInteraction"]),
        ...mapMutations("Modules/SimulationTool", [
            "setLanduseCurrentLayout",
            "setPlanningScenarioDrawType",
            "setplanningScenarioDrawTypesMain",
            "setPlanningScenarioSelectedDrawType",
            "setPlanningScenarioSelectedDrawTypeMain",
            "setPlanningScenarioSelectedInteraction"
        ]),
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
        }
    }
};

</script>

<template>
    <div class="planning-scenario-landuse-create">
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
                            :selected-draw-type="planningScenarioSelectedDrawType"
                            :selected-draw-type-main="planningScenarioSelectedDrawTypeMain"
                            :selected-interaction="planningScenarioSelectedInteraction"
                            :set-selected-draw-type="setPlanningScenarioSelectedDrawType"
                            :set-selected-draw-type-main="setPlanningScenarioSelectedDrawTypeMain"
                            :source="source"
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
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";


</style>
