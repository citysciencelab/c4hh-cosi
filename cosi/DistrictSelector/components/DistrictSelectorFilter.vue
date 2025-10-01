<script>
import {VAutocomplete} from "vuetify/components/VAutocomplete";
import {VChip} from "vuetify/components/VChip";
import {VListItem, VListItemAction, VListItemTitle} from "vuetify/components/VList";

export default {
    name: "DistrictSelectorFilter",
    components: {
        VAutocomplete,
        VChip,
        VListItem,
        VListItemAction,
        VListItemTitle
    },
    props: {
        districtLevels: {
            type: Array,
            required: true
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
        if (this.selectedDistrictNamesByMap.length) {
            this.districtLevels.forEach(level => {
                level.selectedValues = [];
            });
            this.addSelectedValues(this.selectedDistrictNamesByMap,
                this.levelsForFilter.find(level => level.layerId === this.selectedLevelId));
            this.forceRerender();
        }
        /**
         * A small hack to make sure that all features of the lowest level
         * are loaded and processed so that the filter can be set up correctly.
         */
        // this.districtLevels[0].layer.getSource().once("featuresloadend", () => {
        //     this.forceRerender();
        // });
    },

    methods: {
        /**
         * Add the given districts to the selected values of the level.
         * @param {String[]} districtNames - The names of the districts to add.
         * @param {Object} level - The level whose values are set.
         * @returns {void}
         */
        addSelectedValues (districtNames, level) {
            console.log(districtNames);

            level.selectedValues = districtNames;
            this.checkSublevels(level);
        },

        /**
         * Removes the given district from the selected values of the level.
         * @param {String} districtName - The name to remove.
         * @param {Object} level - The level whose values are set.
         * @returns {void}
         */
        removeSelectedValues (districtName, level) {
            const index = level.selectedValues.indexOf(districtName);

            if (index > -1) {
                level.selectedValues.splice(index, 1);
                this.checkSublevels(level);
                this.forceRerender();
            }
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

        /**
         * Selects all values or none.
         * @param {Object} evt - Click event.
         * @param {Object} level - The level whose values are set.
         * @return {void}
         */
        toggleSelectAll (evt, level) {
            this.$nextTick(() => {
                if (this.areAllValuesSelected(level)) {
                    level.selectedValues = [];
                }
                else {
                    level.selectedValues = level.filterableValues.slice();
                }
                this.$emit("updateSelectedDistricts", level.selectedValues);
                this.forceRerender();
            });
        },

        /**
         * Gets the icon for the "select all" item.
         * @param {Object} level - A district level.
         * @returns {String} The icon string.
         */
        getIconSelectAll (level) {
            if (this.areAllValuesSelected(level)) {
                return "mdi-close-box";
            }
            if (this.areSomeValuesSelected(level)) {
                return "mdi-minus-box";
            }
            return "mdi-checkbox-blank-outline";
        },

        /**
         * Checks whether all values are selected at the level.
         * @param {Object} level - A district level.
         * @returns {Boolean} True if all values are selected.
         */
        areAllValuesSelected (level) {
            return level.selectedValues.length === level.filterableValues?.length;
        },

        /**
         * Checks whether some values are selected at the level.
         * @param {Object} level - A district level.
         * @returns {Boolean} True if more than one value is selected, but not all.
         */
        areSomeValuesSelected (level) {
            return level.selectedValues.length > 0 && !this.areAllValuesSelected(level);
        },

        /**
         * Changes the keys of the loop to trigger a rendering.
         * @returns {void}
         */
        forceRerender () {
            this.keyCount += 1;
        }
    }
};
</script>

<template lang="html">
    <div>
        <div
            v-for="(level, idx) in levelsForFilter"
            :key="level.label + keyCount"
            class="mb-3"
        >
            <v-autocomplete
                :items="level.filterableValues"
                :model-value="level.selectedValues"
                :label="level.label"
                chips
                closable-chips
                hide-details
                multiple
                variant="outlined"
                desensity="comfortable"
                @update:modelValue="addSelectedValues($event, level)"
                @blur="forceRerender"
            >
                <template
                    v-if="idx === levelsForFilter.length - 1"
                    #prepend-item
                >
                    <v-list-item
                        ripple
                        @mousedown.prevent
                        @click="toggleSelectAll($event, level)"
                    >
                        <v-list-item-action>
                            <v-icon :color="'indigo darken-4'">
                                {{ getIconSelectAll(level) }}
                            </v-icon>
                        </v-list-item-action>
                        <v-list-item-title>
                            Alle auswählen
                        </v-list-item-title>
                    </v-list-item>
                    <v-divider class="mt-2" />
                </template>
                <template #selection="{ item, index }">
                    <v-chip
                        v-if="index <= 2"
                        closeable
                        @click:close="removeSelectedValues(item, level)"
                    >
                        <span>{{ item }}</span>
                    </v-chip>
                    <span
                        v-if="index === 3"
                        class="grey--text text-caption"
                    >
                        (+{{ level.selectedValues.length - 3 }} weitere)
                    </span>
                </template>
            </v-autocomplete>
        </div>
    </div>
</template>
