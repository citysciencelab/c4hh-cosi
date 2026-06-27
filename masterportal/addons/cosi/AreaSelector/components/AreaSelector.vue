<script>
import ToolInfo from "../../shared/modules/toolInfo/components/ToolInfo.vue";
import {mapGetters, mapMutations} from "vuex";
import getters from "../store/gettersAreaSelector";
import mutations from "../store/mutationsAreaSelector";
import {geomPickerUnlisten, geomPickerSetGeometry, geomPickerGetFeature} from "../../utils/geomPickerHandler";
import {setBBoxToGeom} from "../../utils/setBBoxToGeom.js";
import GeometryPicker from "../../components/GeometryPicker.vue";
import {Stroke, Style} from "ol/style.js";
import Feature from "ol/Feature";
import layerCollection from "@core/layers/js/layerCollection";
import layerFactory from "@core/layers/js/layerFactory";
import GeometryCollection from "ol/geom/GeometryCollection";
import WPS from "@shared/js/api/wps.js";
import {geometryToGeoJson} from "../../utils/geometry/convertToGeoJson";

export default {
    name: "AreaSelector",
    components: {
        ToolInfo,
        GeometryPicker
    },
    data () {
        // non reactive data
        this.feature = null;
        this.drawingLayer = null;
        this.drawingStyle = new Style({
            stroke: new Stroke({
                width: 3,
                color: [232, 85, 115, 1],
                lineDash: [5, 5]
            })
        });
        return {
            einwohner: ""
        };
    },
    computed: {
        ...mapGetters("Modules/AreaSelector", Object.keys(getters)),
        ...mapGetters("Modules/DistrictSelector", ["boundingGeometry"]),
        ...mapGetters("Maps", ["projectionCode"]),
        ...mapGetters("Modules/Language", ["currentLocale"]),
        ...mapGetters(["allLayerConfigs", "restServiceById"]),
        geomField () {
            return {
                name: this.$t("additional:modules.tools.cosi.areaSelector.drawPolygon"),
                type: "Polygon"
            };
        }
    },
    watch: {
        async active (newActive) {
            if (newActive) {
                if (this.feature) {
                    await this.$nextTick();
                    geomPickerSetGeometry(this.$refs["geometry-picker"], this.feature.getGeometry());
                }
            }
            else {
                geomPickerUnlisten(this.$refs["geometry-picker"]);
            }
        },

        geometry (geom) {
            this.feature = geomPickerGetFeature(this.$refs["geometry-picker"]) || new Feature({geometry: geom});
            this.drawingLayer.getLayer().getSource().clear();
            if (this.feature) {
                this.drawingLayer.getLayer().getSource().addFeature(this.feature);
            }
            this.allLayerConfigs.forEach(configg => {
                configg.bboxGeometry = new GeometryCollection([geom]) || this.boundingGeometry;
            });
            // this.addNewSelection({selection: [new Feature(geom)], source: this.$t("additional:modules.tools.cosi.areaSelector.title"), id: this.$t("additional:modules.tools.cosi.areaSelector.title") + " #" + new Feature(geom).ol_uid});
            setBBoxToGeom(this, new GeometryCollection([geom]) || this.boundingGeometry, layerCollection.getLayers());
            // this.setFilterGeometry(this, geom || this.boundingGeometry);
            const service = this.restServiceById("1001");

            if (service === undefined) {
                console.warn("Rest Service with the ID 1001 is not configured in rest-services.json!");
            }
            else {
                // Beispiel: Transformiere die Koordinaten
                const outerPolygon = geometryToGeoJson(geom, false, "EPSG:25832", "EPSG:25832");

                WPS.wpsRequest("1001", service.url, "einwohner_ermitteln.fmw", {
                    "such_flaeche": JSON.stringify(outerPolygon)
                }, this.handleResponsee.bind(this));
            }
        }
    },

    created () {
        this.drawingLayer = this.getLayerById(this.id);
        this.drawingLayer.getLayer().setVisible(true);
        this.drawingLayer.getLayer().setStyle(this.drawingStyle);
    },
    methods: {
        ...mapMutations("Modules/AreaSelector", Object.keys(mutations)),
        // ...mapMutations("Modules/Filter", ["setFilterGeometry"]),
        // ...mapActions("Maps", ["addNewLayerIfNotExists"]),
        // ...mapActions("Modules/SelectionManager", ["addNewSelection"]),

        /**
         * Gets a layer by its ID from the layer collection. If the layer does not exist,
         * it creates a new vector-based layer with the specified ID, adds it to the layer collection,
         * and then returns the newly created layer.         *
         * @param {string} id - The unique identifier of the layer to get or create.
         * @returns {Object} The layer object corresponding to the given ID.
         */
        getLayerById (id) {
            if (typeof layerCollection.getLayerById(id) !== "undefined") {
                return layerCollection.getLayerById(id);
            }
            const layer = layerFactory.createLayer({
                typ: "VECTORBASE",
                id: id,
                name: id,
                alwaysOnTop: true
            });

            layerCollection.addLayer(layer);
            return layer;
        },

        handleResponsee (resp) {
            const parsedData = resp.ExecuteResponse.ProcessOutputs.Output.Data.ComplexData.einwohner,
                responseResult = JSON.parse(parsedData.ergebnis);

            this.einwohner = responseResult.einwohner_fhh;
        },

        /**
         * Updates the geometry from the geomPicker in the data for later use when instantiating a new feature.
         * @param {module:ol/Geometry} geom - The new geometry object.
         * @returns {void}
         */
        updateGeometry (geom) {
            this.setGeometry(geom);
            geomPickerUnlisten(this.$refs["geometry-picker"]);
        }
    }
};
</script>

<template lang="html">
    <ToolInfo
        :url="readmeUrl"
        :locale="currentLocale"
        :summary="$t('additional:modules.tools.cosi.areaSelector.info')"
    />
    <div id="area-selector">
        <GeometryPicker
            ref="geometry-picker"
            :geom-field="geomField"
            :is-gml="false"
            @updateGeometry="updateGeometry"
        />
    </div>
    Einwohner: {{ einwohner }}
</template>
