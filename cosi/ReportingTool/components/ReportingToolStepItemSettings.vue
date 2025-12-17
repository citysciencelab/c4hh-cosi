<script>
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import DropdownAutocomplete from "../../shared/modules/dropdown/components/DropdownAutocomplete.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import {mapGetters} from "vuex";
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";
import TagGroup from "../../shared/modules/tags/components/TagGroup.vue";
import {uniqueId} from "@shared/js/utils/uniqueId";
import utils from "../../utils/index.js";

export default {
    name: "ReportingToolStepItemSettings",
    components: {
        AccordionItem,
        DropdownAutocomplete,
        InputText,
        SwitchInput,
        TagGroup
    },
    props: {
        selectedAreasName: {
            type: String,
            required: false,
            default: ""
        }
    },
    emits: ["update:selected-areas-name", "update:statistical-year"],
    data () {
        return {
            higherDistrictLevel: [],
            isAllAreasSummariseChecked: true,
            selectedAreasNameMaxLength: 50,
            selectedStatisticalAreas: [],
            selectedDistricts: [],
            selectedYear: null
        };
    },
    computed: {
        ...mapGetters("Modules/DistrictSelector", ["districtLevels", "selectedDistrictNames", "selectedDistrictLevel", "selectedStatFeatures"]),

        /**
         * Gets the selectable years based on the selected statistical features.
         * @returns {Object[]} An array of items for the year dropdown.
         */
        years () {
            const availableYears = utils.getAvailableYears(this.selectedStatFeatures),
                items = availableYears.map(year => ({title: year, value: year}));

            // if (items.length) {
            //     items.unshift({title: this.$t("additional:modules.cosi.reportingTool.useMostRecentDataset"), value: "mostRecent"});
            // }
            return items;
        },

        /**
         * Gets an array of higher district levels with their corresponding selection status.
         * Each object in the returned array contains:
         * - `label`: The label of the district level.
         * - `selected`: A boolean indicating whether the district level is currently selected.
         * @returns {Object[]} An array of objects representing higher district level labels.
         */
        higherDistrictLevelLabels () {
            let level = this.districtLevels.map(lev => ({
                label: lev.label,
                selected: this.higherDistrictLevel.length ? this.higherDistrictLevel.includes(lev.label) : true
            }));
            const districtLevel = [];

            if (this.selectedDistrictLevel.label === "Hamburg") {
                level = [];
            }
            else {
                this.districtLevels.forEach(v => {
                    if (v.label === this.selectedDistrictLevel.label) {
                        districtLevel.push(v.label);
                    }
                    if (v.label === this.selectedDistrictLevel.subLevel?.label || v.label === "Statistische Gebiete") {
                        districtLevel.push(v.label);
                    }
                });
            }

            return level?.filter(object => !districtLevel.includes(object.label));
        }
    },
    watch: {

        selectedYear (newVal) {
            this.$emit("update:statistical-year", newVal);
        }
    },
    mounted () {
        this.selectedStatisticalAreas = this.selectedDistrictNames;
        this.selectedYear = this.years[0].value;
    },
    methods: {
        uniqueId,

        /**
         * Emits the updated name for selected areas.
         * @param {String} evt - The new name for the selected areas.
         * @returns {void}
         */
        emitSelectedAreasName (name) {
            this.$emit("update:selected-areas-name", name);
        },

        /**
         * Updates the selected higher district level for multiselect tags.
         * @param {Object[]} selectedDistricts - The labels object containing information about the higher district level.
         * @returns {void}
         */
        updateSelectedDistricts (selectedDistricts) {
            if (typeof selectedDistricts === "undefined") {
                return;
            }
            this.higherDistrictLevel = [];

            selectedDistricts.forEach(v => {
                this.higherDistrictLevel.push(v.label);
            });
        }
    }
};

</script>

<template lang="html">
    <AccordionItem
        :id="uniqueId('data-settings')"
        :is-open="true"
        :title="$t('additional:modules.cosi.reportingTool.settings')"
        icon="bi bi-gear"
    >
        <form>
            <SwitchInput
                id="summarise-areas"
                :aria="$t('additional:modules.cosi.reportingTool.label.summariseStatisticalAreas')"
                :checked="isAllAreasSummariseChecked"
                :interaction="() => isAllAreasSummariseChecked = !isAllAreasSummariseChecked"
                :label="$t('additional:modules.cosi.reportingTool.label.summariseStatisticalAreas')"
                class="mb-3"
            />
            <InputText
                v-if="isAllAreasSummariseChecked"
                id="summed-columns"
                :model-value="selectedAreasName"
                :label="$t('additional:modules.cosi.reportingTool.label.summedColumns')"
                :placeholder="$t('additional:modules.cosi.reportingTool.label.summedColumns')"
                :max-length="selectedAreasNameMaxLength.toString()"
                @update:model-value="emitSelectedAreasName"
            />
            <TagGroup
                v-if="higherDistrictLevelLabels.length"
                class="mb-3 mt-5"
                :items="higherDistrictLevelLabels"
                :multiple="true"
                :label="$t('additional:modules.cosi.reportingTool.label.higherDistrictLevel')"
                @update:selected-items="updateSelectedDistricts"
            />
            <Dropdown-Autocomplete
                v-model="selectedStatisticalAreas"
                :items="selectedDistrictNames"
                multiple
                :label="$t('additional:modules.cosi.reportingTool.label.statisticalAreas')"
            />
            <Dropdown-Autocomplete
                v-model="selectedYear"
                :items="years"
                :label="$t('additional:modules.cosi.reportingTool.label.referenceYear')"
            />
        </form>
    </AccordionItem>
</template>
