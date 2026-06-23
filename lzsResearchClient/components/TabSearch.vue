<script>
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import InputText from "./shared/InputText.vue";
import SpinnerItem from "@shared/modules/spinner/components/SpinnerItem.vue";
import ButtonGroup from "@shared/modules/buttons/components/ButtonGroup.vue";
import {TAB_SET_CURRENT} from "@shared/modules/tabs/components/TabContainer.vue";
import DrawTypes from "@shared/modules/draw/components/DrawTypes.vue";
import DrawEdit from "@shared/modules/draw/components/DrawEdit.vue";
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";
import modifyInteraction from "@masterportal/masterportalapi/src/maps/interactions/modifyInteraction";
import LzsResearchClientSearchBar from "./searchBar/components/LzsResearchClientSearchBar.vue";
import {roundFileSizeToFixed} from "../utils/zipHelpers";
import getOAFFeature from "@shared/js/api/oaf/getOAFFeature";
import {getTranslationForAttribute} from "../utils/translationHelpers";

import Polygon from "ol/geom/Polygon";
import LineString from "ol/geom/LineString";
import Point from "ol/geom/Point";
import MultiPolygon from "ol/geom/MultiPolygon.js";
import Feature from "ol/Feature.js";
import {Fill, Stroke, Style} from "ol/style";
import {getArea} from "ol/sphere";

import {mapGetters, mapActions, mapMutations} from "vuex";

