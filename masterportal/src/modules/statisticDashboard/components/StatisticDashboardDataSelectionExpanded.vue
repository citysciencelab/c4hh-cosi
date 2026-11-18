<script>
// @ts-check
/**
 * @import {DropdownItem} from "@shared/modules/dropdown/types/typesDropdown.js"
 * @import {StatisticDashboardMapGetters, StatisticDashboardMapMutations} from "../types/helpers.js"
 */
import BaseCard from "@shared/modules/cards/components/BaseCard.vue";
import ButtonGroup from "@shared/modules/buttons/components/ButtonGroup.vue";
import {compareDropdownItems} from "@shared/js/utils/sortDropdownItems.js";
import DropdownAutocomplete from "@shared/modules/dropdown/components/DropdownAutocomplete.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {mapGetters, mapMutations} from "vuex";
import StatisticDashboardDifference from "./StatisticDashboardDifference.vue";
import StatisticDashboardFilterRegions from "./StatisticDashboardFilterRegions.vue";
import StatisticDashboardSpecificsSelection from "./StatisticDashboardSpecificsSelection.vue";
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";

export default {
    name: "StatisticDashboardDataSelectionExpanded",
    components: {
        BaseCard,
        ButtonGroup,
        DropdownAutocomplete,
        FlatButton,
        StatisticDashboardFilterRegions,
        StatisticDashboardDifference,
        StatisticDashboardSpecificsSelection,
        SwitchInput
    },
    emits: ["click:showData"],
    data () {
        return {
            isExpanded: false,
            showDifference: false
        };
    },
    computed: {
        .../** @type {StatisticDashboardMapGetters} */ (mapGetters)("Modules/StatisticDashboard", [
            "categories",
            "data",
            "selectedCategories",
            "selectedDates",
            "selectedLevel",
            "selectedRegions",
            "selectedStatisticsKeys",
            "showAggregatedView",
            "specificStatisticKeys",
            "timeStepsFilter"
        ]),

        /**
         * Gets the buttons with group regions
         * @typedef {Object} ButtonGroupRegion
         * @property {string} name - The name of the region.
         * @returns {ButtonGroupRegion[]} The button group regions
         */
        buttonGroupRegions () {
            return this.data.map(level => ({
                name: level.levelName
            }));
        },

        /**
         * Gets the statistics offered in the statistics dropdown, filtered by the selected categories.
         * If showAggregatedView is enabled, specific statistics are excluded.
         * @returns {DropdownItem[]} The selectable statistics.
         */
        selectableStatistics () {
            if (!this.selectedLevel) {
                return [];
            }
            return Object.entries(this.selectedLevel.mappingFilter.statisticsAttributes)
                .filter(([key, attribute]) => this.selectedCategories.includes(attribute.category)
                    && (!this.showAggregatedView || !this.specificStatisticKeys.includes(key)))
                .map(([key, attribute]) => ({
                    value: key,
                    title: attribute.name
                }));
        },

        /**
         * Gets the selected dates sorted alphabetically by their titles for the chips.
         * The dates dropdown itself keeps the chronological order of the time steps.
         * @returns {DropdownItem[]} The sorted selected dates.
         */
        selectedDatesSorted () {
            if (!Array.isArray(this.selectedDates)) {
                return [];
            }

            return [.../** @type {DropdownItem[]} */ (this.selectedDates)].sort((a, b) => compareDropdownItems(a, b));
        },

        /**
         * Gets the keys selected in the statistics dropdown.
         * If showAggregatedView is enabled, specific statistics are selected in the specifics selection instead.
         * @returns {string[]} The selected keys of the statistics dropdown.
         */
        statisticsDropdownKeys () {
            if (!this.showAggregatedView) {
                return this.selectedStatisticsKeys;
            }
            return this.selectedStatisticsKeys.filter(key => !this.specificStatisticKeys.includes(key));
        }
    },
    watch: {
        /**
         * Clear the reference data if the difference section is deactivated.
         * @param {Boolean} val if to show the difference section
         * @returns {void}
         */
        showDifference (val) {
            if (!val) {
                this.setSelectedReferenceData(undefined);
            }
        }
    },
    methods: {
        .../** @type {StatisticDashboardMapMutations} */ (mapMutations)("Modules/StatisticDashboard", [
            "setSelectedDates",
            "setSelectedAggregatedStatisticsKeys",
            "setSelectedLevelName",
            "setSelectedReferenceData",
            "setSelectedStatisticsKeys",
            "updateSelectedCategories"
        ]),

        /**
         * Sets the selected statistics from the statistics dropdown.
         * @param {string[]} keys The selected keys.
         * @returns {void}
         */
        updateStatisticsDropdownKeys (keys) {
            if (this.showAggregatedView) {
                this.setSelectedAggregatedStatisticsKeys(keys);
            }
            else {
                this.setSelectedStatisticsKeys(keys);
            }
        }
    }
};

