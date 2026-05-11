<script>
import BaseLayer from "ol/layer/Base";
import {Select} from "ol/interaction";
import DrawTypes from "@shared/modules/draw/components/DrawTypes.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {fromCircle} from "ol/geom/Polygon";
import GeoAnalyzeResultBuilding from "./GeoAnalyzeResultBuilding.vue";
import GeoAnalyzeResultGeometry from "./GeoAnalyzeResultGeometry.vue";
import GeoJSON from "ol/format/GeoJSON";
import getters from "../store/gettersGeoAnalyze";
import {mapGetters, mapMutations, mapActions} from "vuex";
import mutations from "../store/mutationsGeoAnalyze";
import Point from "ol/geom/Point";
import {requestAnalyze} from "../api/analyze";
import SimpleGeometry from "ol/geom/SimpleGeometry";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";

export default {
    name: "GeoAnalyze",
    components: {
        FlatButton,
        DrawTypes,
        IconButton,
        GeoAnalyzeResultBuilding,
        GeoAnalyzeResultGeometry
    },
    data () {
        return {
            result: [],
            selectedOption: "draw",
            options: {
                draw: {text: "Polygon zeichnen", icon: "bi bi-pencil"},
                select: {text: "Geometrie wählen", icon: "bi bi-pentagon"},
                click: {text: "Gebäude auswerten", icon: "bi bi-building"}
            },
            currentLayout: {
                fillColor: [255, 255, 255],
                fillTransparency: 50,
                strokeColor: [60, 95, 148],
                strokeWidth: 2
            },
            drawTypeLabels: [
                {type: "polygon", label: "common:shared.modules.draw.drawTypes.polygon"},
                {type: "box", label: "common:shared.modules.draw.drawTypes.box"},
                {type: "circle", label: "common:shared.modules.draw.drawTypes.circle"}
            ],
            selectedDrawType: "Polygon",
            selectedDrawTypeMain: "Polygon",
            selectedInteraction: null
        };
    },
    computed: {
        ...mapGetters("Modules/GeoAnalyze", Object.keys(getters)),
        ...mapGetters("Maps", ["clickCoordinate"]),

        /**
         * Gets the name of the current result child component. Depending on the "selectedOption" data.
         * @returns {String} The name of the child component. GeoAnalyzeResultBuilding for the analysis of a buildings
         * and GeoAnalyzeResultGeometry for the analysis of a geometry.
         */
        currentResultComponent: function () {
            if (this.selectedOption === "click") {
                return "GeoAnalyzeResultBuilding";
            }
            if (this.selectedOption === "select" || this.selectedOption === "draw") {
                return "GeoAnalyzeResultGeometry";
            }
            return null;
        },
        /**
         * Gets the heading text based on the currently selected option.
         * @returns {String} The heading title corresponding to 'draw', 'select', or 'click'.
         */
        headingText () {
            const titles = {
                draw: "Auswertung der eingezeichneten Fläche",
                select: "Auswertung der ausgewählten Geometrie",
                click: "Gebäude auswerten"
            };

            return titles[this.selectedOption];
        },
        /**
         * Gets the alert message when no result is available for the current mode.
         * @returns {String} The empty-state message.
         */
        noResultAlertText () {
            const messages = {
                draw: "Es wurde noch kein Polygon eingezeichnet, das ausgewertet werden kann.",
                select: "Es wurde noch keine Geometrie ausgewählt, die ausgewertet werden kann.",
                click: "Bitte klicken Sie auf ein Gebäude in der Karte, um die Auswertung zu starten."
            };

            return messages[this.selectedOption];
        }
    },
    watch: {
        clickCoordinate: "createAnalyzeGeometry",
        selectedOption: "toggleInteraction",

        /**
         * Updates the drawing interaction type when the draw mode is active.
         * @param {string} newType - The geometry type
         * @returns {void}
         */
        selectedDrawType (newType) {
            if (this.selectedOption === "draw" && this.draw) {
                this.draw.setActive(false);
                this.draw.set("type", newType);
                this.draw.setActive(true);
                this.layer.getSource().clear();
            }
        }
    },
    created () {
        this.setNonReactiveData();
    },
    mounted () {
        this.addLayer(this.layer);
        this.addInteractions();
        if (this.selectedOption === "select") {
            this.activateInteraction("select");
        }
    },
    unmounted () {
        this.removeLayerFromMap(this.layer);
        if (this.selectedOption !== "click") {
            this.deactivateInteraction(this.selectedOption);
        }
        this.removeInteractions();
    },
    methods: {
        ...mapMutations("Modules/GeoAnalyze", Object.keys(mutations)),
        ...mapActions("Maps", ["addLayer", "addInteraction", "removeInteraction"]),
        ...mapActions("Alerting", ["addSingleAlert"]),

        /**
         * Adds the select interaction and the draw interaction to the map.
         * @returns {void}
         */
        addInteractions () {
            this.addInteraction(this.select);
        },

        /**
         * Activates the interaction of the given name.
         * @param {String} name - The variable name of the interaction.
         * @returns {void}
         */
        activateInteraction (name) {
            if (name === "select" && this.select) {
                this.select.setActive(true);
            }
        },

        /**
         * Creates a point geometry for building analyze if selectOption is set to "click".
         * Is called by the clickCoordinate watcher.
         * @returns {void}
         */
        createAnalyzeGeometry () {
            if (this.selectedOption === "click") {
                this.geometry = new Point(this.clickCoordinate);
                this.getAnalyzeData(this.geometry);
            }
        },

        /**
         * Deactivates the interaction of the given name.
         * @param {String} name - The variable name of the interaction.
         * @returns {void}
         */
        deactivateInteraction (name) {
            if (name === "select" && this.select) {
                this.select.setActive(false);
            }
        },

        /**
         * Returns whether the feature should be selected.
         * @param {module:ol/Feature} feature - The selected feature.
         * @returns {boolean} - Returns true if the feature may be selected or false otherwise.
         */
        filterForSelect (feature) {
            const geomTypes = ["Polygon", "MultiPolygon", "Circle"],
                isIncluded = geomTypes.includes(feature.getGeometry().getType());

            if (!isIncluded) {
                this.addSingleAlert({content: "Es können nur Flächen und Kreise ausgwählt werden"});
            }
            return isIncluded;
        },

        /**
         * Gets the raw data of the given geometry or the corresponding excel file.
         * Encodes the geometry to a GeoJSON geometry, calls the API and sets the response or opens the excel.
         * @param {module:ol/geom/SimpleGeometry} geometry - The given geometry. Point or Polygon.
         * @param {boolean} [getExcel=false] - Checks if the excel file is fetched of the given geometry.
         * @returns {void}
         */
        getAnalyzeData (geometry, getExcel = false) {
            if (!(geometry instanceof SimpleGeometry)) {
                return;
            }
            const geojsonFormat = new GeoJSON(),
                payload = {
                    geom: geojsonFormat.writeGeometryObject(geometry),
                    excel: getExcel
                };

            requestAnalyze(this.apiUrl, payload)
                .then(data => {
                    if (data?.errorMessage) {
                        this.addSingleAlert({
                            category: "error",
                            content: data.errorMessage,
                            displayClass: "error"
                        });
                    }
                    // open excel
                    else if (data?.file) {
                        window.open(data.file);
                    }
                    // set the reponse
                    else if (data.length !== 0) {
                        this.result = data;
                    }
                    else {
                        this.addSingleAlert({
                            content: "Es wurde keine Geometrie getroffen, die abgefragt werden kann!"
                        });
                    }
                });
        },

        /**
         * Handles the end of a drawing interaction and converts circle geometries to polygons.
         * @param {Object} event - The OpenLayers drawend event.
         * @returns {void}
         */
        onDrawEnd (evt) {
            let geometry = evt.feature.getGeometry();

            if (geometry.getType() === "Circle") {
                geometry = fromCircle(geometry);
            }
            this.geometry = geometry;
            this.getAnalyzeData(this.geometry);
        },

        /**
         * Clears the layer, interactions and results.
         * @returns {void}
         */
        resetAll () {
            this.layer.getSource().clear();
            this.removeInteractions();
            this.result = [];
        },

        /**
         * Registers listener for draw interaction events.
         * On "drawstart" all features are removed from the source of the given layer.
         * On "drawend" the geometry of the feature is send to the api.
         * On "change:active" all features are removed from the source of the given layer.
         * @param {module:ol/interaction/Draw} draw - Interaction for drawing feature geometries.
         * @param {module:ol/layer/Vector} layer - Layer for vector data.
         * @returns {void}
         */
        registerDrawListener (draw, layer) {
            draw.on("drawstart", () => layer.getSource().clear());
            draw.on("drawend", (evt) => {
                this.geometry = evt.feature.getGeometry();
                this.getAnalyzeData(this.geometry);
            });
            draw.on("change:active", () => layer.getSource().clear());
        },

        /**
         * Registers listener for select interaction events.
         * On "select" the geometry of the feature is converted to a polygon and sent to the api.
         * On "change:active" all features are removed from the source of the given layer.
         * @param {module:ol/interaction/Select} select - Interaction for selecting vector features.
         * @returns {void}
         */
        registerSelectListener (select) {
            select.on("select", (evt) => {
                if (evt.selected.length === 0) {
                    return;
                }
                const featureGeometry = evt.selected[0].getGeometry();

                this.geometry = featureGeometry.getType() === "Circle" ? fromCircle(featureGeometry) : featureGeometry;
                this.getAnalyzeData(this.geometry);
            });
            select.on("change:active", (evt) => evt.target.getFeatures().clear());
        },

        /**
         * Removes the select interaction and the draw interaction from the map.
         * @returns {void}
         */
        removeInteractions () {
            this.removeInteraction(this.select);
        },

        /**
         * Removes the given layer from the map.
         * @param {module:ol/layer/Base} layer - The given layer.
         * @returns {void}
         */
        removeLayerFromMap (layer) {
            if (mapCollection.getMap("2D") && layer instanceof BaseLayer) {
                mapCollection.getMap("2D").removeLayer(layer);
            }
        },

        /**
         * Resets everything to the default state.
         * Removes the layer of the draw interaction from the map.
         * Deactivates the selected interaction.
         * Removes all interactions from the map.
         * Sets selectOption to "draw" and result to an empty object.
         * @returns {void}
         */
        reset () {
            this.removeLayerFromMap(this.layer);
            if (this.selectedOption !== "click") {
                this.deactivateInteraction(this.selectedOption);
            }
            this.removeInteractions();
            this.selectedOption = "draw";
            this.result = [];
        },

        /**
         * Sets all needed non reactive data.
         * @returns {void}
         */
        setNonReactiveData () {
            // layer for bbox feature
            this.layer = new VectorLayer({
                name: "Geometry-Analyze",
                source: new VectorSource(),
                alwaysOnTop: true
            });

            this.select = new Select({
                filter: this.filterForSelect
            });
            this.deactivateInteraction("select");
            this.registerSelectListener(this.select, this.geojsonFormat);

            // to keep the geometry for the excel
            this.geometry = {};
        },

        /**
         * Toggles the interaction by selectedOption.
         * Is called by the selectedOption watcher.
         * @param {String} newValue - New value of selectedOption.
         * @param {String} oldValue - Old value of selectedOption.
         * @returns {void}
         */
        toggleInteraction (newValue, oldValue) {
            this.result = [];
            if (newValue === "select") {
                this.activateInteraction("select");
                this.layer.getSource().clear();
            }
            else if (oldValue === "select") {
                this.deactivateInteraction("select");
                this.layer.getSource().clear();
            }
        }
    }
};
</script>

