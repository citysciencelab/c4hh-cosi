<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import {Style, Stroke, Fill, Circle} from "ol/style";
import {MultiPolygon, MultiPoint, MultiLineString, Polygon, LineString, Point, GeometryCollection} from "ol/geom.js";
import Feature from "ol/Feature.js";

export default {
    name: "TabResultTable",
    components: {
        IconButton
    },
    props: {
        tableIndex: {
            type: String,
            required: true
        },
        tableHeader: {
            type: Array,
            required: true
        },
        tableDatasets: {
            type: Array,
            required: true
        },
        hasGeoRef: {
            type: Boolean,
            required: false,
            default: false
        },
        showCheckboxes: {
            type: Boolean,
            required: false,
            default: true
        },
        showButtons: {
            type: Object,
            required: false,
            default () {
                return {
                    georef: true,
                    details: true,
                    preview: false,
                    download: false
                };
            }
        }
    },
    emits: ["openDetails", "showPreview", "download", "clearOtherGeom", "showGeomAgain"],
    data () {
        return {
            currentSorting: {
                index: 0,
                asc: true
            },
            geomLayerId: "lzsGeorefLayer",
            currentlyShownGeorefId: null,
            geoRefShown: false
        };
    },
    computed: {
        ...mapGetters("Modules/LzsResearchClient", [
            "lzsGeomLayout"
        ]),
        sortedData () {
            return this.getSortedData(this.tableDatasets, this.currentSorting.index, this.currentSorting.asc);
        },
        sortableHeaderCount () {
            return this.tableDatasets[0]?.attributes.length || 0;
        },
        headerChecked () {
            return this.tableDatasets.length > 0
                && this.tableDatasets.every(d => d.checked);
        },
        cssVars () {
            return {
                "--geomIndicatorFillColor": this.lzsGeomLayout.fillColor.join(","),
                "--geomIndicatorStrokeColor": this.lzsGeomLayout.strokeColor.join(",")
            };
        }
    },
    methods: {
        ...mapActions("Modules/LzsResearchClient", [
            "fetchGeometryForInstanceId"
        ]),
        ...mapMutations("Modules/LzsResearchClient", [
            "setCheckedForInstanceId"
        ]),
        /**
         * Pushes "checked" values back into searchAttributeResponse and attributesToDownload using instanceId.
         * If a single dataset is provided, only that one is synced; otherwise all datasets in sortedData are synced.
         * @param {Object} dataset - Optional single dataset to sync.
         * @returns {void}
         */
        syncCheckedToStore (dataset) {
            if (dataset) {
                this.setCheckedForInstanceId({
                    instanceId: dataset.instanceId,
                    checked: Boolean(dataset.checked)
                });
                return;
            }

            this.sortedData.forEach((entry) => {
                this.setCheckedForInstanceId({
                    instanceId: entry.instanceId,
                    checked: Boolean(entry.checked)
                });
            });
        },
        /**
         * Toggles the dataset's geometry on the map and marks it as currently shown if it was not before.
         * Emits "showGeom" to notify parents.
         * If the dataset already contains geometry it is shown immediately, otherwise the geometry is fetched first.
         * @param {Object} dataset - Dataset object containing instanceId, archiveId and optional geom.
         * @returns {void}
         */
        toggleDatasetPositionInMap (dataset) {
            if (this.geoRefShown && this.currentlyShownGeorefId === dataset.instanceId) {
                this.clearGeomIndicator();
                this.clearGeom();
                return;
            }

            this.currentlyShownGeorefId = dataset.instanceId;
            this.$emit("clearOtherGeom", this.tableIndex);

            if (dataset.geom) {
                this.showGeomOnLayer(dataset.geom);
            }
            else {
                this.fetchGeometryForInstanceId({
                    "dataclassId": dataset.archiveId,
                    "dataclassInstanceId": dataset.instanceId,
                    "srs": 25832
                }).then(() => {
                    const geom = this.tableDatasets.filter((datasets) => {
                        return datasets.instanceId === dataset.instanceId;
                    })[0].geom;

                    this.showGeomOnLayer(geom);
                });
            }
        },
        /**
         * Creates a vector layer for the provided geometry and adds it to the map.
         * Removes any existing layer with the configured geomLayerId before adding the new one.
         * Fits the map view to the geometry extent and validates the extent values.
         * @param {Object} geom - Geometry object in GeoJSON-like format ({ type: "Point"|"LineString"|"Polygon", coordinates: [...] }).
         * @returns {void}
         */
        showGeomOnLayer (geom) {
            const map = mapCollection.getMap("2D"),
                newFeature = this.createNewVectorFeature(geom);

            this.clearGeom();

            if (newFeature) {
                const vectorSource = new VectorSource({
                        features: [newFeature]
                    }),
                    vectorLayer = new VectorLayer({
                        alwaysOnTop: true,
                        id: this.geomLayerId,
                        source: vectorSource,
                        zIndex: 1000,
                        style: new Style({
                            fill: new Fill({
                                color: this.lzsGeomLayout.fillColor
                            }),
                            stroke: new Stroke({
                                color: this.lzsGeomLayout.strokeColor,
                                width: this.lzsGeomLayout.strokeWidth
                            }),
                            image: new Circle({
                                radius: this.lzsGeomLayout.circleRadius,
                                fill: new Fill({
                                    color: this.lzsGeomLayout.circleFillColor
                                }),
                                stroke: new Stroke({
                                    color: this.lzsGeomLayout.circleStrokeColor,
                                    width: this.lzsGeomLayout.strokeWidth
                                })
                            })
                        })
                    }),
                    extent = newFeature.getGeometry().getExtent();

                map.addLayer(vectorLayer);
                this.geoRefShown = true;

                if (extent.some(coord => isNaN(coord))) {
                    console.error("Invalid extent:", extent);
                    return;
                }

                map.getView().fit(extent, {
                    duration: 1000,
                    maxZoom: 16,
                    padding: [150, 150, 150, 150]
                });
            }
        },
        /**
         * Creates an OpenLayers Feature from a GeoJSON-like geometry object.
         * Supports Point, LineString and Polygon.
         * @param {Object} geom - Geometry object ({ type: string, coordinates: Array }).
         * @returns {Feature|null} The created Feature or null if geometry type is unsupported.
         */
        createNewVectorFeature (geom) {
            const geometry = this.createOlGeometry(geom);

            return geometry ? new Feature({geometry}) : null;
        },
        /**
         * Creates an OpenLayers geometry from a GeoJSON-like geometry object.
         * @param {Object} geom - Geometry object ({ type: string, coordinates: Array }).
         * @returns {import("ol/geom").Geometry|null} The created OL geometry or null if unsupported.
         */
        createOlGeometry (geom) {
            switch (geom.type) {
                case "Point":
                    return new Point(geom.coordinates);
                case "LineString":
                    return new LineString(geom.coordinates);

                case "Polygon":
                    return new Polygon(geom.coordinates);
                case "MultiPolygon":
                    return new MultiPolygon(geom.coordinates);
                case "MultiPoint":
                    return new MultiPoint(geom.coordinates);
                case "MultiLineString":
                    return new MultiLineString(geom.coordinates);
                case "GeometryCollection":
                    return new GeometryCollection(
                        // if GeometryCollection contains an unsupported sub-geometry type
                        //  filter(Boolean) removes all falsy values (null, undefined, false, 0, "")
                        // leaving only valid geometry objects
                        geom.geometries.map(this.createOlGeometry).filter(Boolean)
                    );
                default: return null;
            }
        },
        /**
         * Clear the marker for which dataset is currently shown (does not remove vector from map).
         * @returns {void}
         */
        clearGeomIndicator () {
            this.currentlyShownGeorefId = null;
        },
        /**
         * Remove the geometry layer from the map if present.
         * @returns {void}
         */
        clearGeom () {
            const map = mapCollection.getMap("2D");
            const layerWithGeom = this.getLayerWithGeom();

            if (layerWithGeom) {
                map.removeLayer(layerWithGeom);
            }
            this.geoRefShown = false;
        },
        /**
         * Hide the geometry layer on the map if present (does not remove it).
         * @returns {void}
         */
        hideGeom () {
            const layerWithGeom = this.getLayerWithGeom();

            if (layerWithGeom) {
                layerWithGeom.setVisible(false);
            }
            this.geoRefShown = false;
        },
        /**
         * Show the geometry layer on the map again if it was previously hidden.
         * @returns {void}
         */
        showGeomAgain () {
            const layerWithGeom = this.getLayerWithGeom();

            if (layerWithGeom && !layerWithGeom.getVisible()) {
                layerWithGeom.setVisible(true);
                this.geoRefShown = true;
            }
        },
        /**
         * Get the vector layer that contains the geometry for the currently shown dataset.
         * @returns {VectorLayer|null} The vector layer or null if not found.
         */
        getLayerWithGeom () {
            const map = mapCollection.getMap("2D");

            return map.getLayers().getArray().find(layer => layer.get("id") === this.geomLayerId);
        },
        /**
         * Gets a specific icon class for the sorting of the given column index.
         * @param {String} columnIndex - The index of the column where the icon is displayed.
         * @returns {String} The icon css class for the sorting.
         */
        getIconClassForSorting (columnIndex) {
            if (this.currentSorting.index !== columnIndex) {
                return "bi-arrow-down-up";
            }

            if (this.currentSorting.asc) {
                return "bi-arrow-up";
            }

            return "bi-arrow-down";
        },
        /**
         * Sets the order and sorts the table by the given column index.
         * Sorting by a new column resets the order of the old column.
         * @param {Number} columnIndex - The index of the column to sort by.
         * @returns {void}
         */
        changeSorting (columnIndex) {
            const newSorting = {
                index: columnIndex,
                asc: null
            };

            if (this.currentSorting.index === columnIndex) {
                newSorting.asc = !this.currentSorting.asc;
            }
            else {
                newSorting.asc = true;
            }

            this.currentSorting = newSorting;
        },
        /**
         * Gets the data sorted by column and order.
         * @param {Object[]} data - The data to sort.
         * @param {Number} sortByIndex - The index of the column to sort.
         * @param {Boolean} sortAsc - If false, the data is sorted in descending order.
         * @returns {Object[]} the sorted items.
         */
        getSortedData (data, sortByIndex, sortAsc) {
            const sortedData = [...data].sort((a, b) => {
                const valueA = a.attributes[sortByIndex].value,
                    valueB = b.attributes[sortByIndex].value;

                if ((valueA === undefined || valueA === null) && (valueB === undefined || valueB === null)) {
                    return 0;
                }

                if (valueA === undefined || valueA === null) {
                    return 1;
                }

                if (valueB === undefined || valueB === null) {
                    return -1;
                }

                if (isNaN(valueA) && isNaN(valueB)) {
                    return valueA.localeCompare(valueB, undefined, {ignorePunctuation: true});
                }

                if (!isNaN(valueA) && !isNaN(valueB)) {
                    return parseFloat(valueA) - parseFloat(valueB);
                }

                if (isNaN(valueA)) {
                    return 1;
                }

                if (isNaN(valueB)) {
                    return -1;
                }

                return 0;
            });

            return sortAsc ? sortedData : sortedData.reverse();
        },
        /** Toggles the checked state of all datasets in the table and syncs the changes to the store.
         * @param {Boolean} changeTo - Is the new checked value for the table.
         */
        toggleAllRows (changeTo) {
            this.sortedData.forEach(dataset => {
                dataset.checked = changeTo;
            });

            this.syncCheckedToStore();
        },
        /** Toggles the checked state of a single dataset and syncs the change to the store.
         * @param {Object} dataset - The dataset for which the checked state should be toggled.
         * @param {Boolean} changeTo - Is the new checked value for the dataset.
         */
        toggleOneRow (dataset, changeTo) {
            dataset.checked = changeTo;

            this.syncCheckedToStore(dataset);
        }
    }
};
</script>

