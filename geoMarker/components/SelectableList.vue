<script>

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
         * - cssClass (optional), e.g. "clamp" - CSS class applied to all table data cells for this property
         *
         * items
         * - List of objects for each table row, with properties defined in headers->itemProperty
         *
         * {
         *   headers: [
         *     {
         *       itemProperty: "id",
         *       displayName: "ID"
         *     },
         *     {
         *       itemProperty: "description",
         *       displayName: "Description",
         *       cssClass: "clamp"
         *     }
         *   ],
         *   items: [
         *     {
         *       id: 123,
         *       description: "A description"
         *     },
         *     {
         *       id: 456,
         *       description: "Another text"
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
        }
    },
    emits: ["itemSelected"],
    data () {
        return {
            selectedItem: null
        };
    },
    watch: {
        selectedItemId (id) {
            if (id === null) {
                this.selectedItem = null;
            }
            else {
                this.selectItem(this.tableData.items.find(item => item[this.itemPropertyId] === id));
            }
        }
    },
    mounted () {
        if (this.selectedItemId) {
            this.selectItem(this.tableData.items.find(item => item[this.itemPropertyId] === this.selectedItemId));
        }
    },
    methods: {
        selectItem (item) {
            this.selectedItem = item;

            this.$emit("itemSelected", item);
        }
    }
};
</script>

<template>
    <div
        id="SelectableList"
        class="selectableList fixed"
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
                        {{ item.displayName }}
                    </th>
                </tr>
            </thead>

            <tbody>
                <tr
                    v-for="(trItem, trIndex) in tableData.items"
                    :key="`th_${trIndex}`"
                    :class="[
                        JSON.stringify(selectedItem) === JSON.stringify(trItem) ? 'rowSelected' : ''
                    ]"
                    @click="selectItem(trItem)"
                >
                    <td
                        v-for="(tdHeaderItem, tdIndex) in tableData.headers"
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
                                :cell-data="tableData.items[trIndex]"
                            />
                        </template>

                        <template v-else>
                            <p :title="tableData.items[trIndex][tdHeaderItem.itemProperty]">
                                {{ tableData.items[trIndex][tdHeaderItem.itemProperty] }}
                            </p>
                        </template>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";

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

        th {
            position: sticky;
            top: 0;
            background: $light_blue;
            font-family: $font_family_accent;
            z-index: 2;
            width: fit-content;

            &.cellPadding {
                padding: 0.5rem;
            }
        }

        tr {
            cursor: pointer;

            &:hover {
                background-color: $light_blue;
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

            &.rowSelected td {
                background-color: $primary;
                border-bottom: .0625rem solid $light_grey_hover;
            }
        }
    }
}
</style>
