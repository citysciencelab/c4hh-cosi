<script>
import {VContainer, VRow, VSpacer} from "vuetify/components";
import {VDivider} from "vuetify/components/VDivider";
import {VSelect} from "vuetify/components/VSelect";

export default {
    name: "DistrictFinderFilterOperator",
    components: {
        VContainer,
        VRow,
        VSpacer,
        VDivider,
        VSelect
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
    <v-container>
        <v-row class="justify-content-center">
            <v-divider
                class="conditionline"
                vertical
            />
        </v-row>
        <v-row class="justify-content-center">
            <v-spacer />
            <v-select
                :items="options"
                :model-value="operator"
                dense
                outlined
                hide-details
                class="conditionselect"
                @update:model-value="value => $emit('change', id, value)"
            />
            <v-spacer />
        </v-row>
        <v-row class="justify-content-center">
            <v-divider
                class="conditionline"
                vertical
            />
        </v-row>
    </v-container>
</template>

<style lang="scss" scoped>

.conditionline {
    height: 26px;
    padding: 0;
    border-color: $light_blue;
    opacity: 1;
    border-width: 1px;
}

.conditionselect {
    flex: 0 1 7em;
}
</style>
