<script>
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import InputText from "./shared/InputText.vue";
import SpinnerItem from "@shared/modules/spinner/components/SpinnerItem.vue";
import ButtonGroup from "./shared/ButtonGroup.vue";
import {TAB_SET_CURRENT} from "./shared/TabContainer.vue";
import DrawTypes from "@shared/modules/draw/components/DrawTypes.vue";
import DrawEdit from "@shared/modules/draw/components/DrawEdit.vue";
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";
import modifyInteraction from "@masterportal/masterportalapi/src/maps/interactions/modifyInteraction";

import Polygon from "ol/geom/Polygon";
import LineString from "ol/geom/LineString";
import Point from "ol/geom/Point";
import Feature from "ol/Feature.js";
import {Fill, Stroke, Style} from "ol/style";

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
        SwitchInput
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
            buttonGroupLevels: [
                {name: this.$t("additional:modules.lzsResearchClient.tabs.tabSearch.spatialSelectionGroup.extent")},
                {name: this.$t("additional:modules.lzsResearchClient.tabs.tabSearch.spatialSelectionGroup.geometries")}
            ],
            selectedButtonGroup: "extent"
        };
    },
    computed: {
        ...mapGetters("Modules/LzsResearchClient", [
            "dataClassList",
            "placeholderDataClassList",
            "archiveYears",
            "archiveList",
            "lzsCurrentLayout",
            "lzsDrawTypes",
            "lzsDrawIcons",
            "lzsSelectedDrawType",
            "lzsSelectedDrawTypeMain",
            "lzsSelectedInteraction",
            "lzsDrawEdits",
            "minScaleValue"
        ]),
        ...mapGetters("Maps", [
            "projectionCode",
            "scale",
            "extent"
        ]),
        ...mapGetters("Menu", [
            "expanded"
        ]),
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
        selectedSpatialButtonName () {
            return this.selectedButtonGroup === "geometry"
                ? this.buttonGroupLevels[1].name
                : this.buttonGroupLevels[0].name;
        },
        isSpatialSearchFormValid () {
            if (this.selectedArchiveIds.length === 0) {
                return false;
            }

            if (!this.searchGeometry && this.selectedButtonGroup === "geometry") {
                return false;
            }

            if (this.scale > this.minScaleValue && this.selectedButtonGroup === "extent") {
                return false;
            }

            return true;
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
                this.lzsDrawLayerSource.clear();
                this.searchGeometry = null;
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
            "searchByGeometry"
        ]),
        ...mapActions("Maps", [
            "addNewLayerIfNotExists",
            "addInteraction",
            "removeInteraction"
        ]),
        ...mapMutations("Modules/LzsResearchClient", [
            "setLzsSelectedDrawType",
            "setLzsSelectedInteraction"
        ]),
        /**
         * Set the selected archive identifier.
         * @param {string} archive - The archive name to select.
         */
        setSelectedArchive (archiv) {
            this.selectedArchive = archiv;
        },
        /**
         * Initialize archive and form data structures from `dataClassList`.
         */
        initializeSearchForm () {
            const formData = {},
                archives = {};

            this.dataClassList?.forEach(element => {
                const archiveName = element.name,
                    attributes = element.highestActiveDataclassVersion.dataclassAttributs
                        .filter(attribute => attribute.usage === "I")
                        .map(attribute => ({
                            ...attribute,
                            value: "",
                            placeholder: this.placeholderDataClassList?.[archiveName]?.[attribute.name]?.PLACEHOLDER || "",
                            label: this.$t(`additional:modules.lzsResearchClient.tabs.tabSearch.${attribute.name.toLowerCase()}`),
                            pattern: this.placeholderDataClassList?.[archiveName]?.[attribute.name]?.PATTERN || "",
                            errorMessage: ""
                        }));

                formData[archiveName] = [
                    ...attributes,
                    {
                        name: "maxValueCount",
                        value: "",
                        label: this.$t("additional:modules.lzsResearchClient.tabs.tabSearch.maxValueCount"),
                        pattern: "[0-9]{1,4}",
                        placeholder: "10",
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

            await this.searchByAttribute(payload);

            this.showSpinner = false;

            this.setCurrentTab("tabResult");
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
                        attribute.errorMessage = this.$t("additional:modules.lzsResearchClient.tabs.tabSearch.patternError",
                            {digitNumber: attribute.placeholder.length}
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
            this.searchGeometry = null;

            if (this.currentModifyInteraction) {
                this.removeInteraction(this.currentModifyInteraction);
                this.currentModifyInteraction = null;

                this.lzsDrawLayerSource.clear();
            }
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
        /**
         * Event handler for the 'drawend' event.
         * Triggered when a drawing operation is completed.
         *
         * @param {DrawEvent} event - The event object containing details about the completed drawing.
         * @returns {void}
         */
        onDrawend (event) {
            this.drawEnd = true;

            this.setSearchGeometry(event.feature.getGeometry());
            this.removeInteraction(this.lzsSelectedInteraction);
            this.setLzsSelectedDrawType("");
            this.setLzsSelectedInteraction("");
            this.editFeature();

        },
        /**
         * Sets the map interaction to modify a feature.
         *
         * @returns {void}
         */
        editFeature () {
            this.currentModifyInteraction = modifyInteraction.createModifyInteraction(this.lzsDrawLayerSource);
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

                const style = new Style({
                        fill: new Fill({
                            color: this.lzsCurrentLayout.fillColor
                        }),
                        stroke: new Stroke({
                            color: this.lzsCurrentLayout.strokeColor,
                            width: this.lzsCurrentLayout.strokeWidth
                        })
                    }),
                    feature = new Feature(polygon);

                feature.setStyle(style);

                this.lzsDrawLayerSource.clear();
                this.lzsDrawLayerSource.addFeature(feature);
            }
            else if (geometry instanceof Polygon) {
                this.searchGeometry = {
                    type: "Polygon",
                    coordinates: JSON.parse(JSON.stringify(geometry.getCoordinates()))
                };
            }
            else if (geometry instanceof Point) {
                this.searchGeometry = {
                    type: "Point",
                    coordinates: JSON.parse(JSON.stringify(geometry.getCoordinates()))
                };
            }
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

            this.searchByGeometry(payload)
                .then(() => {
                    this.setCurrentTab("tabResult");
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
                    break;
                case this.$t("additional:modules.lzsResearchClient.tabs.tabSearch.spatialSelectionGroup.extent"):
                default:
                    this.lzsDrawLayerSource.clear();
                    this.selectedButtonGroup = "extent";
                    break;
            }
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
                    :interaction="(evt) => attributeSearchModeIsActive = evt.target.checked"
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
                        :label="attribute.name"
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
                            v-for="archive in archiveList"
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

                    <p
                        v-if="selectedButtonGroup === 'extent' && scale > minScaleValue"
                        class="extentWarning"
                    >
                        {{ $t("additional:modules.lzsResearchClient.tabs.tabSearch.extentWarningMessage", {scale: minScaleValue}) }}
                    </p>

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
                            @drawend="onDrawend"
                        />

                        <div class="deleteFeature">
                            <DrawEdit
                                :draw-edits="lzsDrawEdits"
                                :draw-icons="lzsDrawIcons"
                                :layer="lzsDrawLayer"
                                :selected-interaction="lzsSelectedInteraction"
                                :set-selected-interaction="setLzsSelectedInteraction"
                            />
                        </div>
                    </div>
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

            p.extentWarning {
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
