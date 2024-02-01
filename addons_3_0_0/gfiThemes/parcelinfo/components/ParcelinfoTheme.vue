<script>
import {mapGetters} from "vuex";
import isObject from "../../../../../src_3_0_0/shared/js/utils/isObject";
import FlatButton from "../../../../../src_3_0_0/shared/modules/buttons/components/FlatButton.vue";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList";
import {getFeaturePOST as wfsGetFeaturePOST} from "../../../../../src_3_0_0/shared/js/api/wfs/getFeature";
import getOAFFeature from "../../../../../src_3_0_0/shared/js/api/oaf/getOAFFeature";
import {equalTo, and as andFilter} from "ol/format/filter";
import WFS from "ol/format/WFS";
import {Fill, Stroke, Style} from "ol/style";

export default {
    name: "ParcelinfoTheme",
    components: {FlatButton},
    props: {
        feature: {
            type: Object,
            required: true
        }
    },
    computed: {
        ...mapGetters(["isModuleAvailable"]),
        ...mapGetters("Maps", ["projection"]),
        ...mapGetters("Modules/ValuationPrint", ["parcelLayerId", "id"]),

        /**
         * Returns the mapped properties.
         * @returns {Object} The mapped properties.
         */
        mappedProperties: function () {
            return this.feature?.getMappedProperties();
        },

        /**
         * Checks whether the correct properties are on the parcel feature.
         * @returns {Boolean} - True if it is.
         */
        arePropsAvailable: function () {
            return typeof this.mappedProperties.Flurstück !== "undefined" && typeof this.mappedProperties.Gemarkung !== "undefined";
        }
    },
    watch: {
        feature () {
            if (this.isModuleAvailable("valuationPrint")) {
                this.highlightLayer.getSource().clear();
                if (this.arePropsAvailable) {
                    this.getAndAddFeature(this.rawParcelLayer);
                }
            }
        }
    },
    mounted () {
        if (this.isModuleAvailable("valuationPrint")) {
            this.rawParcelLayer = rawLayerList.getLayerWhere({id: this.parcelLayerId});
            this.highlightLayer = this.createAndAddLayer();

            if (this.arePropsAvailable) {
                this.getAndAddFeature(this.rawParcelLayer);
            }
        }
    },
    unmounted () {
        mapCollection.getMap("2D").removeLayer(this.highlightLayer);
    },
    methods: {
        isObject,

        /**
         * Creates a layer for highlighting on the map.
         * @returns {ol/layer/Vector} - The layer.
         */
        createAndAddLayer () {
            const layer = new VectorLayer({
                id: "parcelInfoLayer",
                name: "parcelInfoLayer",
                source: new VectorSource(),
                zIndex: 99999999999,
                style: new Style({
                    fill: new Fill({
                        color: "rgba(255,255,255,0)"
                    }),
                    stroke: new Stroke({
                        color: "#de2d26",
                        width: 5
                    })
                })
            });

            mapCollection.getMap("2D").addLayer(layer);
            return layer;
        },

        /**
         * Calls the corresponding function depending on the service typ and adds the feature to the highlight layer.
         * @param {Object} rawParcelLayer - The raw layer object for the parcel service.
         * @returns {void}
         */
        async getAndAddFeature (rawParcelLayer) {
            let olFeature;

            if (rawParcelLayer.typ === "WFS") {
                olFeature = await this.getFeatureFromWFS(rawParcelLayer, this.mappedProperties, this.projection);
            }
            else {
                olFeature = await this.getFeatureFromOAF(rawParcelLayer, this.mappedProperties, this.projection);
            }
            this.highlightLayer.getSource().addFeature(olFeature);
        },

        /**
         * Gets the feature from WFS based on the given properties.
         * @param {Object} rawParcelLayer - The raw layer object for the parcel service.
         * @param {Object} properties - The properties of the selected feature.
         * @param {Object} projection - The current map projection.
         * @returns {ol/Feature} - The feature to highlight.
         */
        async getFeatureFromWFS (rawParcelLayer, properties, projection) {
            const payload = {
                    featureNS: rawParcelLayer.featureNS,
                    featureTypes: [rawParcelLayer.featureType],
                    filter: andFilter(equalTo("flstnrzae", properties.Flurstück), equalTo("gemaschl", "02" + properties.Gemarkung)),
                    srsName: projection.getCode()
                },
                response = await wfsGetFeaturePOST(rawParcelLayer.url, payload),
                wfsReader = new WFS();

            return wfsReader.readFeature(response);
        },

        /**
         * Gets the feature from OAF based on the given properties.
         * @param {Object} rawParcelLayer - The raw layer object for the parcel service.
         * @param {Object} properties - The properties of the selected feature.
         * @param {Object} projection - The current map projection.
         * @returns {ol/Feature} - The feature to highlight.
         */
        async getFeatureFromOAF (rawParcelLayer, properties, projection) {
            const response = await getOAFFeature.getOAFFeatureGet(rawParcelLayer.url, rawParcelLayer.collection, 10000, `gemaschl='02${properties.Gemarkung}'AND flstnrzae='${properties.Flurstück}'`, "http://www.opengis.net/def/crs/EPSG/0/25832");

            return getOAFFeature.readAllOAFToGeoJSON(response, {
                featureProjection: projection.getCode()
            });
        },

        /**
         * Todos.
         * @returns {Boolean} false
         */
        createReport: function () {
            return false;
        }
    }
};
</script>

<template>
    <table
        v-if="isObject(mappedProperties)"
        class="table table-hover"
    >
        <tbody>
            <tr
                v-for="(value, key) in mappedProperties"
                :key="value"
            >
                <td class="firstCol">
                    {{ key }}
                </td>
                <td class="secCol">
                    {{ value }}
                </td>
            </tr>
        </tbody>
    </table>
    <FlatButton
        v-if="isModuleAvailable('valuationPrint') && arePropsAvailable"
        id="create-report"
        aria-label="$t('additional:addons.gfiThemes.parcelinfo.createReport')"
        :interaction="createReport"
        :text="$t('additional:addons.gfiThemes.parcelinfo.createReport')"
        :icon="'bi-printer'"
    />
</template>

<style lang="scss" scoped>
@import "~variables";

td.firstCol {
    width: 60%;
    font-family: $font_family_accent;
}
td.secCol {
    width: 40%;
    text-align: left;
}
</style>
