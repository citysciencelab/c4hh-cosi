<script>
import AccessibilityAnalysisExport from "./AccessibilityAnalysisExport.vue";
import AccessibilityAnalysisLegend from "./AccessibilityAnalysisLegend.vue";
import AccessibilityAnalysisTrafficFlow from "./AccessibilityAnalysisTrafficFlow.vue";
import AlertMessage from "../../shared/modules/alerts/components/AlertMessage.vue";
import ButtonGroup from "../../components/ButtonGroup.vue";
import {VExpandTransition} from "vuetify/components/transitions";
import {VItemGroup, VItem} from "vuetify/components/VItemGroup";
import deepEqual from "deep-equal";
import differenceJs from "@shared/js/utils/differenceJS";
import DropdownAutocomplete from "../../shared/modules/dropdown/components/DropdownAutocomplete.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {getLayerSource} from "../../utils/layer/getLayerSource";
import getters from "../store/gettersAccessibilityAnalysis";
import html2canvas from "html2canvas";
import {mapActions, mapGetters, mapMutations} from "vuex";
import methods from "./methodsAnalysis";
import mutations from "../store/mutationsAccessibilityAnalysis";
import {downloadGeoJson, exportAsGeoJson} from "../utils/exportResults";
import {Select} from "ol/interaction";
import ToolInfo from "../../shared/modules/toolInfo/components/ToolInfo.vue";
import {geometryToGeoJson} from "../../utils/geometry/convertToGeoJson";
import {transformCoordinate, transformCoordinates} from "../utils/transformCoordinates";
import TabBar from "../../shared/modules/tabBar/components/TabBar.vue";
import {simplify} from "../../utils/geometry/simplify";
import {getFlatCoordinates} from "../../utils/geometry/getFlatCoordinates";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import LabeledSlider from "../../shared/modules/slider/components/LabeledSlider.vue";
import layerCollection from "@core/layers/js/layerCollection";
import layerFactory from "@core/layers/js/layerFactory";
import ResultManagement from "../../shared/modules/resultManagement/components/ResultManagement.vue";
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";
import {unpackCluster} from "../../utils/features/unpackCluster.js";
import SimpleCard from "../../shared/modules/cards/components/SimpleCard.vue";
import CustomCard from "../../shared/modules/cards/components/CustomCard.vue";
import {singleClick} from "ol/events/condition";
import thousandsSeparator from "../../../../src/shared/js/utils/thousandsSeparator.js";
import travelTimeIndex from "../assets/inrix_traveltimeindex_2021.json";
import VectorLayer from "ol/layer/Vector.js";
import WPS from "@shared/js/api/wps.js";
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";

