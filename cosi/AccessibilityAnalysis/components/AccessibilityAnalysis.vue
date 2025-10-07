<script>
import AccessibilityAnalysisLegend from "./AccessibilityAnalysisLegend.vue";
import AccessibilityAnalysisTrafficFlow from "./AccessibilityAnalysisTrafficFlow.vue";
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import ButtonGroup from "../../components/ButtonGroup.vue";
import deepEqual from "deep-equal";
import differenceJs from "@shared/js/utils/differenceJS";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import getters from "../store/gettersAccessibilityAnalysis";
import {mapActions, mapGetters, mapMutations} from "vuex";
import methods from "./methodsAnalysis";
import mutations from "../store/mutationsAccessibilityAnalysis";
import {downloadGeoJson, exportAsGeoJson} from "../utils/exportResults";
import {Select} from "ol/interaction";
import ToolInfo from "../../components/ToolInfo.vue";
import {getLayerSource} from "../../utils/layer/getLayerSource";
import {geometryToGeoJson} from "../../utils/geometry/convertToGeoJson";
import {transformCoordinate, transformCoordinates} from "../utils/transformCoordinates";
import TabBar from "../../components/TabBar.vue";
import {simplify} from "../../utils/geometry/simplify";
import {getFlatCoordinates} from "../../utils/geometry/getFlatCoordinates";
import {filterAllFeatures} from "../../utils/layer/filterAllFeatures";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import SliderItem from "@shared/modules/slider/components/SliderItem.vue";
import layerCollection from "@core/layers/js/layerCollection";
import layerFactory from "@core/layers/js/layerFactory";
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";
import {unpackCluster} from "../../utils/features/unpackCluster.js";
import {VAutocomplete} from "vuetify/components/VAutocomplete";
import VectorLayer from "ol/layer/Vector.js";
import WPS from "@shared/js/api/wps.js";
import EditForReportTemplate from "../../components/EditForReportTemplate.vue";

