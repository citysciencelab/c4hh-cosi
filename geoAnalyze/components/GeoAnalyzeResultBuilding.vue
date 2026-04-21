<script>
import {mapActions} from "vuex";
import Polygon from "ol/geom/Polygon";

export default {
    name: "GeoAnalyzeResultBuilding",
    props: {
        results: {
            type: Array,
            required: true
        }
    },
    computed: {
        /**
         * Gets the coordinates of the building
         * @returns {Number[]} - polygon coordinates
         */
        buildingCoordinates: function () {
            return this.results[0].geom.coordinates;
        }
    },
    created () {
        this.mappedKeys = {
            "adresse": "Adresse",
            "ew_haupt": "Einwohnerzahl Hauptsitz",
            "ew_neben": "Einwohnerahl Nebensitz",
            "anzahlobergeschosse": "Obergeschosse",
            "anzahluntergeschosse": "Erdgeschosse",
            "bauweise": "Bauweise",
            "gebaeudefunktion": "Gebäudefunktion",
            "dachform": "Dachform"
        };
    },
    mounted () {
        this.markAndZoomToBuilding(this.buildingCoordinates);
    },
    updated () {
        this.markAndZoomToBuilding(this.buildingCoordinates);
    },
    beforeUnmount () {
        this.removePolygonMarker();
    },
    methods: {
        ...mapActions("Maps", ["zoomToExtent", "placingPolygonMarker", "removePolygonMarker"]),

        /**
         * Calculates the sum of residents of the main residence or secondary residence
         * @param {String} key - ew_haupt for main residence || ew_neben for secondary residence
         * @returns {Number} the sum of the residents
         */
        calculateResidentSum (key) {
            let einw = 0;

            this.results.forEach((result) => {
                einw += result[key];
            });

            return einw;
        },

        /**
         * Marks the building and zooms to it.
         * @param {Number[]} coordinates - The polygon coordinates of the building.
         * @returns {void}
         */
        markAndZoomToBuilding (coordinates) {
            const buildingGeometry = new Polygon(coordinates);

            this.placingPolygonMarker(buildingGeometry);
            this.zoomToExtent({extent: buildingGeometry.getExtent()});
        }
    }

};
</script>

<template lang="html">
    <div>
        <p class="mb-3">
            <span>Einwohnerzahl Hauptsitz gesamt: {{ calculateResidentSum("ew_haupt") }}</span>
            <br>
            <span>Einwohnerzahl Nebensitz gesamt: {{ calculateResidentSum("ew_neben") }}</span>
        </p>
        <table class="table table-bordered">
            <tbody>
                <tr
                    v-for="(value, key) in mappedKeys"
                    :key="key"
                >
                    <th>
                        {{ value }}
                    </th>
                    <td
                        v-for="(result, index) in results"
                        :key="index"
                    >
                        {{ result[key] }}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style lang="scss" scoped>
    span, th {
        font-family: "MasterPortalFont Bold", "Arial Narrow", Arial, sans-serif;
    }
</style>
