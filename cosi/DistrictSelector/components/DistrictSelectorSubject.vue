<script>
import Card from "../../shared/modules/cards/components/Card.vue";
import {default as turfUnion} from "@turf/union";
import DistrictSelectorSubjectImport from "./DistrictSelectorSubjectImport.vue";
import DrawTypes from "@shared/modules/draw/components/DrawTypes.vue";
import {downloadJsonToFile} from "../../utils/download";
import {fromCircle as polygonFromCircle} from "ol/geom/Polygon";
import Feature from "ol/Feature";
import {featuresToGeoJsonCollection} from "../../utils/features/convertToGeoJson";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {geometryToGeoJson} from "../../utils/geometry/convertToGeoJson";
import getBoundingGeometry from "../../utils/getBoundingGeometry.js";
import {getLayerById} from "../utils/getLayerById.js";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import layerCollection from "@core/layers/js/layerCollection";
import {mapActions, mapGetters, mapMutations} from "vuex";
import {MultiPolygon, Polygon} from "ol/geom";
import Overlay from "ol/Overlay.js";
import {polygon as turfPolygon} from "@turf/helpers";
import {setBBoxToGeom} from "../../utils/setBBoxToGeom.js";
import thousandsSeparator from "@shared/js/utils/thousandsSeparator.js";
import wktParser from "../../utils/wktParser";
import WPS from "@shared/js/api/wps.js";
import truncate from "@turf/truncate";

