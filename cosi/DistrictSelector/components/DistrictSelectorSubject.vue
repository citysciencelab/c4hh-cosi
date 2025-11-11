<script>
import Card from "../../shared/modules/cards/components/Card.vue";
import Feature from "ol/Feature";
import DrawTypes from "@shared/modules/draw/components/DrawTypes.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import getBoundingGeometry from "../../utils/getBoundingGeometry.js";
import {geometryToGeoJson} from "../../utils/geometry/convertToGeoJson";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import layerCollection from "@core/layers/js/layerCollection";
import layerFactory from "@core/layers/js/layerFactory";
import {mapGetters, mapMutations} from "vuex";
import {MultiPolygon, Polygon} from "ol/geom";
import {setBBoxToGeom} from "../../utils/setBBoxToGeom.js";
import thousandsSeparator from "@shared/js/utils/thousandsSeparator.js";
import WPS from "@shared/js/api/wps.js";
import {default as turfUnion} from "@turf/union";
import {polygon as turfPolygon} from "@turf/helpers";

export default {
    name: "DistrictSelectorSubject",
    components: {
        Card,
        DrawTypes,
        IconButton,
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
            drawTypeLabels: [{type: "polygon", label: "Fläche"}, {type: "box", label: "Rechteck"}],
            drawTypes: ["polygon", "box"],
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

        this.cardsStatistical.forEach(card => {
            const feature = new Feature({
                geometry: card.geometry
            });

            const foundEqualObject = this.cards.find(existingCard => {
                return JSON.stringify(existingCard.statisticalFeature.getGeometry()) === JSON.stringify(feature.getGeometry());
            });

            if (foundEqualObject) {
                return;
            }
            this.addCard(feature, this.buffer, card.selectedDistricts, card.status, card.districtLevelId);
        });

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
        ...mapMutations("Modules/DistrictSelector", ["setSelectedDistrictLevelId"]),

        addCard (feature, buffer, districtNames, status, districtLevelId) {
            this.cards.push({
                badgeList: this.getBadges(),
                buffer,
                data: [
                    {value: this.$t("additional:modules.cosi.districtSelector.area") + " " + (this.cardCounter += 1)},
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
                subjectFeature: this.getBufferedFeature(feature, buffer)
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

        getBufferedFeature (feature, buffer) {
            const geometries = getBoundingGeometry([feature], buffer).getGeometries(),
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
         * Handles the drawend event by updating the drawnFeature and subjectFeature of the .
         * @param {Object} evt - The drawend event object containing the drawn feature.
         * @return {void}
         */
        onDrawEnd (evt) {
            this.activeCard.drawnFeature = evt.feature;
            this.activeCard.subjectFeature = this.getBufferedFeature(this.activeCard.drawnFeature, this.activeCard.buffer);
            this.updateMap();
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
            this.activeCard.subjectFeature = this.getBufferedFeature(this.activeCard.statisticalFeature, this.activeCard.buffer);
            this.updateMap();
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
                this.activeCard.subjectFeature = this.getBufferedFeature(this.activeCard.drawnFeature, this.activeCard.buffer);
            }
            else {
                this.activeCard.subjectFeature = this.getBufferedFeature(this.activeCard.statisticalFeature, this.activeCard.buffer);
            }
            this.updateMap();
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

            card.data[1].label = `Einwohner: ${thousandsSeparator(responseResult.einwohner_fhh)}`;
        }
    }
};
</script>

<template lang="html">
    <div class="district-selector-subject">
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
            <IconButton
                :aria="$t('additional:modules.cosi.districtSelector.deleteButtonArea')"
                :class-array="['btn-primary']"
                :disabled="!activeCard.drawnFeature"
                :icon="'bi-trash'"
                :interaction="removeDrawingFeature"
                :label="$t('additional:modules.cosi.districtSelector.deleteButtonArea')"
            />
        </div>
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
    }
</style>
