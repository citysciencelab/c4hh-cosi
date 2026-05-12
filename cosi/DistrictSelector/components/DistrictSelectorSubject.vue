<script>
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import Card from "../../shared/modules/cards/components/Card.vue";
import AlertMessage from "../../shared/modules/alerts/components/AlertMessage.vue";
import {union as turfUnion} from "@turf/union";
import DistrictSelectorSubjectImport from "./DistrictSelectorSubjectImport.vue";
import DrawTypes from "@shared/modules/draw/components/DrawTypes.vue";
import {downloadJsonToFile} from "../../utils/download";
import {fromCircle as polygonFromCircle} from "ol/geom/Polygon";
import Feature from "ol/Feature";
import {featuresToGeoJsonCollection} from "../../utils/features/convertToGeoJson";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {geometryToGeoJson} from "../../utils/geometry/convertToGeoJson";
import getBoundingGeometry from "../../utils/getBoundingGeometry.js";
import {getLayerById} from "../../utils/layer/getLayerById.js";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import layerCollection from "@core/layers/js/layerCollection";
import {mapActions, mapGetters, mapMutations} from "vuex";
import {MultiPolygon, Polygon} from "ol/geom";
import Overlay from "ol/Overlay.js";
import {polygon as turfPolygon, featureCollection} from "@turf/helpers";
import {setBBoxToGeom} from "../../utils/setBBoxToGeom.js";
import thousandsSeparator from "@shared/js/utils/thousandsSeparator.js";
import {truncate} from "@turf/truncate";
import wktParser from "../../utils/wktParser";
import WPS from "@shared/js/api/wps.js";

