<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import VectorLayer from "ol/layer/Vector.js";
import MeasureInMapTooltip from "./MeasureInMapTooltip.vue";
import MeasureList from "./MeasureList.vue";
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import source from "../js/measureSource.js";
import getStyle from "../js/measureStyle.js";

/**
 * Measurement tool to measure lines and areas in the map.
 * Interaction lifecycle, undo/redo orchestration and computed measurement data
 * are managed by the Vuex store (actionsMeasure.js / gettersMeasure.js).
 * This component is responsible only for rendering and delegating user events.
 * @module modules/MeasureInMap
 */
export default {
    name: "MeasureInMap",
    components: {
        AccordionItem,
        MeasureInMapTooltip,
        MeasureList,
        FlatButton
    },
    data () {
        return {
            deleteIcon: "bi-trash"
        };
    },
    computed: {
        ...mapGetters("Modules/Measure", [
            "featureId",
            "tooltipCoord",
            "interaction",
            "color",
            "source",
            "layer",
            "lines",
            "polygons",
            "geometryValues",
            "lineStringUnits",
            "polygonUnits",
            "selectedGeometry",
            "selectedLineStringUnit",
            "selectedPolygonUnit",
            "currentUnits",
            "enableUndoRedo",
            "measurementList",
            "currentlyModifyingFeatureId",
            "selectedEditInteraction",
            "enrichedMeasurementList",
            "activeMeasurementInfo",
            "canUndoCurrentSketch",
            "canRedoCurrentSketch"
        ]),
        ...mapGetters(["uiStyle"]),
        ...mapGetters("Maps", ["mode", "projection"])
    },
    watch: {
        mode () {
            this.cleanupAllInteractions();
            this.createDrawInteraction();
            this.setFocusToFirstControl();
        },
        selectedGeometry () {
            this.cleanupAllInteractions();
            this.createDrawInteraction();
        },
        measurementList (newList) {
            this.syncFeatureHistories(newList);
        }
    },
    created () {
        this.setLayer(new VectorLayer({
            source,
            id: "measureLayer",
            name: "measureLayer",
            style: getStyle(this.color),
            alwaysOnTop: true
        }));
        this.$store.dispatch("Maps/checkLayer", this.layer).then(layerExists => {
            if (!layerExists) {
                this.$store.dispatch("Maps/addLayer", this.layer);
            }
        });
    },
    mounted () {
        this.createDrawInteraction();
        this.setFocusToFirstControl();
    },
    unmounted () {
        this.removeIncompleteDrawing();
        this.cleanupAllInteractions();
    },
    methods: {
        ...mapMutations("Modules/Measure", [
            "setSelectedGeometry",
            "setSelectedLineStringUnit",
            "setSelectedPolygonUnit",
            "setLayer",
            "setCustomName"
        ]),
        ...mapActions("Modules/Measure", [
            "createDrawInteraction",
            "removeDrawInteraction",
            "deleteFeatures",
            "deleteSingleFeature",
            "cleanupAllInteractions",
            "setInteractionMode",
            "regulateDeleteAll",
            "regulateUndo",
            "regulateRedo",
            "undoLastPointInSketch",
            "redoLastPointInSketch",
            "removeIncompleteDrawing",
            "syncFeatureHistories",
            "handleModifyMeasurement",
            "handleDeleteMeasurement",
            "highlightFeature",
            "unhighlightFeature"
        ]),

        /**
         * Sets focus to the first interactive control of the tool.
         * @returns {void}
         */
        setFocusToFirstControl () {
            this.$nextTick(() => {
                if (this.$refs["measure-tool-geometry-select"] && !this.$refs["measure-tool-geometry-select"].disabled) {
                    this.$refs["measure-tool-geometry-select"].focus();
                }
                else if (this.$refs["measure-tool-unit-select"]) {
                    this.$refs["measure-tool-unit-select"].focus();
                }
            });
        },

        /**
         * Returns true if the UI style is not SIMPLE or TABLE.
         * @returns {Boolean} Whether to show default style elements
         */
        isDefaultStyle () {
            return this.uiStyle !== "SIMPLE" && this.uiStyle !== "TABLE";
        },

        /**
         * Returns true if the map is in 3D mode.
         * @returns {Boolean} Whether the map is currently in 3D mode
         */
        is3DMode () {
            return this.mode === "3D";
        },

        /**
         * Sets the selected unit based on the currently active geometry type.
         * @param {String} value - The unit index as a string
         * @returns {void}
         */
        setSelectedUnit (value) {
            if (this.selectedGeometry === "LineString") {
                this.setSelectedLineStringUnit(value);
            }
            else {
                this.setSelectedPolygonUnit(value);
            }
        }
    }
};
</script>

