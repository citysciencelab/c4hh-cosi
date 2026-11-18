<script>
// @ts-check
/**
 * @import {SpecificsSelection, SpecificsTag} from "../types/internalTypes.js"
 * @import {StatisticDashboardMapGetters, StatisticDashboardMapMutations} from "../types/helpers.js"
 */
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import {mapGetters, mapMutations} from "vuex";

export default {
    name: "StatisticDashboardSpecificsSelection",
    components: {
        AccordionItem
    },
    data () {
        return {
            /** @type {string[]} */
            expandedKeys: []
        };
    },
    computed: {
        .../** @type {StatisticDashboardMapGetters} */ (mapGetters)("Modules/StatisticDashboard", [
            "aggregatedStatistics",
            "selectedLevel",
            "selectedSpecificsTags",
            "selectedStatisticsKeys",
            "specificsChipLimit"
        ]),

        /**
         * Gets the specifics selection of every selected aggregated statistic that has specifics, in selection order.
         * @returns {SpecificsSelection[]} The specifics selections.
         */
        groups () {
            if (!this.selectedLevel) {
                return [];
            }
            const attributes = this.selectedLevel?.mappingFilter?.statisticsAttributes;

            return Object.values(this.aggregatedStatistics)
                .filter(({specifics}) => specifics && Object.keys(specifics).length > 0)
                .sort((a, b) => a.selectedOrder - b.selectedOrder)
                .map(({key, name, specifics = {}}) => ({
                    key,
                    name,
                    tags: Object.entries(specifics).map(([tag, specificKeys]) => {
                        const availableKeys = specificKeys.filter(specificKey => specificKey in attributes),
                              active = (this.selectedSpecificsTags[key] ?? []).includes(tag);

                        return {
                            value: tag,
                            active,
                            availableCount: availableKeys.length,
                            selectedSpecifics: active
                                ? availableKeys
                                    .filter(specificKey => this.selectedStatisticsKeys.includes(specificKey))
                                    .map(specificKey => ({value: specificKey, title: attributes[specificKey].name}))
                                : []
                        };
                    })
                }));
        },

        /**
         * Gets the badge text, which is empty if no specifics tag is set.
         * @returns {string} The translated badge text or an empty string.
         */
        badgeText () {
            const hasActiveTag = Object.values(this.selectedSpecificsTags).some(tags => tags.length > 0);

            return hasActiveTag
                ? this.$t("common:modules.statisticDashboard.dataSelectionExpanded.specificsBadge")
                : "";
        }
    },
    methods: {
        .../** @type {StatisticDashboardMapMutations} */ (mapMutations)("Modules/StatisticDashboard", [
            "removeSpecificStatistic",
            "toggleSpecificsTag"
        ]),

        /**
         * Gets the active tags of the group, each shown as its own list of added statistics.
         * @param {SpecificsSelection} group The specifics selection.
         * @returns {SpecificsTag[]} The active tags.
         */
        activeTags (group) {
            return group?.tags.filter(tag => tag?.active);
        },

        /**
         * Gets the id of the list of a tag, used to remember whether all chips are shown.
         * @param {SpecificsSelection} group The specifics selection.
         * @param {SpecificsTag} tag The tag.
         * @returns {String} The list id.
         */
        listId (group, tag) {
            return `${group.key}:${tag.value}`;
        },

        /**
         * Translates the tag. Falls back to the tag itself if no translation exists.
         * @param {SpecificsTag} tag The tag.
         * @returns {String} The translated tag.
         */
        tagLabel (tag) {
            return this.$t("common:modules.statisticDashboard.dataSelectionExpanded.specificsTag", {context: tag.value, defaultValue: tag.value});
        },

        /**
         * Checks whether the tag has more selected specifics than the chip limit.
         * @param {SpecificsTag} tag The tag.
         * @returns {Boolean} True if not all chips fit into the limit.
         */
        exceedsLimit (tag) {
            return this.specificsChipLimit >= 1 && tag.selectedSpecifics.length > this.specificsChipLimit;
        },

        /**
         * Gets the selected specifics of the tag that are shown as chips.
         * @param {SpecificsSelection} group The specifics selection.
         * @param {SpecificsTag} tag The tag.
         * @returns {Array<{value: string, title: string}>} The visible selected specifics.
         */
        visibleSpecifics (group, tag) {
            if (!this.exceedsLimit(tag) || this.expandedKeys.includes(this.listId(group, tag))) {
                return tag.selectedSpecifics;
            }
            return tag.selectedSpecifics.slice(0, this.specificsChipLimit);
        },

        /**
         * Toggles whether all chips of a list are shown.
         * @param {String} id The list id.
         * @returns {void}
         */
        toggleExpanded (id) {
            this.expandedKeys = this.expandedKeys.includes(id)
                ? this.expandedKeys.filter(expandedKey => expandedKey !== id)
                : [...this.expandedKeys, id];
        }
    }
};
</script>

