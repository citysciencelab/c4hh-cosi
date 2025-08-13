<script>
import AccordionItem from "../../../../src/shared/modules/accordion/components/AccordionItem.vue";
import ElevatedButton from "../../../../src/shared/modules/buttons/components/ElevatedButton.vue";
import SpinnerItem from "../../../../src/shared/modules/spinner/components/SpinnerItem.vue";

export default {
    name: "PrintAccordion",
    components: {
        AccordionItem,
        ElevatedButton,
        SpinnerItem
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
        <div
            v-if="isPrintLoading"
            class="loading-container"
        >
            <SpinnerItem custom-class="spinner" />
            <div class="loading-text">
                {{ translateFunction('additional:modules.combinedGfi.printLoading') }}
            </div>
        </div>
        <div v-else>
            <p class="print-description">
                {{ translateFunction('additional:modules.combinedGfi.printDescription') }}
            </p>
            <div class="button-group">
                <ElevatedButton
                    :text="translateFunction('additional:modules.combinedGfi.printButton')"
                    :icon="'bi-file-pdf'"
                    :disabled="!hasSelectedFeature || isLoading"
                    :interaction="sendPrintRequest"
                />
            </div>
        </div>
    </AccordionItem>
</template>

<style scoped lang="scss">
@import 'variables';

.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 6.25rem;
    padding: 1.25rem;
}

.spinner {
    margin: 0.625rem auto;
    display: block;
}

.loading-text {
    margin-top: 0.9375rem;
    font-size: 0.95em;
    color: $dark_grey;
    text-align: center;
}

.button-group {
    display: flex;
    justify-content: flex-start;
    gap: 0.625rem;
    margin-top: 0.625rem;
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
