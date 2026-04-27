<script>
import BaseLayer from "ol/layer/Base";
import {Draw, Select} from "ol/interaction";
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
        GeoAnalyzeResultBuilding,
        GeoAnalyzeResultGeometry
    },
    data () {
        return {
            result: [],
            selectedOption: "draw",
            options: {
                "draw": "Polygon zeichnen",
                "select": "Geometrie wählen",
                "click": "Gebäude auswerten"
            }
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
            return "GeoAnalyzeResultGeometry";
        }
    },
    watch: {
        clickCoordinate: "createAnalyzeGeometry",
        selectedOption: "toggleInteraction"
    },
    created () {
        this.setNonReactiveData();
    },
    mounted () {
        this.addLayer(this.layer);
        this.addInteractions();
        this.activateInteraction(this.selectedOption);
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
            this.addInteraction(this.draw);
        },

        /**
         * Activates the interaction of the given name.
         * @param {String} name - The variable name of the interaction.
         * @returns {void}
         */
        activateInteraction (name) {
            this[name].setActive(true);
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
            this[name].setActive(false);
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
            this.removeInteraction(this.draw);
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

            // createBox() and type: 'Circle' return a box instead of a circle geometry
            this.draw = new Draw({
                source: this.layer.getSource(),
                type: "Polygon"
            });
            this.registerDrawListener(this.draw, this.layer, this.geojsonFormat);

            // for drawn features on the map
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
            if (newValue === "click") {
                this.deactivateInteraction(oldValue);
            }
            else if (oldValue === "click") {
                this.activateInteraction(newValue);
            }
            else {
                this.deactivateInteraction(oldValue);
                this.activateInteraction(newValue);
            }
        }
    }
};
</script>

<template lang="html">
    <div>
        <div class="form-floating mb-2">
            <select
                id="geo-analyze-mode"
                v-model="selectedOption"
                class="form-select"
            >
                <option
                    v-for="(label, value) in options"
                    :key="value"
                    :value="value"
                >
                    {{ label }}
                </option>
            </select>
            <label for="geo-analyze-mode">
                Analysemodus
            </label>
        </div>
        <template v-if="Object.keys(result).length > 0">
            <p class="mb-3">
                <small>Aus Datenschutzgründen wird bei Einwohnerzahlen kleiner 4 die Zahl drei oder null verwendet.</small>
            </p>
            <component
                :is="currentResultComponent"
                :results="result"
                class="mb-3"
            />
            <FlatButton
                v-if="selectedOption === 'click'"
                :interaction="() => getAnalyzeData(geometry, true)"
                :text="'Details nach Excel exportieren'"
                :icon="'bi bi-download'"
            />
        </template>
    </div>
</template>
