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
import {unpackCluster} from "../../utils/features/unpackCluster.js";
import {getLayerSource} from "../../utils/layer/getLayerSource";
import {geometryToGeoJson} from "../../utils/geometry/convertToGeoJson";
import {transformCoordinate} from "../utils/transformCoordinates";
import TabBar from "../../components/TabBar.vue";
import {simplify} from "../../utils/geometry/simplify";
import {getFlatCoordinates} from "../../utils/geometry/getFlatCoordinates";
import {filterAllFeatures} from "../../utils/layer/filterAllFeatures";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import SliderItem from "@shared/modules/slider/components/SliderItem.vue";
import layerCollection from "@core/layers/js/layerCollection";
import layerFactory from "@core/layers/js/layerFactory";
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";
import VectorLayer from "ol/layer/Vector.js";
import {VAutocomplete} from "vuetify/components/VAutocomplete";

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
        VAutocomplete
    },
    data () {
        return {
            visibleVectorLayers: [],
            supportedLayerTypes: ["WFS", "OAF", "GeoJSON"],
            facilityNames: [],
            directionsLayer: null,
            availableReferenceObjects: [
                {type: "point", text: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.points"), icon: "bi bi-geo-alt", title: "Erreichbarkeit ab einem Referenzpunkt", description: "Zeigt ein Gebiet an, welches von einem ausgewählten Punkt auf der Karte innerhalb einer festgelegten Entfernung erreichbar ist."},
                {type: "facility", text: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.facilities"), icon: "bi bi-building", title: "Erreichbarkeit ab einer ausgewählten Einrichtung", description: "Zeigt ein Gebiet an, welches von einer ausgewählten Einrichtung auf der Karte  innerhalb einer festgelegten Entfernung erreichbar ist."},
                {type: "path", text: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.referToPath"), icon: "bi bi-map", title: "Erreichbarkeit entlang einer Route", description: "Wenn Sie im Routing-Tool eine Route berechnet haben, können Sie hier die Erreichbarkeit entlang dieser Route analysieren."}
            ],
            activeReferenceObject: null,
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
                    type: "time",
                    name: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.scaleUnits.time"),
                    unit: "min",
                    max: 180,
                    maxLabel: "180 min",
                    minLabel: "0 min"
                },
                {
                    type: "distance",
                    name: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.scaleUnits.distance"),
                    unit: "m",
                    max: 10000,
                    maxLabel: "10.000 m",
                    minLabel: "0 m"
                }
            ],
            legendColors: [
                "rgba(0, 240, 3, 0.6)",
                "rgba(200, 200, 3, 0.6)",
                "rgba(240, 0, 3, 0.6)",
                "rgba(180, 165, 165, 0.8)"
            ],
            abortController: null,
            currentCoordinates: null,
            hide: false,
            facilityFeature: null,
            isAllFacilitiesChecked: false,
            selectionCards: []
        };
    },
    computed: {
        ...mapGetters(["restServiceById", "visibleSubjectDataLayerConfigs"]),
        ...mapGetters("Language", ["currentLocale"]),
        ...mapGetters("Modules/AccessibilityAnalysis", Object.keys(getters)),
        ...mapGetters("Maps", ["projectionCode", "clickCoordinate", "getVisibleLayerList"]),
        ...mapGetters("Modules/DistrictSelector", ["boundingGeometry"]),
        // ...mapGetters("Tools/FeaturesList", ["activeVectorLayerList", "isFeatureActive", "layerMapById"]),
        // ...mapGetters("Tools/AreaSelector", {areaSelectorGeom: "geometry"}),
        // ...mapGetters("Tools/SelectionManager", ["activeSelection"]),
        // ...mapGetters("Tools/ScenarioBuilder", ["scenarioUpdated"]),
        ...mapGetters("Modules/Routing/Directions", ["directionsRouteSource", "directionsRouteLayer", "routingDirections"]),

        _mode: {
            get () {
                return this.mode;
            },
            set (v) {
                this.setMode(v);
            }
        },
        _coordinate: {
            get () {
                return this.coordinate;
            },
            set (v) {
                this.setCoordinate(v);
            }
        },
        _selectedFacilities: {
            get () {
                return this.selectedFacilities;
            },
            set (v) {
                this.setSelectedFacilities(v);
            }
        },
        _pointFacilityOrRoute: {
            get () {
                return this.pointFacilityOrRoute;
            },
            set (v) {
                this.setPointFacilityOrRoute(v);
            }
        },
        _cardinality: {
            get () {
                return this.cardinality;
            },
            set (v) {
                this.setCardinality(v);
            }
        },
        _setByFeature: {
            get () {
                return this.setByFeature;
            },
            set (v) {
                this.setSetByFeature(v);
            }
        },
        _transportType: {
            get () {
                return this.transportType;
            },
            set (v) {
                this.setTransportType(v);
            }
        },
        _scaleUnit: {
            get () {
                return this.scaleUnit;
            },
            set (v) {
                this.setScaleUnit(v);
            }
        },
        _selectedDirections: {
            get () {
                return this.selectedDirections;
            },
            set (v) {
                this.setSelectedDirections(v);
            }
        },
        _time: {
            get () {
                return this.time;
            },
            set (v) {
                this.setTime(v);
            }
        },
        _isochroneFeatures: {
            get () {
                return this.isochroneFeatures;
            },
            set (v) {
                this.setIsochroneFeatures(v);
            }
        },
        _useTravelTimeIndex: {
            get () {
                return this.transportType === "driving-car" && this.scaleUnit === "time" ? this.useTravelTimeIndex : false;
            },
            set (v) {
                this.setUseTravelTimeIndex(v);
            }
        },
        selectedFacilityLayer () {
            return this.visibleVectorLayers.filter(layer => this.selectedFacilityNames.includes(layer.getLayer().get("name")));
        }
    },
    watch: {
        // clickCoordinate () {
        //     if (this.mode === "point") {
        //         this.setCoordinateFromClick(this.clickCoordinate, this.projectionCode);
        //     }
        // },
        active () {
            if (this.active) {
                // onSearchbar(this.setSearchResultToOrigin);

                if (this.mode === "path") {
                    this.addLayer(this.directionsLayer);
                }
            }
            else {
                // offSearchbar(this.setSearchResultToOrigin);
                this.removePointMarker();
                this.select.getFeatures().clear();
                this.facilityFeature = null;
            }
        },
        activeSet (newValue, oldValue) {
            console.log(newValue, oldValue);

            if (!this.dataSets[newValue]) {
                // this.removeAll();
                // this.selectionCards = [];
                return;
            }
            this.facilityFeature = null;

            for (const key in this.dataSets[newValue].inputs) {
                this[key] = this.dataSets[newValue].inputs[key];
            }
            this.removePointMarker();
            this.$nextTick(() => {
                if (this.dataSets[newValue].inputs._mode === "point" || this.dataSets[newValue].inputs._mode === "facility") {
                    for (const coordinate of this.dataSets[newValue].inputs._coordinate) {
                        const icoord = transformCoordinate(coordinate, "EPSG:4326", this.projectionCode);

                        icoord.keepPreviousMarker = true;
                        this.placingPointMarker(icoord);
                    }
                }
            });

            this.selectionCards = this.dataSets[newValue].inputs.selectionCards;

            this._isochroneFeatures = this.dataSets[newValue].results;
            this.renderIsochrones(this._isochroneFeatures);
            this.hide = false;
        },

        // async scenarioUpdated () {
        //     await this.$nextTick();
        //     this.tryUpdateIsochrones();
        // },
        pointFacilityOrRoute (value) {
            console.log(value);

            this.setMode(value);
            if (value === "point") {
                this.setCardinality("one");
                this.updateUseTravelTimeIndex(true);
            }
            else if (value === "facility") {
                this.setCardinality("one");
                this.updateUseTravelTimeIndex(false);
            }
            else if (value === "path") {
                this.setCardinality(null);
                this.updateUseTravelTimeIndex(false);
            }
        },
        cardinality (value) {
            if (value === null) {
                return;
            }
            if (value === "one") {
                this.setCoordinate([]);
                this.setSelectedFacilities([]);
                this.removePointMarker();
            }
            if (this.pointFacilityOrRoute === "facility") {
                if (value === "one") {
                    this.setMode("facility");
                }
                else if (value === "some") {
                    this.setMode("facility");
                }
                else if (value === "all") {
                    this.setMode("region");
                }
            }
        },
        mode () {
            console.log(this.mode);

            this.setCoordinate([]);
            this.setSelectedFacilities([]);
            this.removePointMarker();

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
                this._scaleUnit = "distance";
                this._transportType = "foot-walking";
                layerCollection.addLayer(this.getDirectionLayer());
                this._selectedDirections = this.routingDirections;

                // this.addLayer(this.directionsLayer);
                 const newCard = {
                    coord25832: "clickCoordinate",
                    coord4326: "transformCoordinate(clickCoordinate, mapProjectionCode)",
                    icon: this.activeReferenceObject.icon,
                    id: "lickCoordinate.toString()",
                    text: this.activeReferenceObject.text,
                    name: "featureName",
                    layerName: "layerName"
                };

                this.selectionCards.push(newCard);
                // this.addLayer(this.directionsLayer);
            }
            else {
                // layerCollection.removeLayer(this.directionsLayer);
                // this.removeLayerFromMap(this.directionsLayer);
            }
        },
        setByFeature (val) {
            this.setCoordinate([]);
            this.setSelectedFacilities([]);
            this.removePointMarker();
            if (!this.facilityFeature) {
                return;
            }
            if (val || this.facilityFeature.getGeometry().getType() === "Point") {
                this.setCoordinateFromFeature(this.facilityFeature, this.projectionCode);
            }
            else {
                this.setCoordinateFromClick(this.clickCoordinate, this.projectionCode);
            }
        },
        visibleVectorLayers (newValues) {
            this.setFacilityNames(newValues);
        },
        routingDirections () {
            this._selectedDirections = this.routingDirections;
        },
        selectedFacilityNames (newValue, oldValue) {
            if (this.mode !== "facility") {
                return;
            }
            const difference = differenceJs(newValue, oldValue),
                diff = differenceJs(oldValue, newValue);

            // console.log(newValue);
            // console.log(oldValue);
            // console.log(difference);
            // console.log(diff);
            if (diff.length) {
                this.removeCardsByLayerName(diff[0]);
            }
            if (difference.length) {
                const layer = this.visibleVectorLayers.find(layerr => layerr.getLayer().get("name") === difference[0]);
               this.addCardsByLayerName(layer);
            }
              // if (Array.isArray(newValue) && newValue.length > 0) {
            //     this.updateCurrentMetaData();
            // }
        },
        hide: "hideResults",
        /**
         * Detects changes in visible Layers
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

        this.activeReferenceObject = this.availableReferenceObjects[0];
        this.setNonReactiveData();
    },

    /**
   * Put initialize here if mounting occurs after config parsing
    * @returns {void}
   */
    mounted () {
        this.baseUrl = this.restServiceById(this.serviceId || this.fallbackServiceId).url + "/v2/";

        this.applyTranslationKey(this.name);

        this.getLayerById("accessibility-analysis").getLayer().setVisible(true);
        this.getLayerById("accessibility-analysis").getLayer().setZIndex(10);

        this.directionsLayer = this.getLayerById("accessibility-directions");
        // this.directionsLayer.setZIndex(10);
        this.directionsLayer.getLayer().setStyle(this.directionsRouteLayer.getStyleFunction());
        this.directionsLayer.getLayer().setSource(this.directionsRouteSource);
        // this.removeLayerFromMap(this.directionsLayer);

        // onSearchbar(this.setSearchResultToOrigin);
        // onShowFeaturesById(this.tryUpdateIsochrones);
        // onShowAllFeatures(this.tryUpdateIsochrones);
        // onFeaturesLoaded(this.tryUpdateIsochrones);

    },
    methods: {
        ...mapMutations("Modules/PopulationRequest", {
            setPopulationRequestGeometry: "setGeometry",
            setPopulationRequestActive: "setActive"
        }),
        ...mapMutations("Modules/AccessibilityAnalysis", Object.keys(mutations)),
        ...mapActions("Modules/AccessibilityAnalysis", ["getIsochrones"]),
        // ...mapActions("Tools/SelectionManager", ["addNewSelection"]),
        ...mapActions("Maps", ["setCenter", "removeInteraction", "addInteraction", "addLayer", "registerListener", "unregisterListener"]),
        // ...mapMutations("Maps", ["removeLayerFromMap"]),
        ...mapMutations("Tools/ReportTemplates", ["finishEditingToolSettings", "abortEditingToolSettings"]),
        ...mapActions("Maps", ["placingPointMarker", "removePointMarker", "removePointMarkerFeature"]),
        ...mapActions("Alerting", ["addSingleAlert", "cleanup"]),
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

        getVisibleVectorLayers () {
            return layerCollection.getLayers().filter(layer => layer.getLayer() instanceof VectorLayer && layer?.attributes?.isNeverVisibleInTree !== true && this.supportedLayerTypes.includes(layer.get("typ")));
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
            this.registerClickListener();
        },

        /**
         * Registers the listeners to keyboard events onkeydown and onkeyup
         * @returns {void}
         */
        registerClickListener () {
            mapCollection.getMap("2D").addEventListener("click", evt => {
                if (this.mode === "point") {
                    this.setCoordinateFromClick(this.clickCoordinate, this.projectionCode, evt.originalEvent.shiftKey);
                }
            });
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
                    // layerMap = this.layerMapById(layer.get("id")),
                    unpackedFeature = unpackCluster(selectedFeature)[0];

                const nut = layerCollection.getLayerById(layer.get("id"));

                this.facilityFeature = unpackedFeature;

                this.selectedFacilities.push(unpackedFeature);


                if (this.mode === "facility") {
                    let featName = layer.get("name");

                    if (nut.attributes?.searchField?.length > 0) {
                        featName = unpackedFeature.get(nut.attributes?.searchField[0]);
                    }
                    this.setCoordinateFromFeature(unpackedFeature, this.projectionCode, unpackedFeature.get(nut.attributes.searchField[0]), featName);
                }
                else {
                    this.setCoordinateFromClick(this.clickCoordinate, this.projectionCode, evt.mapBrowserEvent.originalEvent.shiftKey);
                }
            });
        },

        /**
         * Sets and transforms the click coordinate to EPSG 4326.
         * @param {event} clickCoordinate - The coordinate of the click.
         * @param {String} mapProjectionCode - The code of the current map projection.
         * @returns {void}
         */
        setCoordinateFromClick: function (clickCoordinate, mapProjectionCode, featureName, layerName) {
            // if (this.activeSet)
            if (this.activeSet !== null) {
                this.setActiveSet(null);
                this.removeAll();
                this.selectionCards = [];
            }

            const newCard = {
                coord25832: clickCoordinate,
                coord4326: transformCoordinate(clickCoordinate, mapProjectionCode),
                icon: this.activeReferenceObject.icon,
                id: clickCoordinate.toString(),
                text: this.activeReferenceObject.text,
                name: featureName,
                layerName: layerName
            };

            this.selectionCards.push(newCard);

            // const coordinate = transformCoordinate(clickCoordinate, mapProjectionCode);

            // this.setSetBySearch(false);

                const markerCoord = [...clickCoordinate];

                markerCoord.keepPreviousMarker = true;
            this.placingPointMarker(markerCoord);
            // }
        },

        /**
         * Sets and transforms the coordinate(s) of a feature to EPSG 4326.
         * @param {ol/Feature} feature - The feature.
         * @param {String} mapProjectionCode - The code of the current map projection.
         * @returns {void}
         */
        setCoordinateFromFeature: function (feature, mapProjectionCode, featureName, layerName) {
            const simplifiedGeom = simplify(feature.getGeometry()),
                flatCoordinates = getFlatCoordinates(simplifiedGeom);
                // transformedCoordinates = transformCoordinates(flatCoordinates, mapProjectionCode);

            // if (this.setByFeature || feature.getGeometry().getType() === "Point") {
                flatCoordinates.forEach((coordinate, index) => {
                    this.setCoordinateFromClick(coordinate, mapProjectionCode, featureName, layerName);
                    // this.placingPointMarker(coordinate);
                });
            // }
            // else {
            // }
        },

        downloadMap () {
            exportMapView("Erreichbarkeitsanalyse_CoSI");
        },

        // tryUpdateIsochrones () {
        //     if (this.mode === "region" && this.currentCoordinates && this.dataSets.length > 0) {
        //         const allActiveFeatures = filterAllFeatures(this.selectedFacilityLayer.map(layer => layer.getLayer()), this.isFeatureActive),
        //             newCoordinates = this.getCoordinates(allActiveFeatures, this.setByFeature);

        //         if (!deepEqual(this.currentCoordinates.map(e=>[e[0], e[1]]), newCoordinates)) {
        //             this.askUpdate = true;
        //         }
        //     }
        // },

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
                        this.addCardsByLayerName(layer);
                    }
                }
                else {
                    getLayerSource(layer.getLayer()).on("featuresloadend", () => {
                        if (layer.getLayer().getSource().getFeatures().length > 0) {
                            if (this.isAllFacilitiesChecked) {
                                this.addCardsByLayerName(layer);
                                console.log(123);
                            }
                        }
                    });
                }
            });
            this.setSelectedFacilityNames(this.facilityNames);
        },

        getDirectionsText: function (routingDirections) {
            return `Route - ${routingDirections.distance} m, ${(routingDirections.duration / 60).toFixed(1)} min`;
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
        createAnalysisSet: async function () {
            this.hide = false;

            const analysisSet = {
                inputs: {},
                results: [],
                geojson: {}
            };

            this.setCoordinate(this.selectionCards.map(card => card.coord4326));


            await this.createIsochrones();

            analysisSet.results = this._isochroneFeatures;
            analysisSet.inputs = {
                // These lines have been changed back and forth so arguing my case for checking first if the value is undefined
                // JSON.parse throws error on undefined
                // So if the original variable is undefined, we don't copy undefined, but instead cause an error
                _mode: this._mode ? JSON.parse(JSON.stringify(this._mode)) : undefined,
                _coordinate: this._coordinate ? JSON.parse(JSON.stringify(this._coordinate)) : undefined,
                selectedFacilityNames: this.selectedFacilityNames ? JSON.parse(JSON.stringify(this.selectedFacilityNames)) : undefined,
                _selectedDirections: this._selectedDirections ? JSON.parse(JSON.stringify(this._selectedDirections)) : undefined,
                _transportType: this._transportType ? JSON.parse(JSON.stringify(this._transportType)) : undefined,
                _scaleUnit: this._scaleUnit ? JSON.parse(JSON.stringify(this._scaleUnit)) : undefined,
                distance: this.distance ? JSON.parse(JSON.stringify(this.distance)) : undefined,
                _time: this._time ? JSON.parse(JSON.stringify(this._time)) : undefined,
                _useTravelTimeIndex: this._useTravelTimeIndex !== undefined ? JSON.parse(JSON.stringify(this._useTravelTimeIndex)) : undefined,
                _setByFeature: this._setByFeature ? JSON.parse(JSON.stringify(this._setByFeature)) : undefined,
                _steps: this._steps ? JSON.parse(JSON.stringify(this._steps)) : [],
                _selectedFacility: this._selectedFacility ? this._selectedFacility : undefined,
                _selectedFacilities: this._selectedFacilities ? this._selectedFacilities : undefined,
                _pointFacilityOrRoute: this._pointFacilityOrRoute ? this._pointFacilityOrRoute : undefined,
                _cardinality: this._cardinality ? this._cardinality : undefined,
                selectionCards: this.selectionCards
            };
            this.dataSets.push(analysisSet);
            // console.log(analysisSet);
console.log(this.dataSets);

            this.setActiveSet(this.dataSets.length - 1);

            if (this.dataSets.length === 1) {
                this.renderIsochrones(this._isochroneFeatures);
            }
            this.dataSets[this.activeSet].geojson = this.exportAsGeoJson(this.getLayerById("accessibility-analysis"), this.projectionCode);
            this.setCoordinate([]);
            // console.log(this.coordinate);


            // this line adds the accessibility analysis data selection to the selection manger
            // this does not seem to make much sense: the only reason to reproduce this would be to reproduce the accessibility analysis. However, since the accessibility analysis creates this selection on the fly, we need the previous selection for reproduction, not this one. this one is then recreated on the fly everytime the analysis is run. Leaving this in in case we want this for some reason down the line.
            // this.addNewSelection({selection: analysisSet.results, source: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.title"), id: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.transportTypes." + this._transportType) + ", " + this.$t("additional:modules.tools.cosi.accessibilityAnalysis.scaleUnits." + this._scaleUnit) + ", [...]"});
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
            // this.setDataSets([]);
            this.setCoordinate([]);
            this.setSelectedFacilities([]);
            this.clear();
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

            this.dataSets[this.activeSet].results = this._isochroneFeatures;
            this.dataSets[this.activeSet].geojson = this.exportAsGeoJson(this.getLayerById("accessibility-analysis"), this.projectionCode);

            this.renderIsochrones(this._isochroneFeatures);
        },
        updateUseTravelTimeIndex (value) {
            this.setUseTravelTimeIndex(value);
        },
        updateTime (value) {
            this._time = value;
        },

        setActiveReferenceObject (obj) {
            this.activeReferenceObject = obj;
            this.setPointFacilityOrRoute(this.activeReferenceObject.type);
            this.selectionCards = [];
            // console.log(this.activeReferenceObject);

        },
        toggleLevel (evt) {
            this._scaleUnit = evt;
        },
        test (val) {
            this._transportType = val;
        },
        test2 (evt) {
            this.setDistance(evt.target.value);
        },

        settSetByFeature (value) {

            this._setByFeature = value;
        },

        removeSelectionCard (cardToRemove) {
            this.removePointMarkerFeature(cardToRemove.coord25832);
            this.selectionCards = this.selectionCards.filter(card => !deepEqual(card, cardToRemove));
        },

        getIconByTransportType (type) {
            return this.transportTypes.find(t => t.type === type).icon;
        },

        getScaleUnitByType (type) {
            return this.scaleUnits.find(s => s.type === type);
        },

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
                this.selectedFacilityLayer.forEach(layer => {
                    this.addCardsByLayerName(layer);
                });
            }
            else {
                this.removeAllMarkerCards();
                // this.setSelectedFacilityNames([]);
            }
        },

        updateActiveSet (set) {
            this.setActiveReferenceObject(this.getAvaibleReferenceObjectByType(set.inputs._pointFacilityOrRoute));

            if (this.dataSets[this.dataSets.indexOf(set)] !== this.dataSets[this.activeSet]) {
                this.setActiveSet(this.dataSets.indexOf(set));
                return;
            }
            this.setActiveSet(null);
            this.removeAll();
            this.selectionCards = [];
        },

        getAvaibleReferenceObjectByType (type) {
            return this.availableReferenceObjects.find(obj => obj.type === type);
        },

        removeCardsByLayerName (name) {
            const cardsToRemove = this.selectionCards.filter(card => card.layerName === name);

            cardsToRemove.forEach(card => {
                this.removePointMarkerFeature(card.coord25832);
            });

            this.selectionCards = this.selectionCards.filter(card => card.layerName !== name);
        },

        addCardsByLayerName (layer) {
            // const layer = this.visibleVectorLayers.find(layerr => layerr.getLayer().get("name") === name);

            if (layer) {
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
        <hr class="mt-0">
        <TabBar
            class="mb-4"
            :items="availableReferenceObjects"
            :active-item="activeReferenceObject"
            @change="setActiveReferenceObject"
        />
        <div class="mb-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">
                    Ausgewählte {{ activeReferenceObject.text }}
                </h5>
            </div>
            <SwitchInput
                v-if="mode === 'facility' && pointFacilityOrRoute === 'facility'"
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
                Noch kein Punkt ausgewählt. Um einen Punkt zu setzen, bitte auf die Karte klicken!
            </div>
            <div v-for="card in selectionCards" class="card mb-3">
                <div class="card-body d-flex p-2 description">
                    <div class="me-2 fs-3"><i :class="card.icon"></i></div>
                    <div class="flex-grow-1">{{card.text}} <br>{{ card.name || card.coord25832.toString() }}</div>
                    <button type="button" class="btn-close" aria-label="Close"
                        @click="removeSelectionCard(card)"
                    ></button>
                </div>
            </div>
        </div>
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
                :class-array="['btn-light', 'mb-0', type.type === _transportType ? 'active': '']"
                :label="type.name"
            />
        </div>
        <h5 class="mb-3">
            Berechnungsmethode
        </h5>
        <ButtonGroup
            v-if="mode !== 'path'"
            class="mb-3"
            :buttons="scaleUnits.map(card => ({name: card.name, value: card.type}))"
            :pre-checked-value="_scaleUnit"
            group="scaleUnits"
            @show-view="toggleLevel"
        />
        <div class="mb-3">
            <div class="d-flex justify-content-center mb-1">
                <input
                    class="form-control form-control-sm fs-5"
                    id="exampleFormControlInput1"
                    :value="distance"
                    @input="setDistance($event)"
                >
            </div>
            <SliderItem
                :id="'routing-slider-input'"
                aria="test"
                class="mb-1"
                :value="distance"
                :min="0"
                :max="getScaleUnitByType(_scaleUnit).max"
                :interaction="setDistance($event)"
            />
            <div class="d-flex justify-content-between value">
                <span>0 {{ getScaleUnitByType(_scaleUnit).unit }}</span>
                <span>{{ getScaleUnitByType(_scaleUnit).max }} {{ getScaleUnitByType(_scaleUnit).unit }}</span>
            </div>
        </div>
        <SwitchInput
            v-if="mode === 'facility'"
            :aria="$t('additional:modules.tools.cosi.accessibilityAnalysis.setByFeatureOutline')"
            :checked="_setByFeature"
            :interaction="() => settSetByFeature(!_setByFeature)"
            :label="$t('additional:modules.tools.cosi.accessibilityAnalysis.setByFeatureOutline')"
            class="mb-3"
        />
        <div
            v-if="_transportType === 'driving-car' && scaleUnit === 'time' && pointFacilityOrRoute === 'point'"
            class="mb-3"
        >
            <SwitchInput
                :id="'autoTrafficFlow'"
                :aria="'Verkehrsfluss berücksichtigen'"
                :checked="useTravelTimeIndex"
                :interaction="() => updateUseTravelTimeIndex(!useTravelTimeIndex)"
                :label="'Verkehrsfluss berücksichtigen'"
            />
            <AccessibilityAnalysisTrafficFlow
                v-if="useTravelTimeIndex"
                :time="_time"
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
                    <div class="p-2 fs-1"><i :class="getIconByTransportType(set.inputs._transportType)"></i></div>
                    <div class="p-2  flex-grow-1">{{ getScaleUnitByType(set.inputs._scaleUnit).name}} <br>
                         <span class="fs-5 title">{{set.inputs._time}} {{getScaleUnitByType(set.inputs._scaleUnit).name === 'Zeit' ? 'Minuten' : 'Meter'}}</span>
                           <br>
                        <span v-if="set.inputs.selectionCards.length === 1">
                            <i :class="set.inputs.selectionCards[0].icon" class="me-2"></i>{{ set.inputs.selectionCards[0].text }} <span class="title">{{ set.inputs._coordinate[0].toString() }}</span>
                        </span>
                        <span v-else>
                            <i :class="set.inputs.selectionCards[0].icon" class="me-2"></i>Mehrere {{ set.inputs.selectionCards[0].text }}
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