export default {
    name: "DistrictSelectorSubject",
    components: {
        Card,
        DistrictSelectorSubjectImport,
        DrawTypes,
        FlatButton,
        InputText
    },
    data () {
        return {
            buffer: 0,
            cardCounter: 0,
            drawStyle: {
                fillColor: [0, 0, 0],
                fillTransparency: 100,
                strokeColor: [254, 110, 1],
                strokeWidth: 4,
                polygonDash: [6, 6]
            },
            drawTypeLabels: [{type: "polygon", label: "Fläche"}, {type: "box", label: "Rechteck"}, {type: "circle", label: "Kreis"}],
            drawTypes: ["polygon", "box", "circle"],
            selectedDrawTypeMain: "",
            selectedDrawType: "",
            selectedInteraction: null
        };
    },
    computed: {
        ...mapGetters(["allLayerConfigs", "restServiceById"]),
        ...mapGetters("Modules/DistrictSelector", ["wpsProcess", "wpsServiceId", "keyOfAttrName"]),
        ...mapGetters("Modules/DistrictSelector", {
            cardsStatistical: "selectionCardsStatisticalData",
            cards: "selectionCardsSubjectData",
            selectedDistrictLayer: "layer"
        }),

        /**
         * Returns the currently active card from the cards array.
         * @returns {Object} The active card object.
         */
        activeCard () {
            return this.cards.find(card => card.status === "active");
        }
    },
    created () {
        this.drawingLayer = getLayerById("district-selector");
        this.drawingLayer.getLayer().setVisible(true);

        this.createCardsFromStatisticalCards(this.cardsStatistical, this.cards);

        if (this.activeCard) {
            this.buffer = this.activeCard.buffer;
        }
        this.cardsStatistical.forEach((card, index) => {
            if (card.status === "active") {
                this.toggleCardStatus(index);
            }
        });

        this.createCircleOverlay();
    },
    beforeUnmount () {
        this.selectedInteraction = "";
        mapCollection.getMap("2D").removeOverlay(this.circleOverlay);
    },
    methods: {
        ...mapActions("Maps", ["zoomToExtent"]),
        ...mapMutations("Modules/DistrictSelector", ["setSelectedDistrictLevelId", "setBoundingGeometry"]),

        /**
         * Adds a new card to the cards array with the provided parameters.
         * @param {String} wktFeature - The feature as WKT string to be added to the card.
         * @param {Number} buffer - The buffer for the subject area(s).
         * @param {String[]} districtNames - The names of the selected districts.
         * @param {String} status - The status of the card (e.g., "active").
         * @param {Number} districtLevelId - The ID of the district level.
         * @param {String} districtLevelLabel - The label of the district level.
         * @returns {void}
         */
        addCard (wktFeature, buffer, districtNames, status, districtLevelId, districtLevelLabel) {
            this.cards.push({
                badgeList: this.getBadges(),
                buffer,
                data: [
                    {value: "Bezugsebene: " + districtLevelLabel},
                    {icon: "bi-map", label: "Gebiete: " + districtNames},
                    {icon: "bi-people", label: "Einwohner: Berechnung läuft..."},
                    {icon: "bi-record-circle", label: "Puffer " + buffer + " m"}
                ],
                districtLevelId,
                districtNames,
                drawnFeatureWKT: null,
                downloadable: false,
                icon: "bi bi-bounding-box-circles",
                removable: false,
                statisticalFeatureWKT: wktFeature,
                status,
                subjectFeatureWKT: this.getBufferedFeature(wktFeature, buffer)
            });
        },


        /**
         * Creates card objects from the provided statistical card data.
         * @param {Object[]} cardsStatistical - An array of statistical card data used as input.
         * @param {Object[]} cards - An array to store the resulting card objects.
         */
        createCardsFromStatisticalCards (cardsStatistical, cards) {
            cardsStatistical.forEach(card => {
                const foundEqualObject = cards.find(existingCard => {
                    return existingCard.statisticalFeatureWKT === card.bboxGeomWKT;
                });

                if (foundEqualObject) {
                    return;
                }

                this.addCard(card.bboxGeomWKT, this.buffer, card.selectedDistricts, card.status, card.districtLevelId, card.districtLevelLabel);
            });
        },

        /**
         * Creates a circle overlay for displaying radius information during circle drawing.
         * @returns {void}
         */
        createCircleOverlay () {
            this.circleOverlayElement = document.createElement("div");
            this.circleOverlayElement.className = "ol-tooltip ol-tooltip-measure";
            this.circleOverlay = new Overlay({
                id: "circle-overlay",
                element: this.circleOverlayElement,
                offset: [15, 0],
                positioning: "center-left"
            });
        },

        /**
         * Downloads the feature of the subject area in geojson file.
         * @param {Object} card - The card object.
         * @returns {void}
         */
        exportFeature (card) {
            const feature = wktParser.decodeFeature(card?.subjectFeatureWKT);

            downloadJsonToFile(featuresToGeoJsonCollection([feature]), "Gebiet für Fachdaten.geojson");
        },

        /**
         * Returns an array of badge objects representing subject and statistical data.
         * @returns {Object[]} An array of badge objects.
         */
        getBadges () {
            return [
                {
                    backgroundColor: "#EB8A3E",
                    color: "rgba(255, 255, 255, 1)",
                    icon: "bi bi-layers",
                    text: this.$t("additional:modules.cosi.districtSelector.subjectData")
                },
                {
                    backgroundColor: "#008DCB",
                    color: "rgba(255, 255, 255, 1)",
                    icon: "bi bi-bar-chart",
                    text: this.$t("additional:modules.cosi.districtSelector.statisticalData")
                }
            ];
        },

        /**
         * Creates a buffered feature of the given features.
         * @param {String} wktFeature - The feature to be buffered as WKT.
         * @param {Number} buffer - The buffer distance to apply around each feature.
         * @returns {String} - The buffered feature as WKT.
         */
        getBufferedFeature (wktFeature, buffer) {
            const feature = wktParser.decodeFeature(wktFeature),
                geometryCollection = getBoundingGeometry([feature], buffer).getGeometries(),
                geojsonPolygons = geometryCollection.map(polygon => turfPolygon(polygon.getCoordinates()));

            this.setBoundingGeometry(geometryCollection);

            let merged = geojsonPolygons[0],
                mergedPolygon = null;

            for (let i = 1; i < geojsonPolygons.length; i++) {
                merged = turfUnion(truncate(merged, {precision: 3, mutate: true}), truncate(geojsonPolygons[i], {precision: 3, mutate: true}));
            }

            if (merged.geometry.type === "Polygon") {
                mergedPolygon = new Polygon(merged.geometry.coordinates);
            }
            else if (merged.geometry.type === "MultiPolygon") {
                mergedPolygon = new MultiPolygon(merged.geometry.coordinates);
            }

            return wktParser.encodeFeature(new Feature({
                geometry: mergedPolygon
            }));
        },

        /**
         * Handles the drawend event by updating the drawnFeature and subjectFeature of the activeCard.
         * If the drawn geometry is a circle, it converts it to a polygon before updating.
         * @param {Object} evt - The drawend event object containing the drawn feature.
         * @return {void}
         */
        onDrawEnd (evt) {
            if (evt.feature.getGeometry().getType() === "Circle") {
                const circleGeom = evt.feature.getGeometry(),
                    polygonGeom = polygonFromCircle(circleGeom, 128);

                evt.feature.setGeometry(polygonGeom);
                mapCollection.getMap("2D").removeOverlay(this.circleOverlay);
            }
            this.activeCard.drawnFeatureWKT = wktParser.encodeFeature(evt.feature);
            this.setSubjectFeature(this.activeCard.drawnFeatureWKT, this.activeCard.buffer);
        },

        /**
         * Removes the drawing feature from the drawing layer and resets the drawingFeature property.
         * If the selected draw type is "circle", it adds the circle overlay to the map and updates its position and radius display.
         * @param {Object} evt - The event object containing the feature to be removed.
         * @return {void}
         */
        removeDrawingFeature (evt) {
            if (this.selectedDrawType === "circle") {
                mapCollection.getMap("2D").addOverlay(this.circleOverlay);
                evt.feature.getGeometry().on("change", (e) => {
                    const radius = e.target.getRadius();

                    this.circleOverlayElement.innerHTML = "Radius: " + (Math.round(radius * 10) / 10) + " m";
                    this.circleOverlay.setPosition(e.target.getLastCoordinate());
                });
            }
            if (this.activeCard.drawnFeatureWKT === null) {
                return;
            }
            this.activeCard.drawnFeatureWKT = null;
            this.setSubjectFeature(this.activeCard.statisticalFeatureWKT, this.activeCard.buffer);
        },

        /**
         * Resets the state of the DistrictSelectorSubject component.
         * @return {void}
         */
        reset () {
            this.selectedInteraction = "";
            this.activeCard.drawnFeatureWKT = null;
            this.setBuffer(0);
        },

        /**
         * Sets the active card and updates the area feature and bounding box accordingly.
         * @param {Number} index - Index of the card to be set as active
         * @return {void}
         */
        setActiveCard (index) {
            this.cards[index].status = "active";
            this.buffer = this.cards[index].buffer;
            this.setSelectedDistrictLevelId(this.cards[index].districtLevelId);
            this.$nextTick(() => {
                this.updateSelectedFeatures(this.cards[index].districtNames);
            });
            this.updateMap(this.activeCard);
        },

        /**
         * Sets the buffer value.
         * @param {Number} value - The buffer value to set.
         * @return {void}
         */
        setBuffer (value) {
            this.buffer = value;
            this.activeCard.buffer = value;
            this.activeCard.data[3].label = "Puffer " + value + " m";
            if (this.activeCard?.drawnFeatureWKT !== null) {
                this.setSubjectFeature(this.activeCard.drawnFeatureWKT, this.activeCard.buffer);
            }
            else {
                this.setSubjectFeature(this.activeCard.statisticalFeatureWKT, this.activeCard.buffer);
            }
        },

        /**
         * Sets the subject feature to the active card with an optional buffer.
         * @param {String} wktString - The feature as wkt string to set as the subject feature.
         * @param {Number} buffer - The buffer value to apply to the feature.
         */
        setSubjectFeature (wktString, buffer) {
            this.activeCard.subjectFeatureWKT = this.getBufferedFeature(wktString, buffer);
            this.updateMap(this.activeCard);
        },

        /**
         * Sets the subject feature from imported features and zooms to its extent.
         * @param {ol/Feature[]} features - The imported features to set as the subject feature.
         */
        setSubjectFeatureFromImport (features) {
            const extent = wktParser.decodeFeature(this.activeCard.subjectFeatureWKT).getGeometry().getExtent();

            this.setSubjectFeature(features, this.activeCard.buffer);
            this.zoomToExtent({extent: extent});
        },

        /**
         * Toggles the status of a card at the specified index.
         * @param {Number} index - Index of the card to toggle
         * @return {void}
         */
        toggleCardStatus (index) {
            const activeIndex = this.cards.findIndex(card => card.status === "active");

            if (activeIndex === index) {
                this.updateMap(this.activeCard);
                return;
            }
            if (activeIndex !== -1) {
                this.cards[activeIndex].status = "";
            }
            this.setActiveCard(index);
        },

        /**
         * Updates the bounding box geometry for all layer configurations and sets it to the map layers.
         * @param {ol/geom/Geometry} geometry - The geometry to set as the bounding box.
         * @returns {void}
         */
        updateLayerBbox (geometry) {
            this.allLayerConfigs.forEach(layerConfig => {
                layerConfig.bboxGeometry = geometry;
            });
            setBBoxToGeom(this, geometry, layerCollection.getLayers());
        },

        /**
         * Updates the map based on the active card.
         * @param {Object} card - The active card object.
         * @returns {void}
         */
        updateMap (card) {
            const subjectFeature = wktParser.decodeFeature(card.subjectFeatureWKT);

            this.drawingLayer.getLayerSource().clear();
            this.drawingLayer.getLayerSource().addFeature(subjectFeature);
            this.setBoundingGeometry(subjectFeature.getGeometry());
            this.updateLayerBbox(subjectFeature.getGeometry());
            this.setPopulationSize(card);
        },

        /**
         * Find the district features by the given names
         * and add them to the feature collection of the select interaction.
         * @param {String[]} namesOfDistricts - Names of the districts to be selected.
         * @returns {void}
         */
        updateSelectedFeatures (namesOfDistricts) {
            const select = mapCollection.getMap("2D").getInteractions().getArray().find(interaction => {
                return interaction.get("id") === "district-selector-select";
            });

            select.getFeatures().clear();

            if (namesOfDistricts.length > 0) {
                const districtFeatures = this.selectedDistrictLayer.getSource().getFeatures(),
                    namesAssoc = {};

                namesOfDistricts.forEach(name => {
                    namesAssoc[name] = true;
                });

                districtFeatures.forEach(feature => {
                    if (Object.prototype.hasOwnProperty.call(namesAssoc, feature.get(this.keyOfAttrName))) {
                        select.getFeatures().push(feature);
                    }
                });
            }
        },

        setPopulationSize (card) {
            const subjectFeature = wktParser.decodeFeature(card.subjectFeatureWKT),
                service = this.restServiceById(this.wpsServiceId),
                geometry = subjectFeature.getGeometry();

            if (service === undefined) {
                console.warn("Rest Service with the ID 1001 is not configured in rest-services.json!");
            }
            else {
                const outerPolygon = geometryToGeoJson(geometry, false, "EPSG:25832", "EPSG:25832");

                WPS.wpsRequest(service.id, service.url, this.wpsProcess, {
                    "such_flaeche": JSON.stringify(outerPolygon)
                },
                (resp) => this.handlePopulationResponsee(resp, card)
                );
            }
        },

        handlePopulationResponsee (resp, card) {
            const parsedData = resp.ExecuteResponse.ProcessOutputs.Output.Data.ComplexData.einwohner,
                responseResult = JSON.parse(parsedData.ergebnis);

            card.data[2].label = `Einwohner: ${thousandsSeparator(responseResult.einwohner_fhh)}`;
        }
    }
};
</script>

