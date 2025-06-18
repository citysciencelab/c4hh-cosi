<script>
import {isUrl} from "../../../../src/shared/js/utils/urlHelper";

export default {
    name: "AttributeTable",
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
    <table class="custom-table">
        <tbody>
            <tr
                v-for="(value, key) in data"
                v-show="!layerConfig?.hideEmptyAttributeValues || (value !== null && value !== undefined && value !== '')"
                :key="key"
            >
                <td class="attribute-name">
                    {{ key }}
                </td>
                <td class="attribute-value">
                    <a
                        v-if="value && isUrl(value)"
                        :href="value"
                        target="_blank"
                        rel="noopener noreferrer"
                    >{{ value }}</a>
                    <template v-else>
                        {{ value }}
                    </template>
                </td>
            </tr>
        </tbody>
    </table>
</template>

<style scoped lang="scss">
@import 'variables';

.custom-table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    background-color: $white;
    border: 1px solid $light_grey;
}

.custom-table td {
    padding: 8px;
    border: 1px solid $light_grey;
    color: $dark_grey;
}

.attribute-name {
    font-weight: bold;
    width: 40%;
    background-color: $light_grey;
    color: $dark_grey;
}

.attribute-value {
    width: 60%;
    color: $dark_grey;
}
</style>
