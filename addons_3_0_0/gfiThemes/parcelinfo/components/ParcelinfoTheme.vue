<script>
import isObject from "../../../../../src_3_0_0/shared/js/utils/isObject";
import FlatButton from "../../../../../src_3_0_0/shared/modules/buttons/components/FlatButton.vue";

export default {
    name: "ParcelinfoTheme",
    components: {FlatButton},
    props: {
        feature: {
            type: Object,
            required: true
        }
    },
    computed: {
        /**
         * Returns the mapped properties.
         * @returns {Object} The mapped properties.
         */
        mappedProperties: function () {
            return this.feature?.getMappedProperties();
        }
    },
    methods: {
        isObject,

        /**
         * Todos.
         * @returns {Boolean} false
         */
        createReport: function () {
            return false;
        }
    }
};
</script>

<template>
    <table
        v-if="isObject(mappedProperties)"
        class="table table-hover"
    >
        <tbody>
            <tr
                v-for="(value, key) in mappedProperties"
                :key="value"
            >
                <td class="firstCol">
                    {{ key }}
                </td>
                <td class="secCol">
                    {{ value }}
                </td>
            </tr>
        </tbody>
    </table>
    <FlatButton
        id="create-report"
        aria-label="$t('additional:addons.gfiThemes.parcelinfo.createReport')"
        :interaction="createReport"
        :text="$t('additional:addons.gfiThemes.parcelinfo.createReport')"
        :icon="'bi-printer'"
    />
</template>

<style lang="scss" scoped>
@import "~variables";

td.firstCol {
    width: 60%;
    font-family: $font_family_accent;
}
td.secCol {
    width: 40%;
    text-align: left;
}
</style>