<template lang="html">
    <div class="district-selector-subject">
        <h5 class="mb-2">
            {{ $t("additional:modules.cosi.districtSelector.bufferHeader") }}
        </h5>
        <InputText
            id="district-selector-buffer"
            :label="$t('additional:modules.cosi.districtSelector.bufferLabel')"
            :model-value="buffer"
            :placeholder="'0'"
            :type="'number'"
            @update:modelValue="setBuffer"
        />
        <h5 class="mb-2">
            {{ $t("additional:modules.cosi.districtSelector.drawHeader") }}
        </h5>
        <div class="d-flex w-25 mb-4">
            <DrawTypes
                :current-layout="drawStyle"
                :draw-types="drawTypes"
                :selected-draw-type="selectedDrawType"
                :selected-draw-type-main="selectedDrawTypeMain"
                :draw-type-labels="drawTypeLabels"
                :selected-interaction="selectedInteraction"
                :set-selected-draw-type="(value) => selectedDrawType = value"
                :set-selected-draw-type-main="(value) => selectedDrawTypeMain = value"
                :set-selected-interaction="(value) => selectedInteraction = value"
                :source="drawingLayer.getLayerSource()"
                @drawstart="removeDrawingFeature"
                @drawend="onDrawEnd"
            />
        </div>
        <DistrictSelectorSubjectImport
            @set-imported-feature="setSubjectFeatureFromImport"
        />
        <FlatButton
            :aria="$t('additional:modules.cosi.districtSelector.resetArea')"
            :class-array="['btn-secondary']"
            class="mx-auto"
            :text="$t('additional:modules.cosi.districtSelector.resetArea')"
            :interaction="reset"
        />
        <hr class="my-4 mx-0 text-black-50">
        <h5>
            {{ $t("additional:modules.cosi.districtSelector.selectedAreas") }}
        </h5>
        <div
            v-for="(item, index) in cards"
            :key="item"
        >
            <Card
                :badge-list="item.badgeList"
                :data="item.data"
                :downloadable="item.downloadable"
                :icon="item.icon"
                :removable="item.removable"
                :status="item.status"
                @click="toggleCardStatus(index)"
            >
                <template #download-menu>
                    <ul class="dropdown-menu">
                        <li class="ps-4">
                            <button
                                class="dropdown-item"
                                @click.stop="exportFeature(item)"
                            >
                                GeoJSON
                            </button>
                        </li>
                    </ul>
                </template>
            </Card>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .district-selector-subject {
        h5 {
           font-size: $font-size-big;
        }

        .file-upload {
            color: $dark_grey;
            font-size: 0.9rem;
            opacity: 0.6;
        }
    }
</style>

<style lang="scss">
    .ol-tooltip {
        position: relative;
        background: rgba(254, 110, 1, 0.8);
        border-radius: 4px;
        color: white;
        padding: 4px 8px;
        white-space: nowrap;
        font-size: 12px;
    }
</style>
