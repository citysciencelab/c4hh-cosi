<script>
import {mapGetters, mapMutations} from "vuex";
import Multiselect from "vue-multiselect";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import SpinnerItem from "@shared/modules/spinner/components/SpinnerItem.vue";
import GraphicalSelect from "@shared/modules/graphicalSelect/components/GraphicalSelect.vue";
import store from "@appstore";
import layerCollection from "@core/layers/js/layerCollection";
import {createEmpty as createEmptyExtent, extend} from "ol/extent";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isBetween from "dayjs/plugin/isBetween";
import {GeoJSON} from "ol/format";

dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export default {
    name: "TabFilterContent",
    components: {
        Multiselect,
        FlatButton,
        InputText,
        SpinnerItem,
        GraphicalSelect
    },
    props: {
        fullyLoaded: {
            type: Boolean,
            required: true,
            default: false
        }
    },
    data () {
        return {
            allFilteredFeatures: [],
            isFiltering: false,
            filterUpdated: false,
            map: mapCollection.getMap("2D"),
            graphicalSelectOpen: false,
            drawOptions: {
                "Box": this.$t("common:shared.modules.graphicalSelect.selectBySquare"),
                "Polygon": this.$t("common:shared.modules.graphicalSelect.selectByPolygon")
            }
        };
    },
    computed: {
        ...mapGetters("Modules/GeoMarker", [
            "filterSelections",
            "statusOptions",
            "categories",
            "departments",
            "initialLoading"
        ]),
        ...mapGetters("Menu", [
            "currentMenuWidth",
            "expanded"
        ]),
        ...mapGetters("Modules/GraphicalSelect", [
            "selectedAreaGeoJson"
        ]),
        /**
         * Returns the category options for the filter dropdown.
         * Converts the categories object into an array of objects with key and label.
         * @returns {Array<{key: string, label: string}>} Array of category options
         */
        categoryOptions () {
            return Object.entries(this.categories).map(([key, value]) => ({
                key: key,
                label: value.name
            }));
        },
        /**
         * Returns the departments to filter, depending on the selection.
         * @returns {Array<Object>} The departments to filter.
         */
        departmentsToFilter () {
            if (this.filterSelections.departmentsSelected.length === 0) {
                return Object.values(this.departments);
            }
            return this.filterSelections.departmentsSelected;
        },
        /**
         * Returns the number of filtered GeoMarkers as a string.
         * @returns {string} Number of GeoMarkers.
         */
        countGeoMarker () {
            return this.allFilteredFeatures.length + " " + this.$t("additional:modules.geoMarker.filter.countGeoMarker");
        },
        /**
         * Checks if status is empty or 'offen'.
         * @returns {boolean} True if selected status is empty or contains 'offen'.
         */
        statusAllOrOpen () {
            return this.filterSelections.statusSelected.length === 0 ||
                   this.filterSelections.statusSelected.includes("offen");
        },
        /**
         * Checks if status is empty or 'inaktiv'.
         * @returns {boolean} True if selected status is empty or contains 'inaktiv'.
         */
        statusAllOrInactive () {
            return this.filterSelections.statusSelected.length === 0 ||
                   this.filterSelections.statusSelected.includes("inaktiv");
        },
        /**
         * Checks if status is empty, 'geschlossen'.
         * @returns {boolean} True if selected status is empty or contains 'geschlossen'.
         */
        statusAllOrClosed () {
            return this.filterSelections.statusSelected.length === 0 ||
                   this.filterSelections.statusSelected.includes("geschlossen");
        },
        /**
         * Checks if the menu sides are open or closed and
         * calculates the padding for the zoomToExtent function, depending on the opening state
         * @returns {Number[]} Padding values for an extent, fitting inbetween the menu sides.
         */
        mapZoomToExtentPadding () {
            const
                rightPadding = this.expanded("secondaryMenu")
                    ? window.innerWidth * Number.parseInt(this.currentMenuWidth("secondaryMenu"), 10) / 100
                    : 20,
                leftPadding = this.expanded("mainMenu")
                    ? window.innerWidth * Number.parseInt(this.currentMenuWidth("mainMenu"), 10) / 100
                    : 20;

            return [20, rightPadding, 20, leftPadding];
        }
    },
    watch: {
        fullyLoaded (val) {
            if (val) {
                // applying filter settings without changing the map extent
                this.updateFilterSelection(false);
                this.setInitialLoading(false);
            }
        },
        selectedAreaGeoJson (geoJson) {
            this.filterSelections.geom = new GeoJSON().readGeometry(geoJson);
            this.filterUpdated = true;
        }
    },
    methods: {
        ...mapMutations("Modules/GeoMarker", [
            "setFilterSelections",
            "setGeoMarkerFeatureList",
            "setGeoMarkerActiveTab",
            "setInitialLoading"
        ]),
        /**
         * Applies the filter settings, checks the layer visibility and updates the filtered features.
         * @param {boolean} [updateExtent=true] - Indicates whether the map extent should be adjusted.
         * @param {boolean} [checkLayerVisibility=true] - Indicates whether the layer visibility should be checked.
         */
        async updateFilterSelection (updateExtent = true, checkLayerVisibility = true) {
            this.isFiltering = true;
            this.allFilteredFeatures = [];

            if (checkLayerVisibility) {
                await this.checkLayerVisibility();
            }

            await this.applyDeptAndStatusFilter();
            await this.applyGeomFilter();
            await this.applyAttributeFilters();

            this.handleFilteredFeaturesOnMap(updateExtent);
            this.setGeoMarkerFeatureList(this.allFilteredFeatures);

            this.filterUpdated = false;
            this.isFiltering = false;
        },
        /**
         * Shows the filtered features on the map and adjusts the extent if necessary.
         * @param {boolean} updateExtent - Indicates whether the map extent should be adjusted.
         */
        handleFilteredFeaturesOnMap (updateExtent) {
            Object.values(this.departments).forEach(department => {
                Object.values(department.layerIds).forEach(layerId => {
                    const layer = layerCollection.getLayerById(layerId);

                    layer?.showFeaturesByIds(this.allFilteredFeatures.map(feat => feat.getId()));
                });
            });

            if (updateExtent && this.allFilteredFeatures.length > 0) {
                // create empty extent
                const bbox = createEmptyExtent();

                // extend the extent for each feature
                this.allFilteredFeatures.forEach(feature => {
                    extend(bbox, feature.getGeometry().getExtent());
                });

                // fit the mapView
                store.dispatch("Maps/zoomToExtent", {
                    extent: bbox,
                    options: {
                        padding: this.mapZoomToExtentPadding
                    }
                });
            }
        },
        /**
         * Checks the visibility of relevant layers and waits until all features are visible.
         * @returns {Promise<void>} Resolves when all features on all layers are visible.
         */
        async checkLayerVisibility () {
            const promises = [];

            this.departmentsToFilter.forEach(async options => {
                // if status is empty or status contains 'offen', set layerIds.open to visible
                if (this.statusAllOrOpen) {
                    promises.push(this.setLayerVisible(options.layerIds.open));
                }

                // if status is empty or status contains 'inaktiv', set layerIds.inactive to visible
                if (this.statusAllOrInactive) {
                    promises.push(this.setLayerVisible(options.layerIds.inactive));
                }

                // if status is empty or status contains 'geschlossen', set layerIds.closed to visible
                if (this.statusAllOrClosed) {
                    promises.push(this.setLayerVisible(options.layerIds.closed));
                }
            });

            await Promise.all(promises);
        },
        /**
         * Sets the visibility of a layer.
         * @param {string} layerId - The ID of the layer.
         * @returns {Promise<void>} Resolves when the features on the layer are visible.
         */
        setLayerVisible (layerId) {
            return new Promise(resolve => {
                const layer = this.map ? this.map.getLayers().getArray()?.find(l => l.get("id") === layerId) : undefined;

                if (layer && layer.isVisible() && !this.initialLoading) {
                    resolve();
                }
                else {
                    store.dispatch("replaceByIdInLayerConfig", {
                        layerConfigs: [{
                            id: layerId,
                            layer: {
                                visibility: true,
                                showInLayerTree: true
                            }
                        }]
                    }, {root: true}).then(() => {
                        this.map.getLayers().getArray().find(l => l.get("id") === layerId).getSource().once("featuresloadend", () => {
                            resolve();
                        });
                    }).catch(() => {
                        resolve();
                    });
                }
            });
        },
        /**
         * Filters features by department and status.
         * @returns {Promise<void>} Resolves when filtering is complete.
         */
        applyDeptAndStatusFilter () {
            return new Promise(resolve => {
                this.departmentsToFilter.forEach(options => {
                    let layer;
                    const layerIdsToCheck = [];

                    // if status is empty or status contains 'offen', check layerIds.open for departments
                    if (this.statusAllOrOpen) {
                        layerIdsToCheck.push(options.layerIds.open);
                    }

                    // if status is empty or status contains 'inaktiv', check layerIds.inactive for departments
                    if (this.statusAllOrInactive) {
                        layerIdsToCheck.push(options.layerIds.inactive);
                    }

                    // if status is empty or status contains 'geschlossen', check layerIds.closed for departments
                    if (this.statusAllOrClosed) {
                        layerIdsToCheck.push(options.layerIds.closed);
                    }

                    layerIdsToCheck.forEach(layerId => {
                        layer = this.map ? this.map.getLayers().getArray().find(l => {
                            return l.get("id") === layerId;
                        }) : undefined;

                        if (layer) {
                            // make the allFilteredFeatures array unique so that each GeoMarker is included only once
                            layer.getSource().getFeatures().forEach(feat => {
                                if (!this.allFilteredFeatures.some(obj => obj.getId() === feat.getId())) {
                                    this.allFilteredFeatures.push(feat);
                                }
                            });
                        }
                    });
                });

                resolve();
            });
        },
        /**
         * Filters features by geometry.
         * @returns {Promise<void>} Resolves when filtering is complete.
         */
        applyGeomFilter () {
            return new Promise(resolve => {
                if (this.filterSelections.geom) {
                    const subSetOfFilteredFeatures = [];

                    this.allFilteredFeatures.forEach(feature => {
                        const geometry = feature.getGeometry();

                        if (geometry && this.filterSelections.geom.intersectsCoordinate(geometry.getCoordinates())) {
                            subSetOfFilteredFeatures.push(feature);
                        }
                    });

                    this.allFilteredFeatures = subSetOfFilteredFeatures;
                    resolve();
                }

                resolve();
            });
        },
        /**
         * Filters features by attributes besides department and status.
         * @returns {Promise<void>} Resolves when filtering is complete.
         */
        applyAttributeFilters () {
            return new Promise(resolve => {
                const subSetOfFilteredFeatures = [];

                for (const feat of this.allFilteredFeatures) {
                    // Category
                    if (this.filterSelections.categorySelected.length > 0) {
                        const allCategoriesSeleted = this.filterSelections.categorySelected.map(options => options.label);

                        // Category filter does not apply to this feature = check next feature
                        if (!allCategoriesSeleted.includes(feat.get("kategorie"))) {
                            continue;
                        }
                    }

                    // Comment of the departments
                    const commentTrimLC = this.filterSelections.filterValueComment.trim().toLowerCase();

                    if (commentTrimLC !== "") {
                        const allCommentFieldsForDept = this.departmentsToFilter.map(options => options.fields.bemerkung);
                        let featHasComment = false;

                        for (const key of allCommentFieldsForDept) {
                            if (feat.get(key)?.toLowerCase().includes(commentTrimLC)) {
                                featHasComment = true;
                                break;
                            }
                        }

                        // Comment filter does not apply to this feature = check next feature
                        if (!featHasComment) {
                            continue;
                        }
                    }

                    // Description, Source, GeoMarkerID
                    // eslint-disable-next-line one-var
                    const filterValueSourceTrimLC = this.filterSelections.filterValueSource?.trim().toLowerCase(),
                        filterValueDescrTrimLC = this.filterSelections.filterValueDescr?.trim().toLowerCase(),
                        filterValueIDTrimLC = this.filterSelections.filterValueId?.trim().toLowerCase();

                    if (filterValueSourceTrimLC && filterValueSourceTrimLC !== "") {
                        // Source filter does not apply to this feature = check next feature
                        if (!feat.get("quelle")?.toLowerCase().includes(filterValueSourceTrimLC)) {
                            continue;
                        }
                    }

                    if (filterValueDescrTrimLC && filterValueDescrTrimLC !== "") {
                        // Description filter does not apply to this feature = check next feature
                        if (!feat.get("beschreibung")?.toLowerCase().includes(filterValueDescrTrimLC)) {
                            continue;
                        }
                    }

                    if (filterValueIDTrimLC && filterValueIDTrimLC !== "") {
                        // GeomarkerID filter does not apply to this feature = check next feature
                        if (!feat.getId().toLowerCase().includes(filterValueIDTrimLC)) {
                            continue;
                        }
                    }

                    // Timestamp created
                    if (this.filterSelections.creationDate.from !== ""
                        || this.filterSelections.creationDate.to !== ""
                    ) {
                        // Timestamp filter does not apply to this feature = check next feature
                        if (!this.filterByDate(this.filterSelections.creationDate, feat.get("zeitstempel"))) {
                            continue;
                        }
                    }

                    // Timestamp closed
                    if (this.filterSelections.closedDate.from !== ""
                        || this.filterSelections.closedDate.to !== ""
                    ) {
                        const allClosedFieldsForDept = this.departmentsToFilter.map(options => options.fields.geschlossen);
                        let featHasClosedDate = false;

                        // Timestamp closed filter does not apply to this feature = check next feature
                        for (const key of allClosedFieldsForDept) {
                            if (this.filterByDate(this.filterSelections.closedDate, feat.get(key))) {
                                featHasClosedDate = true;
                                break;
                            }
                        }

                        if (!featHasClosedDate) {
                            continue;
                        }
                    }

                    // Timestamp reminder
                    if (this.filterSelections.reminderDate.from !== ""
                        || this.filterSelections.reminderDate.to !== ""
                    ) {
                        const allReminderFieldsForDept = this.departmentsToFilter.map(options => options.fields.wiedervorlage);
                        let featHasReminder = false;

                        for (const key of allReminderFieldsForDept) {
                            if (this.filterByDate(this.filterSelections.reminderDate, feat.get(key))) {
                                featHasReminder = true;
                                break;
                            }
                        }

                        // Reminder filter does not apply to this feature = check next feature
                        if (!featHasReminder) {
                            continue;
                        }
                    }

                    // if none of the selected filters failed, push the tested feature to the subSetOfFilteredFeatures
                    subSetOfFilteredFeatures.push(feat);
                }

                this.allFilteredFeatures = subSetOfFilteredFeatures;
                resolve();
            });
        },
        /**
         * Filters features by date.
         * @param {object} filterValue - The filter value object with from and to date.
         * @param {string} dateFieldValue - The value of the date field.
         * @returns {Boolean} true, when the date matches.
         */
        filterByDate (filterValue, dateFieldValue) {
            if (!filterValue || typeof filterValue !== "object") {
                return false;
            }

            const {from, to} = filterValue,
                fromTimeStamp = from === "" ? null : dayjs(from),
                toTimeStamp = to === "" ? null : dayjs(to);

            if (!fromTimeStamp && !toTimeStamp) {
                return false;
            }
            else if (dateFieldValue) {
                const timeStamp = dayjs(dateFieldValue);
                let match = false;

                if (fromTimeStamp && toTimeStamp) {
                    match = timeStamp.isBetween(fromTimeStamp, toTimeStamp, "day", "[]");
                }
                else if (fromTimeStamp) {
                    match = timeStamp.isSameOrAfter(fromTimeStamp, "day");
                }
                else if (toTimeStamp) {
                    match = timeStamp.isSameOrBefore(toTimeStamp, "day");
                }

                if (match) {
                    return true;
                }

                return false;
            }

            return false;
        },
        /**
         * Resets the filter selection to default values.
         */
        resetFilterSelection () {
            this.setFilterSelections({
                departmentsSelected: [],
                statusSelected: ["offen"],
                filterValueSource: "",
                filterValueDescr: "",
                filterValueComment: "",
                filterValueId: "",
                categorySelected: [],
                creationDate: {
                    from: "",
                    to: ""
                },
                closedDate: {
                    from: "",
                    to: ""
                },
                reminderDate: {
                    from: "",
                    to: ""
                },
                geom: null
            });

            this.graphicalSelectOpen = false;

            this.updateFilterSelection(false, false);
        },
        /**
         * Resets the geom filter selection to default values.
         */
        resetGeomFilter () {
            this.filterSelections.geom = null;
            this.graphicalSelectOpen = false;
            this.filterUpdated = true;
        }
    }
};
</script>