export default {
    name: "DistrictSelectorSubject",
    components: {
        AccordionItem,
        AlertMessage,
        Card,
        DistrictSelectorSubjectImport,
        DrawTypes,
        FlatButton,
        InputText
    },
    data () {
        return {
            buffer: 0,
            bufferMax: 50000,
            bufferMin: -10000,
            cardCounter: 0,
            drawStyle: {
                fillColor: [254, 110, 1, 0.2],
                strokeColor: [254, 110, 1],
                strokeWidth: 4
            },
            drawTypeLabels: [{type: "polygon", label: "Fläche"}, {type: "box", label: "Rechteck"}, {type: "circle", label: "Kreis"}],
            drawTypes: ["polygon", "box", "circle"],
            selectedDrawTypeMain: "",
            selectedDrawType: "",
            importResetTrigger: 0
        };
    },
    computed: {
        ...mapGetters(["allLayerConfigs", "restServiceById"]),
        ...mapGetters("Menu", ["zoomToExtentPadding"]),
        ...mapGetters("Modules/DistrictSelector", ["selectedInteraction", "wpsProcess", "wpsServiceId", "keyOfAttrName"]),
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
    watch: {
        cards: {
            handler (val) {
                this.toggleCardStatus(val.findIndex(card => card.status === "active"));
            },
            deep: true
        }
    },
    created () {
        this.drawingLayer = getLayerById("subject-area");
        this.drawingLayer.getLayer().setVisible(true);
        this.setLayerStyle(this.drawingLayer.getLayer(), 0.2);
        this.setActiveCardsFromStatisticalCards(this.cardsStatistical);
        this.createCircleOverlay();
    },
    activated () {
        this.setLayerStyle(this.drawingLayer.getLayer(), 0.2);
    },
    deactivated () {
        this.setLayerStyle(this.drawingLayer.getLayer(), 0);
    },
    beforeUnmount () {
        this.setLayerStyle(this.drawingLayer.getLayer(), 0);
        this.setSelectedInteraction("");
        mapCollection.getMap("2D").removeOverlay(this.circleOverlay);
    },
    methods: {
        ...mapActions("Maps", ["zoomToExtent"]),
        ...mapMutations("Modules/DistrictSelector", ["setSelectedInteraction", "setSelectedDistrictLevelId", "setBoundingGeometry"]),

        /**
         * set active card from the provided statistical card data.
         * @param {Object[]} cardsStatistical - An array of statistical card data used as input.
         * @returns {void}
         */
        setActiveCardsFromStatisticalCards (cardsStatistical) {
            const activeStatIndex = cardsStatistical.findIndex(card => card.status === "active");

            if (activeStatIndex !== -1) {
                this.cards.forEach((card, index) => {
                    card.subjectFeatureWKT = cardsStatistical[index].subjectFeatureWKT;
                    card.status = "";
                });
                this.setActiveCard(activeStatIndex);
            }
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
         * Creates a buffered feature of the given feature.
         * @param {String} wktFeature - The feature to be buffered as WKT.
         * @param {Number} buffer - The buffer distance to apply around the feature.
         * @returns {String} The buffered feature encoded as WKT.
         */
        getBufferedFeature (wktFeature, buffer) {
            const feature = wktParser.decodeFeature(wktFeature),
                geometryCollection = getBoundingGeometry([feature], buffer).getGeometries(),
                geojsonPolygons = geometryCollection.flatMap(geometry => {
                    if (geometry.getType() === "Polygon") {
                        return [turfPolygon(geometry.getCoordinates())];
                    }
                    if (geometry.getType() === "MultiPolygon") {
                        return geometry.getPolygons().map(polygon => turfPolygon(polygon.getCoordinates())
                        );
                    }
                    return [];
                });

            this.setBoundingGeometry(geometryCollection);

            let merged = geojsonPolygons[0];

            for (let i = 1; i < geojsonPolygons.length; i++) {
                merged = turfUnion(featureCollection([
                    truncate(merged, {precision: 3, mutate: true}),
                    truncate(geojsonPolygons[i], {precision: 3, mutate: true})
                ]));
            }

            if (merged.geometry.type === "Polygon") {
                return wktParser.encodeFeature(
                    new Feature({geometry: new Polygon(merged.geometry.coordinates)})
                );
            }

            return wktParser.encodeFeature(
                new Feature({geometry: new MultiPolygon(merged.geometry.coordinates)})
            );
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
        },

        /**
         * Resets the state of the DistrictSelectorSubject component.
         * @return {void}
         */
        reset () {
            this.setSelectedInteraction("");
            this.activeCard.drawnFeatureWKT = null;
            this.setBuffer("0");
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
                const extent = wktParser.decodeFeature(this.cards[index].subjectFeatureWKT).getGeometry().getExtent();

                this.zoomToExtent({extent, options: {padding: this.zoomToExtentPadding}});
            });
            this.updateMap(this.activeCard);
        },

        /**
         * Normalizes the given buffer value.
         * @param {String} value - The user-provided buffer value.
         * @returns {Number} The normalized buffer value.
         */
        normalizeBufferValue (value) {
            const raw = value === "" || value === null || typeof value === "undefined"
                ? 0
                : Number(value);

            if (!Number.isFinite(raw)) {
                return this.buffer;
            }

            return Math.min(this.bufferMax, Math.max(this.bufferMin, raw));
        },

        /**
         * Sets the buffer value (validated and clamped).
         * @param {String} value - The buffer value to set.
         * @return {void}
         */
        setBuffer (value) {
            const nextVal = this.normalizeBufferValue(value),
                sourceWkt = this.activeCard.drawnFeatureWKT || this.activeCard.statisticalFeatureWKT;

            this.buffer = nextVal;
            this.activeCard.buffer = nextVal;
            this.activeCard.data[3].label = `Puffer ${nextVal} m`;

            this.setSubjectFeature(sourceWkt, nextVal);
        },

        /**
         * Sets the style for the given vector layer with the specified opacity for the fill color.
         * @param {ol/layer/Vector} layer - The vector layer to set the style for.
         * @param {number} opacity - The opacity value to set for the layer's fill color (between 0 and 1).
         */
        setLayerStyle (layer, opacity = 0) {
            layer.setStyle(
                {
                    "fill-color": `rgba(235, 138, 62, ${opacity})`,
                    "stroke-color": "#EB8A3E",
                    "stroke-width": 4
                });
        },

        /**
         * Sets the subject feature for the active card and applies the given buffer.
         * @param {String} wktString - The feature as a WKT string.
         * @param {Number} buffer - The buffer distance in meters.
         * @returns {void}
         */
        setSubjectFeature (wktString, buffer) {
            if (typeof wktString !== "string") {
                return;
            }

            const bufferedWkt = this.getBufferedFeature(wktString, buffer);

            this.activeCard.subjectFeatureWKT = bufferedWkt;
            this.updateMap(this.activeCard, true);
        },

        /**
         * Sets the subject feature from imported features and zooms to its extent.
         * @param {ol/Feature[]} features - The imported features to set as the subject feature.
         * @returns {void}
         */
        setSubjectFeatureFromImport (features) {
            const extent = wktParser.decodeFeature(this.activeCard.subjectFeatureWKT).getGeometry().getExtent(),
                importedWkt = Array.isArray(features) && features[0] ? wktParser.encodeFeature(features[0]) : null;

            this.activeCard.drawnFeatureWKT = importedWkt;
            this.setSubjectFeature(importedWkt, this.activeCard.buffer);
            this.zoomToExtent({extent: extent, options: {padding: this.zoomToExtentPadding}});
        },

        /**
         * Toggles the status of a card at the specified index.
         * @param {Number} index - Index of the card to toggle
         * @return {void}
         */
        toggleCardStatus (index) {
            const activeIndex = this.cards.findIndex(card => card.status === "active");

            if (activeIndex === index) {
                this.setActiveCard(index);
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
         * @param {Boolean} requestPopulation - Flag indicating whether to request population data from the WPS service.
         * @returns {void}
         */
        updateMap (card, requestPopulation = false) {
            const subjectFeature = wktParser.decodeFeature(card.subjectFeatureWKT);

            this.drawingLayer.getLayerSource().clear();
            this.drawingLayer.getLayerSource().addFeature(subjectFeature);
            this.setBoundingGeometry(subjectFeature.getGeometry());
            this.updateLayerBbox(subjectFeature.getGeometry());
            if (requestPopulation) {
                this.setPopulationSize(card);
            }
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

        /**
         * Requests the population size for the given subject card via WPS
         * and updates the card accordingly.
         * @param {Object} card - The subject report card containing the geometry and UI state.
         * @returns {void}
         */
        setPopulationSize (card) {
            const subjectFeature = wktParser.decodeFeature(card.subjectFeatureWKT),
                service = this.restServiceById(this.wpsServiceId),
                geometry = subjectFeature.getGeometry(),
                populationLabel = this.$t("additional:modules.cosi.districtSelector.population"),
                notAvailable = this.$t("additional:modules.cosi.districtSelector.populationNotAvailable");

            if (service === undefined) {
                console.warn("Rest Service with the ID 1001 is not configured in rest-services.json!");
                card.data[2].label = populationLabel + ": " + notAvailable;
                card.populationAlert = {
                    type: "error",
                    text: notAvailable
                };
            }
            else {
                const outerPolygon = geometryToGeoJson(geometry, false, "EPSG:25832", "EPSG:25832");

                WPS.wpsRequest(service.id, service.url, this.wpsProcess, {
                    "such_flaeche": JSON.stringify(outerPolygon)
                },
                (resp) => this.handlePopulationResponse(resp, card)
                );
            }
        },

        /**
         * Maps server error messages (area too small or too big) to user-friendly alert texts.
         * @param {String} message - Message returned by the service (already trimmed).
         * @returns {Object|null} alert object or null.
         */
        getPopulationAlertFromServerMessage (message) {
            if (typeof message !== "string" || !message) {
                return null;
            }

            const lower = message.toLowerCase();

            if (lower.includes("zu klein") || lower.includes("minimal")) {
                return {
                    type: "error",
                    text: this.$t("additional:modules.cosi.districtSelector.areaTooSmall")
                };
            }

            if (lower.includes("zu groß")) {
                return {
                    type: "error",
                    text: this.$t("additional:modules.cosi.districtSelector.areaTooBig")
                };
            }

            if (
                lower.includes("zu klein") ||
                lower.includes("minimal") ||
                lower.includes("mindestens 3 adressen") ||
                (lower.includes("adressen") && lower.includes("vergrößern"))
            ) {
                return {
                    type: "error",
                    text: this.$t("additional:modules.cosi.districtSelector.areaTooFewAddresses")
                };
            }

            return {
                type: "warning",
                text: message
            };
        },

        /**
         * Sets the population label and alert to a "not available" state.
         * @param {Object} card - The report card to update.
         * @param {String} type - Alert type ("error" | "warning").
         * @param {String} alertText - The alert message text.
         * @returns {void}
         */
        setPopulationNotAvailable (card, type, alertText) {
            card.data[2].label = "-";
            card.populationAlert = {
                type,
                text: alertText
            };
        },

        /**
         * Handles the population response from the WPS service and updates the
         * population label of the given card.
         * @param {Object} resp - The raw WPS execute response.
         * @param {Object} card - The report card to update.
         * @returns {void}
         */
        handlePopulationResponse (resp, card) {
            const result = resp?.ExecuteResponse?.ProcessOutputs?.Output?.Data?.ComplexData?.einwohner?.ergebnis,
                trimmed = typeof result === "string" ? result.trim() : "",
                populationLabel = this.$t("additional:modules.cosi.districtSelector.population"),
                notAvailable = this.$t("additional:modules.cosi.districtSelector.populationNotAvailable"),
                processingFailed = this.$t("additional:modules.cosi.districtSelector.populationProcessingFailed"),
                mapped = trimmed ? this.getPopulationAlertFromServerMessage(trimmed) : undefined;

            card.populationAlert = null;

            if (!trimmed) {
                this.setPopulationNotAvailable(
                    card,
                    "error",
                    notAvailable
                );
                return;
            }

            if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
                try {
                    const parsed = JSON.parse(trimmed),
                        numericValue = Number(parsed?.einwohner_fhh);

                    if (Number.isFinite(numericValue)) {
                        card.data[2].label = `${populationLabel}: ${thousandsSeparator(numericValue)}`;
                        return;
                    }

                    this.setPopulationNotAvailable(
                        card,
                        "warning",
                        processingFailed
                    );
                    return;
                }
                catch (e) {
                    this.setPopulationNotAvailable(
                        card,
                        "warning",
                        processingFailed
                    );
                    return;
                }
            }

            card.data[2].label = populationLabel + ": " + notAvailable;
            card.populationAlert = mapped || {
                type: "error",
                text: notAvailable
            };
        },

        /**
        * Increments the import reset counter to clear the alert message.
        * @returns {void}
        */
        clearImportAlert () {
            this.importResetTrigger++;
        }
    }
};
</script>

<template lang="html">
    <div class="district-selector-subject">
        <AccordionItem
            id="draw-area"
            :is-open="true"
            :icon="'bi bi-pencil'"
            :title="$t('additional:modules.cosi.districtSelector.drawHeader')"
        >
            <div class="d-flex gap-4 mb-4 ms-3">
                <DrawTypes
                    :current-layout="drawStyle"
                    :draw-types="drawTypes"
                    :selected-draw-type="selectedDrawType"
                    :selected-draw-type-main="selectedDrawTypeMain"
                    :draw-type-labels="drawTypeLabels"
                    :selected-interaction="selectedInteraction"
                    :set-selected-draw-type="(value) => {selectedDrawType = value, clearImportAlert();}"
                    :set-selected-draw-type-main="(value) => {selectedDrawTypeMain = value, clearImportAlert();}"
                    :set-selected-interaction="(value) => {setSelectedInteraction(value), clearImportAlert();}"
                    :source="drawingLayer.getLayerSource()"
                    @drawstart="removeDrawingFeature"
                    @drawend="onDrawEnd"
                />
            </div>
        </AccordionItem>
        <AccordionItem
            id="set-buffer"
            :is-open="false"
            :icon="'bi bi-record-circle'"
            :title="$t('additional:modules.cosi.districtSelector.bufferHeader')"
        >
            <InputText
                id="district-selector-buffer"
                class="mb-4 ms-3"
                :label="$t('additional:modules.cosi.districtSelector.bufferLabel')"
                :model-value="buffer"
                :placeholder="'0'"
                :type="'number'"
                :min="bufferMin"
                :max="bufferMax"
                @update:modelValue="setBuffer"
                @focus="clearImportAlert()"
                @blur="setBuffer(buffer)"
            />
        </AccordionItem>
        <DistrictSelectorSubjectImport
            :reset-trigger="importResetTrigger"
            @set-imported-feature="setSubjectFeatureFromImport"
        />
        <FlatButton
            :aria="$t('additional:modules.cosi.districtSelector.resetArea')"
            :class-array="['btn-secondary']"
            class="mx-auto mt-4"
            :icon="'bi bi-arrow-counterclockwise'"
            :text="$t('additional:modules.cosi.districtSelector.resetArea')"
            :interaction="() => { clearImportAlert(); reset(); }"
        />
        <div
            v-if="cards.length"
            class="mb-4"
        >
            <hr class="my-4 mx-0 text-black-50">
            <h5>
                {{ $t("additional:modules.cosi.districtSelector.selectedAreas") }}
            </h5>
        </div>
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
                @click="() => {toggleCardStatus(index); clearImportAlert();}"
            >
                <template #download-menu>
                    <ul class="dropdown-menu">
                        <li class="ps-4">
                            <button
                                class="dropdown-item"
                                @click.stop="() => {exportFeature(item); clearImportAlert();}"
                            >
                                GeoJSON
                            </button>
                        </li>
                    </ul>
                </template>
            </Card>
            <AlertMessage
                v-if="item.populationAlert && item.status === 'active'"
                :text="item.populationAlert.text"
                :type="item.populationAlert.type"
                :closeable="true"
                class="mb-3"
                @close="() => { item.populationAlert = null; }"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .district-selector-subject {
        h6 {
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
