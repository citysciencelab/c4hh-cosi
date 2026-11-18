<script>
// @ts-check
import GeoJSON from "ol/format/GeoJSON.js";
import Draw from "ol/interaction/Draw.js";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import InputText from "../../../../../src/shared/modules/inputs/components/InputText.vue";
import {Polygon} from "ol/geom.js";

/**
 * @import {Polygon as geojsonPolygon} from "geojson";
 * @import {PropType} from "vue";
 */

export default {
    name: "PolygonInput",
    components: {
        InputText
    },
    props: {
        dataProjection: {
            type: String,
            default: "EPSG:4326"
        },
        disabled: {
            type: Boolean,
            default: false
        },
        featureProjection: {
            type: String,
            default: "EPSG:25832"
        },
        id: {
            type: String,
            required: true
        },
        label: {
            type: String,
            required: true
        },
        value: {
            /**
             * @type {PropType<geojsonPolygon>}
             * */
            type: Object,
            default: null
        }
    },
    emits: ["update:value"],
    data () {
        return {
            /**
             * The draw interaction used for creating the polygon.
             * @type {Draw|null}
             */
            drawInteraction: null,

            drawLayer: new VectorLayer({
                source: new VectorSource(),
                zIndex: Infinity
            }),

            isDrawing: false,

            previousMouseMapInteractionsComponent: ""
        };
    },
    computed: {
        /**
         * Gets the area of the polygon (accuracy depending on projection).
         * @returns {String} The summary or an empty string if no polygon is set.
         */
        displayValue () {
            const coordinates = this.value?.coordinates;

            if (!Array.isArray(coordinates)) {
                return "";
            }

            const areaInSqKm = new Polygon(coordinates)
                .transform(this.dataProjection, this.featureProjection)
                .getArea() / (1000 * 1000);

            return areaInSqKm.toLocaleString("de") + "\u202fkm²";
        }
    },
    mounted () {
        const map = mapCollection.getMap("2D");

        if (!map) {
            return;
        }

        if (this.value) {
            const readFeature = new GeoJSON({
                dataProjection: this.dataProjection,
                featureProjection: this.featureProjection
            }).readFeature(this.value);
            const feature = Array.isArray(readFeature) ? readFeature[0] : readFeature;

            this.drawLayer.getSource()?.addFeature(feature);
        }
        map.addLayer(this.drawLayer);
    },
    beforeUnmount () {
        const map = mapCollection.getMap("2D");

        this.stopDrawing();
        if (map && this.drawLayer) {
            map.removeLayer(this.drawLayer);
        }
        this.drawLayer.getSource()?.clear();
    },
    methods: {
        /**
         * Adds a polygon draw interaction to the map.
         * @returns {void}
         */
        startDrawing () {
            const map = mapCollection.getMap("2D");

            if (!map || this.isDrawing) {
                return;
            }
            this.drawInteraction = new Draw({
                source: this.drawLayer.getSource() ?? undefined,
                type: "Polygon",
                stopClick: true
            });

            this.drawInteraction.on("drawstart", () => this.drawLayer.getSource()?.clear());
            this.drawInteraction.on("drawend", event => {
                const geometry = event.feature.getGeometry();
                const value = geometry ? new GeoJSON().writeGeometryObject(geometry, {
                    dataProjection: this.dataProjection,
                    featureProjection: this.featureProjection
                }) : null;

                this.$emit("update:value", value);
                this.stopDrawing();
            });

            map.addInteraction(this.drawInteraction);
            this.isDrawing = true;
        },

        /**
         * Removes the draw interaction from the map, keeping the drawn polygon visible.
         * @returns {void}
         */
        stopDrawing () {
            const map = mapCollection.getMap("2D");

            if (map && this.drawInteraction) {
                map.removeInteraction(this.drawInteraction);
            }
            this.drawInteraction = null;
            this.isDrawing = false;
        }
    }
};
</script>

<template>
    <div class="mb-3">
        <h5 class="polygon-input-header">
            {{ label }}
        </h5>
        <InputText
            :id="id"
            class="mb-2"
            label=""
            :model-value="displayValue"
            :placeholder="$t('additional:modules.tools.simulationTool.noPolygonDrawn')"
            :disabled="true"
        />
        <button
            :id="`${id}-draw-button`"
            type="button"
            class="btn btn-primary"
            :disabled="disabled || isDrawing"
            @click="startDrawing"
        >
            {{ $t("additional:modules.tools.simulationTool.drawPolygon") }}
        </button>
    </div>
</template>

<style lang="scss" scoped>
.polygon-input-header {
    font-size: 1rem;
}
</style>
