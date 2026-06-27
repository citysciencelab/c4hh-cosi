<script>
import dayjs from "dayjs";
import {mapGetters, mapMutations} from "vuex";

export default {
    name: "SelectableList",
    props: {
        /**
         * Name of the id property. Required in order to
         */
        itemPropertyId: {
            type: String,
            required: false,
            default: "id"
        },
        /**
         * Data to show in the table.
         *
         * A unique "id" is required in the data.
         * You can customize the name of your id using the prop itemPropertyId.
         *
         * headers:
         * - itemProperty (required), e.g. "description" - Name of the item's object property (see items)
         * - displayName (required), e.g. "Description" - The visible label
         * - sortable (required), e.g. "string" or "false" - indicator, if the column shall be sortable and by which type (string, numeric, date)
         * - sortableDateFormat (optional, only needed for sortable: "date") - Format for date sorting (Default YYYY-MM-DD HH:mm)
         * - cssClass (optional), e.g. "clamp" - CSS class applied to all table data cells for this property
         *
         * items
         * - List of objects for each table row, with properties defined in headers->itemProperty
         *
         * {
         *   headers: [
         *     {
         *       itemProperty: "id",
         *       displayName: "ID",
         *       sortable: "numeric"
         *     },
         *     {
         *       itemProperty: "description",
         *       displayName: "Description",
         *       sortable: "string",
         *       cssClass: "clamp"
         *     },
         *     {
         *       itemProperty: "date",
         *       displayName: "Date",
         *       sortable: "date",
         *       sortableDateFormat: "DD.MM.YYYY HH:mm"
         *     }
         *   ],
         *   items: [
         *     {
         *       id: 123,
         *       description: "A description",
         *       date: "2023-01-01 12:00"
         *     },
         *     {
         *       id: 456,
         *       description: "Another text",
         *       date: "2023-01-02 12:00"
         *     },
         *   ],
         * }
         */
        tableData: {
            type: Object,
            required: true
        },
        /**
         * Selects an item id.
         */
        selectedItemId: {
            type: [Number, String],
            required: false,
            default: null
        },
        /**
         * Highlight selections and add hover + cursor?
         */
        highlightSelection: {
            type: Boolean,
            required: false,
            default: true
        }
    },
    emits: ["itemSelected"],
    data () {
        return {
            selectedItem: null,
            currentSorting: {
                columnName: "",
                order: "origin"
            },
            rowRefs: {}
        };
    },
    computed: {
        ...mapGetters("Modules/GeoMarker", [
            "geoMarkerFeatureSelected",
            "geoMarkerShortFeatureId",
            "scrollToGeoMarkerId",
            "listScrollTop"
        ]),
        sortedTable () {
            const table = {
                headers: this.tableData.headers,
                items: this.getSortedItems(this.tableData.items, this.currentSorting.columnName, this.currentSorting.order)
            };

            return table;
        },
        selectedFeatureId () {
            let selectedItemId = null;

            if (this.geoMarkerFeatureSelected) {
                selectedItemId = this.geoMarkerShortFeatureId(this.geoMarkerFeatureSelected.getId());
            }
            else {
                selectedItemId = null;
            }
            return selectedItemId;
        }
    },
    watch: {
        selectedItemId (id) {
            if (id === null) {
                this.selectedItem = null;
            }
            else {
                this.selectItem(this.tableData.items.find(item => item[this.itemPropertyId] === id));
            }
        },
        scrollToGeoMarkerId (id) {
            if (id !== null) {
                this.scrollToRow(id);
            }
            else {
                this.restoreScroll();
            }
        }
    },
    mounted () {
        if (this.selectedItemId) {
            this.selectItem(this.tableData.items.find(item => item[this.itemPropertyId] === this.selectedItemId));
        }

        this.$refs.selectableList.scrollTop = this.listScrollTop;
    },
    methods: {
        ...mapMutations("Modules/GeoMarker", [
            "setListScrollTop"
        ]),
        selectItem (item) {
            this.selectedItem = item;

            this.$emit("itemSelected", item);
        },
        /**
         * Gets a specific icon class to the passed order.
         * @param {String} column - The column in which the table is sorted.
         * @returns {String} The icon css class for the given order.
         */
        getIconClassByOrder (column) {
            if (this.currentSorting?.columnName !== column) {
                return "bi-arrow-down-up origin-order";
            }

            if (this.currentSorting.order === "asc") {
                return "bi-arrow-up";
            }

            if (this.currentSorting.order === "desc") {
                return "bi-arrow-down";
            }

            return "bi-arrow-down-up origin-order";
        },
        /**
         * Gets the next sort order.
         * @param {String} order - The order in which the table is sorted.
         * @returns {String} The sort order. Can be origin, desc, asc.
         */
        getNextSortOrder (order) {
            if (order === "origin") {
                return "asc";
            }

            if (order === "asc") {
                return "desc";
            }

            return "origin";
        },
        /**
         * Sets the order and sorts the table by the given column.
         * Sorting by a new column resets the order of the old column.
         * @param {String} columnName - The column to sort by.
         * @returns {void}
         */
        runSorting (columnName) {
            const newSorting = {
                columnName: columnName,
                order: null
            };

            if (newSorting.columnName === this.currentSorting.columnName) {
                newSorting.order = this.getNextSortOrder(this.currentSorting.order);
            }
            else {
                newSorting.order = this.getNextSortOrder("origin");
            }

            this.currentSorting = newSorting;
        },
        /**
         * Gets the items sorted by column and order.
         * @param {Object[]} items - The items to sort.
         * @param {String} columnToSort - The column name which is sorted.
         * @param {String} order - The order to sort by. Can be origin, desc, asc.
         * @returns {Object[]} the sorted items.
         */
        getSortedItems (items, columnToSort, order) {
            if (!Array.isArray(items)) {
                return [];
            }

            if (order === "origin") {
                return items;
            }

            const columnSettings = this.tableData.headers.find(item => item.itemProperty === columnToSort),
                sorted = [...items].sort((a, b) => {
                    const valueA = a[columnToSort],
                        valueB = b[columnToSort];

                    if ((valueA === undefined || valueA === null) && (valueB === undefined || valueB === null)) {
                        return 0;
                    }

                    if (valueA === undefined || valueA === null) {
                        return 1;
                    }

                    if (valueB === undefined || valueB === null) {
                        return -1;
                    }

                    if (columnSettings?.sortable) {
                        if (columnSettings.sortable === "numeric") {
                            const numA = parseFloat(valueA),
                                numB = parseFloat(valueB);

                            if (isNaN(numA) && isNaN(numB)) {
                                return 0;
                            }

                            if (isNaN(numA)) {
                                return 1;
                            }

                            if (isNaN(numB)) {
                                return -1;
                            }

                            return numA - numB;
                        }
                        else if (columnSettings.sortable === "string") {
                            // Set locales parameter to undefined in order to use the current browser locale.
                            return valueA.localeCompare(valueB, undefined, {ignorePunctuation: true});
                        }
                        else if (columnSettings.sortable === "date") {
                            const format = columnSettings.sortableDateFormat || "YYYY-MM-DD HH:mm",
                                dateA = dayjs(valueA, format),
                                dateB = dayjs(valueB, format);

                            if (!dateA.isValid() && !dateB.isValid()) {
                                return 0;
                            }

                            if (!dateA.isValid()) {
                                return 1;
                            }

                            if (!dateB.isValid()) {
                                return -1;
                            }

                            return dateA.diff(dateB);
                        }
                    }

                    return 0;
                });

            return order === "desc" ? sorted.reverse() : sorted;
        },
        /**
         * Sets a reference to a row element in the table.
         * This function is typically used to store a reference to a DOM element for later access,
         * such as for scrolling, focusing, or measuring purposes.
         *
         * @param {number|string} rowKey - The unique key identifying the row.
         * @param {HTMLElement|null} el - The DOM element representing the row, or null if not present.
         */
        setRowRef (id, el) {
            if (el) {
                this.rowRefs[id] = el;
            }
        },
        /**
         * Scrolls the container to bring the specified table row into view.
         *
         * @param {number} id - The id of the row to scroll to.
         * @returns {void}
         */
        scrollToRow (id) {
            const row = this.rowRefs[id];

            setTimeout(() => {
                if (row) {
                    row.scrollIntoView({behavior: "smooth", block: "center"});
                }
            }, 100);
        },
        /**
         * Handles the scroll event for the element.
         * Updates the actual scroll position.
         * @returns {void}
         */
        onScroll () {
            if (this.$refs.selectableList.scrollTop !== 0) {
                this.setListScrollTop(this.$refs.selectableList.scrollTop);
            }
        },
        /**
         * Restores the scroll position of the table rows to the specified value.
         *
         * @returns {void}
         */
        restoreScroll () {
            this.$nextTick(() => {
                const el = this.$refs.selectableList;

                el.scrollTop = this.listScrollTop;
            });
        }
    }
};
</script>

