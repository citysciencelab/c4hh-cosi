<script>
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import {calculateExtent} from "../../utils/features/calculateExtent.js";
import Card from "../../shared/modules/cards/components/Card.vue";
import DistrictSelectorFilter from "./DistrictSelectorFilter.vue";
import DistrictSelectorStatisticalAdditionalLayer from "./DistrictSelectorStatisticalAdditionalLayer.vue";
import {downloadJsonToFile} from "../../utils/download";
import {DragBox, Select} from "ol/interaction";
import {featuresToGeoJsonCollection} from "../../utils/features/convertToGeoJson";
import {Fill, Stroke, Style} from "ol/style.js";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {geometryToGeoJson} from "../../utils/geometry/convertToGeoJson";
import getBoundingGeometry from "../../utils/getBoundingGeometry.js";
import getFeature from "@shared/js/api/wfs/getFeature.js";
import getMappingJson from "../../utils/getMappingJson.js";
import getters from "../store/gettersDistrictSelector.js";
import IconButton from "../../../../src/shared/modules/buttons/components/IconButton.vue";
import layerCollection from "../../../../src/core/layers/js/layerCollection.js";
import {mapGetters, mapActions, mapMutations} from "vuex";
import mutations from "../store/mutationsDistrictSelector.js";
import {prepareDistrictLevels} from "../utils/prepareDistrictLevels.js";
import {setBBoxToGeom} from "../../utils/setBBoxToGeom.js";
import {singleClick} from "ol/events/condition";
import {styleSelectedDistrictLevels} from "../utils/styleSelectedDistrictLevels.js";
import TagGroup from "../../shared/modules/tags/components/TagGroup.vue";
import thousandsSeparator from "@shared/js/utils/thousandsSeparator.js";
import WPS from "@shared/js/api/wps.js";

