<script>

import {mapGetters} from "vuex";
import getters from "../../../../src/modules/getFeatureInfo/store/gettersGetFeatureInfo.js";
import {isWebLink} from "../../../../src/shared/js/utils/urlHelper.js";
import isObject from "../../../../src/shared/js/utils/isObject.js";
import localeCompare from "../../../../src/shared/js/utils/localeCompare.js";
import {getCenter} from "ol/extent.js";
import TableComponent from "../../../../src/shared/modules/table/components/TableComponent.vue";

export default {
    name: "DataTable",
    components: {
        TableComponent
    },
    props: {
        feature: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            columns: [],
            rows: [],
            data: {},
            dropdownSelected: {},
            filterObject: {},
            originFilteredRows: undefined
        };
    },
    computed: {
        ...mapGetters("Modules/Language", ["currentLocale"]),
        ...mapGetters("Maps", ["projection"]),
        ...mapGetters("Modules/GetFeatureInfo", Object.keys(getters)),

        /**
         * Gets the unsorted and unfiltered rows.
         * @returns {Object[]} The origin rows.
         */
        originRows: function () {
            return this.feature.getFeatures().map(singleFeature => singleFeature.getMappedProperties());
        },

        /**
         * Returns whether download Button is enabled.
         * @returns {Boolean} True if the download Buttion is enabled.
         */
        enableDownload: function () {
            return this.feature?.getTheme()?.params?.enableDownload || false;
        },
        /**
         * Returns the name for the download file.
         * @returns {String} True if the download Buttion is enabled.
         */
        exportFileName: function () {
            return this.feature?.getTheme()?.params?.exportFileName || false;
        },

        /**
         * Returns whether the table is sortable.
         * @returns {Boolean} True if the table is sortable otherwise false.
         */
        isSortable: function () {
            return this.feature.getTheme()?.params?.isSortable || false;
        },

        /**
         * Returns whether the full View table is enabled for the current layer.
         * @returns {Boolean} True if full View table is enabled for the current layer.
         */
        fullViewEnabled: function () {
            return this.feature.getTheme()?.params?.fullViewEnabled || false;
        },

        /**
         * Returns whether the table is filterable.
         * @returns {Boolean} True if the table is filterable otherwise false.
         */
        isFilterable: function () {
            return this.feature.getTheme()?.params?.isFilterable || false;
        },

        /**
         * Returns the value of parameter shownCount
         * @returns {String|undefined} the value of parameter shownCount
         */
        showCount: function () {
            return this.feature.getTheme()?.params?.showCount;
        },

        /**
         * Returns the column which has an other order than 'origin'.
         * @returns {Object|undefined} The column or undefined if no column is found.
         */
        sortingColumn: function () {
            return this.columns.find(column => column.order !== "origin");
        },
        /**
         * Returns additional columns for epsg code, easting and northing.
         * @returns {Object[]} Array of key-value-objects representing the column header and the value to be set for all items.
         */
        additionalColumns () {
            const columns = [],
                extent = this.feature?.getBBox?.();

            if (extent) {
                columns.push({key: "EPSG", value: this.projection.getCode()});
                columns.push({key: "Rechtswert", value: getCenter(extent)[0].toString()});
                columns.push({key: "Hochwert", value: getCenter(extent)[1].toString()});
            }
            return columns;
        }
    },
    watch: {
        filterObject: {
            handler () {
                const filteredRows = this.getFilteredRows(this.filterObject, this.originRows);

                this.originFilteredRows = filteredRows;
                if (this.sortingColumn) {
                    this.rows = this.getSortedRows(this.originFilteredRows ? this.originFilteredRows : this.rows, this.sortingColumn.order, this.sortingColumn.name);
                }
                else {
                    this.rows = filteredRows;
                }
            },
            deep: true
        },
        feature: {
            handler (newVal) {
                this.rows = newVal.getFeatures().map(singleFeature => singleFeature.getMappedProperties());
                this.columns = this.getColumns(newVal.getAttributesToShow());
                this.data = {
                    headers: this.columns,
                    items: this.rows
                };
            },
            immediate: true
        }
    },
    created () {
        this.fileName = this.feature?.getTitle();
    },
    methods: {
        isWebLink,
        isObject,
        /**
         * Creates and returns the columns for the table.
         * @param {Object} gfiAttributes - The attributes to be displayed.
         * @returns {Object[]} The column objects.
         */
        getColumns (gfiAttributes) {
            return Object.keys(gfiAttributes).map((key, idx) => {
                return {
                    name: gfiAttributes[key],
                    order: "origin",
                    index: idx
                };
            });
        },

        /**
         * Gets a specific icon class to the passed order.
         * @param {String} order - The order in which the table is sorted.
         * @returns {String} The icon css class for the given order.
         */
        getIconClassByOrder (order) {
            if (order === "asc") {
                return "bi-arrow-up";
            }
            if (order === "desc") {
                return "bi-arrow-down";
            }
            return "bi-arrow-down-up origin-order";
        },

        /**
         * Gets the old sorted column if another one is to be sorted.
         * @param {Object[]} columns - The columns objects.
         * @param {Number} indexNewColumn - The index of the column that will be sorted.
         * @returns {Object|undefined} The old sorted column or undefined if it not exits.
         */
        getOldSortedColumn (columns, indexNewColumn) {
            return columns.find(col => {
                return col.order !== "origin" && col.index !== indexNewColumn;
            });
        },

        /**
         * Gets the rows sorted in the correct order.
         * @param {Object[]} rows - The rows.
         * @param {String} order - The order in which the table is sorted.
         * @param {String} columnName - The name of the column to sort by.
         * @returns {Object[]} The sorted rows.
         */
        getSortedRows (rows, order, columnName) {
            if (order === "origin") {
                return this.originFilteredRows ? this.originFilteredRows : this.originRows;
            }
            const sorted = [...rows].sort((a, b) => {
                if (typeof a[columnName] === "undefined") {
                    return -1;
                }
                if (typeof b[columnName] === "undefined") {
                    return 1;
                }
                return localeCompare(a[columnName], b[columnName], this.currentLocale, {ignorePunctuation: true});
            });

            return order === "asc" ? sorted : sorted.reverse();
        },

        /**
         * Gets the next sort order.
         * @param {String} order - The order in which the table is sorted.
         * @returns {String} The sort order.
         */
        getSortOrder (order) {
            if (order === "origin") {
                return "asc";
            }
            if (order === "asc") {
                return "desc";
            }
            return "origin";
        },

        /**
         * Gets the unique values for given column name.
         * @param {String} columnName The column name.
         * @param {Object[]} originRows The rows to iterate.
         * @returns {String[]} the unique values.
         */
        getUniqueValuesByColumnName (columnName, originRows) {
            if (typeof columnName !== "string" || !Array.isArray(originRows) || !originRows.length) {
                return [];
            }
            const result = {};

            originRows.forEach(row => {
                if (typeof row[columnName] !== "undefined" && !result[row[columnName]]) {
                    result[row[columnName]] = true;
                }
            });
            return Object.keys(result).sort((a, b) => localeCompare(a, b, this.currentLocale, {ignorePunctuation: true}));
        },

        /**
         * Adds a filter to the filterObject property.
         * @param {String} selectedOption The selected option.
         * @param {String} columnName The name of the column.
         * @returns {void}
         */
        addFilter (selectedOption, columnName) {
            if (typeof selectedOption !== "string" || typeof columnName !== "string") {
                return;
            }

            const value = selectedOption.toLowerCase(),
                filterObject = JSON.parse(JSON.stringify(this.filterObject));

            if (!Object.prototype.hasOwnProperty.call(filterObject, columnName)) {
                filterObject[columnName] = {};
            }
            filterObject[columnName][value] = true;
            this.filterObject = filterObject;
        },

        /**
         * Removes a filter from the filterObject property.
         * @param {String} removedOption The selected option.
         * @param {String} columnName The name of the column.
         * @returns {void}
         */
        removeFilter (removedOption, columnName) {
            if (typeof removedOption !== "string" || typeof columnName !== "string") {
                return;
            }
            const value = removedOption.toLowerCase(),
                filterObject = JSON.parse(JSON.stringify(this.filterObject));

            if (Object.keys(filterObject[columnName]).length === 1) {
                delete filterObject[columnName];
            }
            else {
                delete filterObject[columnName][value];
            }
            this.filterObject = filterObject;
        },

        /**
         * Gets the rows based on given filter.
         * @param {Object} filter The filter object.
         * @param {Object[]} allRows All rows to filter.
         * @returns {Object[]} the rows who matches the filter object.
         */
        getFilteredRows (filter, allRows) {
            if (!isObject(filter) || !Array.isArray(allRows)) {
                return [];
            }
            return allRows.filter((row) => {
                let filterHit = true,
                    allMatching = true;

                Object.keys(filter).forEach(key => {
                    if (!allMatching) {
                        return;
                    }
                    const filterValue = typeof row[key] === "string" ? filter[key][row[key].toLowerCase()] : false;

                    if (!filterValue) {
                        allMatching = false;
                        filterHit = false;
                    }
                });
                return filterHit;
            });
        },
        /**
         * Gets the css z-index for the column header.
         * The left column should always have a higher z-index than the right column.
         * @param {Number} idx - The of the column.
         * @return {Object} The style object.
         */
        getZIndex (idx) {
            return {
                "z-index": this.columns.length - idx
            };
        }
    }
};
</script>

<template>
    <div
        id="table-data-container"
    >
        <TableComponent
            :data="data"
            :sortable="true"
            :full-view-enabled="fullViewEnabled"
            :filterable="true"
            :enable-settings="true"
            :hits="showCount"
            :downloadable="enableDownload"
            :additional-columns-for-download="additionalColumns"
            :export-file-name="exportFileName"
        />
    </div>
</template>

<style lang="scss">

#table-data-container {
    margin:6px 15px 0 12px;
    }
</style>