<template>
    <div
        id="SelectableList"
        ref="selectableList"
        class="selectableList fixed"
        @scroll="onScroll"
    >
        <table
            class="dynamic-column-table table-hover"
        >
            <thead>
                <tr>
                    <th
                        v-for="item in tableData.headers"
                        :key="`th_${item.itemProperty}`"
                        :class="[
                            'cellPadding',
                            `th-item-${item.itemProperty}`
                        ]"
                    >
                        <span>
                            {{ item.displayName }}
                        </span>

                        <span
                            v-if="item.sortable"
                            class="sortable-icon mt-1"
                            role="button"
                            tabindex="0"
                            :class="getIconClassByOrder(item.itemProperty)"
                            @click.stop="runSorting(item.itemProperty)"
                            @keypress.stop="runSorting(item.itemProperty)"
                        />
                    </th>
                </tr>
            </thead>

            <tbody>
                <tr
                    v-for="(trItem, trIndex) in sortedTable.items"
                    :key="`th_${trIndex}`"
                    :ref="el => setRowRef(trItem.id, el)"
                    :class="[
                        selectedFeatureId === trItem.id ? 'rowSelected' : '',
                        highlightSelection ? 'highlightSelection' : ''
                    ]"
                    @click="selectItem(trItem)"
                >
                    <td
                        v-for="(tdHeaderItem, tdIndex) in sortedTable.headers"
                        :key="`td_${trIndex}_${tdIndex}`"
                        :class="[
                            'cellPadding',
                            `td-item-${tdHeaderItem.itemProperty}`,
                            tdHeaderItem.cssClass ?? null
                        ]"
                    >
                        <template v-if="$slots['cell-' + tdHeaderItem.itemProperty]">
                            <slot
                                :name="'cell-' + tdHeaderItem.itemProperty"
                                :cell-data="sortedTable.items[trIndex]"
                            />
                        </template>

                        <template v-else>
                            <p :title="sortedTable.items[trIndex][tdHeaderItem.itemProperty]">
                                {{ sortedTable.items[trIndex][tdHeaderItem.itemProperty] }}
                            </p>
                        </template>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style lang="scss" scoped>

