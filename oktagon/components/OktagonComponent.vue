<script>
import {mapGetters, mapActions} from "vuex";
import {extractEventCoordinates} from "../../../src/shared/js/utils/extractEventCoordinates";
import findWhereJs from "../../../src/shared/js/utils/findWhereJs";
import layerCollection from "@core/layers/js/layerCollection";

export default {
    name: "OktagonComponent",
    computed: {
        ...mapGetters("Modules/OktagonComponent", [
            "layerIds",
            "submitURL",
            "submitObject",
            "zoomLevel"]),
        ...mapGetters("Menu", [
            "expanded"
        ])
    },
    mounted () {
        this.registerListener({type: "click", listener: this.onMapClick,
            keyForBoundFunctions: "onMapClick"});
        this.$nextTick(() => {
            this.initURLParameter();
        });
    },
    unmounted () {
        this.unregisterListener({type: "click", listener: this.onMapClick,
            keyForBoundFunctions: "onMapClick"});
    },
    methods: {
        ...mapActions("Maps", ["zoomToCoordinates", "registerListener", "unregisterListener", "placingPointMarker"]),
        ...mapActions("Modules/OktagonComponent", ["requestALKISWMS", "initURLParameter", "addCoordinatesToSubmitObject"]),
        ...mapActions("Menu", ["toggleMenu"]),

        /**
        * OnMapClick Shows the sidebar with it parameters
        * @param {Event} evt the click event
        * @returns {void}
        */
        async onMapClick (evt) {
            if (!this.expanded("secondaryMenu")) {
                this.toggleMenu("secondaryMenu");
            }
            const coord = extractEventCoordinates(evt.coordinate);

            this.zoomToCoordinates({center: coord, zoom: this.zoomLevel});
            this.placingPointMarker(coord);
            this.addCoordinatesToSubmitObject(coord);
            for (const layerId of this.layerIds) {
                const mapView2D = mapCollection.getMapView("2D"),
                    constrainedResolution = mapView2D.getConstrainedResolution(mapView2D.getResolution()),
                    resolution = findWhereJs(mapView2D.get("options"), {resolution: constrainedResolution}).resolution,
                    projection = mapView2D.getProjection(),
                    layer = layerCollection.getLayerById(layerId),
                    url = layer.getLayerSource().getFeatureInfoUrl(coord, resolution, projection, {
                        INFO_FORMAT: "text/xml",
                        STYLES: ""
                    });

                await this.requestALKISWMS(url);
            }
            this.setFocusToFirstControl();
        },
        /**
        * Opens the submit url in the same window
        * @returns {void}
        */
        async onSubmit () {
            window.open(await this.submitURL, "_self");
        },
        /**
        * Sets the focus to the close.
        * @returns {void}
        */
        setFocusToFirstControl () {
            this.$nextTick(() => {
                if (this.$refs.oktagonSubmitButton) {
                    this.$refs.oktagonSubmitButton.focus();
                }
            });
        }
    }
};
</script>

<template lang="html">
    <div>
        <div
            id="oktagon"
        >
            <table
                v-if="Object.keys(submitObject).length > 0"
                class="table table-condensed table-hover"
            >
                <tbody>
                    <tr
                        v-for="(value, key) in submitObject"
                        :key="key"
                    >
                        <td>
                            {{ key }}
                        </td>
                        <td>
                            {{ value }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="form-group form-group-sm row">
            <div class="col-md-6">
                <button
                    id="oktagonCloseButton"
                    type="button"
                    class="btn btn-secondary col-md-12"
                    @click="close"
                >
                    {{ $t("additional:modules.oktagon.cancel") }}
                </button>
            </div>
            <div class="col-md-6">
                <button
                    id="oktagonSubmitButton"
                    ref="oktagonSubmitButton"
                    type="button"
                    class="btn btn-primary col-md-12"
                    @click="onSubmit"
                >
                    {{ $t("additional:modules.oktagon.send") }}
                </button>
            </div>
        </div>
    </div>
</template>
