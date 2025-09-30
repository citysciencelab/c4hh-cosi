<script>
import {VChip} from "vuetify/components/VChip";
import {VChipGroup} from "vuetify/components/VChipGroup";

export default {
    name: "DistrictSelectorLevel",
    components: {
        VChip,
        VChipGroup
    },
    props: {
        districtLevels: {
            type: Array,
            required: true
        },
        selectedLevelId: {
            type: String,
            required: true
        }
    },
    computed: {
        // Compute the selected district level based on the selectedLevelId prop
        selectedDistrictLevel () {
            return this.districtLevels
                .map((level, index) => level.layerId === this.selectedLevelId ? index : -1)
                .filter(index => index !== -1);
        }
    }
};
</script>

<template lang="html">
    <div
        class="district-selector-level mb-4"
    >
        <label
            class="text-black-50"
            for="chip-group"
        >
            {{ $t('additional:modules.cosi.districtSelector.districtLevel') }}
        </label>
        <v-chip-group
            :model-value="selectedDistrictLevel"
            class="text-left my-2"
        >
            <v-chip
                v-for="level in districtLevels"
                :key="level.layerId"
                class="me-2"
                filter
                @click="$emit('setSelectedDistrictLevelId', level.layerId)"
            >
                {{ level.label }}
            </v-chip>
        </v-chip-group>
    </div>
</template>
