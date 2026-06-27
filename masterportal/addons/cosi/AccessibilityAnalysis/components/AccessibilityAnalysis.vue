<script>
import AccessibilityAnalysisExport from "./AccessibilityAnalysisExport.vue";
import AccessibilityAnalysisLegend from "./AccessibilityAnalysisLegend.vue";
import AccessibilityAnalysisTrafficFlow from "./AccessibilityAnalysisTrafficFlow.vue";
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import AlertMessage from "../../shared/modules/alerts/components/AlertMessage.vue";
import {Dropdown} from "bootstrap";
import ButtonGroup from "../../components/ButtonGroup.vue";
import CustomCard from "../../shared/modules/cards/components/CustomCard.vue";
import {union} from "@turf/union";
import {featureCollection as turfFeatureCollection} from "@turf/helpers";
import {VExpandTransition} from "vuetify/components/transitions";
import {VItemGroup, VItem} from "vuetify/components/VItemGroup";
import dayjs from "dayjs";
import deepEqual from "deep-equal";
import differenceJs from "@shared/js/utils/differenceJS";
import DropdownAutocomplete from "../../shared/modules/dropdown/components/DropdownAutocomplete.vue";
import Feature from "ol/Feature";
import {featureToGeoJson, featuresToGeoJsonCollection} from "../../utils/features/convertToGeoJson";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {geoJsonCollectionToFeatures} from "../../utils/features/convertFromGeoJson";
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
import InputText from "@shared/modules/inputs/components/InputText.vue";
import LabeledSlider from "../../shared/modules/slider/components/LabeledSlider.vue";
import layerCollection from "@core/layers/js/layerCollection";
import layerFactory from "@core/layers/js/layerFactory";
import ResultManagement from "../../shared/modules/resultManagement/components/ResultManagement.vue";
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";
import {unpackCluster} from "../../utils/features/unpackCluster.js";
import SimpleCard from "../../shared/modules/cards/components/SimpleCard.vue";
import {singleClick} from "ol/events/condition";
import thousandsSeparator from "../../../../src/shared/js/utils/thousandsSeparator.js";
import travelTimeIndex from "../assets/inrix_traveltimeindex_2021.json";
import uniq from "../../utils/array/uniq";
import VectorLayer from "ol/layer/Vector.js";
import {VSnackbar} from "vuetify/components/VSnackbar";
import wktParser from "../../utils/wktParser";
import WPS from "@shared/js/api/wps.js";
import {Polygon} from "ol/geom";

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
        InputText,
        LabeledSlider,
        ResultManagement,
        SimpleCard,
        CustomCard,
        SwitchInput,
        TabBar,
        ToolInfo,
        VExpandTransition,
        VSnackbar,
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
                    type: "route",
                    text: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.referToPath"),
                    icon: "bi bi-map",
                    title: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.fromRoute"),
                    description: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.descRoute"),
                    info: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.noRouteCalculated")
                }
            ],
            facilityNames: [],
            mergePolygons: true,
            transportTypes: [
                {
                    type: "foot-walking",
                    name: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.transportTypes.foot-walking"),
                    icon: "bi bi-person-walking"
                },
                {
                    type: "wheelchair",
                    name: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.transportTypes.wheelchair"),
                    icon: "bi bi-person-wheelchair"
                },
                {
                    type: "cycling-regular",
                    name: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.transportTypes.cycling-regular"),
                    icon: "bi bi-bicycle"
                },
                {
                    type: "driving-car",
                    name: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.transportTypes.driving-car"),
                    icon: "bi bi-car-front"
                },
                {
                    // Valhalla multimodal (walk + HVV GTFS transit); only offered on the Valhalla backend.
                    type: "public-transport",
                    name: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.transportTypes.public-transport"),
                    icon: "bi bi-bus-front"
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
            selectionCards: [],
            useTravelTimeIndex: false,
            visibleVectorLayers: [],
            showErrorAlert: false,
            showSpinner: false,
            analysisName: "",
            generatedName: "",
            successSubjectData: false,
            snackbarText: ""
        };
    },
    computed: {
        ...mapGetters(["allLayerConfigs", "restServiceById", "visibleSubjectDataLayerConfigs"]),
        ...mapGetters("Menu", ["zoomToExtentPadding"]),
        ...mapGetters("Modules/Language", ["currentLocale"]),
        ...mapGetters("Maps", ["clickCoordinate", "getVisibleLayerList", "projectionCode"]),
        ...mapGetters("Modules/AccessibilityAnalysis", Object.keys(getters)),
        ...mapGetters("Modules/DistrictSelector", ["boundingGeometry", "selectedDistrictNames", "selectionCardsStatisticalData", "selectionCardsSubjectData"]),
        ...mapGetters("Modules/Routing/Directions", ["directionsRouteSource", "directionsRouteLayer", "routingDirections", "settings"]),
        // ...mapGetters("Modules/FeaturesList", ["activeVectorLayerList", "isFeatureActive", "layerMapById"]),

        /**
         * Transport types offered in the UI. Public transport (Valhalla multimodal)
         * is only available on the self-hosted Valhalla backend, so it is hidden
         * when the ORS backend is active.
         * @returns {Object[]} the selectable transport types.
         */
        displayedTransportTypes () {
            return this.transportTypes.filter(
                type => type.type !== "public-transport" || this.isochroneBackend === "valhalla"
            );
        },

        /**
         * Scale units offered for the current transport type. Public-transport
         * isochrones are time-dependent, so only the time unit is meaningful.
         * @returns {Object[]} the selectable scale units.
         */
        displayedScaleUnits () {
            return this.transportType === "public-transport"
                ? this.scaleUnits.filter(unit => unit.type === "time")
                : this.scaleUnits;
        },

        /**
         * Gets the datasets for card in shared component resultManagement.
         * @returns {Object[]} the datasets for card.
         */
        cardDatasets () {
            const cardData = [],
                activeSubCard = this.selectionCardsSubjectData.find(card => card.status === "active"),
                activeSubjectWKT = activeSubCard?.subjectFeatureWKT;

            this.dataSets.forEach(set => {
                const subjectWKT = set?.inputs?.subjectFeatureWKT,
                    isSubject = activeSubjectWKT !== undefined && subjectWKT === activeSubjectWKT;

                cardData.push({
                    data: this.getData(set),
                    downloadable: true,
                    icon: this.getIconByTransportType(set?.inputs?.transportType),
                    removable: true,
                    status: this.dataSets.indexOf(set) === this.activeSet ? "active" : "",
                    title: set?.inputs?.title,
                    visible: true,
                    subjectData: true,
                    isSubjectDataArea: isSubject,
                    subjectDataDisabled: this.selectedDistrictNames.length > 0,
                    badge: isSubject ? this.getSubjectDataBadge() : this.getMapPreviewBadge()
                });
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
         * Maps the routing profile.
         * @returns {String} The mapped routing profile.
         */
        routingTransportType () {
            const mappedRoutingProfiles = {
                "CAR": this.$t("additional:modules.tools.cosi.accessibilityAnalysis.transportTypes.driving-car"),
                "HGV": this.$t("additional:modules.tools.cosi.accessibilityAnalysis.transportTypes.driving-hgv"),
                "CYCLING": this.$t("additional:modules.tools.cosi.accessibilityAnalysis.transportTypes.cycling-regular"),
                "FOOT": this.$t("additional:modules.tools.cosi.accessibilityAnalysis.transportTypes.foot-walking"),
                "WHEELCHAIR": this.$t("additional:modules.tools.cosi.accessibilityAnalysis.transportTypes.wheelchair")
            };

            return mappedRoutingProfiles[this.settings.speedProfile];
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
         * Watches changes on the active mode.
         * Depending on the mode type, it adds or removes the select interaction and updates selection cards.
         */
        activeMode () {
            if (this.activeMode.type === "facility") {
                this.addInteraction(this.select);
            }
            else {
                this.removeInteraction(this.select);
                this.setUseOuterBoundaries(false);
            }

            if (this.activeMode.type === "route") {
                if (this.routingDirections === null) {
                    return;
                }
                this.addSelectionCardRoute(this.routingDirections, this.routingTransportType, this.activeMode.icon);
            }
        },

        /**
         * Watches changes on the active set index. If the new index is valid, it updates the component's state.
         * @param {Number} index - The new active set index.
         * @returns {void}
         */
        activeSet (index) {
            if (!this.dataSets[index]) {
                this.resetIsochroneBBox();

                const newTitle = this.generateCardTitle();

                this.generatedName = newTitle;
                this.analysisName = newTitle;
                return;
            }

            const inputs = this.dataSets[index].inputs;

            if (inputs.title) {
                this.analysisName = inputs.title;
                this.generatedName = inputs.title;
            }

            for (const key in this.dataSets[index].inputs) {
                const computedProperty = this.$options.computed[key];

                if (typeof computedProperty === "function") {
                    const capName = key.charAt(0).toUpperCase() + key.slice(1);

                    if (Object.prototype.hasOwnProperty.call(this.dataSets[index].inputs, key) && typeof this.dataSets[index].inputs[key] !== "undefined") {
                        this["set" + capName](this.dataSets[index].inputs[key]);
                    }
                }
                else {
                    this[key] = this.dataSets[index].inputs[key];
                }
            }

            if (this.dataSets[index].inputs.mode === "point" || this.dataSets[index].inputs.mode === "facility") {
                const layerIds = uniq(this.dataSets[index].inputs.selectionCards.map(card => card.layerId));

                layerIds.forEach(layerId => {
                    this.replaceByIdInLayerConfig({
                        layerConfigs: [{
                            id: layerId,
                            layer: {
                                visibility: true
                            }
                        }]
                    });
                });

                if (this.dataSets[index].inputs.useOuterBoundaries) {
                    this.setMarkerByCoordinates(this.selectionCards.map(card => card.coord25832).flat());
                }
                else {
                    this.setMarkerByCoordinates(this.selectionCards.map(card => card.coord25832));
                }
            }

            this.setIsochroneFeatures(geoJsonCollectionToFeatures(this.dataSets[index].resultsGeoJSON));
            this.renderIsochrones(this.isochroneFeatures);
            this.setDirectionFeatures(geoJsonCollectionToFeatures(this.dataSets[index].directionResultsGeoJSON));
            this.renderDirections(this.directionFeatures);
        },

        /**
         * Watches click coordinates on the map and adds a selection card if the active mode is "point".
         * @param {Number[]} newClickCoordinate - The click coordinate on the map.
         * @returns {void}
         */
        clickCoordinate (newClickCoordinate) {
            if (this.activeMode.type === "point") {
                const coordinate4326 = transformCoordinate(newClickCoordinate, this.projectionCode),
                    cardText = newClickCoordinate.map(coord => coord.toFixed(6)).join(", ");

                this.addSelectionCard(this.clickCoordinate, coordinate4326, undefined, this.$t("additional:modules.tools.cosi.accessibilityAnalysis.points"), false, false, cardText);
            }
        },

        cardDatasets: {
            handler (newSets, oldSets) {
                if (typeof oldSets === "undefined") {
                    return;
                }

                if (!newSets.length || !newSets.some(set => set.isSubjectDataArea) && oldSets.some(set => set.isSubjectDataArea)) {
                    const activeCard = this.selectionCardsStatisticalData.find(card => card.status === "active"),
                        existedCard = this.selectionCardsSubjectData.find(existingCard => {
                            return JSON.stringify(existingCard.extent) === JSON.stringify(activeCard.extent);
                        });

                    existedCard.subjectFeatureWKT = activeCard.bboxGeomWKT;
                }
            },
            deep: true,
            immediate: true
        },

        /**
         * Forces the slider to rerender on scale unit change.
         * @returns {void}
         */
        scaleUnit () {
            this.sliderRerenderKey++;
        },

        visibleVectorLayers (newLayers, oldLayers) {
            if (oldLayers.length > newLayers.length) {
                this.removeCardsForRemovedLayers(newLayers, oldLayers);
            }

            this.setFacilityNames(newLayers);
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
        this.setDefaults();
        this.visibleVectorLayers = this.getVisibleVectorLayers();

        if (this.routingDirections) {
            const directionsLayer = this.getLayerById("accessibility-directions");

            directionsLayer.getLayer().setStyle(this.directionsRouteLayer.getStyleFunction());
            directionsLayer.getLayer().setSource(this.directionsRouteSource);
            this.setActiveMode(this.getModeByType("route"));
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
        const isochroneService = this.restServiceById(this.serviceId || this.fallbackServiceId);

        // ORS isochrones live under <url>/v2/isochrones; self-hosted Valhalla under <url>/isochrone
        // (the path suffix is appended in requestIsochrones / requestIsochronesValhalla).
        this.baseUrl = this.isochroneBackend === "valhalla" ? isochroneService.url : isochroneService.url + "/v2/";
        this.getLayerById("accessibility-analysis").getLayer().setVisible(true);
        this.getLayerById("accessibility-analysis").getLayer().setZIndex(10);

        this.generatedName = this.generateCardTitle();
        this.analysisName = this.generatedName;

        document.addEventListener("shown.bs.dropdown", this.onDropdownShown);

    },
    beforeUnmount () {
        document.removeEventListener("shown.bs.dropdown", this.onDropdownShown);
    },
    unmounted () {
        this.removeInteraction(this.select);
        this.removeAll();
        this.setDefaults();
        this.resetIsochroneBBox();
    },
    methods: {
        ...mapActions(["replaceByIdInLayerConfig"]),
        ...mapActions("Maps", ["addInteraction", "removeInteraction", "zoomToExtent", "clickCoordinate"]),
        ...mapMutations("Modules/AccessibilityAnalysis", Object.keys(mutations)),
        ...mapActions("Modules/AccessibilityAnalysis", ["getIsochrones"]),
        ...mapMutations("Modules/DistrictSelector", ["setBoundingGeometry"]),
        ...mapActions("Maps", ["placingPointMarker", "removePointMarker", "removePointMarkerFeature"]),
        ...mapActions("Alerting", ["addSingleAlert", "cleanup"]),
        ...mapActions("Modules/Routing/Directions", ["reset"]),
        ...mapMutations("Modules/Routing/Directions", ["setRoutingDirections"]),
        ...methods,

        /**
         * Adds a selection card for points or subjects.
         * @param {Number[]} clickCoordinate - The coordinate of the click event in the current map projection.
         * @param {Number[]} coordinate4326 - The coordinate of the click event in WGS84 (EPSG:4326) projection.
         * @param {String|undefined} featureName - The name of the selected feature.
         * @param {String} layerName - The name of the layer containing the selected feature.
         * @param {Object|undefined} feature - The feature object that was selected.
         * @param {String|undefined} layerId - The unique identifier of the layer containing the selected feature.
         * @param {String} cardText - The text content to be displayed on the selection card.
         * @returns {void}
         */
        addSelectionCard: function (clickCoordinate, coordinate4326, featureName, layerName, feature, layerId, cardText) {
            if (this.hasActiveSet) {
                this.setActiveSet(null);
                this.setDefaults();
                this.removeAll();
            }
            this.setMarkerByCoordinates(this.useOuterBoundaries ? clickCoordinate : [clickCoordinate]);

            const newCard = {
                    coord25832: clickCoordinate,
                    coord4326: coordinate4326,
                    icon: this.activeMode.icon,
                    id: clickCoordinate.toString(),
                    label: layerName || this.activeMode.text,
                    text: cardText,
                    layerName: layerName,
                    layerId,
                    featureName,
                    feature
                },
                cardExists = this.selectionCards.some(card => card.id === newCard.id);

            if (!cardExists) {
                this.selectionCards.push(newCard);
            }
        },

        /**
         * Adds a selection card for a calculated route.
         * @param {Object} routingDirections - The routing directions object.
         * @param {Sting} transportType - The transport type.
         * @param {String} icon - The icon for the selection card.
         * @returns {void}
         */
        addSelectionCardRoute (routingDirections, transportType, icon) {
            const duration = Math.floor(routingDirections.duration / 60),
                card = {
                    coord25832: [],
                    coord4326: [],
                    icon,
                    id: routingDirections.bbox.toString(),
                    label: "Berechnete Route",
                    text: `Entfernung: ${this.routingDirections.distance} m | Zeit: ${duration} min | Verkehrsmittel: ${transportType}`,
                    layerName: "Route"
                };

            this.setScaleUnit("distance");
            this.setTransportType("foot-walking");
            this.selectionCards = [card];
        },

        /**
         * Generates the next random card title.
         * @returns {String} The generated card title.
         */
        generateCardTitle () {
            const titlePart = "Erreichbarkeit ID:",
                allowedCharacters = "ABCDEFGHJKLMNPQRSTUVWXYZ2346789",
                idLength = 6;
            let id = "";

            for (let i = 0; i < idLength; i++) {
                const randomIndex = Math.floor(Math.random() * allowedCharacters.length),
                    randomChar = allowedCharacters[randomIndex];

                id += randomChar;
            }

            return titlePart + " " + id;
        },

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
                    this.setCoordinateFromFeature(unfeat, cardName, layer.getLayer().get("name"), layer.get("id"));
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
            if (this.hasActiveSet) {
                this.setActiveSet(null);
                this.removeDataOnMap();
            }
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
                this.setCoordinateFromFeature(unpackedFeature, cardName, foundLayer.get("name"), foundLayer.get("id"));

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
         * Removes selection cards for layers that are no longer visible.
         * @param {Object[]} newLayers - The currently visible layers.
         * @param {Object[]} oldLayers - The previously visible layers.
         * @returns {void}
         */
        removeCardsForRemovedLayers (newLayers, oldLayers) {
            const removedLayers = differenceJs(oldLayers, newLayers);

            removedLayers.forEach(layer => {
                this.removeCardsByLayerName(layer.getLayer().get("name"));
            });
        },

        /**
         * Resets all options to default values.
         * @returns {void}
         */
        setDefaults () {
            this.useTravelTimeIndex = false;
            this.mergePolygons = true;
            this.setTransportType("driving-car");
            this.setScaleUnit("time");
            this.setTime(this.rangeSettings[this.transportType]?.time?.value ?? this.rangeSettings.default.time.value);
            this.setDistance(this.rangeSettings[this.transportType]?.distance?.value ?? this.rangeSettings.default.distance.value);
        },

        /**
         * Sets and transforms the coordinate(s) of a feature to EPSG 4326.
         * @param {ol/Feature} feature - The feature.
         * @param {String} mapProjectionCode - The code of the current map projection.
         * @returns {void}
         */
        setCoordinateFromFeature: function (feature, featureName, layerName, layerId) {
            let simplifiedGeom;

            if (feature.getGeometry().getType() === "Polygon" && !this.useOuterBoundaries) {
                simplifiedGeom = simplify(feature.getGeometry().getInteriorPoint());
            }
            else {
                simplifiedGeom = simplify(feature.getGeometry());
            }

            if (this.useOuterBoundaries) {
                const flatCoordinates = getFlatCoordinates(simplifiedGeom),
                    coordinates4326 = transformCoordinates(flatCoordinates, this.projectionCode),
                    cardText = "Flächenaußengrenzen für " + (featureName || flatCoordinates.slice(0, 2) + "...");

                this.addSelectionCard(getFlatCoordinates(simplifiedGeom), coordinates4326, featureName, layerName, feature, layerId, cardText);
            }
            else {
                getFlatCoordinates(simplifiedGeom).forEach((coordinate) => {
                    const coordinate4326 = transformCoordinate(coordinate, this.projectionCode),
                        cardText = featureName;

                    this.addSelectionCard(coordinate, coordinate4326, featureName, layerName, feature, layerId, cardText);
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
        * Sets facilityNames array if the corresponding layer has features.
        * @param {Object[]} layerList - The list of layers to check for features.
        * @returns {void}
        */
        setFacilityNames: function (layerList) {
            this.facilityNames = [];

            layerList.forEach(layer => {
                if (getLayerSource(layer.getLayer()).getFeatures().length > 0) {
                    this.facilityNames.push(layer.getLayer().get("name"));
                }
                else {
                    getLayerSource(layer.getLayer()).on("featuresloadend", () => {
                        if (layer.getLayer().getSource().getFeatures().length > 0 && !this.facilityNames.includes(layer.getLayer().get("name"))) {
                            this.facilityNames.push(layer.getLayer().get("name"));
                        }
                    });
                }
            });
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
                this.setDirectionFeatures(this.activeMode.type === "route"
                    ? this.directionsRouteSource.getFeatures().map(feature => feature.clone())
                    : []
                );

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
                analysisSet.resultsGeoJSON = featuresToGeoJsonCollection(this.isochroneFeatures);
                analysisSet.directionResults = this.directionFeatures;
                analysisSet.directionResultsGeoJSON = featuresToGeoJsonCollection(this.directionFeatures);
                analysisSet.inputs = {
                // These lines have been changed back and forth so arguing my case for checking first if the value is undefined
                // JSON.parse throws error on undefined
                // So if the original variable is undefined, we don't copy undefined, but instead cause an error
                    mode: this.activeMode.type ? JSON.parse(JSON.stringify(this.activeMode.type)) : undefined,
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
                    useOuterBoundaries: this.useOuterBoundaries,
                    mergePolygons: this.mergePolygons,
                    steps: this.steps ? JSON.parse(JSON.stringify(this.steps)) : [],
                    selectionCards: this.selectionCards,
                    title: this.analysisName,
                    id: this.generateAnalysisId(this.analysisName),
                    areaInSqKm: new Polygon(this.getOuterPolygon().coordinates).getArea() / (1000 * 1000)
                };
                this.dataSets.unshift(analysisSet);
                this.setActiveSet(0);
                this.renderIsochrones(this.isochroneFeatures);
                this.renderDirections(this.directionFeatures);
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
                const outerPolygon = this.getOuterPolygon();

                WPS.wpsRequest(service.id, service.url, this.wpsProcess, {
                    "such_flaeche": JSON.stringify(outerPolygon)
                }, this.handlePopulationResponsee.bind(this));
            }
        },
        /**
         * Gets the outer polygon.
         * @returns {GeoJSON|String|Boolean} The converted geometry as GeoJSON geometry or as string. False if the converting fails.
         */
        getOuterPolygon () {
            if (!this.isochroneFeatures.length) {
                return false;
            }
            if (this.isochroneFeatures.length === this.steps.length) {
                return geometryToGeoJson(this.isochroneFeatures[0].getGeometry(), false, "EPSG:25832", "EPSG:25832");
            }

            if (this.isochroneFeatures.length > this.steps.length) {
                let featureUnion = featureToGeoJson(this.isochroneFeatures[0], false, "EPSG:25832", "EPSG:25832"),
                    formattedFeature = [];

                for (let i = 0; i < this.isochroneFeatures.length; i = i + this.steps.length) {
                    featureUnion = union(turfFeatureCollection([featureUnion, featureToGeoJson(this.isochroneFeatures[i])]));
                }
                formattedFeature = geoJsonCollectionToFeatures(featureUnion);

                return geometryToGeoJson(formattedFeature[0].getGeometry());
            }

            return false;
        },

        /**
         * Maps server error messages from the population service to user-friendly alert texts.
         * @param {String} message - Message returned by the service.
         * @returns {Object|null} Alert object or `null` if the message is invalid.
         */
        getPopulationAlertFromServerMessage (message) {
            if (!message || typeof message !== "string") {
                return null;
            }

            const lower = message.toLowerCase();

            if (lower.includes("metropolregion hamburg")) {
                return {
                    type: "warning",
                    text: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.areaOutsideMRH")
                };
            }

            return {
                type: "warning",
                text: message
            };
        },

        /**
         * Processes the population WPS response and updates the population value
         * and alert state of the active dataset.
         * @param {Object} resp - Raw WPS ExecuteResponse returned by the service.
         * @returns {void}
         */
        handlePopulationResponsee (resp) {
            const node = resp?.ExecuteResponse?.ProcessOutputs?.Output?.Data?.ComplexData?.einwohner,
                raw = typeof node?.ergebnis === "string" ? node.ergebnis.trim() : "",
                hasError = String(node?.ErrorOccured).toLowerCase() === "yes",
                set = this.dataSets[this.activeSet];

            set.populationAlert = null;
            set.inputs.einwohner = this.$t("additional:modules.tools.cosi.accessibilityAnalysis.populationNotAvailable");

            if (!raw) {
                return;
            }

            if (hasError || !(raw.startsWith("{") || raw.startsWith("["))) {
                set.populationAlert = this.getPopulationAlertFromServerMessage(raw);
                return;
            }

            try {
                const parsed = JSON.parse(raw),
                    value = Number(parsed?.einwohner_fhh);

                if (Number.isFinite(value)) {
                    set.inputs.einwohner = thousandsSeparator(value);
                }
            }
            catch (e) {
                set.populationAlert = {
                    type: "warning",
                    text: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.populationProcessingFailed")
                };
            }
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
            this.removeDataOnMap();
            this.removePointMarker();
            this.showErrorAlert = false;
            this.selectionCards = [];
        },

        removeDataOnMap () {
            this.setCoordinate([]);
            this.setSteps([0, 0, 0]);
            this.setIsochroneFeatures([]);
            this.getLayerById("accessibility-analysis").getLayer().getSource().clear();
            this.setDirectionFeatures([]);
            this.getLayerById("accessibility-directions").getLayer().getSource().clear();
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
            const index = evt.target.closest(".card-total").getAttribute("data-index");

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
            const index = evt.target.closest(".card-total").getAttribute("data-index"),
                link = document.createElement("a");

            link.href = this.dataSets[index].inputs.screenshot;
            link.download = "Erreichbarkeitsanalyse.png";

            link.click();
        },

        /**
         * Updates the active mode and deselects active card if any.
         * @param {Object} obj - The mode object.
         * @returns {void}
         */
        setActiveMode (obj) {
            this.activeMode = obj;
            this.selectionCards = [];

            const newTitle = this.generateCardTitle();

            this.generatedName = newTitle;
            this.analysisName = newTitle;
            this.removePointMarker();
            if (this.hasActiveSet) {
                this.setActiveSet(null);
                this.removeAll();
            }
        },

        /**
         * Updates the calculation method (distance|time) and deselects active card if any.
         * @param {String} value - The scale unit.
         * @returns {void}
         */
        updateCalculationMethod (value) {
            if (this.hasActiveSet) {
                this.setActiveSet(null);
                this.removeDataOnMap();
            }
            this.setScaleUnit(value);
        },

        /**
         * Updates the distance or time based on the selected scale unit.
         * @param {String} value - The new distance or time value.
         * @returns {void}
         */
        updateDistanceOrTime (value) {
            if (this.hasActiveSet) {
                this.setActiveSet(null);
                this.removeDataOnMap();
            }
            if (this.scaleUnit === "time") {
                this.setTime(parseInt(value, 10));
            }
            else {
                this.setDistance(parseInt(value, 10));
            }
            this.showErrorAlert = false;
        },

        /**
         * Toggles the use of outer boundaries for the analysis.
         * @param {boolean} value - True if outer boundaries should be set, false otherwise.
         * @returns {void}
         */
        updateOuterBoundaries (value) {
            if (this.hasActiveSet) {
                this.setActiveSet(null);
                this.removeDataOnMap();
            }
            this.setUseOuterBoundaries(value);
            if (this.selectionCards.length) {
                this.resetSelectionCards();
            }
        },

        /**
         * Sets the transport type and deselects active card if any.
         * @param {String} type - The transport type.
         * @returns {void}
         */
        updateTransportType (val) {
            if (this.hasActiveSet) {
                this.setActiveSet(null);
                this.removeDataOnMap();
            }
            this.setTransportType(val);
            // public-transport (multimodal) isochrones are time-based only
            if (val === "public-transport" && this.scaleUnit !== "time") {
                this.setScaleUnit("time");
            }
            this.showErrorAlert = false;
        },

        /**
         * Sets the travel time and deselects active card if any.
         * @param {String} value - The travel time value.
         * @returns {void}
         */
        updateTravelTime (value) {
            if (this.hasActiveSet) {
                this.setActiveSet(null);
                this.removeDataOnMap();
            }
            this.showErrorAlert = false;
            this.setTravelTime(value);
        },

        /**
         * Sets the value of `useTravelTimeIndex` and deselects active card if any.
         * @param {Boolean} value - True if travel time index should be used
         * @returns {void}
         */
        updateUseTravelTimeIndex (value) {
            if (this.hasActiveSet) {
                this.setActiveSet(null);
                this.removeDataOnMap();
            }
            this.showErrorAlert = false;
            this.useTravelTimeIndex = value;
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
            if (this.activeMode.type === "route") {
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
         * Updates the active data set.
         * @param {index} Number - The index of data set.
         * @returns {void}
         */
        updateActiveSet (index) {
            if (index !== this.activeSet) {
                this.setActiveMode(this.getModeByType(this.dataSets[index].inputs.mode));
                this.setActiveSet(index);
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
                population = data.inputs.einwohner,
                areaInSqKm = data?.inputs?.areaInSqKm || "-",
                locale = this.currentLocale || "de-DE";

            result.push({label: name, value: title});
            if (data.inputs.selectionCards.length > 1 && data.inputs.useOuterBoundaries) {
                result.push({icon: icon, label: pointDes, value: "Flächenaußengrenzen"});
            }
            else {
                result.push({icon: icon, label: pointDes, value: coordinate});

            }
            result.push({
                icon: "bi bi-bounding-box",
                label: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.area") + ": " + areaInSqKm.toLocaleString(locale) + "\u00A0km²"
            });
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
                this.setCoordinateFromFeature(card.feature, card.featureName, card.layerName, card.layerId);
            });
        },

        /**
         * Updates the selected facility names.
         * @param {String[]} newValue - the new falility names in array lists.
         * @returns {void}
         */
        updateSelectedFacilityNames (newValue) {
            if (this.activeMode.type !== "facility") {
                return;
            }
            const oldValue = this.selectedFacilityNames,
                difference = differenceJs(newValue, oldValue),
                diff = differenceJs(oldValue, newValue);

            if (diff.length) {
                diff.forEach(layer => {
                    this.removeCardsByLayerName(layer);
                });
            }
            if (difference.length) {
                this.visibleVectorLayers.forEach(layer => {
                    if (difference.includes(layer.getLayer().get("name"))) {
                        this.addCardsByLayer(layer);
                    }
                });
            }
            this.setSelectedFacilityNames(newValue);
        },
        /**
         * Generates an ID to identify the analyses with name and timestamp.
         * @param {String} name - the currently given name.
          * @returns {String} the generated id.
         */
        generateAnalysisId (name) {
            const idName = name.trim().toLowerCase().replace(/[^a-z0-9]/g, ""),
                timestamp = dayjs().format("YYYYMMDDHHmmss");

            return idName + timestamp;
        },
        /**
         * Updated the analysis name with a generated or user-assigned name.
         * @returns {void}
         */
        updatesAnalysisName () {
            if (!this.analysisName.trim()) {
                const newTitle = this.generateCardTitle();

                this.generatedName = newTitle;
                this.analysisName = newTitle;
            }
            if (this.hasActiveSet) {
                this.setActiveSet(null);
                this.removeDataOnMap();
            }
        },

        /**
         * Sets the badge in the card.
         * @param {index} Number - The index of data set.
         * @returns {void}
         */
        async confirmSubjectDataArea (index) {
            if (index !== this.activeSet) {
                this.$nextTick(() => {
                    this.setActiveSet(index);
                });

                await this.$nextTick();
                await this.$nextTick();
            }

            this.dataSets.forEach(set => {
                if (set.inputs.subjectFeatureWKT === this.selectionCardsSubjectData.find(card => card.status === "active").subjectFeatureWKT) {
                    set.inputs.isSubjectDataArea = false;
                }
            });

            if (this.dataSets[index]) {
                this.dataSets[index].inputs.isSubjectDataArea = true;
            }

            this.addCardToDistrictSelectorSubject(index);
            this.showSnackbar(index, "confirm");
        },

        /**
         * Adds the current card to district selector subject.
         * @returns {void}
         */
        addCardToDistrictSelectorSubject (index) {
            const activeCard = this.selectionCardsStatisticalData.find(card => card.status === "active"),
                existedCard = this.selectionCardsSubjectData.find(existingCard => {
                    return JSON.stringify(existingCard.extent) === JSON.stringify(activeCard.extent);
                }),
                feature = wktParser.encodeFeature(new Feature({geometry: this.isochroneFeatures[0].getGeometry()}));

            this.clearSubjectAreaFromLayer();
            activeCard.subjectFeatureWKT = feature;
            existedCard.subjectFeatureWKT = feature;
            this.dataSets[index].inputs.subjectFeatureWKT = feature;
        },

        /**
         * Clears the subject area from the subject-area layer.
         * @returns {void}
         */
        clearSubjectAreaFromLayer () {
            const layer = this.getLayerById("subject-area");

            layer.getLayerSource().clear();
            layer.getLayer().setVisible(false);
        },

        /**
        * Resets the "subject data area" status
         * @param {number} index - The index of data set.
         */
        resetSubjectDataArea (index) {
            if (!this.dataSets[index]) {
                return;
            }

            this.dataSets[index].inputs.isSubjectDataArea = false;

            this.showSnackbar(index, "reset");

            const activeCard = this.selectionCardsStatisticalData.find(card => card.status === "active"),
                existedCard = this.selectionCardsSubjectData.find(existingCard => {
                    return JSON.stringify(existingCard.extent) === JSON.stringify(activeCard.extent);
                });

            this.clearSubjectAreaFromLayer();
            activeCard.subjectFeatureWKT = activeCard.bboxGeomWKT;
            existedCard.subjectFeatureWKT = activeCard.bboxGeomWKT;
        },

        /**
         * Closes the dropdown menu.
         * @param {Event} event - The click event.
         * @returns {void}
         */
        closeDropdown (event) {
            const dropdownEl = event.target.closest(".dropdown");

            if (dropdownEl) {
                let bsDropdown = Dropdown.getInstance(dropdownEl);

                if (!bsDropdown) {
                    bsDropdown = new Dropdown(dropdownEl);
                }
                bsDropdown.hide();
            }
        },

        /**
         * Returns an array that shows that the subject area is set
         * @returns {Object[]} An array of badge objects.
         */
        getSubjectDataBadge () {
            return [
                {
                    backgroundColor: "#EB8A3E",
                    color: "rgba(255, 255, 255, 1)",
                    icon: "bi bi-layers",
                    text: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.currentSubjectDataArea")
                }
            ];
        },

        /**
         * Returns an array that shows that the analysis is only a preview.
         * @returns {Object[]} An array of badge objects.
         */
        getMapPreviewBadge () {
            return [
                {
                    backgroundColor: "#D9D9D9",
                    color: "rgba(66, 66, 66, 1)",
                    icon: "bi bi-layers",
                    text: this.$t("additional:modules.tools.cosi.accessibilityAnalysis.mapPreview")
                }
            ];
        },

        /**
         * Closes all other open dropdowns when one is shown.
         * @param {Event} event - The "shown.bs.dropdown" event.
         * @returns {void}
        */
        onDropdownShown (event) {
            const current = event.target;

            document.querySelectorAll("[data-bs-toggle=\"dropdown\"].show").forEach(el => {
                if (el === current) {
                    return;
                }

                const instance = Dropdown.getOrCreateInstance(el);

                instance.hide();
            });
        },

        /**
         * Displays a snackbar notification for a specific dataset card.
         * @param {number} index - The index of the dataset.
         * @param {string} type - The type of action triggering the snackbar ("confirm" or "reset").
         * @returns {void}
        */
        showSnackbar (index, type) {
            const card = this.dataSets[index];

            if (!card) {
                return;
            }

            if (type === "confirm") {
                this.snackbarText = this.$t("additional:modules.tools.cosi.accessibilityAnalysis.subjectDataSuccess", {title: card.inputs.title});
            }
            else if (type === "reset") {
                this.snackbarText = this.$t("additional:modules.tools.cosi.accessibilityAnalysis.subjectDataReset", {title: card.inputs.title});
            }
            this.successSubjectData = true;
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
        <h5 class="mode-title my-4">
            {{ $t(`additional:modules.tools.cosi.accessibilityAnalysis.${activeMode.type}Mode`) }}
        </h5>
        <InputText
            id="analysis-name"
            v-model="analysisName"
            class="mt-2"
            :label="'Name der Erreichbarkeitsanalyse'"
            :placeholder="'Name der Erreichbarkeitsanalyse'"
            @blur="updatesAnalysisName"
            @focus="updatesAnalysisName"
        />
        <small class="title-hint ms-3">
            <i class="bi bi-info-circle" />
            {{ $t("additional:modules.tools.cosi.accessibilityAnalysis.titleHint") }}
        </small>
        <div class="mb-4 mt-3 scroll-container">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">
                    Ausgewählte {{ activeMode.text }}
                </h5>
            </div>
            <Dropdown-Autocomplete
                v-if="activeMode.type === 'facility'"
                class="mb-3"
                :items="facilityNames ? facilityNames : []"
                :model-value="selectedFacilityNames ? selectedFacilityNames : []"
                :select-all="true"
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
            v-if="activeMode.type === 'facility'"
            :id="'featureOutline'"
            :aria="$t('additional:modules.tools.cosi.accessibilityAnalysis.setByFeatureOutline')"
            :checked="useOuterBoundaries"
            :interaction="() => updateOuterBoundaries(!useOuterBoundaries)"
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
            v-if="activeMode.type !== 'path'"
        >
            <h5 class="mb-3">
                Verkehrsmittel
            </h5>
            <div
                class="d-flex flex-row mb-4"
            >
                <IconButton
                    v-for="type in displayedTransportTypes"
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
            v-if="activeMode.type !== 'path'"
            class="mb-3"
            :buttons="displayedScaleUnits.map(card => ({name: card.name, value: card.type}))"
            :pre-checked-value="scaleUnit"
            group="scaleUnits"
            @show-view="updateCalculationMethod"
        />
        <LabeledSlider
            :key="sliderRerenderKey"
            class="mb-3"
            :min="rangeSettings[transportType]?.[scaleUnit]?.min ?? rangeSettings.default[scaleUnit].min"
            :max="rangeSettings[transportType]?.[scaleUnit]?.max ?? rangeSettings.default[scaleUnit].max"
            :unit="getScaleUnitByType(scaleUnit).unit"
            :model-value="scaleUnit === 'time' ? time : distance"
            @update:model-value="updateDistanceOrTime"
        />
        <div
            v-if="transportType === 'driving-car' && scaleUnit === 'time' && activeMode.type === 'point'"
            class="mb-3"
        >
            <SwitchInput
                :id="'autoTrafficFlow'"
                :aria="$t('additional:modules.tools.cosi.accessibilityAnalysis.considerTrafficFlow')"
                :checked="useTravelTimeIndex"
                :interaction="() => updateUseTravelTimeIndex(!useTravelTimeIndex)"
                :label="$t('additional:modules.tools.cosi.accessibilityAnalysis.considerTrafficFlow')"
            />
            <AccessibilityAnalysisTrafficFlow
                v-if="useTravelTimeIndex"
                :travel-time="travelTime"
                @update:travel-time="updateTravelTime"
            />
        </div>
        <FlatButton
            class="mx-auto"
            icon="bi bi-play-circle"
            :disabled="selectionCards.length === 0 || hasActiveSet"
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
                @subject-data-set="() => []"
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
                <template #subjectData="{index}">
                    <div
                        class="dropdown-menu p-4"
                        @click.stop
                    >
                        <div v-if="!cardDatasets[index].isSubjectDataArea">
                            <h5 class="dropdown-heading">
                                {{ $t('additional:modules.tools.cosi.accessibilityAnalysis.overwriteSubjectData') }}
                            </h5>
                            <p class="my-3">
                                {{ $t('additional:modules.tools.cosi.accessibilityAnalysis.newSubjectDataNote') }}
                            </p>
                            <p class="my-3">
                                {{ $t('additional:modules.tools.cosi.accessibilityAnalysis.newSubjectDataSelection') }}
                            </p>
                            <div class="d-flex flex-column gap-2 ms-3">
                                <div class="form-check">
                                    <input
                                        id="overwrite-subject"
                                        class="form-check-input"
                                        type="radio"
                                        name="subjectData"
                                        checked
                                    >
                                    <label
                                        class="form-check-label"
                                        for="overwrite-subject"
                                    >
                                        {{ $t('additional:modules.tools.cosi.accessibilityAnalysis.newSubjectDataInputOverwrite') }}
                                    </label>
                                </div>

                                <div class="form-check">
                                    <input
                                        id="merge-subject"
                                        class="form-check-input"
                                        type="radio"
                                        name="subjectData"
                                        disabled
                                    >
                                    <label
                                        class="form-check-label"
                                        for="merge-subject"
                                    >
                                        {{ $t('additional:modules.tools.cosi.accessibilityAnalysis.newSubjectDataInputMerge') }}
                                    </label>
                                </div>
                            </div>

                            <p class="my-3">
                                {{ $t('additional:modules.tools.cosi.accessibilityAnalysis.newSubjectDataMap') }}
                            </p>
                            <div class="d-flex flex-column gap-2 ms-3 mt-3">
                                <div class="form-check">
                                    <input
                                        id="overwrite-map"
                                        class="form-check-input"
                                        type="radio"
                                        name="subjectDataMap"
                                        disabled
                                    >
                                    <label
                                        class="form-check-label"
                                        for="overwrite-map"
                                    >
                                        {{ $t('additional:modules.tools.cosi.accessibilityAnalysis.newSubjectDataMapAnalysis') }}
                                    </label>
                                </div>

                                <div class="form-check">
                                    <input
                                        id="merge-map"
                                        class="form-check-input"
                                        type="radio"
                                        name="subjectDataMap"
                                        checked
                                    >
                                    <label
                                        class="form-check-label"
                                        for="merge-map"
                                    >
                                        {{ $t('additional:modules.tools.cosi.accessibilityAnalysis.newSubjectDataMapOutlines') }}
                                    </label>
                                </div>
                            </div>
                            <FlatButton
                                class="mx-auto mt-3"
                                icon="bi bi-check2"
                                :text="$t('additional:modules.tools.cosi.accessibilityAnalysis.confirmSubjectDataArea')"
                                @click="confirmSubjectDataArea(index)"
                            />
                            <FlatButton
                                class="mx-auto"
                                icon="bi bi-x"
                                :secondary="true"
                                :text="$t('additional:modules.tools.cosi.accessibilityAnalysis.cancelSubjectDataArea')"
                                @click="closeDropdown"
                            />
                        </div>
                        <div v-else>
                            <h5 class="dropdown-heading">
                                {{ $t('additional:modules.tools.cosi.accessibilityAnalysis.activeSubjectDataArea') }}
                            </h5>
                            <span class="mb-3">
                                {{ $t('additional:modules.tools.cosi.accessibilityAnalysis.activeSubjectDataAreaText') }}
                            </span>
                            <FlatButton
                                class="mx-auto mt-3"
                                icon="bi bi-check2"
                                :text="$t('additional:modules.tools.cosi.accessibilityAnalysis.discard')"
                                @click="() => resetSubjectDataArea(index)"
                            />
                            <FlatButton
                                class="mx-auto"
                                icon="bi bi-x"
                                :secondary="true"
                                :text="$t('additional:modules.tools.cosi.accessibilityAnalysis.cancel')"
                                @click="closeDropdown"
                            />
                        </div>
                        <v-snackbar
                            v-model="successSubjectData"
                            :timeout="6000"
                            color="primary"
                        >
                            <span>
                                {{ snackbarText }}
                            </span>
                        </v-snackbar>
                    </div>
                </template>
                <template #after-card="{index}">
                    <AlertMessage
                        v-if="index === activeSet && dataSets[index].inputs.useTravelTimeIndex"
                        :text="$t('additional:modules.tools.cosi.accessibilityAnalysis.travelTimeIndex.warning')"
                        type="info"
                    />
                    <AlertMessage
                        v-if="index === activeSet && dataSets[index].populationAlert"
                        :key="dataSets[index].populationAlertKey"
                        :text="dataSets[index].populationAlert.text"
                        :type="dataSets[index].populationAlert.type"
                        :closeable="true"
                        class="mt-2"
                        @close="dataSets[index].populationAlert = null"
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

        .mode-title {
            color: $secondary;
        }

        .title-hint {
            color: $dark_grey;
        }

        .description {
            font-size: 0.9rem;
        }

        .dropdown-heading {
            color: $secondary;
        }

        .dropdown-menu {
            min-width: 300px;
            max-width: 420px;
            width: max-content;
        }

        font-family: $font_family_default;
    }

</style>