<template lang="html">
    <div>
        <div class="tab-bar pb-4">
            <ul
                class="nav nav-fill p-0"
            >
                <li
                    v-for="(item, key) in options"
                    :key="'nav-item-' + key"
                    class="nav-item"
                    role="presentation"
                >
                    <button
                        class="nav-link p-2 d-flex flex-column align-items-center justify-content-center text-wrap"
                        :class="{ active: selectedOption === key }"
                        type="button"
                        @click="selectedOption = key"
                    >
                        <i
                            :class="[item.icon, 'me-2']"
                        />
                        {{ $t(item.text) }}
                    </button>
                </li>
            </ul>
        </div>
        <div class="tab-content mt-3">
            <div
                v-if="selectedOption === 'draw'"
            >
                <h5 class="px-3">
                    Zeichnen
                </h5>
                <div
                    class="d-flex align-items-start justify-content-between w-100 mb-3"
                >
                    <DrawTypes
                        :current-layout="currentLayout"
                        :draw-types="['polygon', 'box', 'circle']"
                        :draw-type-labels="drawTypeLabels"
                        :selected-draw-type="selectedDrawType"
                        :selected-draw-type-main="selectedDrawTypeMain"
                        :source="layer.getSource()"
                        :set-selected-draw-type="value => selectedDrawType = value"
                        :set-selected-draw-type-main="value => selectedDrawTypeMain = value"
                        @drawstart="resetAll"
                        @drawend="onDrawEnd"
                    />
                    <IconButton
                        :class-array="['btn-primary']"
                        aria="Löschen"
                        icon="bi bi-trash"
                        :interaction="resetAll"
                        label="Löschen"
                    />
                </div>
                <hr>
            </div>
            <template v-if="result && Object.keys(result).length > 0">
                <div class="stats-wrapper py-2">
                    <h5 class="mb-3">
                        {{ headingText }}
                    </h5>
                    <p class="mb-3 text-muted d-flex align-items-start">
                        <i class="bi bi-info-circle me-2 mt-1" />
                        <small>Aus Datenschutzgründen wird bei Einwohnerzahlen kleiner 4 die Zahl drei oder null verwendet.</small>
                    </p>
                    <div class="d-flex justify-content-end mt-2">
                        <FlatButton
                            :interaction="() => getAnalyzeData(geometry, true)"
                            text="Alle Daten exportieren"
                            :icon="'bi bi-download'"
                        />
                    </div>
                    <component
                        :is="currentResultComponent"
                        :results="result"
                        class="mb-3"
                    />
                </div>
            </template>
            <template v-else>
                <div
                    class="alert alert-info border-1 d-flex align-items-center pt-3"
                    role="alert"
                >
                    <i class="alert-icon bi bi-info-circle me-4 mt-1" />
                    <div>
                        {{ noResultAlertText }}
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>
<style lang="scss" scoped>
 .tab-bar {
        .nav-link {
            color: $dark_blue;
            line-height: 1.2;
        }
        .active {
            font-family: $font_family_accent;
            border-bottom: 2px solid $secondary;
            color: $secondary;
        }
        li:has(button:disabled) {
            cursor: not-allowed;
            opacity: 0.6;
        }
    }
    .alert-info {
        background-color: rgba($light-blue, 0.7);
        border-color: $secondary;
        color: $secondary;
    }
    .alert-icon {
        font-size: $icon_length_small;
    }
</style>
