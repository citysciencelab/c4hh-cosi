<script>
import {mapGetters, mapActions} from "vuex";
import omit from "../../../../src/utils/omit";
import {extractEventCoordinates} from "../../../../src/utils/extractEventCoordinates";
import {getWKTGeom} from "../../../../src/utils/getWKTGeom";

export default {
    name: "FlaecheninfoTheme",
    props: {
        feature: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            filteredProps: {}
        };
    },
    computed: {
        ...mapGetters("Tools/Gfi", ["gfiFeatures"]),
        ...mapGetters("MapMarker", ["markerPolygon"])
    },
    watch: {
        feature () {
            this.filterPropsAndHighlightRing();
        }
    },
    mounted () {
        this.$parent.$emit("hidemarker");
        this.filterPropsAndHighlightRing();
    },
    methods: {
        ...mapActions("MapMarker", ["removePolygonMarker", "placingPolygonMarker"]),

        /**
         * Filters the features properties and highlights the border of the parcel.
         * @returns {void}
         */
        filterPropsAndHighlightRing () {
            const requestedParcelId = Radio.request("GFI", "getRequestedParcelId");
            let propsMapped = this.feature.getMappedProperties(),
                ring = "";

            // Sometimes parcel service returns multiple results as center points parcels may be inside another
            // parcel. Because this, results are filtered this way.
            if (requestedParcelId !== false && typeof this.gfiFeatures.filter === "function") {
                const gfiContent = this.gfiFeatures.filter(foundGfiContent => {
                    return foundGfiContent.getProperties().flurstueck === requestedParcelId;
                });

                if (gfiContent[0]) {
                    propsMapped = gfiContent[0].getMappedProperties();
                }
            }

            ring = this.getCoordinates(propsMapped.Umringspolygon);
            this.highlightRing(ring);
            this.filteredProps = omit(propsMapped, ["Umringspolygon"]);
        },
        /**
         * Saves the geometry as WKT.
         * @param {string} ring polygon from feature
         * @returns {String} the coordinates as WKT
         */
        getCoordinates (ring) {
            const coordinatesString = ring ? ring.slice(10, ring.length - 2) : "",
                coordinates = coordinatesString.replace(/,/g, " ");

            return coordinates;
        },

        /**
         * Highlights the borders of the parcel.
         * @param {string} coordinates of the parcels border
         * @returns {void}
         */
        highlightRing (coordinates) {
            const coord = extractEventCoordinates(coordinates);

            this.removePolygonMarker();
            this.placingPolygonMarker(getWKTGeom(coord, "POLYGON"));

            if (this.markerPolygon?.getSource().getFeatures().length > 0) {
                Radio.trigger("Map", "zoomToExtent", {extent: this.markerPolygon?.getSource()?.getExtent(), options: {maxZoom: 7}});
            }
        },
        /**
         * Create a jasper report of the selected parcel.
         * @fires Tools.ParcelSearch#RadioRequestParcelSearchCreateReport
         * @returns {void}
         */
        createReport () {
            const props = this.feature.getProperties();
            let parcel = props.flurstueck;

            while (parcel.length < 6) {
                parcel = "0" + parcel;
            }

            Radio.trigger("ParcelSearch", "createReport", parcel.trim(), props.gemarkung);
        }
    }
};

</script>

<template>
    <div
        v-if="filteredProps"
    >
        <table class="table table-hover">
            <tbody>
                <tr
                    v-for="(value, key) in filteredProps"
                    :key="key"
                >
                    <td>{{ key }}</td>
                    <td>{{ value }}</td>
                </tr>
            </tbody>
        </table>
        <button
            type="button"
            tabindex="-1"
            class="btn btn-primary btn-sm pull-right"
            title="Bericht erzeugen"
            @click="createReport"
        >
            <span>Bericht erzeugen</span>
        </button>
    </div>
</template>
