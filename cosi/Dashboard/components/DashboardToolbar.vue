<script>
import groupMapping from "../../utils/groupMapping";
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
        exportTimeline: false
    }),
    computed: {
        ...mapGetters("Modules/DistrictSelector", [
            "mapping",
            "metadataUrls"
        ]),
        statsMapping () {
            return groupMapping(this.mapping);
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
        :optional-button="{'text': 'Filter hinzufügen', 'icon': 'bi-funnel-fill', 'event': () => {}}"
        @exportTable="exportTable"
        @reorderedSettingItems="reorderSettingItems"
        @toggleSettingItem="toggleSettingItem"
    >
        <template #optionalDropdown>
            <div
                class="dropdown-menu p-0 border-0 mt-1"
            >
                <ul>
                    <li>
                        Test1
                    </li>
                    <li>
                        Test2
                    </li>
                </ul>
            </div>
        </template>
    </ToolBar>
    <v-row
        id="dashboard-toolbar"
        dense
    >
        <v-col>
            <v-autocomplete
                v-model="_statsFeatureFilter"
                :items="statsMapping"
                item-title="value"
                item-type="type"
                :label="$t('additional:modules.tools.cosi.featuresList.layerFilter')"
                outlined
                dense
                multiple
                chips
                clearable
                hide-details
            >
                <template #chip="{ item, index }">
                    <v-chip
                        v-if="index === 0"
                        small
                    >
                        <span>{{ item.value }}</span>
                    </v-chip>
                    <span
                        v-if="index === 1"
                        class="grey--text text-caption"
                    >
                        (+{{ statsFeatureFilter.length - 1 }} weitere)
                    </span>
                </template>
                <template #subheader="{ props }">
                    <div class="d-flex ga-4 align-center">
                        {{ props }}
                        <v-list-subheader class="font-weight-bold bg-primary">
                            {{ props }}
                        </v-list-subheader>
                    </div>
                </template>
                <template #divider>
                    <div class="d-flex ga-4 align-center">
                        <v-divider />
                    </div>
                </template>
                <template #append>
                    <v-icon
                        title="Anmerkungen öffnen"
                        @click="openMetadata"
                    >
                        mdi-information
                    </v-icon>
                </template>
            </v-autocomplete>
        </v-col>
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

</style>