export default {
    name: "AccessibilityAnalysis",
    components: {
        AccessibilityAnalysisExport,
        AccessibilityAnalysisLegend,
        AccessibilityAnalysisTrafficFlow,
        AccordionItem,
        AlertMessage,
        ButtonGroup,
        DropdownAutocomplete,
        FlatButton,
        IconButton,
        LabeledSlider,
        ResultManagement,
        SimpleCard,
        CustomCard,
        SwitchInput,
        TabBar,
        ToolInfo,
        VExpandTransition,
        VItem,
        VItemGroup
    },
    data () {
        return {
            abortController: null,
            activeMode: null,
            availableModes: [
                {
                    type: "point",
                    text: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.points"),
                    icon: "bi bi-geo-alt", title: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.fromReferencePoint"),
                    description: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.descReferencePoint"),
                    info: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.noPointSelected")
                },
                {
                    type: "facility",
                    text: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.facilities"),
                    icon: "bi bi-layers",
                    title: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.fromFacility"),
                    description: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.descFacility"),
                    info: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.noFacilitySelected")
                },
                {
                    type: "path",
                    text: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.referToPath"),
                    icon: "bi bi-map",
                    title: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.fromRoute"),
                    description: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.descRoute"),
                    info: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.noRouteCalculated")
                }
            ],
            cardCounter: 1,
            facilityNames: [],
            directionsLayer: null,
            mergePolygons: true,
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
                    name: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.scaleUnits.time"),
                    type: "time",
                    unit: "min"
                },
                {
                    name: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.scaleUnits.distance"),
                    type: "distance",
                    unit: "m"
                }
            ],
            sliderRerenderKey: 0,
            legendColors: [
                "rgba(0, 76, 168, 0.40)",
                "rgba(47, 135, 245, 0.39)",
                "rgba(199, 214, 250, 0.55)",
                "rgba(159, 25, 215, 1)"
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
            visibleVectorLayers: [],
            showErrorAlert: false,
            showSpinner: false
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
        // ...mapGetters("Modules/SelectionManager", ["activeSelection"]),
        // ...mapGetters("Modules/ScenarioBuilder", ["scenarioUpdated"]),

        /**
         * Gets the datasets for card in shared component resultManagement.
         * @returns {Object[]} the datasets for card.
         */
        cardDatasets () {
            const cardData = [];

            this.dataSets.forEach(set => {
                cardData.push(
                    {
                        data: this.getData(set),
                        downloadable: true,
                        icon: this.getIconByTransportType(set?.inputs?.transportType),
                        removable: true,
                        status: this.dataSets.indexOf(set) === this.activeSet ? "active" : "",
                        title: set.inputs.title,
                        visible: true
                    }
                );
            });

            return cardData;
        },

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
                if (this.dataSets[index].inputs.useOuterBoundaries) {
                    this.setMarkerByCoordinates(this.selectionCards.map(card => card.coord25832).flat());
                }
                else {
                    this.setMarkerByCoordinates(this.selectionCards.map(card => card.coord25832));
                }
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
                this.setUseOuterBoundaries(false);
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
                    label: "Berechnete Route",
                    name: `Entfernung: ${this.routingDirections.distance} m | Zeit: ${this.routingDirections.duration} min | Verkehrsmittel: ${this.mappedRoutingProfiles[this.settings.speedProfile]}`,
                    layerName: "layerName"
                };

                this.selectionCards = [newCard];
            }
        },

        /**
         * Forces the slider to rerender on scale unit change.
         * @returns {void}
         */
        scaleUnit () {
            this.sliderRerenderKey++;
        },

        visibleVectorLayers (newValues) {
            this.setFacilityNames(newValues);
        },

        /**
         * Detects changes in visible Layers.
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
        this.cardCounter = this.dataSets.length;
        this.visibleVectorLayers = this.getVisibleVectorLayers();

        if (this.routingDirections) {
            this.setActiveMode(this.getModeByType("path"));
        }
        else {
            this.setActiveMode(this.availableModes[0]);
        }
        this.setSelectInteraction();
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

        mapCollection.getMap("2D").addEventListener("click", this.onMapClick);
        this.setDefaults();
        // onSearchbar(this.setSearchResultToOrigin);
        // onShowFeaturesById(this.tryUpdateIsochrones);
        // onShowAllFeatures(this.tryUpdateIsochrones);
        // onFeaturesLoaded(this.tryUpdateIsochrones);


    },
    unmounted () {
        this.setMode(this.availableModes[0].type);
        this.removeInteraction(this.select);
        mapCollection.getMap("2D").removeEventListener("click", this.onMapClick);
        // this.removeAll();
        this.setDefaults();
    },
    methods: {
        ...mapActions("Maps", ["addInteraction", "removeInteraction", "zoomToExtent"]),
        ...mapMutations("Modules/PopulationRequest", {
            setPopulationRequestGeometry: "setGeometry",
            setPopulationRequestActive: "setActive"
        }),
        ...mapMutations("Modules/AccessibilityAnalysis", Object.keys(mutations)),
        ...mapActions("Modules/AccessibilityAnalysis", ["getIsochrones"]),
        ...mapActions("Maps", ["placingPointMarker", "removePointMarker", "removePointMarkerFeature"]),
        ...mapActions("Alerting", ["addSingleAlert", "cleanup"]),
        ...mapActions("Modules/Routing/Directions", ["reset", "setRoutingDirections"]),
        ...methods,

        /**
         * Adds selection cards for all features in the given layer.
         * @param {ol/layer/Vector} layer - The layer from which to add cards.
         * @returns {void}
         */
        addCardsByLayer (layer) {
            layer.getLayer().getSource().getFeatures().forEach(feature => {
                const unpackedFeature = unpackCluster(feature);

                unpackedFeature.forEach(unfeat => {
                    let cardName;

                    if (layer.attributes?.searchField?.length > 0) {
                        cardName = unfeat.get(layer.attributes?.searchField[0]);
                    }
                    this.select.getFeatures().push(unfeat);
                    this.setCoordinateFromFeature(unfeat, cardName, layer.getLayer().get("name"));
                });
            });
        },

        /**
         * Checks if all features from a layer are present in the given features.
         * @param {ol/layer/Vector} layer - The layer to check against.
         * @param {ol/Feature[]} features - The feature collection to check.
         * @returns {Boolean} True if all features are present, false otherwise.
         */
        areAllFeaturesInCollection (layer, features) {
            const layerFeatures = layer.getLayerSource().getFeatures(),
                featureIds = features.map(feature => unpackCluster(feature)[0].getId());

            return layerFeatures.every(layerFeature => {
                const unpackedFeatures = unpackCluster(layerFeature);

                return unpackedFeatures.every(unpackedFeature => {
                    return featureIds.includes(unpackedFeature.getId());
                });
            });
        },

        /**
         * Exits the result view by clearing the polygon layer, resetting the active set and setting defaults.
         * @returns {void}
         */
        exitResultView () {
            this.setActiveSet(null);
            this.getLayerById("accessibility-analysis").getLayer().getSource().clear();
        },

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
        setSelectInteraction () {
            this.select = new Select({
                addCondition: singleClick,
                filter: (feature, layer) => this.facilityNames.includes(layer.get("name")),
                hitTolerance: 20,
                removeCondition: singleClick,
                style: null
            });

            this.registerSelectListener(this.select.getFeatures());
        },

        /**
         * Registers the listeners to keyboard events onkeydown and onkeyup
         * @returns {void}
         */
        onMapClick (evt) {
            if (this.mode === "point") {
                this.setCoordinateFromClick(this.clickCoordinate, this.projectionCode, evt.originalEvent.shiftKey, this.$t("additional:modules.tools.cosi.accessibilityAnalysis.points"));
            }
        },

        /**
         * Registers listeners for the select interaction's feature collection.
         * @param {ol/Collection} featureCollection - The feature collection to register listeners on.
         * @returns {void}
         */
        registerSelectListener (featureCollection) {
            featureCollection.on("add", evt => {
                const unpackedFeature = unpackCluster(evt.element)[0],
                    foundLayer = this.visibleVectorLayers.find(layer => {
                        return getLayerSource(layer.getLayer()).hasFeature(unpackedFeature);
                    });
                let cardName;

                if (foundLayer.attributes?.searchField?.length > 0) {
                    cardName = unpackedFeature.get(foundLayer.attributes?.searchField[0]);
                }
                this.setCoordinateFromFeature(unpackedFeature, cardName, foundLayer.get("name"));

                if (this.areAllFeaturesInCollection(foundLayer, featureCollection.getArray())) {
                    this.selectedFacilityNames.push(foundLayer.get("name"));
                }
            });

            featureCollection.on("remove", evt => {
                const featureToRemove = unpackCluster(evt.element)[0],
                    cardToRemove = this.selectionCards.find(card => card.feature.getId() === featureToRemove.getId());

                if (!cardToRemove) {
                    return;
                }
                this.removeSelectionCard(cardToRemove, false);
            });

        },

        /**
         * Resets all options to default values.
         * @returns {void}
         */
        setDefaults () {
            this.useTravelTimeIndex = false;
            this.mergePolygons = true;
            this.isAllFacilitiesChecked = false;
            this.setTransportType("driving-car");
            this.setScaleUnit("time");
            this.setTime(this.rangeSettings[this.transportType]?.time?.value ?? this.rangeSettings.default.time.value);
            this.setDistance(this.rangeSettings[this.transportType]?.distance?.value ?? this.rangeSettings.default.distance.value);
        },

        /**
         * Sets and transforms the click coordinate to EPSG 4326.
         * @param {event} clickCoordinate - The coordinate of the click.
         * @param {String} mapProjectionCode - The code of the current map projection.
         * @returns {void}
         */
        setCoordinateFromClick: function (clickCoordinate, mapProjectionCode, featureName, layerName, feature) {
            if (this.hasActiveSet) {
                this.setActiveSet(null);
                this.setDefaults();
                this.removeAll();
            }

            let coords,
                cardText;

            if (this.useOuterBoundaries) {
                cardText = "Flächenaußengrenzen für " + (featureName || clickCoordinate.slice(0, 2) + "...");
                coords = transformCoordinates(clickCoordinate, mapProjectionCode);
                this.setMarkerByCoordinates(clickCoordinate);
            }
            else {
                cardText = featureName || clickCoordinate.map(coord => coord.toFixed(6)).join(", ");
                coords = transformCoordinate(clickCoordinate, mapProjectionCode);
                this.setMarkerByCoordinates([clickCoordinate]);
            }
            const newCard = {
                    coord25832: clickCoordinate,
                    coord4326: coords,
                    icon: this.activeMode.icon,
                    id: clickCoordinate.toString(),
                    label: layerName || this.activeMode.text,
                    text: cardText,
                    layerName: layerName,
                    featureName,
                    feature
                },
                cardExists = this.selectionCards.some(card => card.id === newCard.id);

            if (!cardExists) {
                this.selectionCards.push(newCard);
            }
        },

        /**
         * Sets and transforms the coordinate(s) of a feature to EPSG 4326.
         * @param {ol/Feature} feature - The feature.
         * @param {String} mapProjectionCode - The code of the current map projection.
         * @returns {void}
         */
        setCoordinateFromFeature: function (feature, featureName, layerName) {
            let simplifiedGeom;

            if (feature.getGeometry().getType() === "Polygon" && !this.useOuterBoundaries) {
                simplifiedGeom = simplify(feature.getGeometry().getInteriorPoint());
            }
            else {
                simplifiedGeom = simplify(feature.getGeometry());
            }

            if (this.useOuterBoundaries) {
                this.setCoordinateFromClick(getFlatCoordinates(simplifiedGeom), this.projectionCode, featureName, layerName, feature);
            }
            else {
                getFlatCoordinates(simplifiedGeom).forEach((coordinate) => {
                    this.setCoordinateFromClick(coordinate, this.projectionCode, featureName, layerName, feature);
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

            try {
                this.showSpinner = true;
                this.showErrorAlert = false;
                await this.createIsochrones();
            }
            catch (error) {
                this.showSpinner = false;
                this.showErrorAlert = true;
            }

            if (this.isochroneFeatures.length > 0) {
                this.showErrorAlert = false;
                mapCollection.getMap("2D").once("rendercomplete", (evt) => {
                    const canvas = evt.target.getViewport().querySelector("canvas"),
                        legend = document.getElementById("accessibility-analysis-legend");

                    html2canvas(legend).then(legendCanvas => {
                        analysisSet.inputs.screenshotLegend = legendCanvas.toDataURL("image/png");
                    });
                    analysisSet.inputs.screenshot = canvas.toDataURL("image/png");
                });

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
                    travelTime: this.useTravelTimeIndex ? this.travelTime : undefined,
                    travelTimeIndex: this.useTravelTimeIndex ? travelTimeIndex[this.travelTime] : undefined,
                    useOuterBoundaries: this.useOuterBoundaries ? JSON.parse(JSON.stringify(this.useOuterBoundaries)) : undefined,
                    mergePolygons: this.mergePolygons,
                    steps: this.steps ? JSON.parse(JSON.stringify(this.steps)) : [],
                    selectionCards: this.selectionCards,
                    isAllFacilitiesChecked: this.isAllFacilitiesChecked,
                    title: "Erreichbarkeit " + this.cardCounter++
                };
                this.dataSets.unshift(analysisSet);
                this.setActiveSet(0);

                if (this.dataSets.length === 1) {
                    this.renderIsochrones(this.isochroneFeatures);
                }
                this.dataSets[this.activeSet].geojson = this.exportAsGeoJson(this.getLayerById("accessibility-analysis"), this.projectionCode);
                this.setPopulationSize();
                this.setCoordinate([]);
                this.showSpinner = false;
            }
        },

        setPopulationSize () {
            const service = this.restServiceById(this.wpsServiceId);

            if (service === undefined) {
                console.warn("Rest Service with the ID 1001 is not configured in rest-services.json!");
            }
            else {
                const outerPolygon = geometryToGeoJson(this.isochroneFeatures[0].getGeometry(), false, "EPSG:25832", "EPSG:25832");

                WPS.wpsRequest(service.id, service.url, this.wpsProcess, {
                    "such_flaeche": JSON.stringify(outerPolygon)
                }, this.handlePopulationResponsee.bind(this));
            }
        },

        handlePopulationResponsee (resp) {
            const parsedData = resp.ExecuteResponse.ProcessOutputs.Output.Data.ComplexData.einwohner,
                responseResult = JSON.parse(parsedData.ergebnis);

            this.dataSets[this.activeSet].inputs.einwohner = thousandsSeparator(responseResult.einwohner_fhh);

        },
        exportAsGeoJson,
        /**
         * Removes the set from data sets.
         * @param {index} Number - The index of data.
         * @returns {void}
         */
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
            this.setSteps([0, 0, 0]);
            this.setIsochroneFeatures([]);
            this.getLayerById("accessibility-analysis").getLayer().getSource().clear();
            this.resetIsochroneBBox();
            this.removePointMarker();
            this.showErrorAlert = false;
            this.selectionCards = [];
        },
        /**
         * Removes all the data.
         * @returns {void}
         */
        removeAllData () {
            this.removeAll();
            this.setDataSets([]);
        },
        /**
         * Downloads the dataset in geojson format.
         * @param {Event} evt - The click event.
         * @returns {void}
         */
        downloadSet (evt) {
            const index = evt.target.closest(".card").getAttribute("data-index");

            downloadGeoJson(this.dataSets[index].geojson);
        },
        downloadAll () {
            this.dataSets.forEach(set => {
                downloadGeoJson(set.geojson);
            });
        },


        /**
         * Downloads the screenshot of the given set.
         * @param {Event} evt - The click event.
         * @returns {void}
         */
        downloadScreenshot (evt) {
            const index = evt.target.closest(".card").getAttribute("data-index"),
                link = document.createElement("a");

            link.href = this.dataSets[index].inputs.screenshot;
            link.download = "Erreichbarkeitsanalyse.png";

            link.click();
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
            this.showErrorAlert = false;
            this.useTravelTimeIndex = value;
        },

        updateTime (value) {
            this.showErrorAlert = false;
            this.setTime(parseInt(value, 10));
        },

        setActiveMode (obj) {
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
        updateTransportType (val) {
            if (this.hasActiveSet) {
                this.setActiveSet(null);
                this.removeAll();
            }
            this.setTransportType(val);
            this.showErrorAlert = false;
        },
        updateDistance (distance) {
            this.showErrorAlert = false;
            if (this.scaleUnit === "time") {
                this.setTime(parseInt(distance, 10));
            }
            else {
                this.setDistance(parseInt(distance, 10));
            }
        },

        removeSelectionCard (cardToRemove, removeFromColl = true) {
            this.setSelectedFacilityNames(this.selectedFacilityNames.filter(name => name !== cardToRemove.layerName));
            this.setActiveSet(null);
            if (cardToRemove.coord25832.some(item => Array.isArray(item))) {
                cardToRemove.coord25832.forEach(coord => {
                    this.removePointMarkerFeature(coord);
                });
            }
            else {
                this.removePointMarkerFeature(cardToRemove.coord25832);
            }
            this.selectionCards = this.selectionCards.filter(card => !deepEqual(card, cardToRemove));
            if (removeFromColl) {
                const index = this.select.getFeatures().getArray().findIndex(feat => feat.getId() === cardToRemove.feature.getId());

                this.select.getFeatures().removeAt(index);
            }
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
         * @param {Object} set - analysis set
         * @returns {Boolean} True if the given set is the active set, false otherwise.
         */
        isSetActive (set) {
            return this.activeSet === this.dataSets.indexOf(set);
        },

        /**
         * Updates the active data set.
         * @param {index} Number - The index of data set.
         * @returns {void}
         */
        updateActiveSet (index) {
            if (index !== this.activeSet) {
                this.setActiveMode(this.getModeByType(this.dataSets[index].inputs.mode));
                this.setActiveSet(index);
                if (this.dataSets[index].inputs.isAllFacilitiesChecked) {
                    this.isAllFacilitiesChecked = true;
                }
                return;
            }
            this.setActiveSet(null);
            this.setDefaults();
            this.removeAll();
        },

        getModeByType (type) {
            return this.availableModes.find(obj => obj.type === type);
        },

        removeCardsByLayerName (name) {
            const cardsToRemove = this.selectionCards.filter(card => card.layerName === name);

            cardsToRemove.forEach(card => {
                this.removeSelectionCard(card);
            });
        },

        /**
         * Gets the data for component card.
         * @param {Object} data - one data set.
         * @returns {Object[]} the rendered data.
         */
        getData (data) {
            const result = [],
                name = this.getScaleUnitByType(data.inputs?.scaleUnit)?.name,
                title = name === "Zeit" ? data.inputs?.time + " Minuten" : data.inputs?.distance + " Meter",
                pointDes = data.inputs.selectionCards.length === 1 ? data.inputs.selectionCards[0].layerName : "Mehrere: " + [...new Set(data.inputs.selectionCards.map(card => card.layerName))],
                coordinate = data.inputs.selectionCards.length === 1 ? data.inputs.selectionCards[0].text : "",
                icon = data.inputs.selectionCards[0]?.icon,
                population = data.inputs.einwohner;

            result.push({label: name, value: title});
            if (data.inputs.selectionCards.length > 1 && data.inputs.useOuterBoundaries) {
                result.push({icon: icon, label: pointDes, value: "Flächenaußengrenzen"});
            }
            else {
                result.push({icon: icon, label: pointDes, value: coordinate});

            }
            result.push({
                icon: "bi bi-people",
                label: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.inhabitants") + ": " + population
            });
            if (data.inputs.useTravelTimeIndex) {
                const ttiTitle = this.$t("additional:modules.tools.cosi.accessibilityAnalysis.travelTimeIndex.title"),
                    timeLabel = this.$t("additional:modules.tools.cosi.accessibilityAnalysis.travelTimeIndex.timeOfDay"),
                    hourLabel = this.$t("additional:modules.tools.cosi.accessibilityAnalysis.travelTimeIndex.hour");

                result.push({
                    icon: "bi bi-sliders",
                    label: `${ttiTitle}: ${data.inputs.travelTimeIndex}, ${timeLabel}: ${data.inputs.travelTime}:00 ${hourLabel}`
                });
            }
            if (data.inputs.selectionCards.length >= 2) {
                result.push(data.inputs.mergePolygons
                    ? {icon: "bi bi-union", label: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.visualizationOptions.visualization") + ": " + this.$t("additional:modules.tools.cosi.accessibilityAnalysis.visualizationOptions.mergePolygons")}
                    : {icon: "bi bi-subtract", label: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.visualizationOptions.visualization") + ": " + this.$t("additional:modules.tools.cosi.accessibilityAnalysis.visualizationOptions.dontMergePolygons")}
                );
            }

            return result;
        },


        /**
         * Resets the selection cards by removing all current selections and re-adding them.
         * @returns {void}
         */
        resetSelectionCards () {
            const cards = [...this.selectionCards];

            this.removeAll();
            cards.forEach(card => {
                this.setCoordinateFromFeature(card.feature, card.featureName, card.layerName);
            });
        },

        /**
         * Toggles the use of outer boundaries for the analysis.
         * @param {boolean} value - True if outer boundaries should be set, false otherwise.
         * @returns {void}
         */
        toggleOuterBoundaries (value) {
            this.setUseOuterBoundaries(value);
            this.setActiveSet(null);
            if (this.selectionCards.length) {
                this.resetSelectionCards();
            }
        },

        updateSelectedFacilityNames (newValue) {
            if (this.mode !== "facility") {
                return;
            }
            const oldValue = this.selectedFacilityNames,
                difference = differenceJs(newValue, oldValue),
                diff = differenceJs(oldValue, newValue);

            if (diff.length) {
                this.removeCardsByLayerName(diff[0]);
            }
            if (difference.length) {
                const layer = this.visibleVectorLayers.find(layerr => layerr.getLayer().get("name") === difference[0]);

                this.addCardsByLayer(layer);
            }
            this.setSelectedFacilityNames(newValue);
        }
    }
};
</script>

<template lang="html">
    <div id="accessibilityanalysis">
        <ToolInfo
            :url="readmeUrl"
            :summary="$t('additional:modules.tools.cosi.accessibilityAnalysis.description')"
        />
        <hr class="mt-0">
        <TabBar
            class="mb-4"
            :items="availableModes"
            :active-item="activeMode"
            @change="setActiveMode"
        />
        <div class="mb-4 scroll-container">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">
                    Ausgewählte {{ activeMode.text }}
                </h5>
            </div>
            <Dropdown-Autocomplete
                v-if="mode === 'facility'"
                :items="facilityNames ? facilityNames : []"
                :model-value="selectedFacilityNames ? selectedFacilityNames : []"
                multiple
                label="Alle Fachdaten auswählen"
                @update:model-value="updateSelectedFacilityNames($event)"
            />
            <AlertMessage
                v-if="selectionCards.length === 0"
                :text="activeMode.info"
                type="noData"
            />
            <div
                v-for="card in selectionCards"
                :key="card.id"
                class="mb-3"
            >
                <SimpleCard
                    :icon="card.icon"
                    :label="card.label"
                    :text="card.text"
                    @click:close="removeSelectionCard(card)"
                />
            </div>
        </div>
        <SwitchInput
            v-if="mode === 'facility'"
            :id="'featureOutline'"
            :aria="$t('additional:modules.tools.cosi.accessibilityAnalysis.setByFeatureOutline')"
            :checked="useOuterBoundaries"
            :interaction="() => toggleOuterBoundaries(!useOuterBoundaries)"
            :label="$t('additional:modules.tools.cosi.accessibilityAnalysis.setByFeatureOutline')"
            class="mb-3"
        />
        <v-expand-transition>
            <div
                v-if="selectionCards.length >= 2 && !useOuterBoundaries"
                class="mb-3"
            >
                <AccordionItem
                    id="AccessibilityAnalysisVisualizationOptionsAccordion"
                    :title="$t('additional:modules.tools.cosi.accessibilityAnalysis.visualizationOptions.header')"
                >
                    <v-item-group
                        v-model="mergePolygons"
                        class="d-flex justify-content-between gap-3"
                        selected-class="card-active"
                        mandatory
                    >
                        <v-item
                            v-slot="{toggle, selectedClass}"
                            :value="true"
                        >
                            <CustomCard
                                hoverable
                                :class="selectedClass"
                                role="button"
                                @click="toggle(); exitResultView()"
                            >
                                <div class="d-flex-column text-center">
                                    <i class="bi bi-union" />
                                    <div>{{ $t('additional:modules.tools.cosi.accessibilityAnalysis.visualizationOptions.mergePolygons') }}</div>
                                    <div class="description">
                                        {{ $t('additional:modules.tools.cosi.accessibilityAnalysis.visualizationOptions.mergePolygonsInfo') }}
                                    </div>
                                </div>
                            </CustomCard>
                        </v-item>
                        <v-item
                            v-slot="{toggle, selectedClass}"
                            :value="false"
                        >
                            <CustomCard
                                hoverable
                                :class="selectedClass"
                                role="button"
                                @click="toggle(); exitResultView()"
                            >
                                <div class="d-flex-column text-center">
                                    <i class="bi bi-subtract" />
                                    <div>{{ $t('additional:modules.tools.cosi.accessibilityAnalysis.visualizationOptions.dontMergePolygons') }}</div>
                                    <div class="description">
                                        {{ $t('additional:modules.tools.cosi.accessibilityAnalysis.visualizationOptions.dontMergePolygonsInfo') }}
                                    </div>
                                </div>
                            </CustomCard>
                        </v-item>
                    </v-item-group>
                </AccordionItem>
            </div>
        </v-expand-transition>
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
                    :aria="type.name"
                    :icon="type.icon"
                    :title="type.name"
                    :interaction="() => updateTransportType(type.type)"
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
        <LabeledSlider
            :key="sliderRerenderKey"
            class="mb-3"
            :min="rangeSettings[transportType]?.[scaleUnit]?.min ?? rangeSettings.default[scaleUnit].min"
            :max="rangeSettings[transportType]?.[scaleUnit]?.max ?? rangeSettings.default[scaleUnit].max"
            :unit="getScaleUnitByType(scaleUnit).unit"
            :model-value="scaleUnit === 'time' ? time : distance"
            @update:model-value="updateDistance"
        />
        <div
            v-if="transportType === 'driving-car' && scaleUnit === 'time' && mode === 'point'"
            class="mb-3"
        >
            <SwitchInput
                :id="'autoTrafficFlow'"
                :aria="$t('additional:modules.tools.cosi.accessibilityAnalysis.considerTrafficFlow')"
                :checked="useTravelTimeIndex"
                :interaction="() => setUseTravelTimeIndex(!useTravelTimeIndex)"
                :label="$t('additional:modules.tools.cosi.accessibilityAnalysis.considerTrafficFlow')"
            />
            <AccessibilityAnalysisTrafficFlow
                v-if="useTravelTimeIndex"
                :travel-time="travelTime"
                @update:travel-time="setTravelTime"
            />
        </div>
        <FlatButton
            class="mx-auto"
            icon="bi bi-play-circle"
            :disabled="selectionCards.length === 0"
            :text="$t('additional:modules.tools.cosi.accessibilityAnalysis.calculateAccessibility')"
            :spinner-trigger="showSpinner"
            @click.native="createAnalysisSet()"
        />
        <AlertMessage
            v-if="showErrorAlert"
            :text="$t('additional:modules.tools.cosi.accessibilityAnalysis.errorAlert')"
            type="error"
            :closeable="true"
        />
        <div v-if="dataSets.length > 0">
            <hr>
            <ResultManagement
                :data-sets="cardDatasets"
                :title="$t('additional:modules.tools.cosi.accessibilityAnalysis.calculatedaVailability')"
                :is-accordion="true"
                icon="bi bi-card-text"
                @download-all="downloadAll"
                @remove-all-data="removeAllData"
                @remove-set="removeSet"
                @update-active-set="updateActiveSet"
            >
                <template #top>
                    <AccessibilityAnalysisLegend
                        v-if="hasActiveSet"
                        :steps="steps"
                        :colors="legendColors"
                        :unit="getScaleUnitByType(scaleUnit).unit"
                    />
                </template>
                <template #card>
                    <AccessibilityAnalysisExport
                        @export-geojson="downloadSet($event)"
                        @export-png="downloadScreenshot($event)"
                    />
                </template>
                <template #after-card="{index}">
                    <AlertMessage
                        v-if="index === activeSet && dataSets[index].inputs.useTravelTimeIndex"
                        :text="$t('additional:modules.tools.cosi.accessibilityAnalysis.travelTimeIndex.warning')"
                        type="info"
                    />
                </template>
            </ResultManagement>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    #accessibilityanalysis {
        .scroll-container {
            max-height: 300px;
            overflow-y: auto;
        }
        .title {
            color: $secondary;
        }

        .description {
            font-size: 0.9rem;
        }

        font-family: $font_family_default;
    }

</style>