<template lang="html">
    <AccordionItem
        id="statistic-dashboard-specifics"
        class="mt-3"
        icon="bi-funnel"
        :title="$t('common:modules.statisticDashboard.dataSelectionExpanded.specificsTitle')"
        :sub-title="$t('common:modules.statisticDashboard.dataSelectionExpanded.specificsSubtitle')"
        sub-font-size="font-size-small"
        :badge-text="badgeText"
        with-border
    >
        <div class="statistic-dashboard-specifics-hint d-flex mb-3">
            <i class="bi bi-info-circle me-3" />
            <span>{{ $t('common:modules.statisticDashboard.dataSelectionExpanded.specificsHint') }}</span>
        </div>
        <p
            v-if="groups.length === 0"
            class="statistic-dashboard-specifics-empty mb-0"
        >
            {{ $t('common:modules.statisticDashboard.dataSelectionExpanded.specificsEmpty') }}
        </p>
        <template
            v-for="(group, index) in groups"
            :key="group.key"
        >
            <hr v-if="index > 0">
            <div class="statistic-dashboard-specifics-group">
                <p class="fw-bold mb-1">
                    {{ group.name }}
                </p>
                <div
                    class="d-flex flex-wrap gap-2 mb-3"
                    role="group"
                    :aria-label="group.name"
                >
                    <button
                        v-for="tag in group.tags"
                        :key="tag.value"
                        type="button"
                        class="statistic-dashboard-specifics-tag btn btn-sm btn-light lh-1 rounded-pill px-3"
                        :class="tag.active ? 'active-button' : ''"
                        :aria-pressed="tag.active"
                        @click="toggleSpecificsTag({statisticKey: group.key, tag: tag.value})"
                    >
                        {{ tagLabel(tag) }}
                    </button>
                </div>
                <div
                    v-for="tag in activeTags(group)"
                    :key="tag.value"
                    class="statistic-dashboard-specifics-list mb-3"
                >
                    <div class="d-flex justify-content-between align-items-baseline mb-1">
                        <p class="statistic-dashboard-specifics-list-title mb-0">
                            {{ $t('common:modules.statisticDashboard.dataSelectionExpanded.specificsAddedTag', {tag: tagLabel(tag)}) }}
                        </p>
                        <span class="statistic-dashboard-specifics-count">
                            {{ $t('common:modules.statisticDashboard.dataSelectionExpanded.specificsCount', {available: tag.availableCount}) }}
                        </span>
                    </div>
                    <div class="d-flex flex-wrap align-items-center gap-1">
                        <v-chip
                            v-for="specific in visibleSpecifics(group, tag)"
                            :key="specific.value"
                            class="statistic-dashboard-specifics-chip"
                            size="small"
                            close-icon="$close"
                            closable
                            @click:close="removeSpecificStatistic(specific.value)"
                        >
                            {{ specific.title }}
                        </v-chip>
                        <button
                            v-if="exceedsLimit(tag)"
                            type="button"
                            class="statistic-dashboard-specifics-toggle btn btn-link btn-sm p-0 ms-1"
                            @click="toggleExpanded(listId(group, tag))"
                        >
                            {{ expandedKeys.includes(listId(group, tag))
                                ? $t('common:modules.statisticDashboard.dataSelectionExpanded.showLess')
                                : $t('common:modules.statisticDashboard.dataSelectionExpanded.showAll') }}
                        </button>
                    </div>
                </div>
            </div>
        </template>
    </AccordionItem>
</template>

<style lang="scss" scoped>
    .statistic-dashboard-specifics-tag.btn-light {
        background: $light_blue;

        &:hover {
            background: $dark_blue;
            color: $white;
        }

        &:active {
            background: $dark_blue;
        }
    }

    .statistic-dashboard-specifics-tag.active-button {
        background: $dark_blue;
        color: $white;
    }

    .statistic-dashboard-specifics-hint {
        font-size: $font_size_sm;
    }

    .statistic-dashboard-specifics-chip {
        background-color: $light_blue;

        :deep(.v-chip__underlay) {
            background-color: unset;
        }
    }

    .statistic-dashboard-specifics-count {
        font-size: $font_size_sm;
    }

    .statistic-dashboard-specifics-toggle {
        font-size: $font_size_sm;
    }
</style>
