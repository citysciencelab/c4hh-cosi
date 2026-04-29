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
            return this.results[0]?.geom.coordinates;
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
            if (coordinates) {
                const buildingGeometry = new Polygon(coordinates);

                this.placingPolygonMarker(buildingGeometry);
                this.zoomToExtent({extent: buildingGeometry.getExtent()});
            }
        }
    }

};
</script>

<template lang="html">
    <div>
        <dl class="population row g-2 px-4">
            <h6 class="population-heading">
                Einwohnerzahlen aller Adressen
            </h6>
            <dt class="col-sm-7 text-muted">
                Hauptsitz gesamt
            </dt>
            <dd class="col-sm-5 border-start-sm ps-sm-3 text-muted">
                {{ calculateResidentSum("ew_haupt") }}
            </dd>
            <dt class="col-sm-7 text-muted">
                Nebensitz gesamt
            </dt>
            <dd class="col-sm-5 border-start-sm ps-sm-3 mb-3 text-muted">
                {{ calculateResidentSum("ew_neben") }}
            </dd>
        </dl>
        <div class="results-grid px-3">
            <div
                v-for="(result, index) in results"
                :key="index"
                class="card border-1 mb-4"
            >
                <div class="card-body p-4">
                    <small class="meta-label">Adresse</small>
                    <h6 class="card-title mb-2">
                        {{ result[Object.keys(mappedKeys)[0]] }}
                    </h6>

                    <dl class="info-list mb-0">
                        <template
                            v-for="(label, key, idx) in mappedKeys"
                            :key="key"
                        >
                            <div
                                v-if="idx !== 0"
                                class="info-row d-flex justify-content-between align-items-center py-1"
                            >
                                <dt class="label text-muted mb-0">
                                    {{ label }}
                                </dt>
                                <dd class="value mb-0 text-end">
                                    {{ result[key] }}
                                </dd>
                            </div>
                        </template>
                    </dl>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .population-heading, .card-title {
        color: $secondary;
        font-family: $font_family_accent;
    }
    .results-grid {
        .card {
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);;
        border-radius: 10px;
    }
        .card-title {
            font-size: $font_size_big;
        }
        .card-label {
            font-family: $font_family_accent;
        }
        .info-list {
            border-top: 1px solid #fff;

            .info-row {
                border-bottom: 1px solid #dee2e6;
                &:last-child {
                    border-bottom: none;
                }
                .label {
                    font-family: $font_family_accent;
                }
                .value {
                    word-break: break-word;
                    font-family: $font_family_default;
                }
            }
        }
}

</style>
