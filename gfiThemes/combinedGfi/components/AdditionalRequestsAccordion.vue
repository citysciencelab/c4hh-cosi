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
        translate: {
            type: Function,
            required: true
        }
    },
    data () {
        return {
            infoHoverIndex: null
        };
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
            :title="translate('additional:modules.combinedGfi.additionalRequests')"
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
                            <strong>{{ translate('additional:modules.combinedGfi.source') }}:</strong> {{ result.url }}
                            <span
                                v-if="result.infoText"
                                class="info-text-container"
                                tabindex="0"
                                role="button"
                                @mouseenter="infoHoverIndex = index"
                                @mouseleave="infoHoverIndex = null"
                                @focusin="infoHoverIndex = index"
                                @focusout="infoHoverIndex = null"
                            >
                                <span
                                    class="info-icon"
                                    :title="translate('additional:modules.combinedGfi.infoHint')"
                                >i</span>
                            </span>
                        </div>
                        <div
                            v-if="infoHoverIndex === index && result.infoText"
                            class="info-inline"
                        >
                            {{ result.infoText }}
                        </div>
                    </div>
                </div>
            </div>
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

.info-text-container {
    display: inline-flex;
    align-items: center;
}

.info-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.2rem;
    height: 1.2rem;
    background-color: $light_blue;
    color: $white;
    border-radius: 50%;
    font-size: 0.8rem;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.info-icon:hover {
    background-color: $dark_blue;
}

.info-inline {
    display: block;
    width: 100%;
    margin-top: 0.5rem;
    background-color: $light_grey;
    color: $dark_grey;
    padding: 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    border: 1px solid $dark_grey;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
