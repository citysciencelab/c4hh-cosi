<script>
import BimFactoryWorkflowInputText from "./BimFactoryWorkflowInputText.vue";
import BimFactoryWorkflowDetailSelector from "./BimFactoryWorkflowDetailSelector.vue";
import BimFactoryWorkflowFilter from "./BimFactoryWorkflowFilter.vue";
import BimFactoryWorkflowSubmit from "./BimFactoryWorkflowSubmit.vue";
import BimFactoryWorkflowInputErrors from "./BimFactoryWorkflowInputErrors.vue";

export default {
    components: {
        BimFactoryWorkflowInputText,
        BimFactoryWorkflowFilter,
        BimFactoryWorkflowDetailSelector,
        BimFactoryWorkflowSubmit,
        BimFactoryWorkflowInputErrors
    },
    props: {
        step: {
            type: Object,
            required: true
        }
    }
};
</script>

<template>
    <div class="BimFactoryWorkflowStep">
        <div class="description">
            {{ step.description }}
        </div>

        <div class="sections">
            <div
                v-for="(section, index) in step.sections"
                :key="index"
                :class="['section', `flex-${section.direction}`]"
            >
                <div
                    :class="['containers', `flex-${section.direction}`]"
                >
                    <div
                        v-for="(container, i) in section.containers"
                        :key="i"
                        class="bimContainer"
                    >
                        <div class="containerTitle">
                            {{ container.containerTitle }}
                        </div>

                        <div
                            :class="['containerContent', `flex-${container.direction}`]"
                        >
                            <div
                                v-for="(component, j) in container.components"
                                :key="j"
                                class="containerComponent"
                            >
                                <component
                                    :is="component.type"
                                    :config="{
                                        component,
                                        containerId: container.containerId,
                                        containerTitle: container.containerTitle
                                    }"
                                    :is-open="step.isOpen"
                                />

                                <BimFactoryWorkflowInputErrors
                                    v-if="component.errors?.length > 0"
                                    :config="component.errors"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
#bim-factory {
    div.BimFactoryWorkflowStep {
        display: flex;
        flex-direction: column;

        div.sections {
            display: flex;
            flex-direction: column;
            box-shadow: 0 0.0625rem 0.3125rem rgba(0, 0, 0, .2),
                        0 0.125rem 0.125rem rgba(0, 0, 0, .14),
                        0 0.1875rem 0.0625rem -0.125rem rgba(0, 0, 0, .12);
            border-radius: 0.25rem;
            padding: 0.75rem;

            div.section {
            display: flex;

                div.containers {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1rem;
                    width: 100%;

                    div.bimContainer {
                        display: flex;
                        flex-direction: column;
                        flex: 1 1 auto;
                        min-width: 0;
                        width: 100%;

                        div.containerTitle {
                            font-size: 1rem;
                            font-weight: bold;
                        }

                        div.containerContent {
                            display: flex;
                            flex-wrap: wrap;

                            div.containerComponent {
                                width: 100%;
                            }
                        }
                    }
                }
            }
        }
    }
}
</style>
