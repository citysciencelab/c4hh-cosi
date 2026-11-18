<script>
/**
 * @import {StatisticDashboardMapGetters} from "../types/helpers.js"
 */
import ButtonGroup from "@shared/modules/buttons/components/ButtonGroup.vue";
import DropdownAutocomplete from "@shared/modules/dropdown/components/DropdownAutocomplete.vue";
import {mapGetters, mapMutations} from "vuex";
import isObject from "@shared/js/utils/isObject.js";


export default {
    name: "StatisticDashboardDifference",
    components: {
        ButtonGroup,
        DropdownAutocomplete
    },
    data () {
        return {
            buttonGroupReference: [
                {
                    name: i18next.t("common:modules.statisticDashboard.label.year")
                },
                {
                    name: i18next.t("common:modules.statisticDashboard.label.area")
                }
            ],
            selectedDate: "",
            selectedRegion: "",
            referenceType: ""
        };
    },
    computed: {
        .../** @type {StatisticDashboardMapGetters} */ (mapGetters)("Modules/StatisticDashboard", [
            "referenceData",
            "selectedReferenceData",
            "selectedLevel"
        ]),

        regionOptions () {
            return this.referenceData?.region ?? [];
        }
    },
    watch: {
        selectedReferenceData (val) {
            if (typeof val === "undefined") {
                this.selectedDate = "";
                this.selectedRegion = "";
            }
        }
    },
    async mounted () {
        this.handleReference(this.buttonGroupReference[0].name);
        if (isObject(this.selectedReferenceData)) {
            if (this.selectedReferenceData.type === "date" && isObject(this.selectedReferenceData.value)) {
                this.selectedDate = this.selectedReferenceData.value;
            }
            else if (this.selectedReferenceData.type === "region") {
                this.handleReference(this.buttonGroupReference[1].name);
                this.selectedRegion = this.selectedReferenceData.value;
            }
        }
    },
    methods: {
        ...mapMutations("Modules/StatisticDashboard", [
            "setSelectedReferenceData"
        ]),
        /**
        * Set the dropdown type.
        * @param {String} value The name of clicked button.
        * @returns {void}
        */
        handleReference (value) {
            this.referenceType = value;
        },

        /**
         * Updates the emit value.
         * @param {String} type The type which is triggered. Can be either "date" or "region".
         * @returns {void}
         */
        updateSelectedReferenceData (type) {
            let selectedReferenceData;

            if (type === "date") {
                selectedReferenceData = this.selectedDate ? {
                    type: "date",
                    value: this.selectedDate
                } : undefined;
                this.selectedRegion = "";
            }
            else if (type === "region") {
                selectedReferenceData = this.selectedRegion ? {
                    type: "region",
                    value: this.selectedRegion
                } : undefined;
                this.selectedDate = "";
            }

            this.setSelectedReferenceData(selectedReferenceData);
        }
    }
};
</script>

<template>
    <div>
        <ButtonGroup
            :buttons="buttonGroupReference"
            :pre-checked-value="referenceType"
            class="mb-3"
            group="referenceGroup"
            full-width
            @set-selected-button="handleReference"
        />
        <DropdownAutocomplete
            v-if="referenceType === buttonGroupReference[0].name"
            v-model="selectedDate"
            class="w-100"
            :label="$t('common:modules.statisticDashboard.reference.optionDate')"
            :items="referenceData?.date ?? []"
            return-object
            clearable
            :placeholder="$t('common:modules.statisticDashboard.reference.placeholder')"
            @update:model-value="updateSelectedReferenceData('date')"
        />
        <DropdownAutocomplete
            v-else
            v-model="selectedRegion"
            class="w-100"
            :items="regionOptions"
            :label="$t('common:modules.statisticDashboard.reference.optionArea')"
            :placeholder="$t('common:modules.statisticDashboard.reference.placeholder')"
            clearable
            @update:model-value="updateSelectedReferenceData('region')"
        />
    </div>
</template>
