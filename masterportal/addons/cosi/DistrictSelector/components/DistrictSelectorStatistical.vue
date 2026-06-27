<script>
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import {calculateExtent} from "../../utils/features/calculateExtent.js";
import Card from "../../shared/modules/cards/components/Card.vue";
import {geoJsonToFeature} from "../../utils/features/convertFromGeoJson.js";
import {union as turfUnion} from "@turf/union";
import DistrictSelectorFilter from "./DistrictSelectorFilter.vue";
import DistrictSelectorStatisticalAdditionalLayer from "./DistrictSelectorStatisticalAdditionalLayer.vue";
import {downloadJsonToFile} from "../../utils/download";
import {DragBox, Select} from "ol/interaction";
import {featuresToGeoJsonCollection} from "../../utils/features/convertToGeoJson";
import {Fill, Stroke, Style} from "ol/style.js";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import getBoundingGeometry from "../../utils/getBoundingGeometry.js";
import getFeature from "@shared/js/api/wfs/getFeature.js";
import {getLayerById} from "../../utils/layer/getLayerById.js";
import {getLimitedDistictName} from "../utils/districts.js";
import getMappingJson from "../../utils/getMappingJson.js";
import {getTotal} from "../../Dashboard/utils/operations";
import getters from "../store/gettersDistrictSelector.js";
import IconButton from "../../../../src/shared/modules/buttons/components/IconButton.vue";
import layerCollection from "../../../../src/core/layers/js/layerCollection.js";
import {mapActions, mapGetters, mapMutations} from "vuex";
import mutations from "../store/mutationsDistrictSelector.js";
import {polygon as turfPolygon, featureCollection as turfFeatureCollection} from "@turf/helpers";
import {prepareDistrictLevels} from "../utils/prepareDistrictLevels.js";
import {setBBoxToGeom} from "../../utils/setBBoxToGeom.js";
import {singleClick} from "ol/events/condition";
import {styleSelectedDistrictLevels} from "../utils/styleSelectedDistrictLevels.js";
import TagGroup from "../../shared/modules/tags/components/TagGroup.vue";
import thousandsSeparator from "@shared/js/utils/thousandsSeparator.js";
import {truncate} from "@turf/truncate";
import wktParser from "../../utils/wktParser";

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
            // Indicates whether the drag box interaction is active or not.
            isDragBoxActive: false,
            // Indicates whether this component is active
            isActive: false,
            ignoreSelectionChange: false
        };
    },
    computed: {
        ...mapGetters("Modules/DistrictSelector", Object.keys(getters)),
        ...mapGetters("Modules/DistrictSelector", {
            cards: "selectionCardsStatisticalData",
            cardsSubject: "selectionCardsSubjectData"
        }),
        ...mapGetters("Menu", ["zoomToExtentPadding"]),
        ...mapGetters(["allLayerConfigs", "restServiceById", "visibleSubjectDataLayerConfigs"]),

        /**
         * Returns the currently active card from the cards array.
         * @returns {Object} The active card object.
         */
        activeCard () {
            return this.cards.find(card => card.status === "active");
        },

        /**
         * Returns the currently active subject card from the cardsSubject array.
         * @returns {Object} The active subject card object.
         */
        activeSubjectCard () {
            return this.cardsSubject.find(card => card.status === "active");
        },

        /**
         * Determines whether the confirm button should be disabled.
         * @returns {boolean} - Returns `true` if the button should be disabled, otherwise `false`.
         */
        disableButton () {
            return this.selectedDistrictNames.length === 0 || !(this.selectedDistrictNames.length > 0 && !this.activeCard);
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
        cards: {
            handler (val) {
                if (!this.isActive && typeof this.activeCard !== "undefined") {
                    const bboxGeomWKT = this.activeCard.subjectFeatureWKT,
                        decodedFeature = wktParser.decodeFeature(bboxGeomWKT);

                    this.addSubjectAreaToLayer(decodedFeature);
                    this.setBoundingGeometry(decodedFeature.getGeometry());
                    this.setSelectedDistrictLevelId(this.activeCard.districtLevelId);
                    this.$nextTick(() => {
                        this.updateSelectedFeatures(this.activeCard.selectedDistricts);
                        this.updateStatFeatures(this.selectedDistrictLevel, this.selectedDistricts, this.activeCard);
                        this.allLayerConfigs.forEach(layerConfig => {
                            layerConfig.bboxGeometry = decodedFeature.getGeometry();
                        });
                        this.updateLayerBbox(bboxGeomWKT);
                    });
                }

                this.createCardsFromStatisticalCards(val, this.cardsSubject);
            },
            deep: true
        },

        /**
         * Watches the isDragBoxActive property and activates or deactivates the drag box interaction.
         * @returns {void}
         */
        isDragBoxActive () {
            this.dragBox.setActive(this.isDragBoxActive);
        },

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
            if (this.ignoreSelectionChange) {
                return;
            }
            if (this.isActive && this.activeCard && this.selectedDistrictNames.sort().toString() !== this.activeCard.selectedDistricts.sort().toString()) {
                this.activeCard.status = "";
            }
        },

        selectedDistrictsCollection: "transferFeatures",
        selectedDistrictLevelId: ["clearFeatures", "changeSelectedDistrictLevel"],
        selectedTabItem (newValue, oldValue) {
            if (oldValue.type === "subject") {
                this.cardsSubject.forEach((card, index) => {
                    this.cards[index].subjectFeatureWKT = card.subjectFeatureWKT;
                    if (card.status === "active") {
                        this.toggleCardStatus(index);
                    }
                });
            }
        },
        visibleSubjectDataLayerConfigs: {
            handler () {
                if (typeof this.activeSubjectCard !== "undefined") {
                    this.updateLayerBbox(this.activeSubjectCard.subjectFeatureWKT);
                    return;
                }
                this.updateLayerBbox(this.activeCard?.bboxGeomWKT);
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
        this.setSelectedFeatureStyle(this.select, 0.2);
        this.isActive = true;
        this.select.setActive(true);
    },
    deactivated () {
        if (!this.activeCard) {
            this.clearFeatures();
            this.clearSubjectAreaFromLayer();
        }

        this.isActive = false;
        this.select.setActive(false);
        this.setSelectedFeatureStyle(this.select, 0);
        this.isDragBoxActive = false;

        const activeStatIndex = this.cards.findIndex(card => card.status === "active");

        if (activeStatIndex !== -1) {
            this.cardsSubject.forEach(card => {
                card.status = "";
            });

            this.cardsSubject[activeStatIndex].status = "active";
        }
    },
    beforeUnmount () {
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
         * Adds the subject area feature to the subject-area layer.
         * @param {ol/Feature} feature - The feature to add to the layer.
         * @returns {void}
         */
        addSubjectAreaToLayer (feature) {
            const layer = getLayerById("subject-area", {
                "fill-color": "rgba(235, 138, 62, 0)",
                "stroke-color": "#EB8A3E",
                "stroke-width": 3
            });

            layer.getLayerSource().addFeature(feature);
            layer.getLayer().setVisible(true);
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
         * Remove all features from the features collection of the select interaction.
         * @returns {void}
         */
        clearFeatures () {
            this.select.getFeatures().clear();
        },

        /**
         * Clears the subject area from the subject-area layer.
         * @returns {void}
         */
        clearSubjectAreaFromLayer () {
            const layer = getLayerById("subject-area", {
                "fill-color": "rgba(235, 138, 62, 0)",
                "stroke-color": "#EB8A3E",
                "stroke-width": 3
            });

            layer.getLayerSource().clear();
            layer.getLayer().setVisible(false);
        },

        /**
         * Creates card objects from the provided statistical card data.
         * @param {Object[]} cardsStatistical - An array of statistical card data used as input.
         * @param {Object[]} cards - An array to store the resulting card objects.
         */
        createCardsFromStatisticalCards (cardsStatistical, cards) {
            [...cardsStatistical].reverse().forEach(card => {
                const foundEqualObject = cards.find(existingCard => {
                    return JSON.stringify(existingCard.districtNames.sort()) === JSON.stringify(card.selectedDistricts.sort());
                });

                if (foundEqualObject) {
                    return;
                }

                this.addCard(card.bboxGeomWKT, 0, card.selectedDistricts, card.status, card.districtLevelId, card.districtLevelLabel, card.extent);
            });
        },

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
        addCard (wktFeature, buffer, districtNames, status, districtLevelId, districtLevelLabel, extent) {
            this.cardsSubject.unshift({
                badgeList: this.getBadges(),
                buffer,
                data: [
                    {value: "Bezugsebene: " + districtLevelLabel},
                    {icon: "bi-map", label: "Gebiete: " + getLimitedDistictName(districtNames)},
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
                status: status,
                subjectFeatureWKT: wktFeature,
                extent: extent
            });
        },

        /**
         * Downloads the feature in geojson file.
         * @param {Object} val - The item object.
         * @returns {void}
         */
        exportFeature (val) {
            downloadJsonToFile(featuresToGeoJsonCollection(wktParser.decodeFeatures(val?.features)), val?.districtLevelLabel + ".geojson");
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
         * Merges the passed geometries and creates a feature from them as WKT.
         * @param {ol/Geometry[]} geometryCollection - An array of geometries.
         * @returns {String} The merged feature encoded as WKT.
         */
        mergeGeometriesToWKT (geometryCollection) {
            const geojsonPolygons = geometryCollection.flatMap(geometry => {
                if (geometry.getType() === "Polygon") {
                    return [turfPolygon(geometry.getCoordinates())];
                }
                if (geometry.getType() === "MultiPolygon") {
                    return geometry.getPolygons().map(polygon => turfPolygon(polygon.getCoordinates()));
                }
                return [];
            });

            let mergedPolygons = geojsonPolygons[0];

            for (let i = 1; i < geojsonPolygons.length; i++) {
                mergedPolygons = turfUnion(turfFeatureCollection([
                    truncate(mergedPolygons, {precision: 3, mutate: true}),
                    truncate(geojsonPolygons[i], {precision: 3, mutate: true})
                ]));
            }

            return wktParser.encodeFeature(
                geoJsonToFeature(mergedPolygons, "EPSG:25832")
            );
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
                    source = this.getDistrictLevelById(this.selectedDistrictLevelId).layer.getSource(),
                    keyOfAttrName = this.selectedDistrictLevel.keyOfAttrName;

                source.forEachFeatureIntersectingExtent(extent, (feature) => {
                    if (this.selectedDistrictLevel.filterableValues.includes(feature.get(keyOfAttrName))) {
                        featureCollection.push(feature);
                    }
                });
                this.isDragBoxActive = false;
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

                // To ensure that the feature style is used for printing, the styleId attribute must be set to any value.
                evt.element.set("styleId", "selected-district");
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
            this.cardsSubject.splice(index, 1);
            if (!this.activeCard && this.cards.length > 0) {
                this.toggleCardStatus(this.cards.length - 1);
            }
            else if (this.cards.length === 0) {
                this.clearFeatures();
                this.clearSubjectAreaFromLayer();
                this.updateLayerBbox(undefined);
            }
        },

        /**
         * Sets the style of the selected features of the select interaction.
         * @param {ol/interaction/Select} selectInteraction - The select interaction containing the selected features to style.
         * @param {number} opacity - The opacity value to set for the features fill color (between 0 and 1).
         */
        setSelectedFeatureStyle (selectInteraction, opacity = 0) {
            selectInteraction.style_.fill_.color_ = [0, 141, 203, opacity];
            selectInteraction.getFeatures().forEach(feature => {
                feature.setStyle(() => new Style({
                    fill: new Fill({color: [0, 141, 203, opacity]}),
                    stroke: new Stroke({color: [0, 141, 203, 1], width: 8})
                }));
            });
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
                        fill: new Fill({color: "rgba(0, 141, 203, 0.2)"}),
                        stroke: new Stroke({color: "rgba(0, 141, 203, 1)", width: 8})
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
         * Toggles isDragBoxActive to control the drag box.
         * @returns {void}
         */
        toggleDragBox () {
            this.isDragBoxActive = !this.isDragBoxActive;
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
                bboxGeom = getBoundingGeometry(this.selectedFeatures, 0);

            if (this.cards.some(card => JSON.stringify(card.selectedDistricts.sort()) === JSON.stringify(this.selectedDistrictNames.sort()))) {
                const index = this.cards.findIndex(card => JSON.stringify(card.selectedDistricts.sort()) === JSON.stringify(this.selectedDistrictNames.sort()));

                this.toggleCardStatus(index);
                return;
            }

            this.isDragBoxActive = false;
            this.cards.unshift({
                badgeList: [{
                    backgroundColor: "rgba(0, 141, 203, 1)",
                    color: "rgba(255, 255, 255, 1)",
                    icon: "bi bi-bar-chart",
                    text: this.$t("additional:modules.cosi.districtSelector.statisticalData")
                },
                {
                    backgroundColor: "#EB8A3E",
                    color: "rgba(255, 255, 255, 1)",
                    icon: "bi bi-layers",
                    text: this.$t("additional:modules.cosi.districtSelector.subjectData")
                }],
                data: [
                    {value: this.$t("additional:modules.cosi.districtSelector.districtLevel") + ": " + this.selectedDistrictLevel.label},
                    {icon: "bi-map", label: this.$t("additional:modules.cosi.districtSelector.selectedAreas") + ": " + getLimitedDistictName(this.selectedDistrictNames)},
                    {icon: "bi-people", label: this.$t("additional:modules.cosi.districtSelector.population") + ": Berechnung läuft..."}
                ],
                districtLevelId: this.selectedDistrictLevel.layerId,
                districtLevelLabel: this.selectedDistrictLevel.label,
                downloadable: false,
                extent,
                features: wktParser.encodeFeatures(this.selectedFeatures.slice()),
                bboxGeomWKT: wktParser.encodeGeometry(bboxGeom),
                icon: "bi-image",
                selectedDistricts: this.selectedDistrictNames,
                status: "",
                subjectFeatureWKT: this.mergeGeometriesToWKT(bboxGeom.getGeometries())
            });

            this.toggleCardStatus(0);

            if (extent) {
                this.setBoundingGeometry(bboxGeom);
                this.setFilterGeometry(bboxGeom);
                this.updateStatFeatures(this.selectedDistrictLevel, this.selectedDistricts, this.cards.at(0));
            }
            else {
                this.resetView();
                this.setBoundingGeometry(undefined);
                this.updateLayerBbox(undefined);
                this.setFilterGeometry(this.areaSelectorGeom || false);
            }
        },

        updateLayerBbox (geometry) {
            if (typeof geometry === "undefined") {
                setBBoxToGeom(this, geometry, layerCollection.getLayers());
            }
            else {
                const geometryCollection = wktParser.decodeGeometry(geometry);

                setBBoxToGeom(this, geometryCollection, layerCollection.getLayers());
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
            if (this.activeCard) {
                this.activeCard.status = "";
                this.$nextTick(() => {
                    this.updateLayerBbox(undefined);
                });
            }
        },

        /**
         * Updates the statistical features based on the selected district level and the selected districts.
         * @param {Object} selectedDistrictLevel - The selected district level.
         * @param {Object[]} selectedDistricts - Array of the selected districts.
         * @return {void}
         */
        updateStatFeatures (selectedDistrictLevel, selectedDistricts, card) {
            this.loadStatFeatures({
                districtLevel: selectedDistrictLevel,
                getStatFeatures: getFeature.getFeaturePOST,
                districts: selectedDistricts
            }).then(() => {
                this.generateTable().then((dashboardItems) => {
                    const foundItem = dashboardItems.find((item) => item.category === this.mapping[0].value),
                        districtLabels = selectedDistricts.map(district => district.getLabel()),
                        population = getTotal(foundItem, districtLabels, foundItem.years[0]);

                    card.population = thousandsSeparator(population);
                    card.data[2].label = this.$t("additional:modules.cosi.districtSelector.population") + ": " + thousandsSeparator(population);
                });

            });
        },

        /**
         * Toggles the status of a card at the specified index.
         * @param {Number} index - Index of the card to toggle
         * @return {void}
         */
        toggleCardStatus (index) {
            const activeIndex = this.cards.findIndex(card => card.status === "active"),
                subjectFeatureWKT = this.cards[index]?.subjectFeatureWKT,
                subjectFeature = wktParser.decodeFeature(subjectFeatureWKT);

            this.clearSubjectAreaFromLayer();
            this.addSubjectAreaToLayer(subjectFeature);

            if (activeIndex === index) {
                this.updateLayerBbox(subjectFeatureWKT);
                return;
            }
            if (activeIndex !== -1 && activeIndex !== index) {
                this.cards[activeIndex].status = "";
            }
            this.cards[index].status = "active";
            this.setSelectedDistrictLevelId(this.cards[index].districtLevelId);

            this.ignoreSelectionChange = true;

            this.$nextTick(() => {
                this.updateSelectedFeatures(this.cards[index].selectedDistricts);
                this.updateLayerBbox(subjectFeatureWKT);
                this.zoomToExtent({extent: this.cards[index].extent, options: {padding: this.zoomToExtentPadding}});

                this.ignoreSelectionChange = false;
            });
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
                        :id="'districtSelectorDragBox'"
                        :aria="'Rechteck zeichnen'"
                        :class-array="['btn-primary', 'me-3', isDragBoxActive ? 'active': '']"
                        :icon="'bi bi-square'"
                        :interaction="() => toggleDragBox()"
                        :label="'Rechteck'"
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
                class="d-flex flex-column-reverse"
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

    #districtSelectorDragBox.active {
        background-color: $dark_blue;
        color: rgba(255, 255, 255, 1);
    }
</style>
