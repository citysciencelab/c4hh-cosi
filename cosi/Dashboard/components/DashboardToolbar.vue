<script>
import {Dropdown} from "bootstrap";
import DropdownAutocomplete from "../../shared/modules/dropdown/components/DropdownAutocomplete.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {mapGetters} from "vuex";
import {VCol, VRow} from "vuetify/components/VGrid";
import {VAutocomplete} from "vuetify/components/VAutocomplete";
import {VChip} from "vuetify/components/VChip";
import {VIcon} from "vuetify/components/VIcon";
import {VCheckbox} from "vuetify/components/VCheckbox";
import {VBtn} from "vuetify/components/VBtn";
import {VListSubheader} from "vuetify/components/VList";
import {VDivider} from "vuetify/components/VDivider";
import ToolBar from "../../shared/modules/toolBar/components/ToolBar.vue";

export default {
    name: "DashboardToolbar",
    components: {
        DropdownAutocomplete,
        FlatButton,
        ToolBar,
        VCol,
        VRow,
        VAutocomplete,
        VChip,
        VIcon,
        VCheckbox,
        VBtn,
        VListSubheader,
        VDivider
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
    emits: ["exportTable", "reorderColumns", "setStatsFeatureFilter", "toggleColumn"],
    data: () => ({
        addFilterButton: null,
        exportTimeline: false
    }),
    computed: {
        ...mapGetters("Modules/DistrictSelector", [
            "mapping",
            "metadataUrls"
        ]),

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
    },
    methods: {
        openMetadata () {
            this.metadataUrls.forEach(url => {
                window.open(url);
            });
        },

        exportTable (val) {
            this.$emit("exportTable", this.exportTimeline || val);
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
        :show-detail="{'visibility': true}"
        :optional-button="{text: $t('additional:modules.tools.cosi.dashboard.addFilter'), icon: 'bi-funnel-fill', id: 'add-filter-button'}"
        @exportTable="exportTable"
        @reorderedSettingItems="reorderSettingItems"
        @toggleSettingItem="toggleSettingItem"
    >
        <template #optionalDropdown>
            <h6 class="my-3">
                {{ $t('additional:modules.tools.cosi.dashboard.addFilter') }}
            </h6>
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
            <div class="d-flex justify-content-center">
                <FlatButton
                    id="apply-filter-button"
                    customclass="mb-2"
                    icon="bi bi-check2"
                    :text="$t('additional:modules.tools.cosi.dashboard.closeFilter')"
                    :interaction="() => addFilterButton.hide()"
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
                    v-for="(item, index) in _statsFeatureFilter"
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
        <v-col cols="auto">
            <v-btn
                dense
                small
                tile
                color="grey lighten-1"
                :title="$t('additional:modules.tools.cosi.dashboard.exportTable')"
                @click="exportTable"
            >
                {{ $t('additional:modules.tools.cosi.dashboard.exportTable') }}
            </v-btn>
        </v-col>
    </v-row>
</template>

<style lang="scss" scoped>

.v-chip {
    margin: 4px 8px 4px 0;
    background-color: $light_blue;
    color: unset;
}

</style>