<template lang="html">
    <div id="measure">
        <MeasureInMapTooltip />

        <div class="form-floating mb-3">
            <select
                id="measure-tool-geometry-select"
                ref="measure-tool-geometry-select"
                class="form-select"
                :disabled="is3DMode()"
                :value="selectedGeometry"
                @change="setSelectedGeometry($event.target.value)"
            >
                <option
                    v-for="geometryValue in geometryValues"
                    :key="'measure-tool-geometry-select-' + geometryValue"
                    :value="geometryValue"
                >
                    {{ is3DMode()
                        ? "3D"
                        : $t("common:modules.measure." +
                            (geometryValue === "LineString" ? "stretch" : "area"))
                    }}
                </option>
            </select>
            <label for="measure-tool-geometry-select">
                {{ $t("common:modules.measure.geometry") }}
            </label>
        </div>

        <div class="form-floating mb-3">
            <select
                id="measure-tool-unit-select"
                ref="measure-tool-unit-select"
                class="form-select"
                :disabled="is3DMode()"
                :value="selectedGeometry === 'LineString' ? selectedLineStringUnit : selectedPolygonUnit"
                @change="setSelectedUnit($event.target.value)"
            >
                <option
                    v-for="(unit, i) in currentUnits"
                    :key="'measure-tool-unit-select-' + i"
                    :value="i"
                >
                    {{ unit }}
                </option>
            </select>
            <label for="measure-tool-unit-select">
                {{ $t("common:modules.measure.measure") }}
            </label>
        </div>

        <MeasureList
            v-if="enableUndoRedo && !is3DMode()"
            :measurement-list="enrichedMeasurementList"
            :selected-feature-id="featureId"
            :currently-modifying-feature-id="currentlyModifyingFeatureId"
            :active-measurement="activeMeasurementInfo"
            :can-undo-active="canUndoCurrentSketch"
            :can-redo-active="canRedoCurrentSketch"
            @modify-measurement="handleModifyMeasurement"
            @delete-measurement="handleDeleteMeasurement"
            @undo-action="regulateUndo"
            @redo-action="regulateRedo"
            @highlight-feature="highlightFeature"
            @unhighlight-feature="unhighlightFeature"
            @rename-measurement="setCustomName"
            @undo-active-sketch="undoLastPointInSketch"
            @redo-active-sketch="redoLastPointInSketch"
        />

        <div class="d-flex justify-content-center my-3">
            <FlatButton
                id="measure-delete"
                :aria-label="$t('common:modules.measure.deleteAll')"
                :interaction="regulateDeleteAll"
                :text="$t('common:modules.measure.deleteAll')"
                :icon="deleteIcon"
                :disabled="source && source.getFeatures().length === 0"
            />
        </div>

        <div v-if="isDefaultStyle()">
            <AccordionItem
                id="measure-information"
                font-size="font-size-base"
                heading-level="h2"
                icon="bi-info-circle-fill"
                icon-margin-end="me-2"
                :title="$t('common:modules.coordToolkit.info')"
                :use-indentation="true"
            >
                {{ $t("common:modules.measure.influenceFactors") }}
                <ul class="inaccuracy-list">
                    <li>{{ $t("common:modules.measure.scale") }}</li>
                    <li>{{ $t("common:modules.measure.resolution") }}</li>
                    <li>{{ $t("common:modules.measure.screenResolution") }}</li>
                    <li>{{ $t("common:modules.measure.inputAccuracy") }}</li>
                    <li>{{ $t("common:modules.measure.measureDistance") }}</li>
                </ul>
            </AccordionItem>
        </div>
    </div>
</template>

<style lang="scss" scoped>
</style>
