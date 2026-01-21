<script>
import ToolBar from "../../shared/modules/toolBar/components/ToolBar.vue";
import {VBtn} from "vuetify/components/VBtn";
import {VCheckbox} from "vuetify/components/VCheckbox";
import {VCol, VRow} from "vuetify/components/VGrid";
import {VIcon} from "vuetify/components/VIcon";
import {VSelect} from "vuetify/components/VSelect";
import {VTextField} from "vuetify/components/VTextField";

export default {
    name: "FeaturesListToolbar",
    components: {
        ToolBar,
        VBtn,
        VCheckbox,
        VCol,
        VIcon,
        VRow,
        VSelect,
        VTextField
    },
    props: {
        filterItems: {
            type: Array,
            required: true
        },
        showDipasButton: {
            type: Boolean,
            default: false
        }
    },
    data () {
        return {
            search: "",
            selectedLayerList: [],
            exportDetails: false,
            sumUpLayers: false
        };
    },
    computed: {

        /**
         * Gets a localised object defining the location score button.
         * @returns {Object} The location score button definition.
         */
        locationScoreButton () {
            return {
                id: "location-score-button",
                text: this.$t("additional:modules.tools.cosi.featuresList.titleLocationScore"),
                icon: "bi bi-house-door",
                closeOnOutside: true
            };
        }
    },
    watch: {
        selectedLayerList (value) {
            this.$emit("setLayerFilter", value);
        },
        search (value) {
            this.$emit("setSearch", value);
        }
    }
};
</script>

<template lang="html">
    <ToolBar
        :optional-button="locationScoreButton"
        v-bind="$attrs"
    >
        <template #filterMenu>
            Filter für Einrichtungsübersicht
        </template>
        <template #optionalDropdown>
            Standortbewertung
        </template>
    </ToolBar>
    <div id="features-list-toolbar">
        <v-row>
            <v-col cols="8">
                <v-select
                    v-model="selectedLayerList"
                    :items="filterItems"
                    multiple
                    dense
                    outlined
                    small-chips
                    deletable-chips
                    hide-details
                    :menu-props="{ closeOnContentClick: true }"
                    :label="$t('additional:modules.tools.cosi.featuresList.layerFilter')"
                />
            </v-col>
            <v-col class="border-style">
                <v-btn
                    tile
                    depressed
                    small
                    color="grey lighten-1"
                    :title="$t('additional:modules.tools.cosi.featuresList.createCharts')"
                    @click="$emit('createCharts')"
                >
                    <v-icon
                        small
                        left
                    >
                        mdi-poll
                    </v-icon>
                    {{ $t('additional:modules.tools.cosi.featuresList.createCharts') }}
                </v-btn>
                <v-btn
                    v-if="showDipasButton"
                    small
                    depressed
                    tile
                    color="grey lighten-1"
                    :title="$t('additional:modules.tools.cosi.featuresList.dipas.createCharts')"
                    @click="$emit('createDipasCharts')"
                >
                    <v-icon>mdi-thumbs-up-down</v-icon>
                </v-btn>
                <br>
                <v-checkbox
                    v-model="sumUpLayers"
                    dense
                    hide-details
                    :label="$t('additional:modules.tools.cosi.featuresList.sumUpLayers')"
                    :title="$t('additional:modules.tools.cosi.featuresList.sumUpLayersTooltip')"
                />
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="8">
                <v-text-field
                    v-model="search"
                    append-icon="mdi-magnify"
                    :label="$t('additional:modules.tools.cosi.featuresList.search')"
                    dense
                    outlined
                    hide-details
                    clearable
                />
            </v-col>
            <v-col class="border-style">
                <v-btn
                    id="export-table"
                    tile
                    depressed
                    small
                    color="grey lighten-1"
                    :title="$t('additional:modules.tools.cosi.featuresList.exportTable')"
                    @click="$emit('exportTable', exportDetails)"
                >
                    <v-icon
                        small
                        left
                    >
                        mdi-file-export
                    </v-icon>
                    {{ $t('additional:modules.tools.cosi.featuresList.exportTable') }}
                </v-btn>
                <br>
                <v-checkbox
                    id="export-details"
                    v-model="exportDetails"
                    dense
                    hide-details
                    :label="$t('additional:modules.tools.cosi.featuresList.exportDetails')"
                    :title="$t('additional:modules.tools.cosi.featuresList.exportDetails')"
                />
            </v-col>
        </v-row>
    </div>
</template>
