<script>
import AccordionItem from "../../../../src/shared/modules/accordion/components/AccordionItem.vue";
import {calculateExtent} from "../../utils/features/calculateExtent.js";
import DistrictSelectorFilter from "./DistrictSelectorFilter.vue";
import {DragBox, Select} from "ol/interaction";
import Feature from "ol/Feature";
import {Fill, Stroke, Style, Text} from "ol/style.js";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
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
import ToolInfo from "../../shared/modules/toolInfo/components/ToolInfo.vue";
import {union} from "../../utils/geomUtils.js";
import TagGroup from "../../shared/modules/tags/components/TagGroup.vue";
import AlertMessage from "../../shared/modules/alerts/components/AlertMessage.vue";

export default {
    name: "DistrictSelector",
    components: {
        AccordionItem,
        AlertMessage,
        DistrictSelectorFilter,
        FlatButton,
        IconButton,
        TagGroup,
        ToolInfo
    },
    data () {
        return {
            // A buffer for the extent of the selected district(s)
            bufferVal: 0,
            // color for the drag box button
            dragBoxButtonColor: "grey lighten-1",
            // display additional info layers by key true/false
            visibleAdditionalLayers: [],
            loading: true
        };
    },
    computed: {
        ...mapGetters("Modules/Language", ["currentLocale"]),
        ...mapGetters("Modules/DistrictSelector", Object.keys(getters)),
        ...mapGetters(["visibleSubjectDataLayerConfigs", "allLayerConfigs", "visibleLayerConfigs"]),
        ...mapGetters("Modules/AreaSelector", {areaSelectorGeom: "geometry"}),

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

        selectedDistrictsCollection: "transferFeatures",
        selectedDistrictLevelId: ["clearFeatures", "changeSelectedDistrictLevel"],

        boundingGeometry () {
            this.bufferLayer.getSource().clear();
            if (this.bufferVal > 0 && typeof this.boundingGeometry !== "undefined") {
                const bufferedFeature = this.getBufferFeature(this.boundingGeometry.getGeometries());

                this.bufferLayer.getSource().addFeature(bufferedFeature);
            }
        },
        /**
         * @description Watches Layer visiblity changes to determine whether the addtional info layers are active
         * @param {module:ol/layer[]} layerList - An array of visible layers.
         * @returns {void}
         */
        visibleSubjectDataLayerConfigs: {
            handler (visibleLayerConfigs) {
                const newIdList = [],
                    visibleLayerIds = visibleLayerConfigs.map(config => config.id);

                for (const key in this.additionalInfoLayers) {
                    for (const layerId of this.additionalInfoLayers[key]) {
                        if (visibleLayerIds.includes(layerId)) {
                            newIdList.push(key);
                        }
                    }
                }
                this.visibleAdditionalLayers = [...new Set(newIdList)];
            },
            deep: true
        }
    },
    async created () {
        mapCollection.getMap("2D").once("rendercomplete", () => {
            this.loading = false;
        });
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
    beforeUnmount () {
        this.select.setActive(false);
        // this.removeInteraction(this.select);
        this.removeInteraction(this.dragBox);
        document.getElementById("mp-menu-secondaryMenu").style.width = this.sideMenuWidth;

        // to do for MP3?
        // this.$watch("$store.state.Tools.Print.active", (newVal) => {
        //     if (newVal) {
        //         styleSelectedDistrictLevels(this.districtLevels, this.selectedDistrictLevelId, {
        //             fill: {
        //                 color: [255, 255, 255, 0]
        //             },
        //             stroke: {
        //                 color: [51, 153, 204, 1],
        //                 width: 3
        //             }
        //         }, 0);
        //     }
        //     else if (this.selectedDistrictNames.length) {
        //         styleSelectedDistrictLevels(this.districtLevels, this.selectedDistrictLevelId, {
        //             fill: {
        //                 color: [255, 255, 255, 0]
        //             },
        //             stroke: {
        //                 color: [51, 153, 204, 1],
        //                 width: 3
        //             }
        //         }, 0.6);
        //     }
        // });

        // remove overlay if no districts are selected at this point
        if (this.selectedDistrictNames.length === 0) {
            styleSelectedDistrictLevels(this.districtLevels);
        }
    },

    methods: {
        ...mapActions("Alerting", ["addSingleAlert", "cleanup"]),
        ...mapActions("Maps", ["addInteraction", "removeInteraction", "zoomToExtent", "resetView", "addNewLayerIfNotExists"]),
        ...mapActions("Modules/DistrictSelector", ["loadStatFeatures"]),
        ...mapActions(["replaceByIdInLayerConfig"]),
        ...mapMutations("Modules/DistrictSelector", Object.keys(mutations)),
        ...mapMutations("Modules/Filter", ["setFilterGeometry"]),

        /**
         * Get a feature to display the buffer. Merges the geometries of the districts.
         * @param {ol/geom/Geometry[]} geometries - An array of buffered district geometries.
         * @returns {ol/Feature} The bufferd feature.
         */
        getBufferFeature (geometries) {
            const features = [];

            geometries.forEach(geom => {
                const feature = new Feature({
                    geometry: geom
                });

                features.push(feature);
            });
            return union(features, false, true);
        },

        /**
         * Remove all features from the features collection of the select interaction.
         * @returns {void}
         */
        clearFeatures () {
            this.select.getFeatures().clear();
        },

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
         * Sets all needed non reactive data.
         * @returns {void}
         */
        async setNonReactiveData () {
            this.setSelectInteraction();

            // drag box interaction
            this.dragBox = new DragBox();
            this.dragBox.setActive(false);
            this.registerDragBoxListener(this.dragBox, this.select.getFeatures());
            this.addInteraction(this.dragBox);

            // buffer layer
            this.bufferLayer = await this.addNewLayerIfNotExists({layerName: "district-selection-buffer"});
            this.bufferLayer.setStyle(() => {
                return new Style({
                    stroke: new Stroke({
                        color: [66, 66, 66, 1],
                        width: 1,
                        lineDash: [10, 4]
                    }),
                    text: new Text({
                        textAlign: "start",
                        textBaseline: "middle",
                        text: "Puffer",
                        fill: new Fill({color: "white"}),
                        stroke: new Stroke({color: [66, 66, 66, 1], width: 4}),
                        placement: "line",
                        font: "12px Arial",
                        repeat: 500
                    })
                });
            });
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
                        stroke: new Stroke({color: "#3399CC", width: 5})
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
         * Changes the visibility of the additional layers based on the passed layer id.
         * @param {Event} event - An input change event.
         * @returns {void}
         */
        switchAdditionalLayers (event) {
            const layerName = event.target.value,
                isLayerVisible = this.visibleAdditionalLayers.includes(layerName);

            for (const id of this.additionalInfoLayers[layerName]) {
                this.replaceByIdInLayerConfig({
                    layerConfigs: [{
                        id,
                        layer: {
                            id,
                            visibility: isLayerVisible
                        }
                    }]
                });
            }
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
         * @param {Boolean} zoomToExtent - Should the camera zoom to the selection?
         * @returns {void}
         */
        updateExtent (zoomToExtent = true) {
            const extent = calculateExtent(this.selectedFeatures, parseInt(this.bufferVal, 10)),
                bboxGeom = getBoundingGeometry(this.selectedFeatures, this.bufferVal),
                selectedDistricts = this.selectedDistrictLevel.districts.filter(district => district.isSelected === true);

            if (extent) {
                this.setBufferValue(this.bufferVal);
                this.setExtent(extent);
                this.setBoundingGeometry(bboxGeom);
                this.allLayerConfigs.forEach(configg => {
                    configg.bboxGeometry = this.areaSelectorGeom || bboxGeom;
                });
                setBBoxToGeom(this, this.areaSelectorGeom || bboxGeom, layerCollection.getLayers());
                this.setFilterGeometry(this.areaSelectorGeom || bboxGeom);

                if (zoomToExtent) {
                    this.zoomToExtent({extent, options: {}});
                }

                this.loadStatFeatures({
                    districtLevel: this.selectedDistrictLevel,
                    getStatFeatures: getFeature.getFeaturePOST,
                    districts: selectedDistricts
                });
            }
            else {
                this.setExtent([]);
                this.resetView();
                this.setBoundingGeometry(undefined);
                this.allLayerConfigs.forEach(configg => {
                    configg.bboxGeometry = this.areaSelectorGeom || bboxGeom;
                });
                setBBoxToGeom(this, this.areaSelectorGeom || bboxGeom, layerCollection.getLayers());
                this.setFilterGeometry(this.areaSelectorGeom || false);
                // if (this.showSelectedWarning) {
                //     this.addSingleAlert({
                //         category: this.$t("additional:modules.tools.cosi.districtSelector.warning"),
                //         content: "Warnung",
                //         displayClass: "warning"
                //     });
                // }
            }
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
        }
    }
};
</script>

<template lang="html">
    <div id="district-selector">
        <ToolInfo
            :url="readmeUrl"
            :locale="currentLocale"
            :summary="$t('additional:modules.cosi.districtSelector.description')"
        />
        <hr class="my-4 mx-0 text-black-50">
        <AlertMessage
            text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."
            type="success"
        />
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
                <AccordionItem
                    id="hidden-objects2"
                    :title="$t('additional:modules.cosi.districtSelector.additionalLayer')"
                    icon="bi bi-layers-half"
                >
                    <div class="mb-2">
                        {{ $t('additional:modules.cosi.districtSelector.additionalInfoLayersHelp') }}
                    </div>
                    <div
                        v-for="(ids, key) in additionalInfoLayers"
                        :key="key"
                        class="form-check form-switch me-3"
                    >
                        <input
                            id="layerSwitcher"
                            v-model="visibleAdditionalLayers"
                            class="form-check-input rounded-pill me-1"
                            type="checkbox"
                            :value="key"
                            role="switch"
                            aria-checked="false"
                            @change="switchAdditionalLayers"
                        >
                        <label
                            class="form-check-label"
                            for="layerSwitcher"
                        >
                            {{ key }}
                        </label>
                    </div>
                </AccordionItem>
            </div>
            <AccordionItem
                id="hidden-objects3"
                :title="$t('additional:modules.cosi.districtSelector.inputLabel')"
                icon="bi bi-record-circle"
            >
                <input
                    v-if="enableBuffer"
                    id="input-buffer"
                    v-model="bufferVal"
                    class="form-control w-25"
                    type="number"
                    step="250"
                    min="0"
                >
            </AccordionItem>
            <div class="d-grid d-flex justify-content-between mt-5">
                <FlatButton
                    id="confirmButton"
                    icon="bi-check"
                    type="button"
                    :aria-label="$t('additional:modules.cosi.districtSelector.buttonConfirm')"
                    :text="$t('additional:modules.cosi.districtSelector.buttonConfirm')"
                    :interaction="updateExtent"
                />
                <FlatButton
                    id="resetButton"
                    icon="bi-arrow-counterclockwise"
                    type="button"
                    :aria-label="$t('additional:modules.cosi.districtSelector.buttonReset')"
                    :text="$t('additional:modules.cosi.districtSelector.buttonReset')"
                    :interaction="clearFeatures"
                />
            </div>
        </template>
    </div>
</template>

<style lang="scss">
    .ol-dragbox {
        background-color: rgba(255, 255, 255, 0.4);
        border-color: rgba(51, 153, 204, 1);
        border-width: 1.25
    }
</style>