</script>

<template lang="html">
    <div
        v-if="buttonGroupRegions.length > 1"
        class="mb-4"
    >
        <h6>{{ $t('common:modules.statisticDashboard.dataSelectionExpanded.level') }}</h6>
        <ButtonGroup
            :buttons="buttonGroupRegions"
            :selected-value="selectedLevel?.levelName"
            full-width
            group="regions"
            @set-selected-button="setSelectedLevelName"
        />
    </div>
    <BaseCard class="mb-3">
        <h6 class="mt-2 fs-5 fw-bold text-mp-secondary">
            <i
                class="mr-2 fs-4 bi"
                :class="selectedStatisticsKeys.length > 0 ? 'bi-check-circle-fill text-success' : 'bi-1-circle-fill'"
            />
            {{ $t('common:modules.statisticDashboard.dataSelectionExpanded.title') }}
        </h6>
        <DropdownAutocomplete
            class="mb-2"
            :label="$t('common:modules.statisticDashboard.dataSelectionExpanded.categories')"
            :items="categories"
            multiple
            sortable
            selected-first
            :model-value="selectedCategories"
            @update:model-value="updateSelectedCategories"
        />
        <DropdownAutocomplete
            class="mb-2"
            :label="$t('common:modules.statisticDashboard.dataSelectionExpanded.indicators')"
            :items="selectableStatistics"
            :model-value="statisticsDropdownKeys"
            multiple
            sortable
            selected-first
            @update:model-value="updateStatisticsDropdownKeys"
        />
        <StatisticDashboardSpecificsSelection
            v-if="showAggregatedView"
            class="mb-2"
        />
        <span
            v-if="selectedStatisticsKeys.length > 0"
            class="text-mp-secondary"
        >
            {{
                $t('common:modules.statisticDashboard.dataSelectionExpanded.selectedStatistics', {
                    count: selectedStatisticsKeys.length
                })
            }}
        </span>
    </BaseCard>
    <BaseCard class="mb-3">
        <h6 class="mt-2 fs-5 fw-bold text-mp-secondary">
            <i
                class="mr-2 fs-4 bi"
                :class="selectedRegions.length > 0 ? 'bi-check-circle-fill text-success' : 'bi-2-circle-fill'"
            />
            {{ $t('common:modules.statisticDashboard.dataSelectionExpanded.area') }}
        </h6>
        <StatisticDashboardFilterRegions />
    </BaseCard>
    <BaseCard class="mb-4">
        <h6 class="mt-2 fs-5 fw-bold text-mp-secondary">
            <i
                class="mr-2 fs-4 bi"
                :class="selectedDates.length > 0 ? 'bi-check-circle-fill text-success' : 'bi-3-circle-fill'"
            />
            {{ $t('common:modules.statisticDashboard.dataSelectionExpanded.timePeriod') }}
        </h6>
        <DropdownAutocomplete
            class="my-2"
            :label="$t('common:modules.statisticDashboard.label.year')"
            :items="timeStepsFilter"
            return-object
            multiple
            :placeholder="$t('common:modules.statisticDashboard.reference.placeholder')"
            :model-value="selectedDatesSorted"
            @update:model-value="setSelectedDates"
        />
    </BaseCard>
    <div class="d-flex mb-3">
        <i class="mr-3 fs-5bi bi-exclude" />
        <div class="d-flex flex-column flex-grow-1">
            <label
                for="show-difference"
                class="fw-bold"
            >
                {{ $t('common:modules.statisticDashboard.dataSelectionExpanded.showDifference') }}
            </label>
            {{ $t('common:modules.statisticDashboard.dataSelectionExpanded.differenceDescription') }}
        </div>
        <SwitchInput
            id="show-difference"
            v-model="showDifference"
            omit-label
            :aria="$t('common:modules.statisticDashboard.dataSelectionExpanded.showDifference')"
            :label="$t('common:modules.statisticDashboard.dataSelectionExpanded.showDifference')"
        />
    </div>
    <StatisticDashboardDifference
        v-if="showDifference"
        class="mb-3"
    />
    <div class="mt-3 d-flex justify-content-center">
        <FlatButton
            :disabled="selectedDates.length === 0 || selectedStatisticsKeys.length === 0 || selectedRegions.length === 0"
            :text="$t('common:modules.statisticDashboard.dataSelectionExpanded.showData')"
            icon="bi bi-plus-circle"
            :interaction="() => $emit('click:showData')"
        />
    </div>
</template>

<style lang="scss" scoped>
    .fw-bold {
        font-weight: $font_family_accent;
    }
</style>
