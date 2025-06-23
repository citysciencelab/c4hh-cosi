<script>
import AccordionItem from "../../../../src/shared/modules/accordion/components/AccordionItem.vue";
import ElevatedButton from "../../../../src/shared/modules/buttons/components/ElevatedButton.vue";

export default {
    name: "PrintAccordion",
    components: {
        AccordionItem,
        ElevatedButton
    },
    props: {
        /**
         * Whether print functionality is available
         */
        printConfigPath: {
            type: String,
            default: null
        },
        /**
         * Whether there is a selected feature
         */
        hasSelectedFeature: {
            type: Boolean,
            required: true
        },
        /**
         * Whether data is loading
         */
        isLoading: {
            type: Boolean,
            required: true
        },
        /**
         * Whether print is loading
         */
        isPrintLoading: {
            type: Boolean,
            required: true
        },
        /**
         * Function to send print request
         */
        sendPrintRequest: {
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
    }
};
</script>

<template>
    <AccordionItem
        v-if="printConfigPath"
        id="print-section"
        :title="translateFunction('additional:modules.combinedGfi.printSection')"
        :icon="'bi bi-printer'"
        :is-open="false"
        font-size="font-size-base"
        :coloured-header="true"
    >
        <p class="print-description">
            {{ translateFunction('additional:modules.combinedGfi.printDescription') }}
        </p>
        <div class="button-group">
            <ElevatedButton
                :text="translateFunction('additional:modules.combinedGfi.printButton')"
                :icon="isPrintLoading ? null : 'bi-file-pdf'"
                :disabled="!hasSelectedFeature || isLoading || isPrintLoading"
                :interaction="sendPrintRequest"
                additional-css="print-btn"
            >
                <span
                    v-if="isPrintLoading"
                    class="spinner-border spinner-border-sm me-1"
                    role="status"
                />
            </ElevatedButton>
        </div>
    </AccordionItem>
</template>

<style scoped lang="scss">
@import 'variables';

.button-group {
    display: flex;
    justify-content: flex-start;
    gap: 10px;
    margin-top: 10px;
}

.print-btn {
    background-color: $dark_blue;
    border-color: $dark_blue;
    color: $white;
}

.print-btn:hover {
    background-color: $light_blue;
    border-color: $light_blue;
}

.print-description {
    margin-bottom: 1rem;
}
</style>
