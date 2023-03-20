<script>
import ToolTemplate from "../../../src/modules/tools/ToolTemplate.vue";
import {mapGetters, mapMutations, mapActions} from "vuex";
import getters from "../store/gettersGeoAnalyze";
import mutations from "../store/mutationsGeoAnalyze";
import Dropdown from "../../../src/share-components/dropdowns/components/DropdownSimple.vue";
import {Draw, Select} from "ol/interaction";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import GeoJSON from "ol/format/GeoJSON";
import Point from "ol/geom/Point";
import SimpleGeometry from "ol/geom/SimpleGeometry";
import {fromCircle} from "ol/geom/Polygon";
import {requestAnalyze} from "../api/analyze";
import GeoAnalyzeResultBuilding from "./GeoAnalyzeResultBuilding.vue";
import GeoAnalyzeResultGeometry from "./GeoAnalyzeResultGeometry.vue";

export default {
    name: "GeoAnalyze",
    components: {
        ToolTemplate,
        Dropdown,
        GeoAnalyzeResultBuilding,
        GeoAnalyzeResultGeometry
    },
    data () {
        return {
            result: {},
            selectedOption: "draw",
            options: {
                "draw": "Polygon zeichnen",
                "select": "Geometrie wählen",
                "click": "Gebäude auswerten"
            }
        };
    },
    computed: {
        ...mapGetters("Tools/GeoAnalyze", Object.keys(getters)),
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
        active (newValue) {
            if (newValue) {
                this.addLayerToMap(this.layer);
                this.addInteractions();
                this.activateInteraction(this.selectedOption);
            }
            else {
                this.reset();
            }

        },
        clickCoordinate: "createAnalyzeGeometry",
        selectedOption: "toggleInteraction"
    },
    created () {
        this.setNonReactiveData();
        this.$on("close", () => {
            this.setActive(false);
        });
    },
    methods: {
        ...mapMutations("Tools/GeoAnalyze", Object.keys(mutations)),
        ...mapMutations("Maps", ["addLayerToMap", "removeLayerFromMap"]),
        ...mapActions("Maps", ["addInteraction", "removeInteraction"]),
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
            this.result = {};

            // TODO replace trigger when Menu is migrated
            // set the backbone model to active false for changing css class in menu (menu/desktop/tool/view.toggleIsActiveClass)
            // else the menu-entry for this tool is always highlighted
            const model = Radio.request("ModelList", "getModelByAttributes", {id: this.id});

            if (model) {
                model.set("isActive", false);
            }
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
            this.result = {};
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
    <ToolTemplate
        :title="$t(name)"
        :icon="icon"
        :active="active"
        :render-to-window="renderToWindow"
        :resizable-window="resizableWindow"
        :deactivate-gfi="deactivateGFI"
    >
        <template
            v-if="active"
            #toolBody
        >
            <form>
                <Dropdown
                    v-model="selectedOption"
                    :focus-on-creation="true"
                    :options="options"
                    :label="''"
                />
            </form>
            <template v-if="Object.keys(result).length > 0">
                <hr>
                <p>
                    <small>Aus Datenschutzgründen wird bei Einwohnerzahlen kleiner 4 die Zahl drei oder null verwendet.</small>
                </p>
                <hr>
                <component
                    :is="currentResultComponent"
                    :results="result"
                />
                <hr>
                <form class="d-flex justify-content-end">
                    <button
                        class="btn btn-primary"
                        type="button"
                        @click="getAnalyzeData(geometry, true)"
                    >
                        Details nach Excel exportieren
                    </button>
                </form>
            </template>
        </template>
    </ToolTemplate>
</template>

<style lang="scss" scoped>
    hr {
        margin-top: 10px;
        margin-bottom: 10px;
    }
    .dl-horizontal {
        dd {
            margin-left: 240px;
        }
        dt {
           width: 220px;
        }
    }
</style>
