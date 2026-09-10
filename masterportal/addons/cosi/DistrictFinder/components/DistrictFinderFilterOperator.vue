<script>
import DropdownAutocomplete from "../../shared/modules/dropdown/components/DropdownAutocomplete.vue";
import {VSpacer} from "vuetify/components";

export default {
    name: "DistrictFinderFilterOperator",
    components: {
        DropdownAutocomplete,
        VSpacer
    },
    props: {
        id: {
            type: String,
            required: true
        },
        operator: {
            type: String,
            required: true
        }
    },
    emits: ["change"],
    data () {
        return {
            options: [
                {title: this.$t("additional:modules.tools.cosi.districtFinder.operators.or"), value: "or"},
                {title: this.$t("additional:modules.tools.cosi.districtFinder.operators.and"), value: "and"}
            ]
        };
    }
};
</script>

<template lang="html">
    <div class="container">
        <div class="row justify-content-center">
            <div class="conditionline" />
        </div>
        <div class="row justify-content-center">
            <v-spacer />
            <Dropdown-Autocomplete
                class="col col-md-3 conditionselect"
                :items="options"
                :model-value="operator"
                :label="$t('additional:modules.tools.cosi.districtFinder.label.linkConditions')"
                @update:model-value="value => $emit('change', id, value)"
            />
            <v-spacer />
        </div>
        <div class="row justify-content-center">
            <div class="conditionline m-0" />
        </div>
    </div>
</template>

<style lang="scss" scoped>

.conditionline {
    width: 1px;
    height: 26px;
    padding: 0;
    background-color: $secondary;
    opacity: 1;
}

</style>
