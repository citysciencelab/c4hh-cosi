<script>
import Card from "../../shared/modules/cards/components/Card.vue";
import {default as turfUnion} from "@turf/union";
import DistrictSelectorSubjectImport from "./DistrictSelectorSubjectImport.vue";
import DrawTypes from "@shared/modules/draw/components/DrawTypes.vue";
import {fromCircle as polygonFromCircle} from "ol/geom/Polygon";
import Feature from "ol/Feature";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {geometryToGeoJson} from "../../utils/geometry/convertToGeoJson";
import getBoundingGeometry from "../../utils/getBoundingGeometry.js";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import layerCollection from "@core/layers/js/layerCollection";
import layerFactory from "@core/layers/js/layerFactory";
import {mapActions, mapGetters, mapMutations} from "vuex";
import {MultiPolygon, Polygon} from "ol/geom";
import {polygon as turfPolygon} from "@turf/helpers";
import {setBBoxToGeom} from "../../utils/setBBoxToGeom.js";
import thousandsSeparator from "@shared/js/utils/thousandsSeparator.js";
import WPS from "@shared/js/api/wps.js";

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
        this.drawingLayer = this.getLayerById("district-selector");
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
    },
    beforeUnmount () {
        this.selectedInteraction = "";
    },
    methods: {
        ...mapActions("Maps", ["zoomToExtent"]),
        ...mapMutations("Modules/DistrictSelector", ["setSelectedDistrictLevelId"]),

        addCard (feature, buffer, districtNames, status, districtLevelId, districtLevelLabel) {
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
                drawnFeature: null,
                downloadable: false,
                icon: "bi bi-bounding-box-circles",
                removable: false,
                statisticalFeature: feature,
                status,
                subjectFeature: this.getBufferedFeature([feature], buffer)
            });
        },


        /**
         * Creates card objects from the provided statistical card data.
         * @param {Object[]} cardsStatistical - An array of statistical card data used as input.
         * @param {Object[]} cards - An array to store the resulting card objects.
         */
        createCardsFromStatisticalCards (cardsStatistical, cards) {
            cardsStatistical.forEach(card => {
                const feature = new Feature({
                        geometry: card.geometry
                    }),
                    foundEqualObject = cards.find(existingCard => {
                        return JSON.stringify(existingCard.statisticalFeature.getGeometry()) === JSON.stringify(feature.getGeometry());
                    });

                if (foundEqualObject) {
                    return;
                }
                this.addCard(feature, this.buffer, card.selectedDistricts, card.status, card.districtLevelId, card.districtLevelLabel);
            });
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
         * @param {ol/Feature[]} features - The array of features to be buffered.
         * @param {Number} buffer - The buffer distance to apply around each feature.
         * @returns {ol/Feature} - The buffered feature.
         */
        getBufferedFeature (features, buffer) {
            const geometries = getBoundingGeometry(features, buffer).getGeometries(),
                geojsonPolygons = geometries.map(polygon => turfPolygon(polygon.getCoordinates()));

            let merged = geojsonPolygons[0],
                mergedPolygon = null;

            for (let i = 1; i < geojsonPolygons.length; i++) {
                merged = turfUnion(merged, geojsonPolygons[i]);
            }

            if (merged.geometry.type === "Polygon") {
                mergedPolygon = new Polygon(merged.geometry.coordinates);
            }
            else if (merged.geometry.type === "MultiPolygon") {
                mergedPolygon = new MultiPolygon(merged.geometry.coordinates);
            }

            return new Feature({
                geometry: mergedPolygon
            });
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

            layer.getLayer().setStyle(
                {
                    "fill-color": "rgba(0, 0, 0, 0)",
                    "stroke-color": "#EB8A3E",
                    "stroke-line-dash": [6, 6],
                    "stroke-width": 4
                }
            );

            layerCollection.addLayer(layer);
            return layer;
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
            }
            this.activeCard.drawnFeature = evt.feature;
            this.setSubjectFeature([this.activeCard.drawnFeature], this.activeCard.buffer);
        },

        /**
         * Removes the drawing feature from the drawing layer and resets the drawingFeature property.
         * @return {void}
         */
        removeDrawingFeature () {
            if (this.activeCard.drawnFeature === null) {
                return;
            }
            this.activeCard.drawnFeature = null;
            this.setSubjectFeature([this.activeCard.statisticalFeature], this.activeCard.buffer);
        },

        /**
         * Resets the state of the DistrictSelectorSubject component.
         * @return {void}
         */
        reset () {
            this.selectedInteraction = "";
            this.activeCard.drawnFeature = null;
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

            this.updateMap();
        },

        /**
         * Sets the buffer value.
         * @param {Number} value - The buffer value to set.
         * @return {void}
         */
        setBuffer (value) {
            this.buffer = value;
            this.activeCard.buffer = value;
            this.activeCard.data[2].label = "Puffer " + value + " m";
            if (this.activeCard.drawnFeature !== null) {
                this.setSubjectFeature([this.activeCard.drawnFeature], this.activeCard.buffer);
            }
            else {
                this.setSubjectFeature([this.activeCard.statisticalFeature], this.activeCard.buffer);
            }
        },

        /**
         * Sets the subject feature to the active card with an optional buffer.
         * @param {ol/Feature[]} features - The features to set as the subject feature.
         * @param {Number} buffer - The buffer value to apply to the feature.
         */
        setSubjectFeature (features, buffer) {
            this.activeCard.subjectFeature = this.getBufferedFeature(features, buffer);
            this.updateMap();
        },

        /**
         * Sets the subject feature from imported features and zooms to its extent.
         * @param {ol/Feature[]} features - The imported features to set as the subject feature.
         */
        setSubjectFeatureFromImport (features) {
            this.setSubjectFeature(features, this.activeCard.buffer);
            this.zoomToExtent({extent: this.activeCard.subjectFeature.getGeometry().getExtent()});
        },

        /**
         * Toggles the status of a card at the specified index.
         * @param {Number} index - Index of the card to toggle
         * @return {void}
         */
        toggleCardStatus (index) {
            const activeIndex = this.cards.findIndex(card => card.status === "active");

            if (activeIndex === index) {
                this.updateMap();
                return;
            }
            if (activeIndex !== -1) {
                this.cards[activeIndex].status = "";
            }
            this.setActiveCard(index);
        },

        updateLayerBbox (geometry) {
            this.allLayerConfigs.forEach(layerConfig => {
                layerConfig.bboxGeometry = geometry;
            });
            setBBoxToGeom(this, geometry, layerCollection.getLayers());
        },

        updateMap () {
            this.drawingLayer.getLayerSource().clear();
            this.drawingLayer.getLayerSource().addFeature(this.activeCard.subjectFeature);
            this.updateLayerBbox(this.activeCard.subjectFeature.getGeometry());
            this.setPopulationSize(this.activeCard);
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
            const service = this.restServiceById(this.wpsServiceId),
                geometry = card.subjectFeature.getGeometry();

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
                @remove-set="removeCard(index)"
            />
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
