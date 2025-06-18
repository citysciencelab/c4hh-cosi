<script>
import {isUrl} from "../../../../src/shared/js/utils/urlHelper";
import TableComponent from "../../../../src/shared/modules/table/components/TableComponent.vue";

export default {
    name: "AttributeTable",
    components: {
        TableComponent
    },
    props: {
        /**
         * The data object containing key-value pairs to display in the table
         */
        data: {
            type: Object,
            required: true
        },
        /**
         * Layer configuration to determine if empty values should be hidden
         */
        layerConfig: {
            type: Object,
            default: () => ({})
        }
    },
    computed: {
        /**
         * Transforms the key-value data into table format for TableComponent
         */
        tableData () {
            const items = [],
                headers = [
                    {name: "attribute", displayName: "Attribut", visible: true},
                    {name: "value", displayName: "Wert", visible: true}
                ];

            Object.entries(this.data).forEach(([key, value]) => {
                if (!this.layerConfig?.hideEmptyAttributeValues || (value !== null && value !== undefined && value !== "")) {
                    items.push({
                        attribute: key,
                        value: value
                    });
                }
            });

            return {
                headers,
                items
            };
        }
    },
    methods: {
        /**
         * Tests if the given string is a URL.
         * @param {String} str The string to test.
         * @returns {Boolean} True if the string is a URL.
         */
        isUrl
    }
};
</script>

<template>
    <TableComponent
        :data="tableData"
        :show-header="false"
        table-class="attribute-table"
        font-size="medium"
    />
</template>

<style scoped lang="scss">
// Custom styling for attribute table can be added here if needed
</style>