export default {
    name: "AccessibilityAnalysis",
    components: {
        AccessibilityAnalysisLegend,
        AccessibilityAnalysisTrafficFlow,
        AccordionItem,
        ButtonGroup,
        FlatButton,
        IconButton,
        SliderItem,
        SwitchInput,
        TabBar,
        ToolInfo,
        VAutocomplete,
        EditForReportTemplate
    },
    data () {
        return {
            abortController: null,
            activeMode: null,
            availableModes: [
                {
                    type: "point",
                    text: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.points"),
                    icon: "bi bi-geo-alt", title: "Erreichbarkeit ab einem Referenzpunkt",
                    description: "Zeigt ein Gebiet an, welches von einem ausgewählten Punkt auf der Karte innerhalb einer festgelegten Entfernung erreichbar ist.",
                    info: "Noch kein Punkt ausgewählt. Um einen Punkt zu setzen, bitte auf die Karte klicken!"
                },
                {
                    type: "facility",
                    text: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.facilities"),
                    icon: "bi bi-building",
                    title: "Erreichbarkeit ab einer ausgewählten Einrichtung",
                    description: "Zeigt ein Gebiet an, welches von einer ausgewählten Einrichtung auf der Karte  innerhalb einer festgelegten Entfernung erreichbar ist.",
                    info: "Noch keine Einrichtung ausgewählt. Um eine Einrichtung zu wählen, bitte auf eine oder mehrere Einrichtungen in der Karte klicken!"
                },
                {
                    type: "path",
                    text: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.referToPath"),
                    icon: "bi bi-map",
                    title: "Erreichbarkeit entlang einer Route",
                    description: "Wenn Sie im Routing-Tool eine Route berechnet haben, können Sie hier die Erreichbarkeit entlang dieser Route analysieren.",
                    info: "Noch keine Route berechnet. Um eine Route zu berechnen, bitte das Routing-Tool öffnen, Start- und Zielpunkt wählen und eine Route berechnen."
                }
            ],
            facilityNames: [],
            directionsLayer: null,
            transportTypes: [
                {
                    type: "driving-car",
                    name: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.transportTypes.driving-car"),
                    icon: "bi bi-car-front"
                },
                {
                    type: "cycling-regular",
                    name: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.transportTypes.cycling-regular"),
                    icon: "bi bi-bicycle"
                },
                {
                    type: "foot-walking",
                    name: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.transportTypes.foot-walking"),
                    icon: "bi bi-person-walking"
                },
                {
                    type: "wheelchair",
                    name: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.transportTypes.wheelchair"),
                    icon: "bi bi-person-wheelchair"
                }
            ],
            scaleUnits: [
                {
                    default: 20,
                    max: 180,
                    maxLabel: "180 min",
                    minLabel: "0 min",
                    name: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.scaleUnits.time"),
                    type: "time",
                    unit: "min"
                },
                {
                    default: 1000,
                    max: 10000,
                    maxLabel: "10.000 m",
                    minLabel: "0 m",
                    name: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.scaleUnits.distance"),
                    type: "distance",
                    unit: "m"
                }
            ],
            legendColors: [
                "rgba(0, 240, 3, 0.6)",
                "rgba(200, 200, 3, 0.6)",
                "rgba(240, 0, 3, 0.6)",
                "rgba(180, 165, 165, 0.8)"
            ],
            isAllFacilitiesChecked: false,
            selectionCards: [],
            useTravelTimeIndex: false,
            mappedRoutingProfiles: {
                "CAR": "Auto",
                "HGV": "LKW",
                "CYCLING": "Fahrrad",
                "FOOT": "Fußweg",
                "WHEELCHAIR": "Rollstuhl"
            },
            visibleVectorLayers: []
        };
    },
    computed: {
        ...mapGetters(["allLayerConfigs", "restServiceById", "visibleSubjectDataLayerConfigs"]),
        ...mapGetters("Language", ["currentLocale"]),
        ...mapGetters("Maps", ["clickCoordinate", "getVisibleLayerList", "projectionCode"]),
        ...mapGetters("Modules/AccessibilityAnalysis", Object.keys(getters)),
        ...mapGetters("Modules/DistrictSelector", ["boundingGeometry"]),
        ...mapGetters("Modules/Routing/Directions", ["directionsRouteSource", "directionsRouteLayer", "routingDirections", "settings"]),
        // ...mapGetters("Modules/FeaturesList", ["activeVectorLayerList", "isFeatureActive", "layerMapById"]),
        // ...mapGetters("Modules/AreaSelector", {areaSelectorGeom: "geometry"}),
        // ...mapGetters("Modules/SelectionManager", ["activeSelection"]),
        // ...mapGetters("Modules/ScenarioBuilder", ["scenarioUpdated"]),

        /**
         * Checks if an analysis set is active.
         * @returns {Boolean} True if an analysis set is active, false otherwise.
         */
        hasActiveSet () {
            return this.activeSet !== null;
        },

        /**
         * Returns the value of distance or time based on the selected scale unit.
         * @returns {Number} The value of distance or time.
         */
        scaleUnitValue () {
            return this.scaleUnit === "time" ? this.time : this.distance;
        },


        /**
         * Returns the selected layers based on the visible vector layers
         * and the selected facility names.
         * @returns {Array} - An array of layers that match the selected facility names.
         */
        selectedLayer () {
            return this.visibleVectorLayers.filter(layer => {
                return this.selectedFacilityNames.includes(layer.getLayer().get("name"));
            });
        }
    },
    watch: {
        /**
         * Watches changes on the active set index. If the new index is valid, it updates the component's state.
         * @param {Number} index - The new active set index.
         * @returns {void}
         */
        activeSet (index) {
            if (!this.dataSets[index]) {
                return;
            }

            for (const key in this.dataSets[index].inputs) {
                const computedProperty = this.$options.computed[key];

                if (typeof computedProperty === "function") {
                    const capName = key.charAt(0).toUpperCase() + key.slice(1);

                    if (this.dataSets[index].inputs[key]) {
                        this["set" + capName](this.dataSets[index].inputs[key]);
                    }
                }
                else {
                    this[key] = this.dataSets[index].inputs[key];
                }
            }

            if (this.dataSets[index].inputs.mode === "point" || this.dataSets[index].inputs.mode === "facility") {
                this.setMarkerByCoordinates(this.selectionCards.map(card => card.coord25832));
            }

            this.setIsochroneFeatures(this.dataSets[index].results);
            this.renderIsochrones(this.isochroneFeatures);
        },

        // async scenarioUpdated () {
        //     await this.$nextTick();
        //     this.tryUpdateIsochrones();
        // },
        mode () {
            if (this.mode === "facility") {
                this.addInteraction(this.select);
            }
            else {
                this.removeInteraction(this.select);
            }

            if (this.mode === "region" && this.activeSelection === null) {
                this.resetIsochroneBBox();
            }

            if (this.mode === "path") {
                if (this.routingDirections === null) {
                    return;
                }

                this.setScaleUnit("distance");
                this.setTransportType("foot-walking");
                layerCollection.addLayer(this.directionsLayer);

                const newCard = {
                    coord25832: "",
                    coord4326: "",
                    icon: this.activeMode.icon,
                    id: this.routingDirections.bbox.toString(),
                    text: "Berechnete Route",
                    name: `Entfernung: ${this.routingDirections.distance} m | Zeit: ${this.routingDirections.duration} min | Verkehrsmittel: ${this.mappedRoutingProfiles[this.settings.speedProfile]}`,
                    layerName: "layerName"
                };

                this.selectionCards = [newCard];
            }
        },

        visibleVectorLayers (newValues) {
            this.setFacilityNames(newValues);
        },
        selectedFacilityNames (newValue, oldValue) {
            if (this.mode !== "facility") {
                return;
            }
            const difference = differenceJs(newValue, oldValue),
                diff = differenceJs(oldValue, newValue);

            if (diff.length) {
                this.removeCardsByLayerName(diff[0]);
            }
            if (difference.length) {
                const layer = this.visibleVectorLayers.find(layerr => layerr.getLayer().get("name") === difference[0]);

                this.addCardsByLayer(layer);
            }
        },
        /**
         * Detects changes in visible Layers.
         *
         * @returns {void}
         */
        visibleSubjectDataLayerConfigs: {
            handler () {
                this.visibleVectorLayers = this.getVisibleVectorLayers();
            },
            deep: true
        }
    },
    /**
    * @returns {void}
    */
    created () {
        this.visibleVectorLayers = this.getVisibleVectorLayers();

        if (this.routingDirections) {
            this.setActiveMode(this.getModeByType("path"));
        }
        else {
            this.setActiveMode(this.availableModes[0]);
        }
        this.setNonReactiveData();
    },

    /**
   * Put initialize here if mounting occurs after config parsing
    * @returns {void}
   */
    mounted () {
        this.baseUrl = this.restServiceById(this.serviceId || this.fallbackServiceId).url + "/v2/";

        this.getLayerById("accessibility-analysis").getLayer().setVisible(true);
        this.getLayerById("accessibility-analysis").getLayer().setZIndex(10);

        this.directionsLayer = this.getLayerById("accessibility-directions");
        this.directionsLayer.getLayer().setStyle(this.directionsRouteLayer.getStyleFunction());
        this.directionsLayer.getLayer().setSource(this.directionsRouteSource);

        // onSearchbar(this.setSearchResultToOrigin);
        // onShowFeaturesById(this.tryUpdateIsochrones);
        // onShowAllFeatures(this.tryUpdateIsochrones);
        // onFeaturesLoaded(this.tryUpdateIsochrones);


    },
    unmounted () {
        this.setMode(this.availableModes[0].type);
        this.removeInteraction(this.select);
        mapCollection.getMap("2D").removeEventListener("click", this.onMapClick);
        this.removeAll();
        this.setDefaults();
    },
    methods: {
        ...mapActions("Maps", ["setCenter", "removeInteraction", "addInteraction"]),
        ...mapMutations("Modules/PopulationRequest", {
            setPopulationRequestGeometry: "setGeometry",
            setPopulationRequestActive: "setActive"
        }),
        ...mapMutations("Modules/AccessibilityAnalysis", Object.keys(mutations)),
        ...mapActions("Modules/AccessibilityAnalysis", ["getIsochrones"]),
        // ...mapActions("Tools/SelectionManager", ["addNewSelection"]),
        // ...mapMutations("Maps", ["removeLayerFromMap"]),
        ...mapActions("Maps", ["placingPointMarker", "removePointMarker", "removePointMarkerFeature"]),
        ...mapActions("Alerting", ["addSingleAlert", "cleanup"]),
        ...mapActions("Modules/Routing/Directions", ["reset", "setRoutingDirections"]),
        ...methods,

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

        /**
         * Returns all visible vector layers from the layer collection that are of supported types.
         * Supported types include "WFS", "OAF", and "GeoJSON".
         * @returns {Array} An array of visible vector layer objects.
         */
        getVisibleVectorLayers () {
            const supportedLayerTypes = ["WFS", "OAF", "GeoJSON"];

            return layerCollection.getLayers().filter(layer => {
                return layer.getLayer() instanceof VectorLayer && layer?.attributes.visibility === true && layer?.attributes?.isNeverVisibleInTree !== true && supportedLayerTypes.includes(layer.get("typ"));
            });
        },

        /**
         * Sets all needed non reactive data.
         * @returns {void}
         */
        setNonReactiveData () {
            this.select = new Select({
                style: null,
                filter: (feature, layer) => this.selectedFacilityNames.includes(layer.get("name"))
            });

            this.registerSelectListener(this.select);
            mapCollection.getMap("2D").addEventListener("click", this.onMapClick);
        },

        /**
         * Registers the listeners to keyboard events onkeydown and onkeyup
         * @returns {void}
         */
        onMapClick (evt) {
            if (this.mode === "point") {
                this.setCoordinateFromClick(this.clickCoordinate, this.projectionCode, evt.originalEvent.shiftKey);
            }
        },

        /**
         * Registers listener for select interaction events.
         * On "select" the name of the selected feature and the click coordinate is set.
         * @param {ol/interaction/Select} select - Interaction for selecting features.
         * @returns {void}
         */
        registerSelectListener (select) {
            select.on("select", evt => {
                if (evt.selected.length === 0) {
                    return;
                }

                const selectedFeature = evt.selected[0],
                    layer = evt.target.getLayer(selectedFeature),
                    unpackedFeature = unpackCluster(selectedFeature)[0],
                    nut = layerCollection.getLayerById(layer.get("id"));

                this.selectedFacilities.push(unpackedFeature);

                let featName = layer.get("name");

                if (nut.attributes?.searchField?.length > 0) {
                    featName = unpackedFeature.get(nut.attributes?.searchField[0]);
                }
                this.setCoordinateFromFeature(unpackedFeature, this.projectionCode, unpackedFeature.get(nut.attributes.searchField[0]), featName);
            });
        },

        /**
         * Resets all options to default values.
         * @returns {void}
         */
        setDefaults () {
            this.useTravelTimeIndex = false;
            this.isAllFacilitiesChecked = false;
            this.setTransportType("driving-car");
            this.setScaleUnit("time");
            this.setTime(this.scaleUnits[0].default);
            this.setDistance(this.scaleUnits[1].default);
        },

        /**
         * Sets and transforms the click coordinate to EPSG 4326.
         * @param {event} clickCoordinate - The coordinate of the click.
         * @param {String} mapProjectionCode - The code of the current map projection.
         * @returns {void}
         */
        setCoordinateFromClick: function (clickCoordinate, mapProjectionCode, featureName, layerName) {
            if (this.hasActiveSet) {
                this.setActiveSet(null);
                this.setDefaults();
                this.removeAll();
                this.selectionCards = [];
            }
            let coords;

            if (this.setByFeature) {
                coords = transformCoordinates(clickCoordinate, mapProjectionCode);
                this.setMarkerByCoordinates(clickCoordinate);
            }
            else {
                coords = transformCoordinate(clickCoordinate, mapProjectionCode);
                this.setMarkerByCoordinates([clickCoordinate]);
            }

            const newCard = {
                coord25832: clickCoordinate,
                coord4326: coords,
                icon: this.activeMode.icon,
                id: clickCoordinate.toString(),
                text: this.activeMode.text,
                name: featureName,
                layerName: layerName
            };

            this.selectionCards.push(newCard);
        },

        /**
         * Sets and transforms the coordinate(s) of a feature to EPSG 4326.
         * @param {ol/Feature} feature - The feature.
         * @param {String} mapProjectionCode - The code of the current map projection.
         * @returns {void}
         */
        setCoordinateFromFeature: function (feature, mapProjectionCode, featureName, layerName) {
            let simplifiedGeom;

            if (feature.getGeometry().getType() === "Polygon" && !this.setByFeature) {
                simplifiedGeom = simplify(feature.getGeometry().getInteriorPoint());
            }
            else {
                simplifiedGeom = simplify(feature.getGeometry());
            }

            if (this.setByFeature) {
                this.setCoordinateFromClick(getFlatCoordinates(simplifiedGeom), mapProjectionCode, featureName, layerName);
            }
            else {

                getFlatCoordinates(simplifiedGeom).forEach((coordinate) => {
                    this.setCoordinateFromClick(coordinate, mapProjectionCode, featureName, layerName);
                });
            }
        },

        /**
         * Sets a marker for each coordinate in the coordinates array.
         * @param {Array} coordinates - Array of coordinates where markers should be placed.
         * @returns {void}
         */
        setMarkerByCoordinates (coordinates) {
            coordinates.forEach(coordinate => {
                const markerCoord = [...coordinate];

                markerCoord.keepPreviousMarker = true;
                this.placingPointMarker(markerCoord);
            });
        },

        /**
        * set facilityNames in model, trigger renderDropDownView
        * @param {Object} vectorLayers layer models of updated selected layer
        * @returns {void}
        */
        setFacilityNames: function (vectorLayers) {
            this.facilityNames = [];

            vectorLayers.forEach(layer => {
                this.facilityNames.push(layer.getLayer().get("name"));
                if (getLayerSource(layer.getLayer()).getFeatures().length > 0) {
                    if (this.isAllFacilitiesChecked) {
                        this.addCardsByLayer(layer);
                    }
                }
                else {
                    getLayerSource(layer.getLayer()).on("featuresloadend", () => {
                        if (layer.getLayer().getSource().getFeatures().length > 0) {
                            if (this.isAllFacilitiesChecked) {
                                this.addCardsByLayer(layer);
                            }
                        }
                    });
                }
            });

            this.setSelectedFacilityNames(this.facilityNames);
        },

        /**
        * closes this component and opens requestInhabitants component and executes makeRequest with the calculated geoJSON of this component
        * @returns {void}
        */
        async requestInhabitants () {
            const outerPolygon = geometryToGeoJson(this.isochroneFeatures[0].getGeometry(), false, "EPSG:25832", "EPSG:25832");

            this.close();
            await this.$nextTick();
            this.setPopulationRequestActive(true);
            this.setPopulationRequestGeometry(outerPolygon);
        },

        getArrayDepth (array) {
            if (!Array.isArray(array)) {
                return 0; // Kein Array, also Tiefe 0
            }
            return 1 + Math.max(0, ...array.map(this.getArrayDepth));
        },
        createAnalysisSet: async function () {

            const analysisSet = {
                inputs: {},
                results: [],
                geojson: {}
            };

            this.setCoordinate(this.selectionCards.map(card => card.coord4326));

            if (this.getArrayDepth(this.coordinate) === 3) {
                this.setCoordinate(this.coordinate.flat());
            }


            await this.createIsochrones();

            analysisSet.results = this.isochroneFeatures;
            analysisSet.inputs = {
                // These lines have been changed back and forth so arguing my case for checking first if the value is undefined
                // JSON.parse throws error on undefined
                // So if the original variable is undefined, we don't copy undefined, but instead cause an error
                mode: this.mode ? JSON.parse(JSON.stringify(this.mode)) : undefined,
                coordinate: this.coordinate ? JSON.parse(JSON.stringify(this.coordinate)) : undefined,
                selectedFacilityNames: this.selectedFacilityNames ? JSON.parse(JSON.stringify(this.selectedFacilityNames)) : undefined,
                routingDirections: this.routingDirections ? JSON.parse(JSON.stringify(this.routingDirections)) : undefined,
                transportType: this.transportType ? JSON.parse(JSON.stringify(this.transportType)) : undefined,
                scaleUnit: this.scaleUnit ? JSON.parse(JSON.stringify(this.scaleUnit)) : undefined,
                distance: this.distance ? JSON.parse(JSON.stringify(this.distance)) : undefined,
                time: this.time ? JSON.parse(JSON.stringify(this.time)) : undefined,
                useTravelTimeIndex: this.useTravelTimeIndex !== undefined ? JSON.parse(JSON.stringify(this.useTravelTimeIndex)) : undefined,
                setByFeature: this.setByFeature ? JSON.parse(JSON.stringify(this.setByFeature)) : undefined,
                steps: this.steps ? JSON.parse(JSON.stringify(this.steps)) : [],
                selectedFacility: this.selectedFacility ? this.selectedFacility : undefined,
                selectedFacilities: this.selectedFacilities ? this.selectedFacilities : undefined,
                selectionCards: this.selectionCards,
                isAllFacilitiesChecked: this.isAllFacilitiesChecked
            };
            this.dataSets.push(analysisSet);

            this.setActiveSet(this.dataSets.length - 1);

            if (this.dataSets.length === 1) {
                this.renderIsochrones(this.isochroneFeatures);
            }
            this.dataSets[this.activeSet].geojson = this.exportAsGeoJson(this.getLayerById("accessibility-analysis"), this.projectionCode);

            // console.log(this.coordinate);
            const service = this.restServiceById("1001");

            if (service === undefined) {
                console.warn("Rest Service with the ID 1001 is not configured in rest-services.json!");
            }
            else {
                // Beispiel: Transformiere die Koordinaten
                const outerPolygon = geometryToGeoJson(this.isochroneFeatures[0].getGeometry(), false, "EPSG:25832", "EPSG:25832");

                WPS.wpsRequest("1001", service.url, "einwohner_ermitteln.fmw", {
                    "such_flaeche": JSON.stringify(outerPolygon)
                }, this.handleResponsee.bind(this));
            }
            this.setCoordinate([]);

            // this line adds the accessibility analysis data selection to the selection manger
            // this does not seem to make much sense: the only reason to reproduce this would be to reproduce the accessibility analysis. However, since the accessibility analysis creates this selection on the fly, we need the previous selection for reproduction, not this one. this one is then recreated on the fly everytime the analysis is run. Leaving this in in case we want this for some reason down the line.
            // this.addNewSelection({selection: analysisSet.results, source: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.title"), id: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.transportTypes." + this._transportType) + ", " + this.$t("additional:modules.tools.cosi.accessibilityAnalysis.scaleUnits." + this.scaleUnit) + ", [...]"});
        },
        handleResponsee (resp) {
            const parsedData = resp.ExecuteResponse.ProcessOutputs.Output.Data.ComplexData.einwohner,
                responseResult = JSON.parse(parsedData.ergebnis);

            this.dataSets[this.activeSet].inputs.einwohner = responseResult.einwohner_fhh;

        },
        exportAsGeoJson,
        // pagination features
        removeSet (index) {
            if (this.activeSet === this.dataSets.length - 1) {
                this.setActiveSet(this.activeSet - 1);
            }

            this.dataSets.splice(index, 1);

            if (this.dataSets.length === 0) {
                this.removeAll();
            }

        },
        removeAll () {
            this.setCoordinate([]);
            this.setSelectedFacilities([]);
            this.setSteps([0, 0, 0]);
            this.setIsochroneFeatures([]);
            this.getLayerById("accessibility-analysis").getLayer().getSource().clear();
            this.resetIsochroneBBox();
            this.removePointMarker();
            // this.removeLayerFromMap(this.directionsLayer);
        },
        downloadSet (index) {
            downloadGeoJson(this.dataSets[index].geojson);
        },
        downloadAll () {
            this.dataSets.forEach(set => {
                downloadGeoJson(set.geojson);
            });
        },

        async updateAnalysisSet () {
            await this.createIsochrones();

            this.dataSets[this.activeSet].results = this.isochroneFeatures;
            this.dataSets[this.activeSet].geojson = this.exportAsGeoJson(this.getLayerById("accessibility-analysis"), this.projectionCode);

            this.renderIsochrones(this.isochroneFeatures);
        },

        /**
         * Sets the value of `useTravelTimeIndex`.
         * @param {Boolean} value - True if travel time index should be used
         * @returns {void}
         */
        setUseTravelTimeIndex (value) {
            this.useTravelTimeIndex = value;
        },

        updateTime (value) {
            this.setTime(parseInt(value, 10));
        },

        setActiveMode (obj) {
            this.selectionCards = [];
            this.activeMode = obj;
            this.setMode(this.activeMode.type);
            this.removeAll();
            if (this.hasActiveSet) {
                this.setActiveSet(null);
            }
        },
        toggleLevel (evt) {
            this.setActiveSet(null);
            this.removeAll();
            this.setScaleUnit(evt);
        },
        test (val) {
            if (this.hasActiveSet) {
                this.setActiveSet(null);
                this.removeAll();
                this.selectionCards = [];
            }
            this.setTransportType(val);
        },
        updateDistance (distance) {
            if (this.scaleUnit === "time") {
                this.setTime(parseInt(distance, 10));
            }
            else {
                this.setDistance(parseInt(distance, 10));
            }
        },

        removeSelectionCard (cardToRemove) {
            this.setActiveSet(null);
            this.removePointMarkerFeature(cardToRemove.coord25832);
            this.selectionCards = this.selectionCards.filter(card => !deepEqual(card, cardToRemove));
            this.getLayerById("accessibility-analysis").getLayer().getSource().clear();
            if (this.mode === "path") {
                this.reset();
            }
        },

        getIconByTransportType (type) {
            return this.transportTypes.find(t => t.type === type).icon;
        },

        getScaleUnitByType (type) {
            return this.scaleUnits.find(s => s.type === type);
        },

        /**
         *
         *
         * @param set - analysis set
         * @returns {Boolean} True if the given set is the active set, false otherwise.
         */
        isSetActive (set) {
            return this.activeSet === this.dataSets.indexOf(set);
        },


        removeAllMarkerCards () {
            this.selectionCards = [];
            this.removePointMarker();
        },

        toggleAllFacilitiesChecked () {
            this.isAllFacilitiesChecked = !this.isAllFacilitiesChecked;

            if (this.isAllFacilitiesChecked) {
                this.setSelectedFacilityNames(this.facilityNames);
                this.selectedLayer.forEach(layer => {
                    this.addCardsByLayer(layer);
                });
            }
            else {
                this.removeAllMarkerCards();
            }
        },

        updateActiveSet (set) {
            if (this.dataSets[this.dataSets.indexOf(set)] !== this.dataSets[this.activeSet]) {
                this.setActiveMode(this.getModeByType(set.inputs.mode));
                this.setActiveSet(this.dataSets.indexOf(set));
                if (set.inputs.isAllFacilitiesChecked) {
                    this.isAllFacilitiesChecked = true;
                }
                return;
            }
            this.setActiveSet(null);
            this.setDefaults();
            this.removeAll();
            this.selectionCards = [];

        },

        getModeByType (type) {
            return this.availableModes.find(obj => obj.type === type);
        },

        removeCardsByLayerName (name) {
            const cardsToRemove = this.selectionCards.filter(card => card.layerName === name);

            cardsToRemove.forEach(card => {
                this.removePointMarkerFeature(card.coord25832);
            });

            this.selectionCards = this.selectionCards.filter(card => card.layerName !== name);
        },

        addCardsByLayer (layer) {
            layer.getLayer().getSource().getFeatures().forEach(feature => {
                const unpackedFeature = unpackCluster(feature);

                unpackedFeature.forEach(unfeat => {
                    let featName = layer.getLayer().get("name");

                    if (layer.attributes?.searchField?.length > 0) {
                        featName = unfeat.get(layer.attributes?.searchField[0]);
                    }
                    this.setCoordinateFromFeature(unfeat, this.projectionCode, featName, layer.getLayer().get("name"));
                });
            });
        }
    }
};
</script>

