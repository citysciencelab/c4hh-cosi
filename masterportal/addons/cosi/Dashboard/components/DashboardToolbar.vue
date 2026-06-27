<script>
import {Dropdown} from "bootstrap";
import DropdownAutocomplete from "../../shared/modules/dropdown/components/DropdownAutocomplete.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import {mapGetters} from "vuex";
import ToolBar from "../../shared/modules/toolBar/components/ToolBar.vue";

export default {
    name: "DashboardToolbar",
    components: {
        DropdownAutocomplete,
        FlatButton,
        IconButton,
        InputText,
        ToolBar
    },
    props: {
        statsFeatureFilter: {
            type: Array,
            required: true
        },
        downloadDisabled: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    emits: ["exportTable", "reorderColumns", "setStatsFeatureFilter", "setTimestampsValues", "startCalculation", "toggleColumn"],
    data: () => ({
        addFilterButton: null,
        calculateButton: null,
        calculationName: "",
        category_A: null,
        category_B: null,
        exportTimeline: false,
        operation: "add"
        // showAllFilters: false
    }),
    computed: {
        ...mapGetters("Modules/Dashboard", ["timestamps", "timestampsFiltered"]),
        ...mapGetters("Modules/DistrictSelector", ["mapping"]),
        /**
         * Filters to display in active filter area.
         * @returns {String[]} List of active filters.
         */
        // visibleStatsFeatureFilter () {
        //     const maxVisible = 5;

        //     return this.showAllFilters
        //         ? this._statsFeatureFilter
        //         : this._statsFeatureFilter.slice(0, maxVisible);
        // },
        /**
         * Whether "show more / less" toggle should be shown.
         * @returns {Boolean} `true` if more than five filters are available, otherwise `false`.
         */
        // hasMoreFilters () {
        //     return this._statsFeatureFilter.length > 5;
        // },
        /**
        * Get calculation operator items with localized titles.
        * @returns {Object[]} Array of calculation operator items.
        */
        calculationOperatorItems () {
            return [
                {title: this.$t("additional:modules.tools.cosi.dashboard.tableRowMenu.add"), value: "add"},
                {title: this.$t("additional:modules.tools.cosi.dashboard.tableRowMenu.subtract"), value: "subtract"},
                {title: this.$t("additional:modules.tools.cosi.dashboard.tableRowMenu.multiply"), value: "multiply"},
                {title: this.$t("additional:modules.tools.cosi.dashboard.tableRowMenu.divide"), value: "divide"},
                {title: this.$t("additional:modules.tools.cosi.dashboard.tableRowMenu.dividePercent"), value: "dividePercent"}
            ];
        },

        /**
         * Get unique groups from mapping.
         * @returns {String[]} Array of unique group names.
         */
        groups () {
            const groupsWithDuplicates = this.mapping.map(item => item.group);

            return [...new Set(groupsWithDuplicates)];
        },

        selectedGroups: {
            /**
             * Gets selected groups - a groups is considered selected if at least one of its categories is selected.
             * @returns {String[]} Array of selected group names.
             */
            get () {
                return this.groups.filter(
                    group => this.mapping.some(
                        mappingEntry => mappingEntry.group === group && this.statsFeatureFilter.includes(mappingEntry.value)
                    )
                );
            },
            /**
             * Sets the selected groups - if a group has been added or removed, all its categories are added or removed, too.
             * @param {String[]} newSelectedGroups Array of updated group names.
             * @returns {void}
             */
            set (newSelectedGroups) {
                const oldSelectedGroups = this.selectedGroups,
                    addedGroups = newSelectedGroups.filter(group => !oldSelectedGroups.includes(group)),
                    removedGroups = oldSelectedGroups.filter(group => !newSelectedGroups.includes(group)),
                    categoriesToAdd = this.mapping.filter(mappingEntry => addedGroups.includes(mappingEntry.group))
                        .map(mappingEntry => mappingEntry.value),
                    categoriesToRemove = this.mapping.filter(mappingEntry => removedGroups.includes(mappingEntry.group))
                        .map(mappingEntry => mappingEntry.value);

                this._statsFeatureFilter = [
                    ...this._statsFeatureFilter.filter(category => !categoriesToRemove.includes(category)),
                    ...categoriesToAdd
                ];
            }
        },

        /**
         * Get timestamps sorted in descending order.
         * @returns {String[]} Array of sorted timestamps.
         */
        sortedTimestamps () {
            return this.timestamps.slice(0).sort().reverse();
        },

        _statsFeatureFilter: {
            get () {
                return this.statsFeatureFilter;
            },
            set (value) {
                this.$emit("setStatsFeatureFilter", value);
            }
        }
    },
    mounted () {
        this.addFilterButton = Dropdown.getOrCreateInstance(document.getElementById("add-filter-button"));
        this.calculateButton = Dropdown.getOrCreateInstance(document.getElementById("calculation-button"));
    },
    methods: {
        /**
         * Emits startCalculation event with necessary parameters and resets input fields.
         * @returns {void}
         */
        onStartCalculation () {
            this.$emit("startCalculation", this.calculationName, this.operation, this.category_A, this.category_B);
            this.calculateButton.hide();
            this.calculationName = "";
            this.category_A = null;
            this.category_B = null;
            this.operation = "add";
        },

        reorderSettingItems (settingItems) {
            this.$emit("reorderColumns", settingItems);
        },

        toggleSettingItem (columnName) {
            this.$emit("toggleColumn", columnName);
        },
        /**
         * Resets all active filters and related export options to their default state.
         * @returns {void}
         */
        resetFilters () {
            this._statsFeatureFilter = [];
            this.exportTimeline = false;
            // this.showAllFilters = false;
            this.$emit("setTimestampsValues", []);
        }
    }
};
</script>

<template>
    <ToolBar
        :optional-button="{text: $t('additional:modules.tools.cosi.dashboard.tableRowMenu.calculate'), icon: 'bi-plus-slash-minus', id: 'calculation-button', closeOnOutside: true}"
        :download-disabled="downloadDisabled"
        @exportTable="$emit('exportTable', exportTimeline)"
    >
        <template #filterMenu>
            <div
                v-if="_statsFeatureFilter.length > 0 || timestampsFiltered.length > 0"
                class="reset-filter-row"
            >
                <IconButton
                    class="reset-filter-btn"
                    icon="bi-arrow-clockwise"
                    :aria="$t('additional:modules.tools.cosi.dashboard.resetFilter')"
                    :interaction="resetFilters"
                    :label="$t('additional:modules.tools.cosi.dashboard.resetFilter')"
                />
            </div>
            <DropdownAutocomplete
                v-model="selectedGroups"
                class="mb-3"
                :items="groups"
                label="Gruppen"
                multiple
            />
            <DropdownAutocomplete
                v-model="_statsFeatureFilter"
                class="mb-3"
                :items="mapping"
                item-title="value"
                :label="$t('additional:modules.tools.cosi.dashboard.category')"
                multiple
            />
            <DropdownAutocomplete
                class="mb-3"
                :items="sortedTimestamps"
                :label="$t('additional:modules.tools.cosi.dashboard.timestamp')"
                :model-value="timestampsFiltered"
                multiple
                @update:modelValue="(value) => $emit('setTimestampsValues', value)"
            />
        </template>
        <template #optionalDropdown>
            <h6 class="my-2">
                {{ $t('additional:modules.tools.cosi.dashboard.createCalc') }}
            </h6>
            <InputText
                id="calculation-name-input"
                v-model="calculationName"
                :label="$t('additional:modules.tools.cosi.dashboard.nameCalc')"
                placeholder=""
            />
            <DropdownAutocomplete
                v-model="category_A"
                :items="mapping"
                item-title="value"
                :label="$t('additional:modules.tools.cosi.dashboard.category')"
            />
            <div class="d-flex flex-column align-items-center">
                <div>
                    <div class="vr" />
                </div>
                <DropdownAutocomplete
                    v-model="operation"
                    :items="calculationOperatorItems"
                    :label="$t('additional:modules.tools.cosi.dashboard.tableRowMenu.operation')"
                />
                <div>
                    <div class="vr" />
                </div>
            </div>
            <DropdownAutocomplete
                v-model="category_B"
                :items="mapping"
                item-title="value"
                :label="$t('additional:modules.tools.cosi.dashboard.category')"
            />
            <div class="d-flex justify-content-center">
                <FlatButton
                    id="calculation-button"
                    customclass="mt-3 mb-2"
                    icon="bi bi-plus-circle"
                    :text="$t('additional:modules.tools.cosi.dashboard.tableRowMenu.calculate')"
                    :disabled="!category_A || !category_B"
                    :interaction="() => onStartCalculation()"
                />
            </div>
        </template>
        <!-- <template #underHorizontalRule>
            <div
                v-if="_statsFeatureFilter.length > 0"
                class="mb-4"
            >
                <div>{{ $t('additional:modules.tools.cosi.dashboard.activeFilters') }}:</div>
                <v-chip
                    v-for="(item, index) in visibleStatsFeatureFilter"
                    :key="item"
                    variant="flat"
                    closable
                    @click:close="_statsFeatureFilter.splice(index, 1)"
                >
                    {{ item }}
                    <template #close>
                        <v-icon>mdi-close</v-icon>
                    </template>
                </v-chip>
                <button
                    v-if="hasMoreFilters"
                    type="button"
                    class="filter-toggle text-primary"
                    :aria-expanded="showAllFilters.toString()"
                    @click="showAllFilters = !showAllFilters"
                >
                    {{
                        showAllFilters
                            ? $t('additional:modules.tools.cosi.dashboard.showLessFilters')
                            : $t('additional:modules.tools.cosi.dashboard.showAllFilters')
                    }}
                </button>
                <div class="d-inline-block text-center d-flex justify-content-center mt-3">
                    <FlatButton
                        :aria-label="$t('common:modules.filter.filterResetAll')"
                        :text="$t('common:modules.filter.filterResetAll')"
                        :icon="'bi-x-circle'"
                        :interaction="resetFilters"
                    />
                </div>
            </div>
        </template> -->
    </ToolBar>
</template>

<style lang="scss" scoped>
.reset-filter-row {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}
.reset-filter-btn :deep(button, .btn) {
    padding: 4px 8px;
    border-radius: 999px;
    transition: all 150ms ease;
}
.reset-filter-btn :deep(button:hover, .btn:hover) {
    background: #D6E3FF;
    box-shadow: 0 0 0 2px rgba(60, 95, 148, 0.25);
}
.filter-toggle {
    margin-top: 4px;
    font-size: 0.85rem;

    a {
        cursor: pointer;
        text-decoration: none;
    }
    &:hover {
        text-decoration: underline;
    }
}
.v-chip {
    margin: 4px 8px 4px 0;
    background-color: $light_blue;
    color: unset;
}

.vr {
    width: 2px;
    background-color: $secondary;
    display: block;
    opacity: unset;
    height: 2em;
}

</style>
