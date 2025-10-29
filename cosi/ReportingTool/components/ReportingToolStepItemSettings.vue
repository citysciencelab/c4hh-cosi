<script>
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import DropdownAutocomplete from "../../shared/modules/dropdown/components/DropdownAutocomplete.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import {mapGetters} from "vuex";
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";
import TagGroup from "../../shared/modules/tags/components/TagGroup.vue";
import {uniqueId} from "@shared/js/utils/uniqueId";

export default {
    name: "ReportingToolStepItemSettings",
    components: {
        AccordionItem,
        DropdownAutocomplete,
        InputText,
        SwitchInput,
        TagGroup
    },
    data () {
        return {
            higherDistrictLevel: [],
            isAllAreasSummariseChecked: false,
            selectedAreasName: "",
            selectedAreasNameMaxLength: 50,
            selectedStatisticalAreas: [],
            selectedDistricts: [],
            years: [
                "2020",
                "2021",
                "2022",
                "2023"
            ],
            selectedYear: []
        };
    },
    computed: {
        ...mapGetters("Modules/DistrictSelector", ["districtLevels", "selectedDistrictNames", "selectedDistrictLevel"]),

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
                selected: this.higherDistrictLevel.length ? this.higherDistrictLevel.includes(lev.label) : false
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
    mounted () {
        this.selectedStatisticalAreas = this.selectedDistrictNames;
    },
    methods: {
        uniqueId,
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
        },

        /**
         * Updates the selected statistical areas.
         * @param {String[]} areas - The selected areas.
         * @returns {void}
         */
        updateSelectedStatisticalAreas (areas) {
            this.selectedStatisticalAreas = areas;
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
                :items="selectedDistrictNames"
                :multiple="true"
                :selected-items="selectedStatisticalAreas"
                :label="$t('additional:modules.cosi.reportingTool.label.statisticalAreas')"
                @update:selected-items="updateSelectedStatisticalAreas"
            />
            <Dropdown-Autocomplete
                :items="years"
                :multiple="false"
                :selected-items="selectedYear"
                :label="$t('additional:modules.cosi.reportingTool.label.referenceYear')"
            />
        </form>
    </AccordionItem>
</template>
