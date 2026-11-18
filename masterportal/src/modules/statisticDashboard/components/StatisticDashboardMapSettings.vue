<script>
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";

export default {
    name: "StatisticDashboardMapSettings",
    components: {
        SwitchInput
    },
    props: {
        /**
         * Whether area names, year and value are shown as labels on the map.
         */
        showLabels: {
            type: Boolean,
            required: false,
            default: true
        },
        /**
         * Whether tooltips are shown on the map.
         */
        showTooltips: {
            type: Boolean,
            required: false,
            default: true
        }
    },
    emits: ["update:showLabels", "update:showTooltips"]
};
</script>

<template>
    <div class="map-settings px-2">
        <h5 class="mb-3 mt-3 map-settings-heading">
            {{ $t("common:modules.statisticDashboard.legend.additionalInformation") }}
        </h5>
        <SwitchInput
            id="map-settings-labels"
            class="mb-2"
            label="common:modules.statisticDashboard.legend.showLabels"
            :aria="$t('common:modules.statisticDashboard.legend.showLabels')"
            :model-value="showLabels"
            @update:model-value="$emit('update:showLabels', $event)"
        />
        <SwitchInput
            id="map-settings-tooltips"
            class="mb-4"
            label="common:modules.statisticDashboard.legend.showTooltips"
            :aria="$t('common:modules.statisticDashboard.legend.showTooltips')"
            :model-value="showTooltips"
            @update:model-value="$emit('update:showTooltips', $event)"
        />
    </div>
</template>

<style lang="scss" scoped>
.map-settings {
    .map-settings-heading {
        font-family: $font_family_accent;
    }
}
</style>