export default {
    name: "DistrictSelectorStatistical",
    components: {
        AccordionItem,
        Card,
        DistrictSelectorFilter,
        DistrictSelectorStatisticalAdditionalLayer,
        FlatButton,
        IconButton,
        TagGroup
    },
    props: {
        loading: {
            type: Boolean,
            default: false
        }
    },
    data () {
        return {
            // color for the drag box button
            dragBoxButtonColor: "grey lighten-1"
        };
    },
    computed: {
        ...mapGetters("Modules/DistrictSelector", Object.keys(getters)),
        ...mapGetters("Modules/DistrictSelector", {
            cards: "selectionCardsStatisticalData",
            cardsSubject: "selectionCardsSubjectData"
        }),
        ...mapGetters(["allLayerConfigs", "restServiceById", "visibleSubjectDataLayerConfigs"]),

        activeCard () {
            return this.cards.find(card => card.status === "active");
        },

        disableButton () {
            return this.selectedDistrictNames.length === 0;
        },
        /**
         * Gets an array of district level labels with their corresponding values and selection status.
         * Each object in the returned array contains:
         * - `label`: The label of the district level.
         * - `value`: The layer ID of the district level.
         * - `selected`: A boolean indicating whether the district level is currently selected.
         * @returns {Array<Object>} An array of objects representing district level labels.
         */
        districtLevelLabels () {
            return this.districtLevels.map(level => ({
                label: level.label,
                value: level.layerId,
                selected: level.layerId === this.selectedDistrictLevelId
            }));
        },

        layerList () {
            return mapCollection.getMap("2D").getLayers().getArray();
        }
    },
    watch: {
        /**
         * Every time the list of layers of the map changes the function prepareDistricts is called.
         * @param {module:ol/layer[]} newLayerList - An array of layers.
         * @returns {void}
         */
        layerList: function (newLayerList) {
            prepareDistrictLevels(this.districtLevels, newLayerList);
        },

        /**
         * Styles the selected district level when loading is false (map emits "rendercomplete").
         * @returns {void}
         */
        loading () {
            if (!this.loading) {
                styleSelectedDistrictLevels(this.districtLevels, this.selectedDistrictLevelId, this.selectedDistrictLevel.activeStyle);
            }
        },

        /**
         * Updates the active card status when the selected district names change.
         * @returns {void}
         */
        selectedDistrictNames () {
            if (this.activeCard && this.selectedDistrictNames.sort().toString() !== this.activeCard.selectedDistricts.sort().toString()) {
                this.activeCard.status = "";
            }
        },

        selectedDistrictsCollection: "transferFeatures",
        selectedDistrictLevelId: ["clearFeatures", "changeSelectedDistrictLevel"],

        visibleSubjectDataLayerConfigs: {
            handler () {
                this.updateLayerBbox(this.activeCard?.geometry);

            },
            deep: true
        }
    },
    async created () {
        this.setNonReactiveData();

        if (typeof this.selectedDistrictLevelId === "undefined") {
            this.setInitMapping(await getMappingJson());
            this.setMapping(await getMappingJson());
            await prepareDistrictLevels(this.districtLevels, this.layerList);
            this.districtLevels[0].layer.getSource().on("featuresloadend", () => {
                styleSelectedDistrictLevels(this.districtLevels, this.selectedDistrictLevelId, this.selectedDistrictLevel.activeStyle);
            });
            this.setSelectedDistrictLevelId(this.districtLevels[0].layerId);
        }
        else {
            styleSelectedDistrictLevels(this.districtLevels, this.selectedDistrictLevelId, this.selectedDistrictLevel.activeStyle);
        }

    },
    activated () {
        this.select.setActive(true);
        const drawingLayer = layerCollection.getLayerById("district-selector");

        if (drawingLayer) {
            drawingLayer.getLayerSource().clear();
            drawingLayer.getLayer().setVisible(false);
        }

        this.cardsSubject.forEach((card, index) => {
            if (card.status === "active") {
                this.toggleCardStatus(index);
            }
        });
    },
    deactivated () {
        const features = this.select.getFeatures(),
            // Hole die Features der aktiven Karte
            activeCardFeatures = this.activeCard?.features || []; // Fallback auf leeres Array, falls keine aktive Karte vorhanden ist

        // Entferne alle Features, die nicht zur aktiven Karte gehören
        features.forEach(feature => {
            const isInActiveCard = activeCardFeatures.some(activeFeature => JSON.stringify(feature?.getGeometry()) === JSON.stringify(activeFeature.getGeometry()));

            if (!isInActiveCard) {
                features.remove(feature);
            }
        });

        this.select.setActive(false);
    },
    beforeUnmount () {
        this.removeInteraction(this.dragBox);
        document.getElementById("mp-menu-secondaryMenu").style.width = this.sideMenuWidth;

        // remove overlay if no districts are selected at this point
        if (this.selectedDistrictNames.length === 0) {
            styleSelectedDistrictLevels(this.districtLevels);
        }
    },

    methods: {
        ...mapActions("Alerting", ["addSingleAlert", "cleanup"]),
        ...mapActions("Maps", ["addInteraction", "removeInteraction", "zoomToExtent", "resetView"]),
        ...mapActions("Modules/Dashboard", ["generateTable"]),
        ...mapActions("Modules/DistrictSelector", ["loadStatFeatures"]),
        ...mapMutations("Modules/DistrictSelector", Object.keys(mutations)),
        ...mapMutations("Modules/Filter", ["setFilterGeometry"]),

        /**
         * Sets the district level to the given id.
         * @param {String} id - The layer id of the selected district lelvel.
         * @returns {void}
         */
        changeSelectedDistrictLevel (id) {
            const districtLevel = this.getDistrictLevelById(id);

            this.setSelectedDistrictLevel(districtLevel);
            styleSelectedDistrictLevels(this.districtLevels, id, districtLevel.activeStyle);
        },

        /**
         * Remove all features from the features collection of the select interaction.
         * @returns {void}
         */
        clearFeatures () {
            this.select.getFeatures().clear();
        },

        /**
         * Downloads the feature in geojson file.
         * @param {Object} val - The item object.
         * @returns {void}
         */
        exportFeature (val) {
            downloadJsonToFile(featuresToGeoJsonCollection(val?.features), val?.districtLevelLabel + ".geojson");
        },

        /**
         * Gets the selected district level to the given id.
         * @param {String} layerId - The layer id of the selected district level.
         * @returns {Object} The selected district level.
         */
        getDistrictLevelById (layerId) {
            return this.districtLevels.find(district => {
                return district.layerId === layerId;
            });
        },

        /**
         * Registers listener for drag box interaction events.
         * On "boxend" all features that intersect the box are added to the feature collection.
         * On "boxstart" calls the clearFeatures function.
         * @param {module:ol/interaction/DragBox} dragBox - Interaction for drawing a vector box.
         * @param {module:ol/Collection} featureCollection - The feature collection of the select interaction.
         * @returns {void}
         */
        registerDragBoxListener (dragBox, featureCollection) {
            dragBox.on("boxend", (evt) => {
                const extent = evt.target.getGeometry().getExtent(),
                    source = this.getDistrictLevelById(this.selectedDistrictLevelId).layer.getSource();

                source.forEachFeatureIntersectingExtent(extent, (feature) => {
                    featureCollection.push(feature);
                });
            });

            dragBox.on("boxstart", () => this.clearFeatures());
        },

        /**
         * Registers listener for the feature collection of the select interaction.
         * On "change:length" (add or remove a feautre to/from the collection) the names of the selected districts are saved to the store.
         * On "change:add" the district is set to selected.
         * On "change:remove" the district is set to unselected.
         * @param {module:ol/Collection} featureCollection - The feature collection of the select interaction.
         * @returns {void}
         */
        registerFeatureCollectionListener (featureCollection) {
            featureCollection.on("change:length", (evt) => {
                const selectedNames = evt.target.getArray().map(feature => {
                    return feature.get(this.keyOfAttrName);
                });

                this.setSelectedDistrictsCollection(evt.target);
                this.setSelectedDistrictNames([...new Set(selectedNames)]);

            });

            featureCollection.on("remove", (evt) => {
                // evt.element -> feature that was removed
                const foundDistrict = this.selectedDistrictLevel.districts.find(district => {
                    return district.adminFeature.getId() === evt.element.getId();
                });

                foundDistrict.isSelected = false;
            });

            featureCollection.on("add", (evt) => {
                // evt.element -> feature that was added
                const foundDistrict = this.selectedDistrictLevel.districts.find(district => {
                    return district.adminFeature.getId() === evt.element.getId();
                });

                foundDistrict.isSelected = true;
            });
        },

        /**
         * Removes a card from the cards array at the specified index.
         * @param {Number} index - Index of the card to be removed
         * @return {void}
         */
        removeCard (index) {
            this.cards.splice(index, 1);
            if (!this.activeCard && this.cards.length > 0) {
                this.toggleCardStatus(this.cards.length - 1);
            }
            else if (this.cards.length === 0) {
                this.clearFeatures();
                this.updateLayerBbox(undefined);
            }
        },

        /**
         * Sets all needed non reactive data.
         * @returns {void}
         */
        setNonReactiveData () {
            this.setSelectInteraction();

            // drag box interaction
            this.dragBox = new DragBox();
            this.dragBox.setActive(false);
            this.registerDragBoxListener(this.dragBox, this.select.getFeatures());
            this.addInteraction(this.dragBox);
        },

        /**
         *
         */
        setSelectInteraction () {
            this.select = mapCollection.getMap("2D").getInteractions().getArray().find(interaction => {
                return interaction.get("id") === "district-selector-select";
            });

            if (typeof this.select === "undefined") {
                this.select = new Select({
                    // select only features of the selected district level
                    filter: (feature, layer) => {
                        const keyOfAttrName = this.selectedDistrictLevel.keyOfAttrName;

                        return layer.get("id") === this.selectedDistrictLevelId && this.selectedDistrictLevel.filterableValues.includes(feature.get(keyOfAttrName));
                    },
                    style: new Style({
                        fill: new Fill({color: "rgba(255, 255, 255, 0)"}),
                        stroke: new Stroke({color: "rgba(33, 132, 251, 1)", width: 8})
                    }),
                    addCondition: singleClick,
                    removeCondition: singleClick
                });
                this.select.set("id", "district-selector-select");
                this.registerFeatureCollectionListener(this.select.getFeatures());
                this.addInteraction(this.select);
            }
            this.select.setActive(true);
        },

        /**
         * Activates/deactivates the dragbox interaction and toggles the css class for the drag box button.
         * @returns {void}
         */
        toggleDragBox () {
            if (this.dragBox.getActive()) {
                this.dragBox.setActive(false);
                this.dragBoxButtonColor = "grey lighten-1";
            }
            else {
                this.dragBox.setActive(true);
                this.dragBoxButtonColor = "primary";
            }
        },

        /**
         * If the collection are set outside this component,
         * the features of this collection are transferred to the feature collection of the select interaction.
         * Then the updateExtent function is called.
         * Otherwise nothing else happens.
         * @param {module:ol/Collection} featureCollection - The feature collection to set to the select interaction.
         * @returns {void}
         */
        transferFeatures (featureCollection) {
            if (featureCollection.get("fromExternal")) {
                // if no districts have been selected
                // and the tool is closed
                // shade all not selected districts
                // before applying the new selection
                if (this.selectedDistrictNames.length === 0 && !this.active) {
                    styleSelectedDistrictLevels(this.districtLevels, this.selectedDistrictLevel.layerId, this.selectedDistrictLevel.activeStyle);
                }
                this.select.getFeatures().clear();
                featureCollection.forEach(feature => {
                    this.select.getFeatures().push(feature);
                });
                this.updateExtent(featureCollection.get("zoomToExtent"));
            }
        },

        /**
         * Sets the extent and zoom to it, if not empty.
         * Sets the BBox of all Vector Layers to the selected districts
         * If the extent is empty (this means no features are selected), a warning appears.
         * @returns {void}
         */
        updateExtent () {
            const extent = calculateExtent(this.selectedFeatures, parseInt(0, 10)),
                bboxGeom = getBoundingGeometry(this.selectedFeatures, 0),
                selectedDistricts = this.selectedDistrictLevel.districts.filter(district => district.isSelected === true);

            this.cards.push({
                badgeList: [{
                    backgroundColor: "rgba(33, 132, 251, 1)",
                    color: "rgba(255, 255, 255, 1)",
                    icon: "bi bi-bar-chart",
                    text: this.$t("additional:modules.cosi.districtSelector.statisticalData")
                }],
                data: [
                    {value: "Bezugsebene: " + this.selectedDistrictLevel.label},
                    {icon: "bi-map", label: "Gebiete: " + selectedDistricts.map(district => district.getName())},
                    {icon: "bi-people", label: "Einwohner: Berechnung läuft..."}
                ],
                districtLevelId: this.selectedDistrictLevel.layerId,
                districtLevelLabel: this.selectedDistrictLevel.label,
                downloadable: false,
                extent,
                features: this.selectedFeatures.slice(),
                geometry: bboxGeom,
                icon: "bi-image",
                selectedDistricts: selectedDistricts.map(district => district.getName()),
                status: ""
            });
            this.setPopulationSize(this.cards.at(-1));
            this.toggleCardStatus(this.cards.length - 1);

            if (extent) {
                this.setBoundingGeometry(bboxGeom);
                this.setFilterGeometry(this.areaSelectorGeom || bboxGeom);

                this.loadStatFeatures({
                    districtLevel: this.selectedDistrictLevel,
                    getStatFeatures: getFeature.getFeaturePOST,
                    districts: selectedDistricts
                }).then(() => {
                    this.generateTable();
                });
            }
            else {
                this.resetView();
                this.setBoundingGeometry(undefined);
                this.updateLayerBbox(undefined);
                this.setFilterGeometry(this.areaSelectorGeom || false);
            }
        },

        updateLayerBbox (geometry) {
            setBBoxToGeom(this, geometry, layerCollection.getLayers());
        },

        /**
         * Find the district features by the given names
         * and add them to the feature collection of the select interaction.
         * @param {String[]} namesOfDistricts - Names of the districts to be selected.
         * @returns {void}
         */
        updateSelectedFeatures (namesOfDistricts) {
            this.clearFeatures();

            if (namesOfDistricts.length > 0) {
                const districtFeatures = this.layer.getSource().getFeatures(),
                    namesAssoc = {};

                namesOfDistricts.forEach(name => {
                    namesAssoc[name] = true;
                });

                districtFeatures.forEach(feature => {
                    if (Object.prototype.hasOwnProperty.call(namesAssoc, feature.get(this.keyOfAttrName))) {
                        this.select.getFeatures().push(feature);
                    }
                });
            }
        },

        /**
         * Updates the selected district level based on the provided district level label.
         * @param {Object} districtLevelLabel - The labels object containing information about the district level.
         * @returns {void}
         */
        updateSelectedDistrictLevel (districtLevelLabel) {
            if (typeof districtLevelLabel === "undefined") {
                return;
            }
            this.setSelectedDistrictLevelId(districtLevelLabel.value);
            if (this.activeCard) {
                this.activeCard.status = "";
                this.$nextTick(() => {
                    this.updateLayerBbox(undefined);
                });
            }
        },
        /**
         * Toggles the status of a card at the specified index.
         * @param {Number} index - Index of the card to toggle
         * @return {void}
         */
        toggleCardStatus (index) {
            const activeIndex = this.cards.findIndex(card => card.status === "active");

            if (activeIndex === index) {
                this.updateLayerBbox(this.cards[index].geometry);
                return;
            }
            if (activeIndex !== -1) {
                this.cards[activeIndex].status = "";
            }
            this.cards[index].status = "active";
            this.setSelectedDistrictLevelId(this.cards[index].districtLevelId);
            this.$nextTick(() => {
                this.updateSelectedFeatures(this.cards[index].selectedDistricts);
                this.updateLayerBbox(this.cards[index].geometry);
                this.zoomToExtent({extent: this.cards[index].extent, options: {}});
            });
        },

        setPopulationSize (card) {
            const service = this.restServiceById(this.wpsServiceId);

            if (service === undefined) {
                console.warn("Rest Service with the ID 1001 is not configured in rest-services.json!");
            }
            else {
                const outerPolygon = geometryToGeoJson(card.geometry, false, "EPSG:25832", "EPSG:25832");

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
    <div id="district-selector">
        <template v-if="districtLevels.length && selectedDistrictLevelId">
            <TagGroup
                class="mb-3"
                :items="districtLevelLabels"
                :label="$t('additional:modules.cosi.districtSelector.districtLevel')"
                :loading="loading"
                @update:selected-items="updateSelectedDistrictLevel"
            />
            <DistrictSelectorFilter
                :district-levels="districtLevels"
                :loading="loading"
                :selected-level-id="selectedDistrictLevelId"
                :selected-district-names-by-map="selectedDistrictNames"
                @updateSelectedDistricts="updateSelectedFeatures"
            />

            <hr class="my-4 mx-0 text-black-50">
            <AccordionItem
                id="hidden-objects"
                :title="$t('additional:modules.cosi.districtSelector.drawLabel')"
                icon="bi bi-plus-square-dotted"
            >
                <div class="d-flex align-items-center">
                    <IconButton
                        :id="'drawButton'"
                        :aria="'Rechteck zeichnen'"
                        :class-array="['btn-primary', 'me-3', dragBox.getActive() ? 'active': '']"
                        :icon="'bi bi-square'"
                        :interaction="() => toggleDragBox()"
                    />
                </div>
            </AccordionItem>
            <div v-if="Object.keys(additionalInfoLayers).length">
                <DistrictSelectorStatisticalAdditionalLayer />
            </div>
            <FlatButton
                id="confirmButton"
                class="mx-auto"
                icon="bi-check"
                type="button"
                :aria-label="$t('additional:modules.cosi.districtSelector.buttonConfirm')"
                :disabled="disableButton"
                :text="$t('additional:modules.cosi.districtSelector.buttonConfirm')"
                :interaction="updateExtent"
            />
        </template>
        <hr class="my-4 mx-0 text-black-50">
        <h5 class="mb-2">
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
                :status="item.status"
                :visible="false"
                @click="toggleCardStatus(index)"
                @remove-set="removeCard(index)"
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

<style lang="scss">
    .ol-dragbox {
        background-color: rgba(255, 255, 255, 0.4);
        border-color: rgba(51, 153, 204, 1);
        border-width: 1.25
    }
</style>