<template lang="html">
    <div id="accessibilityanalysis">
        <AccordionItem
            id="accessibility-analysis-information"
            icon="bi bi-info-circle"
            :title="'Information'"
        >
            <ToolInfo
                :url="readmeUrl"
                :summary="$t('additional:modules.tools.cosi.accessibilityAnalysis.description')"
            />
        </AccordionItem>
        <EditForReportTemplate
            :report-template-mode="reportTemplateMode"
            tool-name="accessibilityAnalysis"
        />
        <hr class="mt-0">
        <TabBar
            class="mb-4"
            :items="availableModes"
            :active-item="activeMode"
            @change="setActiveMode"
        />
        <div class="mb-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">
                    Ausgewählte {{ activeMode.text }}
                </h5>
            </div>
            <SwitchInput
                v-if="mode === 'facility'"
                :aria="'Alle Einrichtungen auswählen'"
                :checked="isAllFacilitiesChecked"
                :interaction="toggleAllFacilitiesChecked"
                :label="'Alle Einrichtungen auswählen'"
                class="mb-3"
            />
            <v-autocomplete
                v-if="isAllFacilitiesChecked && mode === 'facility'"
                :model-value="selectedFacilityNames"
                :items="facilityNames"
                class="mb-3"
                label="Themen"
                chips
                closable-chips
                hide-details
                multiple
                variant="outlined"
                density="compact"
                @update:model-value="setSelectedFacilityNames($event)"
            />
            <div
                v-if="selectionCards.length === 0"
                class="d-flex align-items-center justify-content-center alert alert-light"
                role="alert"
            >
                <i class="bi bi-slash-circle me-4 fs-4" />
                {{ activeMode.info }}
            </div>
            <div
                v-for="card in selectionCards"
                :key="card.id"
                class="card mb-3"
            >
                <div class="card-body d-flex p-2 description">
                    <div class="me-2 fs-3">
                        <i :class="card.icon" />
                    </div>
                    <div class="flex-grow-1">
                        {{ card.text }}
                        <br>
                        {{ card.name || card.coord25832.toString() }}
                    </div>
                    <button
                        type="button"
                        class="btn-close"
                        aria-label="Close"
                        @click="removeSelectionCard(card)"
                    />
                </div>
            </div>
        </div>
        <div
            v-if="mode !== 'path'"
        >
            <h5 class="mb-3">
                Verkehrsmittel
            </h5>
            <div
                class="d-flex flex-row mb-4"
            >
                <IconButton
                    v-for="type in transportTypes"
                    :key="type.type"
                    class="me-5"
                    :aria="'test'"
                    :icon="type.icon"
                    :title="type.name"
                    :interaction="() => test(type.type)"
                    :class-array="['btn-light', 'mb-0', type.type === transportType ? 'active': '']"
                    :label="type.name"
                />
            </div>
        </div>
        <h5 class="mb-3">
            Berechnungsmethode
        </h5>
        <ButtonGroup
            v-if="mode !== 'path'"
            class="mb-3"
            :buttons="scaleUnits.map(card => ({name: card.name, value: card.type}))"
            :pre-checked-value="scaleUnit"
            group="scaleUnits"
            @show-view="toggleLevel"
        />
        <div class="mb-3">
            <div class="d-flex justify-content-center mb-1">
                <input
                    class="form-control form-control-sm fs-5"
                    id="exampleFormControlInput1"
                    :value="scaleUnit === 'time' ? time : distance"
                    @input="updateDistance($event.target.value)"
                >
            </div>
            <SliderItem
                :id="'routing-slider-input'"
                aria="test"
                class="mb-1"
                :value="scaleUnit === 'time' ? time : distance"
                :min="0"
                :max="getScaleUnitByType(scaleUnit).max"
                :interaction="event => updateDistance(event.target.value)"
            />
            <div class="d-flex justify-content-between value">
                <span>0 {{ getScaleUnitByType(scaleUnit).unit }}</span>
                <span>{{ getScaleUnitByType(scaleUnit).max }} {{ getScaleUnitByType(scaleUnit).unit }}</span>
            </div>
        </div>
        <SwitchInput
            v-if="mode === 'facility'"
            :id="'featureOutline'"
            :aria="$t('additional:modules.tools.cosi.accessibilityAnalysis.setByFeatureOutline')"
            :checked="setByFeature"
            :interaction="() => setSetByFeature(!setByFeature)"
            :label="$t('additional:modules.tools.cosi.accessibilityAnalysis.setByFeatureOutline')"
            class="mb-3"
        />
        <div
            v-if="transportType === 'driving-car' && scaleUnit === 'time' && mode === 'point'"
            class="mb-3"
        >
            <SwitchInput
                :id="'autoTrafficFlow'"
                :aria="'Verkehrsfluss berücksichtigen'"
                :checked="useTravelTimeIndex"
                :interaction="() => setUseTravelTimeIndex(!useTravelTimeIndex)"
                :label="'Verkehrsfluss berücksichtigen'"
            />
            <AccessibilityAnalysisTrafficFlow
                v-if="useTravelTimeIndex"
                :time="time"
                @update:time="updateTime"
            />
        </div>
        <FlatButton
            class="mx-auto"
            icon="bi bi-play-circle"
            :text="'Erreichbarkeit berechnen'"
            @click.native="createAnalysisSet()"
        />
        <div v-if="dataSets.length > 0">
            <hr>
            <h5 class="mb-3">
                Berechnete Erreichbarkeiten
            </h5>
            <AccessibilityAnalysisLegend
                v-if="dataSets.length > 0"
                :steps="steps"
                :colors="legendColors"
            />
            <div v-for="set in dataSets" class="card mb-3 card-hover shadow-sm" :class="isSetActive(set) ? 'card-active' : ''" :key="set">
                <div class="card-body d-flex p-0 description align-items-center" @click="updateActiveSet(set)">
                    <div class="p-2 fs-1"><i :class="getIconByTransportType(set.inputs.transportType)"></i></div>
                    <div class="p-2  flex-grow-1">{{ getScaleUnitByType(set.inputs.scaleUnit).name}} <br>
                         <span class="fs-5 title">{{getScaleUnitByType(set.inputs.scaleUnit).name === 'Zeit' ? set.inputs.time : set.inputs.distance}} {{getScaleUnitByType(set.inputs.scaleUnit).name === 'Zeit' ? 'Minuten' : 'Meter'}}</span>
                           <br>
                        <span v-if="set.inputs.selectionCards.length === 1">
                            <i :class="set.inputs.selectionCards[0].icon" class="me-2"></i>{{ set.inputs.selectionCards[0].text }} <span class="title">{{ set.inputs.coordinate[0].toString() }}</span>
                        </span>
                        <span v-else>
                            <i :class="set.inputs.selectionCards[0].icon" class="me-2"></i>Mehrere {{ set.inputs.selectionCards[0].text }}
                        </span>
                        <br>
                        <span>
                            Einwohner: {{ set.inputs.einwohner }}
                        </span>
                        <br>
                    </div>
                    <div class="d-flex align-self-start">
                        <IconButton
                            class="p-1"
                            :aria="'Download'"
                            icon="bi bi-download"
                            :interaction="() => downloadSet(dataSets.indexOf(set))"
                        />
                        <IconButton
                            class="p-1"
                            :aria="'Löschen'"
                            icon="bi bi-trash"
                            :interaction="() => removeSet(dataSets.indexOf(set))"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    #accessibilityanalysis {
        .title {
            color: $secondary;
        }

        .description {
            font-size: 0.9rem;
        }

        font-family: $font_family_default;

        #exampleFormControlInput1 {
            width: 8ch;
            text-align: center;
            color: $secondary;
            font-family: $font_family_accent;
        }

        .card-hover:hover {
            cursor: pointer;
            border-color: $secondary;
            border-width: 2px;
            background-color: $light_blue;
            i {
                color: $secondary;
            }
        }

        .card-active {
            border-color: $secondary;
            border-width: 2px;
            i {
                color: $secondary;
            }
        }
    }

</style>
