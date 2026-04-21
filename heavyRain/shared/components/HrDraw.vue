<script>
import DrawTypes from "@shared/modules/draw/components/DrawTypes.vue";
import {Fill, Stroke, Style} from "ol/style.js";
import GeoJSON from "ol/format/GeoJSON.js";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import layerCollection from "@core/layers/js/layerCollection.js";
import layerFactory from "@core/layers/js/layerFactory.js";
import {mapActions} from "vuex";
import modifyInteraction from "@masterportal/masterportalapi/src/maps/interactions/modifyInteraction.js";

const hrDrawLayerId = "heavy-rain-draw";

export default {
    name: "HrDraw",
    components: {
        DrawTypes,
        IconButton
    },
    props: {
        heading: {
            type: String,
            default: ""
        },
        strokeColor: {
            type: Array,
            required: false,
            default: () => [0, 85, 164]
        }
    },
    emits: ["update:drawn-geojson-feature"],
    data () {
        return {
            currentLayout: {
                fillColor: [255, 255, 255],
                fillTransparency: 50,
                strokeColor: this.strokeColor,
                strokeWidth: 2
            },
            currentModifyInteraction: null,
            drawTypeLabels: [
                {type: "polygon", label: "common:shared.modules.draw.drawTypes.polygon"},
                {type: "box", label: "common:shared.modules.draw.drawTypes.box"},
                {type: "circle", label: "common:shared.modules.draw.drawTypes.circle"}
            ],
            source: null,
            selectedDrawType: "",
            selectedDrawTypeMain: "",
            selectedInteraction: null
        };
    },
    computed: {
        /**
         * Gets if to show the edit geometry button.
         * @returns {Boolean} True if there is drawn feature.
         */
        showEditIcon () {
            return typeof this.source?.getFeatures === "function" && this.source?.getFeatures()?.length;
        }
    },
    watch: {
        /**
         * Decides if to remove edit interaction according to selected draw type.
         * @param {String} val the main selected draw type.
         */
        selectedDrawTypeMain (val) {
            if (val !== "") {
                this.removeInteraction(this.currentModifyInteraction);
                this.currentModifyInteraction = null;
            }
        },

        /**
         * Changes the draw style.
         * @param {Number[]} val the stroke color.
         */
        strokeColor: {
            handler (val) {
                this.currentLayout.strokeColor = val;

                if (!this.source?.getFeatures().length) {
                    return;
                }

                const style = new Style({
                    stroke: new Stroke({
                        color: val,
                        width: this.currentLayout.strokeWidth
                    }),
                    fill: new Fill({
                        color: [255, 255, 255, 0.5]
                    })
                });


                this.source?.getFeatures()[0].setStyle(style);
            },
            deep: true,
            immediate: true
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
        ...mapActions("Maps", ["addInteraction", "removeInteraction"]),

        /**
         * Clears the current drawing and emits an empty value.
         * @returns {void}
         */
        clearDrawnFeature () {
            this.resetAll();
            this.$emit("update:drawn-geojson-feature", null);
        },

        /**
         * Edits the geometry of current source features.
         * @returns {void}
         */
        editSource () {
            if (this.currentModifyInteraction === null) {
                this.removeInteraction(this.selectedInteraction);
                this.selectedDrawType = "";
                this.selectedDrawTypeMain = "";
                this.selectedInteraction = "";
                this.currentModifyInteraction = modifyInteraction.createModifyInteraction(this.source);
                this.addInteraction(this.currentModifyInteraction);
                this.currentModifyInteraction?.on("modifyend", async () => {
                    const geojson = new GeoJSON().writeFeatureObject(this.source.getFeatures()[0]);

                    this.$emit("update:drawn-geojson-feature", geojson);
                });
            }
            else {
                this.removeInteraction(this.currentModifyInteraction);
                this.currentModifyInteraction = null;
            }
        },

        /**
         * Emits the drawn feature as a GeoJSON object.
         * @param {Object} event The OpenLayers drawend event.
         * @returns {void}
         */
        onDrawEnd (event) {
            if (!event?.feature) {
                return;
            }

            if (typeof event.feature.setId === "function") {
                event.feature.setId("drawn-feature");
            }

            const geojsonFeature = new GeoJSON().writeFeatureObject(event.feature);

            this.source.addFeature(event.feature);
            this.$emit("update:drawn-geojson-feature", geojsonFeature);
        },

        /**
         * Returns the source of the heavy rain draw layer and creates the layer if needed.
         * @returns {ol/source/Vector} The draw layer source.
         */
        getLayerSource () {
            const existingLayer = layerCollection.getLayerById(hrDrawLayerId);

            if (typeof existingLayer !== "undefined") {
                return existingLayer.getLayerSource();
            }

            const layer = layerFactory.createLayer({
                typ: "VECTORBASE",
                id: hrDrawLayerId,
                name: hrDrawLayerId,
                alwaysOnTop: true
            });

            layerCollection.addLayer(layer);

            return layer.getLayerSource();
        },

        /**
         * Clears the current draw interaction and deletes the source.
         * @returns {void}
         */
        resetAll () {
            this.source.clear();
            this.removeInteraction(this.currentModifyInteraction);
            this.currentModifyInteraction = null;
        }
    }
};
</script>

<template lang="html">
    <div>
        <h5
            v-if="heading"
            class="mb-3"
        >
            {{ heading }}
        </h5>
        <div class="d-flex align-items-start gap-3">
            <DrawTypes
                :key="strokeColor"
                :current-layout="currentLayout"
                :draw-types="['polygon', 'box', 'circle']"
                :draw-type-labels="drawTypeLabels"
                :selected-draw-type="selectedDrawType"
                :selected-draw-type-main="selectedDrawTypeMain"
                :selected-interaction="selectedInteraction"
                :source
                :set-selected-draw-type="value => selectedDrawType = value"
                :set-selected-draw-type-main="value => selectedDrawTypeMain = value"
                @drawstart="resetAll"
                @drawend="onDrawEnd"
            />
            <IconButton
                :class-array="['btn-primary']"
                :aria="$t('common:modules.draw_old.attributeSelect.remove')"
                icon="bi bi-trash"
                :interaction="clearDrawnFeature"
                :label="$t('common:modules.draw_old.attributeSelect.remove')"
            />
            <IconButton
                v-if="showEditIcon"
                :class-array="[
                    'btn-primary',
                    currentModifyInteraction !== null ? 'active': '',
                ]"
                :aria="$t('additional:modules.updateRequirements.geometryEdit')"
                icon="bi bi-tools"
                :interaction="editSource"
                :label="$t('additional:modules.updateRequirements.geometryEdit')"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
</style>