<template>
    <div id="geoMarkerFilterContent">
        <div class="headline">
            <div class="headlineTopPart">
                <p v-show="!isFiltering">
                    {{ countGeoMarker }}
                </p>

                <div class="spacer-div" />

                <div class="geomFilterButtons">
                    <FlatButton
                        v-if="filterSelections.geom"
                        :text="'additional:modules.geoMarker.filter.graphicalSelect.filterButtonResetTitle'"
                        icon="bi-x-circle"
                        :secondary="true"
                        @click="resetGeomFilter"
                    />

                    <FlatButton
                        :text="filterSelections.geom ? 'additional:modules.geoMarker.filter.graphicalSelect.filterButtonActiveTitle' : 'additional:modules.geoMarker.filter.graphicalSelect.filterButtonTitle'"
                        :icon="filterSelections.geom ? 'bi-check-circle' : 'bi-bounding-box-circles'"
                        :secondary="true"
                        :customclass="filterSelections.geom ? 'geomFilterActive' : ''"
                        @click="graphicalSelectOpen = !graphicalSelectOpen"
                    />
                </div>
            </div>

            <GraphicalSelect
                v-if="graphicalSelectOpen"
                ref="graphicalSelection"
                :options="drawOptions"
                :start-geometry="filterSelections.geom"
                :label="'additional:modules.geoMarker.filter.graphicalSelect.title'"
            />
        </div>

        <div class="filterSettings">
            <label
                class="input-label"
                for="deptsSelect"
            >
                {{ $t("additional:modules.geoMarker.filter.departments.label") }}
            </label>

            <Multiselect
                id="deptsSelect"
                v-model="filterSelections.departmentsSelected"
                label="name"
                track-by="name"
                :options="Object.values(departments)"
                name="select-box"
                :multiple="true"
                :placeholder="$t('additional:modules.geoMarker.filter.departments.placeholder')"
                :show-labels="false"
                open-direction="bottom"
                :hide-selected="false"
                :allow-empty="true"
                :close-on-select="true"
                :clear-on-select="false"
                :internal-search="false"
                @remove="filterUpdated = true"
                @select="filterUpdated = true"
            />

            <div class="labelSelectContainer">
                <label
                    class="input-label"
                    for="statusSelect"
                >
                    {{ $t("additional:modules.geoMarker.filter.status.label") }}
                </label>

                <Multiselect
                    id="statusSelect"
                    v-model="filterSelections.statusSelected"
                    :options="statusOptions"
                    name="select-box"
                    :multiple="true"
                    :placeholder="$t('additional:modules.geoMarker.filter.status.placeholder')"
                    :show-labels="false"
                    open-direction="bottom"
                    :hide-selected="false"
                    :allow-empty="true"
                    :close-on-select="true"
                    :clear-on-select="false"
                    :internal-search="false"
                    @remove="filterUpdated = true"
                    @select="filterUpdated = true"
                />
            </div>

            <div class="labelSelectContainer">
                <label
                    class="input-label"
                    for="categorySelect"
                >
                    {{ $t("additional:modules.geoMarker.filter.categories.label") }}
                </label>

                <Multiselect
                    id="categorySelect"
                    v-model="filterSelections.categorySelected"
                    :options="categoryOptions"
                    label="label"
                    track-by="key"
                    name="select-box"
                    :multiple="true"
                    :placeholder="$t('additional:modules.geoMarker.filter.categories.placeholder')"
                    :show-labels="false"
                    open-direction="bottom"
                    :hide-selected="false"
                    :allow-empty="true"
                    :close-on-select="true"
                    :clear-on-select="false"
                    :internal-search="false"
                    @remove="filterUpdated = true"
                    @select="filterUpdated = true"
                />
            </div>

            <InputText
                id="descrFilter"
                v-model="filterSelections.filterValueDescr"
                :label="$t('additional:modules.geoMarker.filter.description.label')"
                :placeholder="$t('additional:modules.geoMarker.filter.description.placeholder')"
                @update:modelValue="filterUpdated = true"
            />

            <InputText
                id="commentFilter"
                v-model="filterSelections.filterValueComment"
                :label="$t('additional:modules.geoMarker.filter.comment.label')"
                :placeholder="$t('additional:modules.geoMarker.filter.comment.placeholder')"
                @update:modelValue="filterUpdated = true"
            />

            <div class="multiFieldLine">
                <InputText
                    id="sourceFilter"
                    v-model="filterSelections.filterValueSource"
                    :label="$t('additional:modules.geoMarker.filter.source.label')"
                    :placeholder="$t('additional:modules.geoMarker.filter.source.placeholder')"
                    @update:modelValue="filterUpdated = true"
                />

                <InputText
                    id="geomarkerIDFilter"
                    v-model="filterSelections.filterValueId"
                    :label="$t('additional:modules.geoMarker.filter.geoMarkerID.label')"
                    :placeholder="$t('additional:modules.geoMarker.filter.geoMarkerID.placeholder')"
                    @update:modelValue="filterUpdated = true"
                />
            </div>

            <p class="multiFieldLineLabel">
                {{ $t("additional:modules.geoMarker.filter.dates.labels.created") }}
            </p>

            <div class="multiFieldLine">
                <InputText
                    id="creationDateRangeFrom"
                    v-model="filterSelections.creationDate.from"
                    :label="$t('additional:modules.geoMarker.filter.dates.from.label')"
                    type="date"
                    :placeholder="$t('additional:modules.geoMarker.filter.dates.from.placeholder')"
                    @update:modelValue="filterUpdated = true"
                />

                <InputText
                    id="creationDateRangeTo"
                    v-model="filterSelections.creationDate.to"
                    :label="$t('additional:modules.geoMarker.filter.dates.to.label')"
                    type="date"
                    :placeholder="$t('additional:modules.geoMarker.filter.dates.to.placeholder')"
                    @update:modelValue="filterUpdated = true"
                />
            </div>

            <p class="multiFieldLineLabel">
                {{ $t("additional:modules.geoMarker.filter.dates.labels.closed") }}
            </p>

            <div class="multiFieldLine">
                <InputText
                    id="closedDateRangeFrom"
                    v-model="filterSelections.closedDate.from"
                    :label="$t('additional:modules.geoMarker.filter.dates.from.label')"
                    type="date"
                    :placeholder="$t('additional:modules.geoMarker.filter.dates.from.placeholder')"
                    @update:modelValue="filterUpdated = true"
                />

                <InputText
                    id="closedDateRangeTo"
                    v-model="filterSelections.closedDate.to"
                    :label="$t('additional:modules.geoMarker.filter.dates.to.label')"
                    type="date"
                    :placeholder="$t('additional:modules.geoMarker.filter.dates.to.placeholder')"
                    @update:modelValue="filterUpdated = true"
                />
            </div>

            <p class="multiFieldLineLabel">
                {{ $t("additional:modules.geoMarker.filter.dates.labels.review") }}
            </p>

            <div class="multiFieldLine">
                <InputText
                    id="reminderDateRangeFrom"
                    v-model="filterSelections.reminderDate.from"
                    :label="$t('additional:modules.geoMarker.filter.dates.from.label')"
                    type="date"
                    :placeholder="$t('additional:modules.geoMarker.filter.dates.from.placeholder')"
                    @update:modelValue="filterUpdated = true"
                />

                <InputText
                    id="reminderDateRangeTo"
                    v-model="filterSelections.reminderDate.to"
                    :label="$t('additional:modules.geoMarker.filter.dates.to.label')"
                    type="date"
                    :placeholder="$t('additional:modules.geoMarker.filter.dates.to.placeholder')"
                    @update:modelValue="filterUpdated = true"
                />
            </div>
        </div>

        <div class="geomarkerFilterbuttons">
            <div class="filterAndListButton">
                <FlatButton
                    :text="$t('additional:modules.geoMarker.filter.buttons.filter')"
                    icon="bi-funnel-fill"
                    :disabled="!filterUpdated"
                    @click="updateFilterSelection()"
                />

                <FlatButton
                    v-if="allFilteredFeatures.length !== 0"
                    :text="$t('additional:modules.geoMarker.filter.buttons.list')"
                    icon="bi-card-list"
                    :secondary="true"
                    @click="setGeoMarkerActiveTab('tabList')"
                />
            </div>

            <SpinnerItem
                v-if="isFiltering"
                custom-class="spinner"
                class="ms-3"
            />

            <FlatButton
                :text="$t('additional:modules.geoMarker.filter.buttons.restore')"
                icon="bi-x-circle"
                @click="resetFilterSelection()"
            />
        </div>
    </div>
