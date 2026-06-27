<script>
import AccordionItem from "../../../../src/shared/modules/accordion/components/AccordionItem.vue";

export default {
    name: "AdditionalRequestsAccordion",
    components: {
        AccordionItem
    },
    props: {
        /**
         * Array of additional request results
         */
        additionalRequestResults: {
            type: Array,
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
    computed: {
        /**
         * Check if any result has info text to show the info accordion
         * @returns {Boolean} true if any result has infoText
         */
        hasInfoText () {
            return this.additionalRequestResults.some(result => result.infoText);
        }
    }
};
</script>

<template>
    <div
        v-if="additionalRequestResults.length"
        class="additional-requests"
    >
        <AccordionItem
            id="additional-requests-section"
            :title="translateFunction('additional:modules.combinedGfi.additionalRequests')"
            :icon="'bi bi-clipboard-data'"
            :is-open="false"
            font-size="font-size-base"
            :coloured-header="true"
        >
            <div
                v-for="(result, index) in additionalRequestResults"
                :key="index"
                class="additional-request"
            >
                <div class="result-container">
                    <div class="result-text">
                        {{ result.text }}
                    </div>
                    <hr>
                    <div class="source-container">
                        <div class="source-line">
                            <strong>{{ translateFunction('additional:modules.combinedGfi.source') }}:</strong> {{ result.url }}
                        </div>
                    </div>
                </div>
            </div>
            <AccordionItem
                v-if="hasInfoText"
                id="additional-requests-info-section"
                :title="translateFunction('additional:modules.combinedGfi.information')"
                :icon="'bi bi-info-circle-fill'"
                :is-open="false"
                font-size="font-size-base"
            >
                <div
                    v-for="(result, index) in additionalRequestResults"
                    :key="'info-' + index"
                    class="info-item"
                >
                    <div
                        v-if="result.infoText"
                        class="info-content"
                    >
                        <p class="info-text">
                            {{ result.infoText }}
                        </p>
                    </div>
                </div>
            </AccordionItem>
        </AccordionItem>
    </div>
</template>

<style scoped lang="scss">
@import 'variables';

.additional-requests {
    margin-top: 1rem;
}

.additional-request {
    margin-bottom: 1rem;
}

.result-container {
    padding: 1rem;
}

.result-text {
    margin-bottom: 0.5rem;
}

.source-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.source-line {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.info-item {
    margin-bottom: 1rem;
}

.info-item:last-child {
    margin-bottom: 0;
}

.info-content {
    padding: 0.5rem 0;
}

.info-text {
    margin: 0;
    color: $dark_grey;
    font-size: 0.875rem;
    line-height: 1.4;
}
</style>
