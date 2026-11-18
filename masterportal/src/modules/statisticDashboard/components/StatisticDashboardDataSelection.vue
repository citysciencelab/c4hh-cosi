<script>
// @ts-check
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import StatisticDashboardDataSelectionExpanded from "./StatisticDashboardDataSelectionExpanded.vue";
import {mapGetters} from "vuex";

export default {
    name: "StatisticDashboardDataSelection",
    components: {
        IconButton,
        StatisticDashboardDataSelectionExpanded
    },
    emits: ["resetAll"],
    data () {
        return {
            isExpanded: false
        };
    },
    computed: {
        ...mapGetters("Modules/StatisticDashboard", [
            "selectedCategories",
            "selectedDates",
            "selectedRegions",
            "selectedStatistics",
            "selectedStatisticsKeys",
            "selectedRegionsValues",
            "selectedReferenceData"
        ]),

        allFiltersSelected () {
            return this.selectedCategories.length > 0
                && this.selectedStatisticsKeys.length > 0
                && this.selectedRegions.length > 0
                && this.selectedDates.length > 0;
        }
    }
};

</script>

<template lang="html">
    <div class="card card-body p-3">
        <div
            v-show="isExpanded"
            class="px-2"
        >
            <div class="d-flex flex-wrap justify-content-between">
                <div class="my-3">
                    <h5 class="m-0">
                        <i class="bi bi-sliders mr-2" />
                        {{ $t('common:modules.statisticDashboard.headings.dataSelection') }}
                    </h5>
                </div>
                <div class="d-flex gap-2">
                    <IconButton
                        id="reset-filter-button"
                        :aria="$t('common:modules.statisticDashboard.button.resetFilter')"
                        :label="$t('common:modules.statisticDashboard.button.resetFilter')"
                        icon="bi bi-arrow-counterclockwise"
                        :label-class-array="['mt-1 lh-sm btn-label-smaller']"
                        @click="$emit('resetAll')"
                    />
                    <IconButton
                        id="close-filter-button"
                        :aria="$t('common:modules.statisticDashboard.button.closeFilter')"
                        :label="$t('common:modules.statisticDashboard.button.closeFilter')"
                        icon="bi bi-x"
                        :label-class-array="['mt-1 lh-sm btn-label-smaller']"
                        @click="isExpanded = false"
                    />
                </div>
            </div>
            <StatisticDashboardDataSelectionExpanded
                @click:showData="isExpanded = false"
            />
        </div>
        <template v-if="!isExpanded">
            <div class="d-flex flex-wrap justify-content-between">
                <div class="my-3">
                    <h5 class="m-0">
                        <i class="bi bi-sliders mx-2" />
                        {{ $t('common:modules.statisticDashboard.headings.dataSelection') }}
                    </h5>
                </div>
                <div>
                    <button
                        type="button"
                        class="btn btn-text fw-bold shadow-none"
                        @click="isExpanded = true"
                    >
                        {{ $t('common:modules.statisticDashboard.legend.edit') }}
                    </button>
                </div>
            </div>
            <div class="mt-2">
                <p
                    v-if="selectedCategories.length > 0"
                    class="selected-categories mb-3"
                >
                    {{ selectedCategories.join(' · ') }}
                </p>
                <p
                    v-if="!allFiltersSelected"
                    class="mt-1 mb-2"
                >
                    <small class="fst-italic">
                        {{ $t('common:modules.statisticDashboard.infoTextFilter') }}
                    </small>
                </p>
                <div class="d-flex flex-wrap gap-2">
                    <span
                        v-if="selectedStatisticsKeys.length > 0"
                        class="badge rounded-pill text-dark fw-normal px-3 py-2 filter-count-badge"
                    >
                        <i class="bi bi-bar-chart-line me-1" />
                        {{ selectedStatisticsKeys.length }} {{ $t('common:modules.statisticDashboard.label.statistic', { count: selectedStatisticsKeys.length }) }}
                    </span>
                    <span
                        v-if="selectedRegions.length > 0"
                        class="badge rounded-pill text-dark fw-normal px-3 py-2 filter-count-badge"
                    >
                        <i class="bi bi-pin-map me-1" />
                        {{ selectedRegionsValues.length }} {{ $t('common:modules.statisticDashboard.label.area', { count: selectedRegionsValues.length }) }}
                    </span>
                    <span
                        v-if="selectedDates.length > 0"
                        class="badge rounded-pill text-dark fw-normal px-3 py-2 filter-count-badge"
                    >
                        <i class="bi bi-calendar-event me-1" />
                        {{ selectedDates.length }} {{ $t('common:modules.statisticDashboard.label.year', { count: selectedDates.length }) }}
                    </span>
                    <span
                        v-if="selectedReferenceData"
                        class="badge rounded-pill text-dark fw-normal px-3 py-2 filter-count-badge"
                    >
                        <i class="bi bi-exclude me-1" />
                        {{ $t('common:modules.statisticDashboard.label.differenceMode') }} {{ selectedReferenceData.type === "date" ? $t('common:modules.statisticDashboard.label.year') : $t('common:modules.statisticDashboard.label.area') }}
                    </span>
                </div>
            </div>
        </template>
    </div>
</template>

<style lang="scss" scoped>

.btn-text {
    color: $secondary;
    font-size: $font_size_sm;
}

.btn-wrapper {
    width: 5rem !important;
}

.filter-count-badge {
    background-color: $light_blue;
}

.selected-categories {
    font-size: $font_size_big;
}

</style>