</template>

<style lang="scss">
div#geoMarkerFilterContent {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex: 1;
    overflow: hidden;

    div.form-floating:has(input#descrFilter) {
        margin-top: 1rem;
    }

    div.headline {
        display: flex;
        flex-direction: column;
        justify-content: space-between;

        div.headlineTopPart {
            display: flex;
            justify-content: space-between;
            gap: 2rem;

            div.geomFilterButtons {
                display: flex;
                gap: 1rem;

                button.geomFilterActive {
                    background-color: #41b883;
                }
            }
        }
    }

    div.filterSettings {
        display: flex;
        flex-direction: column;
        justify-content: left;
        flex: 1;
        overflow: auto;
        padding-right: 1rem;
    }

    p.multiFieldLineLabel {
        margin-bottom: 0;
    }

    div.multiFieldLine {
        display: flex;
        justify-content: space-between;
        gap: 2rem;

        div.form-floating,
        div.labelSelectContainer {
            flex: 1;
        }
    }

    div.geomarkerFilterbuttons {
        display: flex;
        justify-content: space-between;
        gap: 2rem;
        margin-top: 0.5rem;

        button {
            // !important here necessary, because of "margin-bottom: 1rem !important" in .mb-3 class
            margin-bottom: 0px !important;
        }

        div.filterAndListButton {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            gap: 1rem;
        }
    }
}
</style>
