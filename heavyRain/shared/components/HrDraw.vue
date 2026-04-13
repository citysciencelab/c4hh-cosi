<script>
import DrawTypes from "@shared/modules/draw/components/DrawTypes.vue";
import GeoJSON from "ol/format/GeoJSON.js";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import layerCollection from "@core/layers/js/layerCollection.js";
import layerFactory from "@core/layers/js/layerFactory.js";
import {markRaw} from "vue";

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
        }
    },
    emits: ["update:drawn-geojson-feature"],
    data () {
        return {
            currentLayout: {
                fillColor: [202, 116, 251],
                fillTransparency: 50,
                strokeColor: [255, 2, 2],
                strokeWidth: 2
            },
            drawTypeLabels: [
                {type: "polygon", label: "common:shared.modules.draw.drawTypes.polygon"},
                {type: "box", label: "common:shared.modules.draw.drawTypes.box"},
                {type: "circle", label: "common:shared.modules.draw.drawTypes.circle"}
            ],
            source: null,
            selectedDrawType: "",
            selectedDrawTypeMain: ""
        };
    },
    created () {
        this.source = markRaw(this.getLayerSource());
    },
    methods: {
        /**
         * Clears the current drawing and emits an empty value.
         * @returns {void}
         */
        clearDrawnFeature () {
            this.source?.clear();
            this.$emit("update:drawn-geojson-feature", null);
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
            const geojsonFeature = new GeoJSON().writeFeatureObject(event.feature);

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
                :current-layout="currentLayout"
                :draw-types="['polygon', 'box', 'circle']"
                :draw-type-labels="drawTypeLabels"
                :selected-draw-type="selectedDrawType"
                :selected-draw-type-main="selectedDrawTypeMain"
                :source
                :set-selected-draw-type="value => selectedDrawType = value"
                :set-selected-draw-type-main="value => selectedDrawTypeMain = value"
                @drawstart="() => source?.clear()"
                @drawend="onDrawEnd"
            />
            <IconButton
                :class-array="['btn-primary']"
                :aria="$t('common:modules.draw_old.attributeSelect.remove')"
                icon="bi bi-trash"
                :interaction="clearDrawnFeature"
                :label="$t('common:modules.draw_old.attributeSelect.remove')"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
</style>