export default {
    name: "TabSearch",
    components: {
        FlatButton,
        InputText,
        SpinnerItem,
        DrawTypes,
        DrawEdit,
        ButtonGroup,
        SwitchInput,
        LzsResearchClientSearchBar
    },
    inject: {
        setCurrentTab: {from: TAB_SET_CURRENT, default: null}
    },
    data () {
        return {
            attributeSearchModeIsActive: false,
            selectedArchive: "",
            searchWithAttributeFormData: {},
            archives: {},
            showSpinner: false,
            isAttributeSearchFormValid: true,
            selectedArchiveIds: [],
            selectedYears: [],
            lzsDrawLayer: null,
            lzsDrawLayerSource: null,
            currentModifyInteraction: null,
            drawEnd: false,
            searchGeometry: null,
            selectedButtonGroup: "extent",
            showAreaWarning: false,
            searchGeometryArea: null,
            selectedParcelDistrict: null,
            parcelNumberInputValue: ""
        };
    },
    computed: {
        ...mapGetters("Modules/LzsResearchClient", [
            "dataClassList",
            "placeholderDataClassList",
            "archiveYears",
            "archiveList",
            "archiveHasGeoref",
            "lzsCurrentLayout",
            "lzsDrawTypes",
            "lzsDrawIcons",
            "lzsSelectedDrawType",
            "lzsSelectedDrawTypeMain",
            "lzsSelectedInteraction",
            "lzsDrawEdits",
            "minScaleValue",
            "maxResultValueCount",
            "addressSearchCoordinates",
            "maxGeometryArea",
            "parcelSourceData",
            "alkisBaseUrl"
        ]),
        ...mapGetters("Maps", [
            "projectionCode",
            "scale",
            "extent"
        ]),
        ...mapGetters("Menu", [
            "expanded"
        ]),
        archiveWithGeorefList () {
            return this.archiveList.filter((archive) => {
                return this.archiveHasGeoref(archive.id);
            });
        },
        /**
         * Generates a sorted list of years grouping the selected archives.
         *
         * Iterates through selected IDs to build a map keyed by year:
         * - If the year is encountered for the first time, it initializes a new entry with an empty array.
         * - Then, it pushes the current archive name into that year's list (whether newly created or existing).
         *
         * @returns {Array<{year: string, archiveNames: string[]}>} Ascending sorted array of year objects.
         */
        yearsList () {
            const yearsList = {};

            this.selectedArchiveIds.forEach(id => {
                const item = this.archiveYears && this.archiveYears[id];

                if (!item || !Array.isArray(item.years)) {
                    return;
                }

                item.years.forEach(singleYear => {
                    if (!yearsList[singleYear]) {
                        yearsList[singleYear] = {
                            year: singleYear,
                            archiveNames: []
                        };
                    }
                    if (!yearsList[singleYear].archiveNames.includes(item.archiveName)) {
                        yearsList[singleYear].archiveNames.push(item.archiveName);
                    }
                });
            });

            return Object.values(yearsList).sort((a, b) => a.year - b.year);
        },
        buttonGroupLevels () {
            return [
                {name: this.$t("additional:modules.lzsResearchClient.tabs.tabSearch.spatialSelectionGroup.extent")},
                {name: this.$t("additional:modules.lzsResearchClient.tabs.tabSearch.spatialSelectionGroup.geometries")},
                {name: this.$t("additional:modules.lzsResearchClient.tabs.tabSearch.spatialSelectionGroup.address")},
                {name: this.$t("additional:modules.lzsResearchClient.tabs.tabSearch.spatialSelectionGroup.parcel")}
            ];
        },
        selectedSpatialButtonName () {
            switch (this.selectedButtonGroup) {
                case "geometry":
                    return this.$t("additional:modules.lzsResearchClient.tabs.tabSearch.spatialSelectionGroup.geometries");
                case "address":
                    return this.$t("additional:modules.lzsResearchClient.tabs.tabSearch.spatialSelectionGroup.address");
                case "parcel":
                    return this.$t("additional:modules.lzsResearchClient.tabs.tabSearch.spatialSelectionGroup.parcel");
                case "extent":
                default:
                    return this.$t("additional:modules.lzsResearchClient.tabs.tabSearch.spatialSelectionGroup.extent");
            }
        },
        isSpatialSearchFormValid () {
            if (this.selectedArchiveIds.length === 0) {
                return false;
            }

            if (!this.searchGeometry && ["geometry", "address", "parcel"].includes(this.selectedButtonGroup)) {
                return false;
            }

            if (this.scale > this.minScaleValue && this.selectedButtonGroup === "extent") {
                return false;
            }

            return true;
        },
        maxValueCountPlaceholder () {
            if (this.maxResultValueCount >= 10) {
                return "10";
            }
            else if (this.maxResultValueCount >= 5) {
                return "5";
            }

            return String(this.maxResultValueCount);
        },
        maxValueCountDefaultValue () {
            if (this.maxResultValueCount >= 25) {
                return "25";
            }
            else if (this.maxResultValueCount >= 10) {
                return "10";
            }

            return "1";
        },
        spatialAreaWarning () {
            const areaInSquareKilometers = roundFileSizeToFixed(this.searchGeometryArea / 1e6),
                maxAreaInSquareKilometers = roundFileSizeToFixed(this.maxGeometryArea / 1e6);

            if (this.selectedButtonGroup === "extent" && this.scale > this.minScaleValue) {
                return this.$t("additional:modules.lzsResearchClient.tabs.tabSearch.extentWarningMessage", {scale: this.minScaleValue});
            }
            if (this.selectedButtonGroup === "geometry" && this.showAreaWarning) {
                return this.$t("additional:modules.lzsResearchClient.tabs.tabSearch.geometryAreaWarningMessage", {maxArea: maxAreaInSquareKilometers, area: areaInSquareKilometers});
            }
            if (this.selectedButtonGroup === "parcel" && this.showAreaWarning) {
                return this.$t("additional:modules.lzsResearchClient.tabs.tabSearch.parcelSearchNoResults");

            }
            return null;
        }
    },
    watch: {
        selectedArchive (newValue) {
            if (newValue) {
                this.validateSearchWithAttributeForm();
            }
        },
        /** Watch the yearsList to update the selectedYears */
        yearsList (yearsListNewValue) {
            const availableYears = yearsListNewValue.map(y => y.year);

            this.selectedYears = this.selectedYears.filter(year =>availableYears.includes(year));
        },
        lzsSelectedDrawType (newValue, oldValue) {
            if (this.drawEnd) {
                this.drawEnd = false;
                return;
            }

            if (newValue !== oldValue) {
                this.removeSearchGeometry();
                this.showAreaWarning = false;
            }
        },
        async selectedButtonGroup (newValue, oldValue) {
            if (newValue === "parcel" && oldValue !== "parcel") {
                if (!this.parcelSourceData) {
                    await this.retrieveParcelSourceData();
                }
            }
        }
    },
    async created () {
        this.lzsDrawLayer = await this.addNewLayerIfNotExists({layerName: "lzsDrawLayer", alwaysOnTop: true});

        this.lzsDrawLayerSource = this.lzsDrawLayer.getSource();
    },
    async mounted () {
        await this.fetchDataClassList();
        await this.fetchPlaceholders();

        this.initializeSearchForm();
    },
    methods: {
        ...mapActions("Modules/LzsResearchClient", [
            "fetchDataClassList",
            "searchByAttribute",
            "fetchPlaceholders",
            "fetchYears",
            "searchByGeometry",
            "retrieveParcelSourceData"
        ]),
        ...mapActions("Maps", [
            "addNewLayerIfNotExists",
            "addInteraction",
            "removeInteraction",
            "removePointMarker",
            "placingPointMarker",
            "zoomToExtent"
        ]),
        ...mapMutations("Modules/LzsResearchClient", [
            "setLzsSelectedDrawType",
            "setLzsSelectedInteraction",
            "setSearchInput",
            "setAddressSearchCoordinates",
            "setErrorMessage"
        ]),
        /**
         * Update the active search form.
         * @param {Boolean} attributeSearchMode - Is false if the geometry search form is to be activated.
         */
        changeSearchMode (attributeSearchMode) {
            this.attributeSearchModeIsActive = attributeSearchMode;
            if (attributeSearchMode) {
                this.removeSearchGeometry();
                this.removePointMarker();
                this.setSearchInput("");
                this.setAddressSearchCoordinates(null);

                if (this.parcelSourceData) {
                    this.clearParcelSearch(true);
                }
            }
        },
        /**
         * Activates or deactivates the modify interaction without destroying it,
         * so it can be re-enabled when the user returns to this tab.
         * @param {Boolean} active Whether the modify interaction should listen to map events.
         * @returns {void}
         */
        setMapInteractionsActive (active) {
            this.currentModifyInteraction?.setActive(active);
        },
        /**
         * Sets `searchGeometry` to null and removes the map interaction.
         */
        removeSearchGeometry () {
            this.searchGeometry = null;

            this.lzsDrawLayerSource.clear();

            if (this.currentModifyInteraction) {
                this.currentModifyInteraction.un("modifyend", this.onModifyEnd);
                this.currentModifyInteraction?.un("modifystart", this.onModifyStart);
                this.removeInteraction(this.currentModifyInteraction);
                this.currentModifyInteraction = null;
            }

            if (this.showAreaWarning) {
                this.showAreaWarning = false;
            }
        },
        /**
         * Set the selected archive identifier.
         * @param {string} archive - The archive name to select.
         */
        setSelectedArchive (archiv) {
            this.selectedArchive = archiv;
        },
        /**
         * Set the selected parcel area identifier.
         * @param {string} parcelDistrict - The parcel district name to select.
         */
        setSelectedParcelDistrict (parcelDistrict) {
            this.selectedParcelDistrict = parcelDistrict;
        },
        /**
         * Initialize archive and form data structures from `dataClassList`.
         */
        initializeSearchForm () {
            const formData = {},
                archives = {};

            this.dataClassList?.forEach(element => {
                const archiveName = element.name,
                    archiveId = element.id,
                    attributes = element.highestActiveDataclassVersion.dataclassAttributs
                        .filter(attribute => attribute.usage === "I")
                        .map(attribute => ({
                            ...attribute,
                            value: "",
                            placeholder: this.placeholderDataClassList?.[archiveId]?.[attribute.name]?.PLACEHOLDER || "",
                            labelKey: `additional:modules.lzsResearchClient.tabs.tabSearch.${attribute.name.toLowerCase()}`,
                            pattern: this.placeholderDataClassList?.[archiveId]?.[attribute.name]?.PATTERN || "",
                            testNumberRange: null,
                            errorKey: this.placeholderDataClassList?.[archiveId]?.[attribute.name]?.ERROR_KEY,
                            errorParams: this.placeholderDataClassList?.[archiveId]?.[attribute.name]?.ERROR_PARAMS || {},
                            errorMessage: ""
                        }));

                formData[archiveName] = [
                    ...attributes,
                    {
                        name: "maxValueCount",
                        value: this.maxValueCountDefaultValue,
                        labelKey: "additional:modules.lzsResearchClient.tabs.tabSearch.maxValueCount",
                        pattern: "[0-9]*",
                        testNumberRange: [1, this.maxResultValueCount],
                        placeholder: this.maxValueCountPlaceholder,
                        errorKey: "numberRangeError",
                        errorParams: {minNum: 1, maxNum: this.maxResultValueCount},
                        errorMessage: ""
                    }
                ];

                archives[element.name] = element.id;
            });

            this.searchWithAttributeFormData = formData;
            this.archives = archives;
            this.setSelectedArchive(this.dataClassList[0]?.name);
        },
        /**
         * Build a search payload from the form data, show a spinner and perform the search.
         * After search, switch to the result tab.
         */
        async searchWithAttribute () {
            if (!this.isAttributeSearchFormValid) {
                return;
            }

            const payload = {
                dataclassIds: [this.archives[this.selectedArchive]],
                maxvaluecount: "",
                fachattribute: []
            };

            this.searchWithAttributeFormData[this.selectedArchive].forEach(formItem => {
                if (formItem.usage === "I") {
                    payload.fachattribute.push({
                        id: formItem.name.toUpperCase(),
                        value: formItem.value, type: formItem.usage
                    });
                }

                if (formItem.name === "maxValueCount") {
                    payload.maxvaluecount = formItem.value;
                }
            });

            this.showSpinner = true;

            this.searchByAttribute(payload)
                .then((result) => {
                    if (result) {
                        this.setCurrentTab("tabResult");
                    }
                })
                .finally(() => {
                    this.showSpinner = false;
                });
        },
        /**
         * Validate form fields against their patterns and set error messages accordingly.
         */
        validateSearchWithAttributeForm () {
            const attributes = this.searchWithAttributeFormData[this.selectedArchive];

            this.isAttributeSearchFormValid = true;

            attributes.forEach(attribute => {
                attribute.errorMessage = "";

                if (attribute.pattern && attribute.value !== null && String(attribute.value) !== "") {
                    const regex = new RegExp(`^${attribute.pattern}$`);

                    if (!regex.test(String(attribute.value))) {
                        attribute.errorMessage = this.$t(`additional:modules.lzsResearchClient.tabs.tabSearch.${attribute.errorKey}`,
                            attribute.errorParams
                        );
                        this.isAttributeSearchFormValid = false;
                    }
                }

                if (attribute.testNumberRange && attribute.value !== null && Number(attribute.value) !== "") {
                    if (
                        Number(attribute.value) < attribute.testNumberRange[0] ||
                        Number(attribute.value) > attribute.testNumberRange[1]
                    ) {
                        attribute.errorMessage = this.$t(`additional:modules.lzsResearchClient.tabs.tabSearch.${attribute.errorKey}`,
                            attribute.errorParams
                        );
                        this.isAttributeSearchFormValid = false;
                    }
                }
            });
        },
        /**
         * Reset the attribute form and related validation to initial state.
         */
        resetForm () {
            this.initializeSearchForm();
            this.validateSearchWithAttributeForm();
            this.resetGeometricSearchForm();
            this.removeSearchGeometry();
            this.setSearchInput("");
            this.setAddressSearchCoordinates(null);
            this.clearParcelSearch(true);
        },
        /**
         * Reset the geometric search selection (archive ids).
         */
        resetGeometricSearchForm () {
            this.selectedArchiveIds = [];
            // IMPORTANT:
            // we do not reset archiveYears here, because it works like a caching mechanism.
            // We filter archiveYears according to selectedArchiveIds in yearsList and show yearsList in template. See yearsList computed.
            // So if we dont reset it, we can use the data later, without sending a new request. See onSelectedArchiveIdsChange method.
            // For later implementation, please do not reset archiveYears and dont use it directly so that you need to reset it sometime.
        },
        /**
         * Toggle an archive id in `selectedArchiveIds` and fetch years if needed.
         * @param {string} archiveId - Archive identifier to toggle.
         * @param {Event} event - The change event from the checkbox.
         */
        async onSelectedArchiveIdsChange (archiveId, event) {
            const checked = event.target.checked;

            if (checked) {
                if (!this.selectedArchiveIds.includes(archiveId)) {
                    this.selectedArchiveIds.push(archiveId);
                }

                if (!this.archiveYears[archiveId]) {
                    await this.fetchYears(archiveId);
                }
            }
            else {
                this.selectedArchiveIds = this.selectedArchiveIds.filter(id => id !== archiveId);
            }
        },
        /**
         * Toggle a year in `selectedYears`.
         * @param {number|string} year - Year to toggle.
         * @param {Event} event - The change event from the checkbox.
         */
        onSelectedYearsChange (year, event) {
            const checked = event.target.checked;

            if (checked) {
                if (!this.selectedYears.includes(year)) {
                    this.selectedYears = [...this.selectedYears, year];
                }
            }
            else {
                this.selectedYears = this.selectedYears.filter(y => y !== year);
            }
        },
        /**
         * Gets the current map extent and if needed adjusts it for expanded menus,
         * creates a polygon from the extent and sets the searchGeometry.
         *
         *  @returns {void}
         */
        getCurrentVisibleMapExtent () {
            // The search by extent is only possible when the map is zoomed in enough
            // and the current map scale is smaller or equal to the minScaleValue
            if (this.scale > this.minScaleValue) {
                return;
            }

            // Get only the extent of the visible map area if any menus are expanded
            const map = mapCollection.getMap("2D"),
                bottomLeftPixelAtCoordinates = map?.getPixelFromCoordinate([this.extent[0], this.extent[1]]),
                topRightPixelAtCoordinates = map?.getPixelFromCoordinate([this.extent[2], this.extent[3]]),
                rightPadding = this.expanded("secondaryMenu")
                    ? document.getElementById("mp-menu-secondaryMenu").offsetWidth
                    : 20,
                leftPadding = this.expanded("mainMenu")
                    ? document.getElementById("mp-menu-mainMenu").offsetWidth
                    : 20,
                shiftedBottomLeftPixelX = [bottomLeftPixelAtCoordinates[0] + leftPadding, bottomLeftPixelAtCoordinates[1]],
                shiftedBottomLeftCoordinate = map.getCoordinateFromPixel(shiftedBottomLeftPixelX),
                shiftedTopRightPixelX = [topRightPixelAtCoordinates[0] - rightPadding, topRightPixelAtCoordinates[1]],
                shiftedTopRightCoordinate = map.getCoordinateFromPixel(shiftedTopRightPixelX),
                bottomLeft = [
                    shiftedBottomLeftCoordinate[0],
                    shiftedBottomLeftCoordinate[1]
                ],
                topRight = [
                    shiftedTopRightCoordinate[0],
                    shiftedTopRightCoordinate[1]
                ],
                polygonCoordinates = [[
                    bottomLeft,
                    [topRight[0], bottomLeft[1]],
                    topRight,
                    [bottomLeft[0], topRight[1]],
                    bottomLeft
                ]];

            this.searchGeometry = {
                type: "Polygon",
                coordinates: JSON.parse(JSON.stringify(polygonCoordinates))
            };
        },
        resetDrawingInteraction () {
            this.drawEnd = true;

            this.removeInteraction(this.lzsSelectedInteraction);
            this.setLzsSelectedDrawType("");
            this.setLzsSelectedInteraction("");
        },
        cancelIncompleteDrawing () {
            if (this.currentModifyInteraction) {
                return;
            }
            this.resetDrawingInteraction();
        },
        /**
         * Event handler for the 'drawend' event.
         * Triggered when a drawing operation is completed.
         *
         * @param {DrawEvent} event - The event object containing details about the completed drawing.
         * @returns {void}
         */
        onDrawEnd (event) {
            this.setSearchGeometry(event.feature.getGeometry());
            this.resetDrawingInteraction();
            this.editFeature();
        },
        /**
         * Event handler for the 'modifyend' event.
         * Triggered when a modification operation on a feature is completed, updating the search geometry accordingly.
         *
         * @param {ModifyEvent} event - The event object containing details about the completed modification.
         * @returns {void}
         */
        onModifyEnd (event) {
            const feature = event.features.getArray()[0];

            this.setSearchGeometry(feature.getGeometry());
        },
        /**
         * Handles the start of a draw modification event.
         * Triggered when a modify interaction begins on a feature.
         *
         * @returns {void}
         */
        onModifyStart () {
            this.showAreaWarning = false;
        },
        /**
         * Sets the map interaction to modify a feature.
         *
         * @returns {void}
         */
        editFeature () {
            this.currentModifyInteraction = modifyInteraction.createModifyInteraction(this.lzsDrawLayerSource);
            this.currentModifyInteraction.on("modifyend", this.onModifyEnd);
            this.currentModifyInteraction?.on("modifystart", this.onModifyStart);
            this.addInteraction(this.currentModifyInteraction);
        },
        /**
         * Sets the searchGeometry based on the provided geometry.
         * If the geometry is a LineString, it converts it to a Polygon.
         * @param {LineString|Polygon|Point} geometry - The geometry to set as searchGeometry.
         *
         * @return {void}
         */
        setSearchGeometry (geometry) {
            const style = new Style({
                fill: new Fill({
                    color: this.lzsCurrentLayout.fillColor
                }),
                stroke: new Stroke({
                    color: this.lzsCurrentLayout.strokeColor,
                    width: this.lzsCurrentLayout.strokeWidth
                })
            });

            if (geometry instanceof LineString) {
                const coordinates = geometry.getCoordinates(),
                    polygonCoordinates = [
                        [...coordinates, coordinates[0]]
                    ],
                    polygon = new Polygon(polygonCoordinates);

                this.searchGeometry = {
                    type: "Polygon",
                    coordinates: JSON.parse(JSON.stringify(polygonCoordinates))
                };

                const feature = new Feature(polygon);

                feature.setStyle(style);

                this.lzsDrawLayerSource.addFeature(feature);

                if (this.checkSearchGeometryArea(polygon)) {

                    this.searchGeometry = {
                        type: "Polygon",
                        coordinates: JSON.parse(JSON.stringify(polygonCoordinates))
                    };
                }
            }
            else if (geometry instanceof Polygon) {
                if (this.selectedButtonGroup === "address" || this.selectedButtonGroup === "parcel") {
                    this.lzsDrawLayerSource.clear();

                    const feature = new Feature(geometry);

                    feature.setStyle(style);

                    this.lzsDrawLayerSource.addFeature(feature);

                    this.zoomToExtent({
                        extent: geometry.getExtent(),
                        options: {
                            padding: this.mapZoomToExtentPadding()
                        }
                    });
                }

                if (this.checkSearchGeometryArea(geometry)) {
                    this.searchGeometry = {
                        type: "Polygon",
                        coordinates: JSON.parse(JSON.stringify(geometry.getCoordinates()))
                    };
                }
            }
            else if (geometry instanceof Point) {
                this.searchGeometry = {
                    type: "Point",
                    coordinates: JSON.parse(JSON.stringify(geometry.getCoordinates()))
                };
            }
            else {
                this.searchGeometry = null;
                this.lzsDrawLayerSource.clear();
            }
        },
        /**
         * Checks whether the provided geometry area is within acceptable bounds for performing a search operation.
         *
         * @param {Object} geometry - The geometry object whose area needs to be validated.
         * @param {number} [maxArea] - The maximum allowed area for the search geometry.
         * @returns {boolean} Returns `true` if the geometry area is valid, `false` otherwise.
         */
        checkSearchGeometryArea (geometry) {
            this.searchGeometryArea = getArea(geometry, {projection: this.projectionCode});

            if (this.searchGeometryArea > this.maxGeometryArea) {
                this.showAreaWarning = true;
                this.searchGeometry = null;

                return false;
            }

            return true;
        },
        /**
         * Build a search payload from the selected geometry, archive IDs and years and perform the search.
         * After the search, switch to the result tab.
         *
         * @return {void}
         */
        searchWithGeometry () {
            const featureDataclassAttribs = this.selectedYears.map(year => {
                return {
                    "id": "JAHRGANG",
                    "type": "I",
                    "value": year
                };
            });

            if (this.selectedButtonGroup === "extent") {
                this.getCurrentVisibleMapExtent();
            }

            const payload = {
                "dataclassIdsWithJahrgang": this.selectedYears.length ? [...this.selectedArchiveIds] : [],
                "dataclassIdsWithoutJahrgang": !this.selectedYears.length ? [...this.selectedArchiveIds] : [],
                "srs": Number(this.projectionCode.split(":")[1]),
                "featuregeometrie": JSON.parse(JSON.stringify(this.searchGeometry)),
                "featureDataclassAttribs": featureDataclassAttribs
            };

            this.showSpinner = true;
            this.setMapInteractionsActive(false);

            this.searchByGeometry(payload)
                .then((result) => {
                    if (result) {
                        this.setCurrentTab("tabResult");
                    }
                })
                .finally(() => {
                    this.showSpinner = false;
                });
        },
        /**
         * Initiates the search based on the active search mode.
         *
         * @returns {void}
         */
        startSearch () {
            // clear all error messages on start of a search
            this.setErrorMessage("");

            switch (this.attributeSearchModeIsActive) {
                case true:
                    this.searchWithAttribute();
                    break;
                case false:
                default:
                    this.searchWithGeometry();
                    break;
            }
        },
        /**
         * Sets the selected button group for spatial selection.
         * @param {string} group - The name of the selected button group.
         *
         * @return {void}
         */
        setSelectedButtonGroup (group) {
            switch (group) {
                case this.$t("additional:modules.lzsResearchClient.tabs.tabSearch.spatialSelectionGroup.geometries"):
                    this.selectedButtonGroup = "geometry";
                    this.removeSearchGeometry();

                    if (this.addressSearchCoordinates) {
                        this.removePointMarker();
                        this.setSearchInput(null);
                    }

                    this.clearParcelSearch(true);

                    break;
                case this.$t("additional:modules.lzsResearchClient.tabs.tabSearch.spatialSelectionGroup.address"):
                    this.removeSearchGeometry();
                    this.selectedButtonGroup = "address";

                    this.clearParcelSearch(true);


                    break;
                case this.$t("additional:modules.lzsResearchClient.tabs.tabSearch.spatialSelectionGroup.parcel"):
                    this.removeSearchGeometry();
                    this.selectedButtonGroup = "parcel";
                    break;
                case this.$t("additional:modules.lzsResearchClient.tabs.tabSearch.spatialSelectionGroup.extent"):
                default:
                    this.removeSearchGeometry();

                    if (this.addressSearchCoordinates) {
                        this.removePointMarker();
                        this.setSearchInput(null);
                    }

                    this.clearParcelSearch(true);

                    this.selectedButtonGroup = "extent";
                    break;
            }
        },
        /**
         * Checks if the menu sides are open or closed and
         * calculates the padding for the zoomToExtent function, depending on the opening state
         * @returns {Number[]} Padding values for an extent, fitting inbetween the menu sides.
         */
        mapZoomToExtentPadding () {
            const
                rightPadding = this.expanded("secondaryMenu")
                    ? document.getElementById("mp-menu-secondaryMenu").offsetWidth + 20
                    : 20,
                leftPadding = this.expanded("mainMenu")
                    ? document.getElementById("mp-menu-mainMenu").offsetWidth + 20
                    : 20;

            return [20, rightPadding, 20, leftPadding];
        },
        /**
         * Clears the parcel search input and resets the selected parcel district and search geometry.
         * @param {boolean} clearDistrict - Whether to also clear the selected parcel district.
         */
        clearParcelSearch (clearDistrict = false) {
            this.parcelNumberInputValue = "";
            this.showAreaWarning = false;

            if (clearDistrict) {
                this.setSelectedParcelDistrict(null);
            }

            if (this.searchGeometry) {
                this.removeSearchGeometry();
            }
        },
        /**
         * Fetches parcel search results from the OAF feature service.
         * @async
         * @returns {Promise<Object|null>} GeoJSON parcel data or null if an error occurs.
         */
        async fetchParcelSearchResults () {
            try {
                this.showSpinner = true;

                const parcelGeoJson = await getOAFFeature.getOAFFeatureGet(this.alkisBaseUrl, "Flurstueck", {
                    limit: 100,
                    filterCrs: "http://www.opengis.net/def/crs/EPSG/0/25832",
                    crs: "http://www.opengis.net/def/crs/EPSG/0/25832",
                    filter: true,
                    literalFilters: {gemaschl: "02" + this.selectedParcelDistrict, flstnrzae: this.parcelNumberInputValue}
                });

                this.showSpinner = false;

                return parcelGeoJson;
            }
            catch (error) {
                console.warn("An error has occurred when requesting the parcel features", error);
                return null;
            }
        },
        /**
         * Handles the parcel search submission by fetching parcel search results and zooming to the parcel geometry.
         * @returns {void}
         */
        handleParcelSearchSubmit () {
            this.setSearchGeometry(null);
            this.showAreaWarning = false;

            this.fetchParcelSearchResults()
                .then((parcelGeoJson) => {
                    if (parcelGeoJson && parcelGeoJson[0]?.geometry) {
                        const parcelGeometry = new MultiPolygon([]),
                            parcel = parcelGeoJson[0];

                        let searchGeometry;

                        parcelGeometry.setCoordinates(parcel.geometry.coordinates);

                        if (parcelGeometry.getPolygons().length === 1) {
                            searchGeometry = parcelGeometry.getPolygons()[0];
                        }
                        else {
                            searchGeometry = parcelGeometry.getPolygons().reduce((largest, polygon) => {
                                if (!largest || polygon.getArea() > largest.getArea()) {
                                    return polygon;
                                }
                                return largest;
                            }, null);
                        }

                        if (!searchGeometry) {
                            console.warn("No valid parcel geometry found.");
                            return;
                        }

                        this.setSearchGeometry(searchGeometry);
                        this.zoomToExtent({
                            extent: searchGeometry.getExtent(),
                            options: {
                                padding: this.mapZoomToExtentPadding()
                            }
                        });
                    }
                    else {

                        this.showAreaWarning = true;
                        console.warn("No parcel geometry found in the search results.");
                    }
                });
        },
        /**
         * Returns the translated label for an attribute key, falling back to the raw attribute name if no translation exists.
         * @param {String} key - The attribute key to translate.
         * @param {String} fallback - The raw attribute name to use if no translation is found.
         * @returns {String} The translated label or the fallback value.
         */
        getTranslationForAttributeWrapper (key, fallback) {
            return getTranslationForAttribute(key, fallback);
        }
    }
};
</script>

