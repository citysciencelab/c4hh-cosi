<script>
import DropdownAutocomplete from "../../shared/modules/dropdown/components/DropdownAutocomplete.vue";

export default {
    name: "DistrictSelectorFilter",
    components: {
        DropdownAutocomplete
    },
    props: {
        districtLevels: {
            type: Array,
            required: true
        },
        loading: {
            type: Boolean,
            default: false,
            required: false
        },
        selectedLevelId: {
            type: String,
            required: true
        },
        selectedDistrictNamesByMap: {
            type: Array,
            required: false,
            default: () => []
        }
    },
    data () {
        return {
            keyCount: 0
        };
    },
    computed: {
        /**
         * Returns the required levels for filtering depending on the selected level.
         * @returns {Object[]} The required district levels.
         */
        levelsForFilter () {
            const index = this.districtLevels.findIndex(level => level.layerId === this.selectedLevelId),
                levelsLength = this.districtLevels.length - 1;

            return index !== levelsLength ? this.districtLevels.slice(index, -1).toReversed() : [this.districtLevels[levelsLength]];
        }
    },

    watch: {
        /**
         * Updates the selected values of the lowest district level.
         * @param {String[]} districtNames - The Districts selected in the map.
         * @returns {void}
         */
        selectedDistrictNamesByMap (districtNames) {
            const lowestLevel = this.levelsForFilter[this.levelsForFilter.length - 1];

            if (districtNames.length !== lowestLevel.selectedValues.length) {
                lowestLevel.selectedValues = districtNames;
                this.forceRerender();
            }
        },

        /**
         * Resets the selected and filterable values of all districts.
         * @returns {void}
         */
        selectedLevelId () {
            this.districtLevels.forEach(level => {
                level.selectedValues = [];
                level.filterableValues = level.nameList;
            });
        }
    },

    mounted () {
        this.addSelectedValues(this.selectedDistrictNamesByMap,
            this.levelsForFilter.find(level => level.layerId === this.selectedLevelId));
        this.forceRerender();
    },

    methods: {
        /**
         * Add the given districts to the selected values of the level.
         * @param {String[]} districtNames - The names of the districts to add.
         * @param {Object} level - The level whose values are set.
         * @returns {void}
         */
        addSelectedValues (districtNames, level) {
            level.selectedValues = districtNames;
            this.checkSublevels(level);
        },

        /**
         * Checks whether sublevels exist and updates them.
         * If not 'updateSelectedDistricts' is emitted.
         * @param {Object} level - The level whose sublevel is checked.
         * @returns {void}
         */
        checkSublevels (level) {
            const lowestLevel = this.levelsForFilter[this.levelsForFilter.length - 1];

            if (level.layerId === lowestLevel.layerId) {
                this.$emit("updateSelectedDistricts", level.selectedValues);
                return;
            }
            if (level.selectedValues.length) {
                this.updateSubLevelValues(level.selectedValues, level.subLevel);
            }
            else {
                this.updateSubLevelValues(level.filterableValues, level.subLevel);
            }
        },

        /**
         * Updates the filterable and selected values of the given level.
         * Is called recursively if the passed level has a sublevel.
         * @param {String[]} districtNames - The names of the districts.
         * @param {Object} level - A districht level.
         * @returns {void}
         */
        updateSubLevelValues (districtNames, level) {
            const districtNamesObject = Object.assign(...districtNames.map(key => ({[key]: true}))),
                filteredDistricts = level.districts.filter(district => Object.prototype.hasOwnProperty.call(districtNamesObject, district.referencDistrictName));

            level.filterableValues = filteredDistricts.map(district => district.getName()).sort();
            level.selectedValues = level.selectedValues.filter(value => {
                return level.filterableValues.includes(value);
            });
            if (level.subLevel !== null) {
                this.updateSubLevelValues(level.filterableValues, level.subLevel);
            }
            else {
                this.$emit("updateSelectedDistricts", level.selectedValues);
            }
        },

        forceRerender () {
            this.keyCount += 1;
        }
    }
};
</script>

<template lang="html">
    <div v-if="selectedLevelId">
        <div
            v-for="(level, idx) in levelsForFilter"
            :key="level.label + keyCount"
            class="mb-3"
        >
            <Dropdown-Autocomplete
                :items="level.filterableValues ? level.filterableValues : []"
                :model-value="level.selectedValues ? level.selectedValues : []"
                multiple
                :label="level.label"
                :loading="loading"
                :max-chip-count="5"
                :select-all="idx === levelsForFilter.length - 1"
                @update:model-value="addSelectedValues($event, level)"
            />
        </div>
    </div>
</template>
