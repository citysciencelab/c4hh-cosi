<script>
import {isHTML} from "@shared/js/utils/isHTML.js";

export default {
    name: "TabBasicData",
    props: {
        attributes: {
            type: Object,
            required: true
        }
    },
    methods: {
        isHTML
    }
};
</script>

<template>
    <div id="TabBasicData">
        <table>
            <tbody>
                <tr
                    v-for="(value, key) in attributes"
                    :key="key"
                >
                    <td class="font-bold">
                        {{ key }}
                    </td>
                    <td
                        v-if="isHTML(value)"
                        v-html="value"
                    />
                    <td v-else>
                        {{ value }}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style lang="scss" scoped>
#TabBasicData {
    padding-top: 0.5rem;

    table {
        width: 100%;

        tr {
            border-color: var(--bs-border-color);
            border-style: solid;
            border-width: 0.5px 0;

            &:first-child {
                border-top-width: 0;
            }

            &:last-child {
                border-bottom-width: 0;
            }

            td {
                padding: 0.5rem;
                border-color: inherit;
                border-style: solid;
                border-width: 0;
            }
        }
    }
}
</style>