<template>
    <div id="TabSearch">
        <div
            v-if="showSpinner"
            class="loadingSpinner"
        >
            <SpinnerItem
                custom-class="spinner"
                class="ms-3"
            />
        </div>

        <div v-else>
            <div class="switch-container">
                <SwitchInput
                    id="idSearchModeSwitch"
                    :aria="$t('additional:modules.lzsResearchClient.tabs.tabSearch.searchModeSwitchLabel')"
                    :label="$t('additional:modules.lzsResearchClient.tabs.tabSearch.searchModeSwitchLabel')"
                    :checked="attributeSearchModeIsActive"
                    :interaction="(evt) => changeSearchMode(evt.target.checked)"
                />
            </div>

            <div
                v-if="attributeSearchModeIsActive"
                id="searchFormWithAttributes"
                class="searchFormWithAttributes"
            >
                <label for="archive">
                    {{ $t("additional:modules.lzsResearchClient.tabs.tabSearch.selectArchivLabel") }}
                </label>

                <select
                    id="archive"
                    class="form-select archive"
                    :value="selectedArchive"
                    @change="setSelectedArchive($event.target.value)"
                >
                    <option
                        v-for="(_, name) in searchWithAttributeFormData"
                        :key="name"
                        :value="name"
                    >
                        {{ name }}
                    </option>
                </select>

                <div class="searchWithAttributeForm">
                    <InputText
                        v-for="attribute in searchWithAttributeFormData[selectedArchive]"
                        :id="attribute.name"
                        :key="attribute.name"
                        v-model="attribute.value"
                        :class-obj="['form-control' + (attribute.errorMessage.length > 0 ? ' is-invalid': ' is-valid')]"
                        :label="getTranslationForAttributeWrapper(attribute.labelKey, attribute.name)"
                        :placeholder="attribute.placeholder"
                        :error-message="attribute.errorMessage"
                        @input="validateSearchWithAttributeForm()"
                    />
                </div>
            </div>

            <div
                v-if="!attributeSearchModeIsActive"
                id="searchFormWithGeometry"
                class="searchFormWithGeometry"
            >
                <div class="archiveSelection">
                    <span>
                        {{ $t('additional:modules.lzsResearchClient.tabs.tabSearch.selectArchivLabel') }}
                    </span>

                    <div
                        class="archiveSelectionList"
                        role="group"
                        aria-label="archives"
                    >
                        <div
                            v-for="archive in archiveWithGeorefList"
                            :key="archive.id"
                            class="archiveCheckboxList"
                        >
                            <input
                                :id="`archiveCheckbox-${archive.id}`"
                                type="checkbox"
                                :value="archive.id"
                                :checked="selectedArchiveIds.includes(archive.id)"
                                @change="onSelectedArchiveIdsChange(archive.id, $event)"
                            >

                            <label :for="`archiveCheckbox-${archive.id}`">
                                {{ archive.name }}
                            </label>
                        </div>
                    </div>
                </div>

                <div class="yearsSelection">
                    <span>
                        {{ $t('additional:modules.lzsResearchClient.tabs.tabSearch.selectYearsLabel') }}
                    </span>

                    <div
                        class="yearsSelectionList"
                        role="group"
                        aria-label="years"
                    >
                        <div
                            v-for="yearObject in yearsList"
                            :key="yearObject.year"
                            class="yearCheckboxItem"
                        >
                            <input
                                :id="`yearCheckbox-${yearObject.year}`"
                                type="checkbox"
                                :value="yearObject.year"
                                :checked="selectedYears.includes(yearObject.year)"
                                @change="onSelectedYearsChange(yearObject.year, $event)"
                            >

                            <label :for="`yearCheckbox-${yearObject.year}`">
                                <span>
                                    {{ yearObject.year }}
                                </span>
                                <span>
                                    ({{ yearObject.archiveNames.join(", ") }})
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="spatialSelection">
                    <p class="spatialSelectionLabel">
                        {{ $t("additional:modules.lzsResearchClient.tabs.tabSearch.spatialSelectionLabel") }}
                    </p>

                    <ButtonGroup
                        :buttons="buttonGroupLevels"
                        :pre-checked-value="selectedButtonGroup"
                        group="spatialSelectionGroups"
                        class="level-switch"
                        :selected-value="selectedSpatialButtonName"
                        @set-selected-button="setSelectedButtonGroup"
                    />

                    <div
                        v-if="selectedButtonGroup === 'geometry'"
                        class="spatialSelectionButtons d-flex align-items-center"
                    >
                        <DrawTypes
                            :source="lzsDrawLayerSource"
                            :current-layout="lzsCurrentLayout"
                            :draw-types="lzsDrawTypes"
                            :draw-icons="lzsDrawIcons"
                            :selected-draw-type="lzsSelectedDrawType"
                            :selected-interaction="lzsSelectedInteraction"
                            :set-selected-draw-type="setLzsSelectedDrawType"
                            :set-selected-interaction="setLzsSelectedInteraction"
                            :should-emit-events="true"
                            @drawend="onDrawEnd"
                        />

                        <div class="deleteFeature">
                            <DrawEdit
                                :draw-edits="lzsDrawEdits"
                                :draw-icons="lzsDrawIcons"
                                :layer="lzsDrawLayer"
                                :selected-interaction="lzsSelectedInteraction"
                                :set-selected-interaction="setLzsSelectedInteraction"
                                @click="removeSearchGeometry"
                            />
                        </div>
                    </div>

                    <div
                        v-if="selectedButtonGroup === 'address'"
                        class="addressSearch"
                    >
                        <LzsResearchClientSearchBar
                            @set-search-geometry="setSearchGeometry"
                        />
                    </div>

                    <div
                        v-if="selectedButtonGroup === 'parcel'"
                        class="spatialSelectionButtons parcelSearch d-flex flex-column"
                    >
                        <div>
                            <label for="parcelSearchSelect">
                                {{ $t("additional:modules.lzsResearchClient.tabs.tabSearch.selectParcelDistrictLabel") }}
                            </label>

                            <select
                                id="parcelSearchSelect"
                                class="form-select archive"
                                :value="selectedParcelDistrict"
                                @change="setSelectedParcelDistrict($event.target.value)"
                            >
                                <option
                                    v-for="(_, name) in parcelSourceData"
                                    :key="name"
                                    :value="parcelSourceData[name].id"
                                >
                                    {{ name + " (" + parcelSourceData[name].id + ")" }}
                                </option>
                            </select>
                        </div>

                        <label for="parcelNumber">
                            {{ $t("additional:modules.lzsResearchClient.tabs.tabSearch.parcelNumberLabel") }}
                        </label>

                        <div class="input-group">
                            <input
                                id="parcelNumber"
                                ref="parcelNumberInput"
                                v-model="parcelNumberInputValue"
                                type="search"
                                class="form-control"
                                :aria-label="$t('additional:modules.lzsResearchClient.tabs.tabSearch.parcelNumberLabel')"
                            >
                            <button
                                v-if="parcelNumberInputValue"
                                class="btn-icon input-icon reset-button"
                                type="button"
                                aria-label="$t('additional:modules.lzsResearchClient.tabs.tabSearch.parcelSearchCancel.clearParcelSearch')"
                                @click="clearParcelSearch(false)"
                            >
                                <i class="bi-x-lg fs-6" />
                            </button>
                            <button
                                id="lzs-research-client-parcel-search-button"
                                class="btn btn-primary"
                                :aria-label="$t('additional:modules.lzsResearchClient.tabs.tabSearch.parcelNumberLabel')"
                                type="button"
                                :disabled="!parcelNumberInputValue || !selectedParcelDistrict"
                                @click="handleParcelSearchSubmit"
                                @keydown.enter="handleParcelSearchSubmit"
                            >
                                <i
                                    class="bi-search"
                                    role="img"
                                />
                            </button>
                        </div>
                    </div>

                    <p
                        v-if="spatialAreaWarning"
                        class="spatialAreaWarning"
                    >
                        {{ spatialAreaWarning }}
                    </p>
                </div>
            </div>

            <div class="searchButtons">
                <div class="spacer-div" />
                <FlatButton
                    :aria-label="$t('additional:modules.lzsResearchClient.tabs.tabSearch.searchButtonLabel')"
                    :text="$t('additional:modules.lzsResearchClient.tabs.tabSearch.searchButtonLabel')"
                    :disabled="attributeSearchModeIsActive ? !isAttributeSearchFormValid : !isSpatialSearchFormValid"
                    @click="startSearch()"
                />

                <FlatButton
                    :aria-label="$t('additional:modules.lzsResearchClient.tabs.tabSearch.resetButtonLabel')"
                    :text="$t('additional:modules.lzsResearchClient.tabs.tabSearch.resetButtonLabel')"
                    @click="resetForm()"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    #TabSearch {
        padding: 1rem 0.5rem;
        position: relative;
        height: 100%;

        div.switch-container {
            display: flex;
            flex-direction: column;
            align-items: end;
            margin-bottom: 0.5rem;
        }

        div.searchFormWithAttributes {
            select.archive {
                margin-bottom: 1rem;
            }
        }

        div.loadingSpinner {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            gap: 2rem;
            align-items: center;
            justify-content: center;
            background: rgba(255,255,255,0.7);
            z-index: 2;

            div.spinner {
                width: 4rem;
                height: 4rem;
            }

            p {
                background-color: white;
                white-space: pre-line;
                padding: 1.5rem;
            }
        }

        div.searchFormWithGeometry {
            .archiveSelectionList {
                max-height: 12.5rem;
                overflow-y: auto;
                border: 0.0625rem solid rgba(0,0,0,0.1);
                padding: 0.5rem;
                margin: 0.5rem 0 1rem 0;
            }

            .archiveCheckboxList {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                white-space: nowrap;
            }
            .yearsSelection {
                .yearsSelectionList {
                    height: 10rem;
                    overflow-y: auto;
                    border: 0.0625rem solid rgba(0,0,0,0.1);
                    padding: 0.5rem;
                    margin: 0.5rem 0 1rem 0;
                }

                .yearCheckboxItem {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    white-space: nowrap;
                }
            }
            div.noCommonYearError {
                color: $light_red;
            }

            p.spatialAreaWarning {
                color: $light_red;
                font-size: 0.875rem;
                margin: 1rem;
            }

            div.spatialSelectionButtons {
                margin-top: 1.5rem;
                gap: 0.5rem;

                div.deleteFeature {
                    height: 2.5rem;

                    :deep(hr) {
                        display: none;
                    }
                }

                &.parcelSearch {
                    div.input-group {
                        position: relative;

                        #lzs-research-client-parcel-search-button {
                            border-top-right-radius: 5px;
                            border-bottom-right-radius: 5px;
                            position: relative;

                        }

                        .input-label {
                            color: $placeholder-color;
                        }

                        input[type="search"] {
                            -webkit-appearance: none;
                            appearance: none;

                            &::-webkit-search-cancel-button {
                                display: none;
                            }
                        }

                        .btn-icon {
                            position: absolute;
                            right: 40px;
                            top: 40%;
                            transform: translateY(-50%);
                            background-color: rgba(0, 0, 0, 0);
                            border: none;
                            padding: 5px 0 0 10px;
                            z-index: 5;
                        }

                        .input-icon {
                            margin-left: -37px;
                        }

                        .reset-button {
                            cursor: pointer;
                        }
                    }

                }
            }

            div.spatialSelection {
                .level-switch {
                    :deep(.btn-group) {
                        flex-wrap: wrap;
                    }

                    :deep(.btn-group .btn) {
                        border-radius: 0;
                        border-left: 1px solid rgba(255, 255, 255);
                        border-right: 1px solid rgba(255, 255, 255);
                    }
                }
            }

            div.addressSearch {
                margin-top: 1rem;
                margin-left: 0.25rem;
            }
        }

        div.searchButtons {
            display: flex;
            gap: 0.5rem;
            margin-top: 1rem;

            *:nth-child(2) {
                margin-left: auto;
            }
        }
    }
</style>
