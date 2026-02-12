<script>
import DropdownAutocomplete from "../../shared/modules/dropdown/components/DropdownAutocomplete.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import ToolBar from "../../shared/modules/toolBar/components/ToolBar.vue";
import {VBtn} from "vuetify/components/VBtn";
import {VCheckbox} from "vuetify/components/VCheckbox";
import {VCol, VRow} from "vuetify/components/VGrid";
import {VIcon} from "vuetify/components/VIcon";

export default {
    name: "FeaturesListToolbar",
    components: {
        DropdownAutocomplete,
        IconButton,
        InputText,
        ToolBar,
        VBtn,
        VCheckbox,
        VCol,
        VIcon,
        VRow
    },
    props: {
        districtItems: {
            type: Array,
            required: true
        },
        filterItems: {
            type: Array,
            required: true
        },
        showDipasButton: {
            type: Boolean,
            default: false
        }
    },
    emits: ["setDistrictFilter", "setLayerFilter", "setSearch", "exportTable"],
    data () {
        return {
            searchString: "",
            selectedDistrictItems: [],
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
            return undefined;
            // return {
            //     id: "location-score-button",
            //     text: this.$t("additional:modules.tools.cosi.featuresList.titleLocationScore"),
            //     icon: "bi bi-house-door",
            //     closeOnOutside: true
            // };
        }
    },
    watch: {
        searchString (value) {
            this.$emit("setSearch", value);
        },
        /**
         * Emits the selected district items to the parent component whenever they change.
         */
        selectedDistrictItems () {
            this.$emit("setDistrictFilter", this.selectedDistrictItems);
        },
        selectedLayerList (value) {
            this.$emit("setLayerFilter", value);
        }
    },
    methods: {
        /**
         * Resets all active filters and related export options to their default state.
         * @returns {void}
         */
        resetFilters () {
            this.searchString = "";
            this.selectedDistrictItems = [];
            this.selectedLayerList = [];
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
            <div
                v-if="selectedLayerList.length > 0 || selectedDistrictItems.length > 0 || searchString !== ''"
                class="mb-2 d-flex w-100 justify-content-end"
            >
                <IconButton
                    :class-array="['btn-light']"
                    icon="bi-arrow-clockwise"
                    :aria="$t('additional:modules.tools.cosi.dashboard.resetFilter')"
                    :interaction="resetFilters"
                    :label="$t('additional:modules.tools.cosi.dashboard.resetFilter')"
                />
            </div>
            <InputText
                id="calculation-name-input"
                v-model="searchString"
                :label="'Tabelle druchsuchen'"
                placeholder=""
            />
            <DropdownAutocomplete
                v-model="selectedLayerList"
                :items="filterItems"
                label="Fachdaten"
                multiple
            />
            <DropdownAutocomplete
                v-model="selectedDistrictItems"
                :items="districtItems"
                label="Gebiete"
                multiple
            />
        </template>
        <template #optionalDropdown>
            Standortbewertung
        </template>
    </ToolBar>
    <div id="features-list-toolbar">
        <v-row>
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