<template>
    <div
        :id="`TabResultTable-${tableIndex}`"
        class="TabResultTable"
    >
        <table v-if="sortedData.length">
            <thead>
                <tr>
                    <th
                        v-if="showCheckboxes"
                        @click.stop="toggleAllRows(!headerChecked)"
                        @keypress.stop="toggleAllRows(!headerChecked)"
                    >
                        <input
                            id="header-checkbox"
                            type="checkbox"
                            :checked="headerChecked"
                            @change="(evt) => toggleAllRows(evt.target.checked)"
                        >
                    </th>
                    <th
                        v-for="(attrName, attrIndex) in tableHeader"
                        :key="attrName"
                        :class="`th-item-${attrName}`"
                    >
                        <span>
                            {{ attrName }}
                        </span>

                        <span
                            v-if="attrIndex < sortableHeaderCount"
                            class="sortable-icon mt-1"
                            role="button"
                            tabindex="0"
                            :class="getIconClassForSorting(attrIndex)"
                            @click.stop="changeSorting(attrIndex)"
                            @keypress.stop="changeSorting(attrIndex)"
                        />
                    </th>
                </tr>
            </thead>

            <tbody>
                <tr
                    v-for="(dataset, datasetIndex) in sortedData"
                    :key="datasetIndex"
                    :class="'dataset-row dataset-row-' + datasetIndex"
                    :data-dataset-index="datasetIndex"
                >
                    <td
                        v-if="showCheckboxes"
                        @click.stop="toggleOneRow(dataset, !dataset.checked)"
                        @keypress.stop="toggleOneRow(dataset, !dataset.checked)"
                    >
                        <input
                            :id="`checkbox-${datasetIndex}`"
                            type="checkbox"
                            :checked="dataset.checked"
                            @change="(evt) => toggleOneRow(dataset, evt.target.checked)"
                        >
                    </td>
                    <td
                        v-for="attrName in sortedData[0].attributes.map(a => a.id || a.name)"
                        :key="attrName"
                        :class="`td-item-${attrName}`"
                        @click.stop="showCheckboxes ? toggleOneRow(dataset, !dataset.checked) : undefined"
                        @keypress.stop="showCheckboxes ? toggleOneRow(dataset, !dataset.checked) : undefined"
                    >
                        {{
                            (dataset.attributes.find(a => (a.id || a.name) === attrName) || {}).value || ''
                        }}
                    </td>

                    <td v-if="showButtons.georef">
                        <IconButton
                            v-if="hasGeoRef"
                            :class-array="[
                                'btn-light',
                                'me-2',
                                'listAction',
                                'georefButton',
                                datasetIndex % 2 !== 0 ? 'button-dark-background' : '',
                                dataset.instanceId === currentlyShownGeorefId ? 'isShownGeometry' : ''
                            ]"
                            :style="cssVars"
                            :aria="$t('additional:modules.lzsResearchClient.tabs.archiveList.table.showPositionInMap')"
                            icon="bi-crosshair"
                            @click="toggleDatasetPositionInMap(dataset)"
                        />
                    </td>

                    <td v-if="showButtons.details">
                        <IconButton
                            :class-array="['btn-light', 'me-2', 'listAction', datasetIndex % 2 !== 0 ? 'button-dark-background' : '']"
                            :aria="$t('additional:modules.lzsResearchClient.tabs.archiveList.table.goToDetails')"
                            icon="bi-arrow-right-circle"
                            @click="$emit('openDetails', dataset.instanceId)"
                        />
                    </td>

                    <td v-if="showButtons.preview">
                        <IconButton
                            v-if="dataset.hasPreview"
                            :class-array="['btn-light', 'me-2', 'listAction', datasetIndex % 2 !== 0 ? 'button-dark-background' : '']"
                            :aria="$t('additional:modules.lzsResearchClient.tabs.archiveList.table.showPreview')"
                            icon="bi-image"
                            @click="$emit('showPreview', dataset.instanceId)"
                        />
                    </td>

                    <td v-if="showButtons.download">
                        <IconButton
                            :class-array="['btn-light', 'me-2', 'listAction', datasetIndex % 2 !== 0 ? 'button-dark-background' : '']"
                            :aria="$t('additional:modules.lzsResearchClient.tabs.archiveList.table.download')"
                            icon="bi-file-earmark-arrow-down"
                            @click="$emit('download', dataset.instanceId)"
                        />
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style lang="scss" scoped>

.TabResultTable {
    table {
        width: 100%;

        th {
            &:first-child {
                padding-left: 1rem;
            }
            span.sortable-icon {
                cursor: pointer;
                margin: 0 0 0 0.5rem;

                &:hover {
                    background-color: $light_grey_hover;
                }
            }
        }

        tr {
            line-height: 3rem;

            /* Each dataset consists of multiple rows, so we group them using a data attribute. */
            &.dataset-row[data-dataset-index]:nth-child(odd) {
                background: $white;
            }
            &.dataset-row[data-dataset-index]:nth-child(even) {
                background: $light_grey_hover;
            }
            &.dataset-row[data-dataset-index]:nth-child(odd):hover,
            &.dataset-row[data-dataset-index]:nth-child(even):hover {
                background: $light_grey_active;
            }

            td:first-child {
                padding-left: 1rem;
            }
        }
    }

    :deep(button.button-dark-background) {
        background-color: $light_grey_hover;
        border-color: $light_grey_hover;
    }

    :deep(button.isShownGeometry) {
        background-color: rgb(var(--geomIndicatorFillColor));
        border-color: rgb(var(--geomIndicatorStrokeColor));
    }
}
</style>
