<script>
import IconButton from "@shared/modules/buttons/components/IconButton.vue";

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
    emits: ["openDetails", "showPreview", "download"],
    data () {
        return {
            currentSorting: {
                index: 0,
                asc: true
            }
        };
    },
    computed: {
        sortedData () {
            return this.getSortedData(this.tableDatasets, this.currentSorting.index, this.currentSorting.asc);
        },
        sortableHeaderCount () {
            return this.tableDatasets[0]?.attributes.length || 0;
        }
    },
    methods: {
        showDatasetPositionInMap (datasetInstanceId) {
            console.warn(datasetInstanceId + " noch nicht implementiert!");
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
                        v-for="attrName in sortedData[0].attributes.map(a => a.id || a.name)"
                        :key="attrName"
                        :class="`td-item-${attrName}`"
                    >
                        {{
                            (dataset.attributes.find(a => (a.id || a.name) === attrName) || {}).value || ''
                        }}
                    </td>

                    <td>
                        <IconButton
                            v-if="showButtons.georef && hasGeoRef"
                            :class-array="['btn-light', 'me-2', 'listAction', datasetIndex % 2 !== 0 ? 'button-dark-background' : '']"
                            :aria="$t('additional:modules.lzsResearchClient.tabs.tabResult.table.showPositionInMap')"
                            icon="bi-crosshair"
                            @click="showDatasetPositionInMap(dataset.instanceId)"
                        />
                    </td>

                    <td>
                        <IconButton
                            v-if="showButtons.details"
                            :class-array="['btn-light', 'me-2', 'listAction', datasetIndex % 2 !== 0 ? 'button-dark-background' : '']"
                            :aria="$t('additional:modules.lzsResearchClient.tabs.tabResult.table.goToDetails')"
                            icon="bi-arrow-right-circle"
                            @click="$emit('openDetails', dataset.instanceId)"
                        />
                    </td>

                    <td>
                        <IconButton
                            v-if="showButtons.preview && dataset.hasPreview"
                            :class-array="['btn-light', 'me-2', 'listAction', datasetIndex % 2 !== 0 ? 'button-dark-background' : '']"
                            :aria="$t('additional:modules.lzsResearchClient.tabs.tabResult.table.showPreview')"
                            icon="bi-image"
                            @click="$emit('showPreview', dataset.instanceId)"
                        />
                    </td>

                    <td>
                        <IconButton
                            v-if="showButtons.download"
                            :class-array="['btn-light', 'me-2', 'listAction', datasetIndex % 2 !== 0 ? 'button-dark-background' : '']"
                            :aria="$t('additional:modules.lzsResearchClient.tabs.tabResult.table.download')"
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
//@import "~variables";

.TabResultTable {
    table {
        width: 100%;

        th {
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
}
</style>