.selectableList {
    min-height: 15rem;
    border: solid .0625rem $light_blue;
    border-radius: 0.3125rem;
    max-height: calc(100vh - 14.0625rem);
    box-sizing: border-box;
    width: 100%;
    overflow-y: scroll;

    &.tableHeight {
        max-height: 36vh;
    }

    table {
        table-layout: inherit;
        border-collapse: separate;
        border-spacing: 0;
        width: 100%;

        th {
            position: sticky;
            top: 0;
            background: $light_blue;
            font-family: $font_family_accent;
            z-index: 2;
            width: fit-content;

            span.sortable-icon {
                cursor: pointer;
                margin: 0 0 0 0.5rem;

                &:hover {
                    background-color: $light_grey_hover;
                }
            }

            &.cellPadding {
                padding: 0.5rem;
                text-wrap: nowrap;
            }
        }

        tr {
            &.highlightSelection {
                cursor: pointer;

                &:hover {
                    background-color: $light_blue;
                }

                &.rowSelected td {
                    background-color: $primary;
                    border-bottom: .0625rem solid $light_grey_hover;
                }
            }

            td {
                word-wrap: break-word;
                white-space: normal;
                border-bottom: solid .0625rem $light_blue;
                vertical-align: top;

                p {
                    margin: 0;
                }

                &.cellPadding {
                    padding: 0.5rem;
                }

                &.clamp {
                    p {
                        display: -webkit-box;
                        -webkit-box-orient: vertical;
                        -webkit-line-clamp: 2;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        margin: 0;
                        max-width: 100%;
                        display: box;
                        box-orient: vertical;
                        line-clamp: 2;
                    }
                }
            }
        }
    }
}
</style>
