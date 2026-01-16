<script>
import {Dropdown} from "bootstrap";
import DropdownAutocomplete from "../../shared/modules/dropdown/components/DropdownAutocomplete.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {mapGetters} from "vuex";
import {VCol, VRow} from "vuetify/components/VGrid";
import {VChip} from "vuetify/components/VChip";
import {VIcon} from "vuetify/components/VIcon";
import {VCheckbox} from "vuetify/components/VCheckbox";
import ToolBar from "../../shared/modules/toolBar/components/ToolBar.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";

export default {
    name: "DashboardToolbar",
    components: {
        DropdownAutocomplete,
        FlatButton,
        InputText,
        ToolBar,
        VCol,
        VRow,
        VChip,
        VIcon,
        VCheckbox
    },
    props: {
        districtColumns: {
            type: Array,
            required: true
        },
        statsFeatureFilter: {
            type: Array,
            required: true
        }
    },
    emits: ["exportTable", "reorderColumns", "setStatsFeatureFilter", "toggleColumn", "startCalculation"],
    data: () => ({
        addFilterButton: null,
        calculateButton: null,
        calculationName: "",
        exportTimeline: false,
        category_A: null,
        category_B: null,
        operation: "add",
        showAllFilters: false
    }),
    computed: {
        ...mapGetters("Modules/DistrictSelector", [
            "mapping",
            "metadataUrls"
        ]),
        /**
         * Filters to display in active filter area.
         * @returns {String[]} List of active filters.
         */
        visibleStatsFeatureFilter () {
            const maxVisible = 5;

            return this.showAllFilters
                ? this._statsFeatureFilter
                : this._statsFeatureFilter.slice(0, maxVisible);
        },
        /**
         * Whether "show more / less" toggle should be shown.
         * @returns {Boolean} `true` if more than five filters are available, otherwise `false`.
         */
        hasMoreFilters () {
            return this._statsFeatureFilter.length > 5;
        },
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

        _statsFeatureFilter: {
            get () {
                return this.statsFeatureFilter;
            },
            set (value) {
                this.$emit("setStatsFeatureFilter", value);
            }
        },

        /**
         * Get column names from districtColumns prop.
         * @returns {String[]} Array of column names.
         */
        columnNames () {
            return this.districtColumns.map(col => col.text);
        }
    },
    mounted () {
        this.addFilterButton = Dropdown.getOrCreateInstance(document.getElementById("add-filter-button"));
        this.calculateButton = Dropdown.getOrCreateInstance(document.getElementById("calculation-button"));
    },
    methods: {
        openMetadata () {
            this.metadataUrls.forEach(url => {
                window.open(url);
            });
        },

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
        }
    }
};
</script>

<template>
    <ToolBar
        :setting-items="columnNames"
        :optional-button="{text: $t('additional:modules.tools.cosi.dashboard.addFilter'), icon: 'bi-funnel-fill', id: 'add-filter-button', closeOnOutside: true}"
        @exportTable="$emit('exportTable', exportTimeline)"
        @reorderedSettingItems="reorderSettingItems"
        @toggleSettingItem="toggleSettingItem"
    >
        <template #optionalDropdown>
            <DropdownAutocomplete
                v-model="selectedGroups"
                :items="groups"
                label="Gruppen"
                multiple
            />
            <DropdownAutocomplete
                v-model="_statsFeatureFilter"
                :items="mapping"
                item-title="value"
                :label="$t('additional:modules.tools.cosi.featuresList.layerFilter')"
                multiple
            />
        </template>
        <template #calculationDropdown>
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
                :label="$t('additional:modules.tools.cosi.dashboard.categoryCol')"
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
                :label="$t('additional:modules.tools.cosi.dashboard.categoryCol')"
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
        <template #underHorizontalRule>
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
            </div>
        </template>
    </ToolBar>
    <v-row
        id="dashboard-toolbar"
        dense
    >
        <v-col cols="auto">
            <v-checkbox
                id="export-details"
                v-model="exportTimeline"
                dense
                hide-details
                :label="$t('additional:modules.tools.cosi.dashboard.exportTableTimeline')"
                :title="$t('additional:modules.tools.cosi.dashboard.exportTableTimeline')"
            />
        </v-col>
    </v-row>
</template>

<style lang="scss" scoped>
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
