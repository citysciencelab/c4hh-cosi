<script>
import AccordionItem from "../../../../src/shared/modules/accordion/components/AccordionItem.vue";
import ElevatedButton from "../../../../src/shared/modules/buttons/components/ElevatedButton.vue";

export default {
    name: "ExportAccordion",
    components: {
        AccordionItem,
        ElevatedButton
    },
    props: {
        /**
         * Current file name
         */
        fileName: {
            type: String,
            required: true
        },
        /**
         * Current export format
         */
        currentFormat: {
            type: String,
            required: true
        },
        /**
         * List of shown formats
         */
        shownFormatList: {
            type: Array,
            required: true
        },
        /**
         * Function to set current format
         */
        setCurrentFormat: {
            type: Function,
            required: true
        },
        /**
         * Function to export data
         */
        exportData: {
            type: Function,
            required: true
        },
        /**
         * Translation function
         */
        translateFunction: {
            type: Function,
            required: true
        }
    },
    emits: ["update:fileName"]
};
</script>

<template>
    <AccordionItem
        id="export-section"
        :title="translateFunction('additional:modules.combinedGfi.standardExport') || 'Standard Export'"
        :icon="'bi bi-file-earmark-arrow-down'"
        :is-open="false"
        font-size="font-size-base"
        :coloured-header="true"
    >
        <div class="form-floating mb-3 export-dropdown">
            <select
                id="printFormat"
                class="form-select"
                @change="setCurrentFormat($event.target.value)"
            >
                <option
                    v-for="(format, i) in shownFormatList"
                    :key="i"
                    :value="format"
                    :selected="format === currentFormat"
                >
                    {{ format }}
                </option>
            </select>
            <label for="printFormat">{{ translateFunction("additional:modules.combinedGfi.exportFormat") }}</label>
        </div>
        <div class="form-floating mb-3 export-dropdown">
            <input
                :value="fileName"
                type="text"
                class="form-control"
                :aria-label="translateFunction('additional:modules.combinedGfi.fileName')"
                @input="$emit('update:fileName', $event.target.value)"
            >
            <label for="fileName">{{ translateFunction("additional:modules.combinedGfi.fileName") }}</label>
        </div>

        <div class="button-group">
            <ElevatedButton
                :text="translateFunction('additional:modules.combinedGfi.export')"
                :icon="'bi-download'"
                :interaction="exportData"
            />
        </div>
    </AccordionItem>
</template>

<style scoped lang="scss">
@import 'variables';

.button-group {
    display: flex;
    justify-content: center;
    gap: 0.625rem;
    margin-top: 0.625rem;
}

.export-btn {
    background-color: $light_blue;
    border-color: $light_blue;
    color: $white;
}

.export-btn:hover {
    background-color: $dark_blue;
    border-color: $dark_blue;
}

.export-dropdown {
    margin-bottom: 1rem;
}
</style>
