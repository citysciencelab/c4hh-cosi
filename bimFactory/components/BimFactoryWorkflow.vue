<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import AccordionItem from "../../../src/shared/modules/accordion/components/AccordionItem.vue";
import FlatButton from "../../../src/shared/modules/buttons/components/FlatButton.vue";
import BimFactoryWorkflowStep from "./BimFactoryWorkflowStep.vue";

export default {
    components: {
        AccordionItem,
        FlatButton,
        BimFactoryWorkflowStep
    },
    props: {
        workflowId: {
            type: Number,
            required: true
        }
    },
    data () {
        return {
            accordionItems: [],
            showNextButton: true,
            showBackButton: false
        };
    },
    computed: {
        ...mapGetters("Modules/BimFactory", [
            "getWorkflowForId",
            "getWorkflowDetailsForId",
            "workflowFormData",
            "previousWorkflowBackgroundLayer",
            "previousWorkflowForegroundLayers",
            "isRequestErrorGeneral"
        ]),
        ...mapGetters(["visibleBaselayerConfigs"]),
        currentWorkflow () {
            return this.getWorkflowForId(this.workflowId);
        },
        foregroundLayers () {
            return this.currentWorkflow?.layerIds.foreground;
        },
        backgroundLayers () {
            return this.currentWorkflow?.layerIds.background;
        },
        currentWorkflowDetails () {
            return this.getWorkflowDetailsForId(this.workflowId);
        }
    },
    watch: {
        currentWorkflowDetails: {
            handler () {
                this.initializeAccordionItems();
            },
            immediate: true,
            deep: true
        }
    },
    async mounted () {
        this.setCurrentWorkflowLayers();
        await this.loadSingleWorkflow(this.workflowId);
        this.initializeAccordionItems(true);
        this.initializeWorkflowFormData();
    },
    beforeUnmount () {
        if (this.previousWorkflowBackgroundLayer && this.previousWorkflowBackgroundLayer !== this.visibleBaselayerConfigs[0].id) {
            this.replaceByIdInLayerConfig({
                layerConfigs: [{
                    id: this.visibleBaselayerConfigs[0].id,
                    layer: {
                        visibility: true
                    }
                }]
            });

            this.replaceByIdInLayerConfig({
                layerConfigs: [{
                    id: this.previousWorkflowBackgroundLayer,
                    layer: {
                        visibility: false
                    }
                }]
            });
        }

        if (this.previousWorkflowForegroundLayers.length) {
            this.previousWorkflowForegroundLayers.forEach(layer => {
                this.replaceByIdInLayerConfig({
                    layerConfigs: [{
                        id: layer,
                        layer: {
                            visibility: false
                        }
                    }]
                });
            });
        }
    },
    methods: {
        ...mapActions("Modules/BimFactory", ["loadSingleWorkflow"]),
        ...mapActions(["replaceByIdInLayerConfig"]),
        ...mapActions("Modules/BaselayerSwitcher", ["updateLayerVisibilityAndZIndex"]),
        ...mapMutations("Modules/BimFactory", ["setPreviousWorkflowBackgroundLayer", "setPreviousWorkflowForegroundLayers"]),
        initializeWorkflowFormData () {
            const formData = {
                containers: []
            };

            this.accordionItems.forEach(step => {
                if (!step.sections) {
                    return;
                }
                step.sections.forEach(section => {
                    section.containers.forEach(container => {
                        const containerData = {
                            containerId: container.containerId,
                            containerTitle: container.containerTitle,
                            components: {}
                        };

                        container.components.forEach(element => {
                            if (["BimFactoryWorkflowInputText", "BimFactoryWorkflowDetailSelector"].includes(element.type)) {
                                containerData.components[element.machineName] = {
                                    title: element.title,
                                    value: element.defaultValue || ""
                                };
                            }
                        });

                        if (Object.keys(containerData.components).length > 0) {
                            formData.containers.push(containerData);
                        }
                    });
                });
            });
            this.$store.commit("Modules/BimFactory/initializeWorkflowFormData", formData);
        },
        /**
         * Initializes and re-initializes the accordeon e.g. after a form submit/response.
         * @param {boolean} firstRun Flag to Initialize the accordeon
         */
        initializeAccordionItems (firstRun = false) {
            this.accordionItems = this.currentWorkflowDetails ? JSON.parse(JSON.stringify(this.currentWorkflowDetails.steps)) : [];
            if (this.accordionItems.length > 0) {
                if (firstRun) {
                    this.accordionItems.forEach((item) => {
                        item.isOpen = false;
                    });

                    this.accordionItems[0].isOpen = true;
                }
                else {
                    this.accordionItems.forEach((item) => {
                        item.isError = this.checkForErrors(item);
                        item.isOpen = item.isError;
                    });

                    this.accordionItems[this.accordionItems.length - 1].isOpen = true;
                }
            }
        },
        goForwards () {
            for (let i = 0; i < this.accordionItems.length; i++) {
                if (this.accordionItems[i].isOpen === true) {
                    this.accordionItems[i].isOpen = false;
                    this.accordionItems[i + 1].isOpen = true;
                    this.checkNavigationButtons();
                    break;
                }
            }
        },
        goBackwards () {
            for (let i = 0; i < this.accordionItems.length; i++) {
                if (this.accordionItems[i].isOpen === true) {
                    this.accordionItems[i].isOpen = false;
                    this.accordionItems[i - 1].isOpen = true;
                    this.checkNavigationButtons();
                    break;
                }
            }
        },
        openThis (event, index) {
            if (event.target.classList.contains("accordion-button") && !event.target.classList.contains("collapsed")) {
                this.accordionItems.forEach((item) => {
                    item.isOpen = false;
                });

                this.accordionItems[index].isOpen = true;
                this.checkNavigationButtons();
            }
        },
        checkForErrors (item) {
            if (!item || !item.sections) {
                return false;
            }

            for (const section of item.sections) {
                if (!section.containers) {
                    continue;
                }
                for (const container of section.containers) {
                    if (!container.components) {
                        continue;
                    }
                    for (const component of container.components) {
                        if (Array.isArray(component.errors) && component.errors.length > 0) {
                            return true;
                        }
                    }
                }
            }
            return false;
        },
        checkNavigationButtons () {
            for (let i = 0; i < this.accordionItems.length; i++) {
                if (this.accordionItems[i].isOpen === true) {
                    this.showNextButton = i + 1 < this.accordionItems.length;
                    this.showBackButton = i > 0;
                    break;
                }
            }
        },
        setCurrentWorkflowLayers () {
            if (this.backgroundLayers) {
                this.replaceByIdInLayerConfig({
                    layerConfigs: [{
                        id: this.backgroundLayers[0],
                        layer: {
                            visibility: true
                        }
                    }]
                });

                if (this.previousWorkflowBackgroundLayer !== this.backgroundLayers[0]) {
                    this.setPreviousWorkflowBackgroundLayer(this.backgroundLayers[0]);
                }
            }

            const previousWorkflowForegroundLayers = [];

            this.foregroundLayers?.forEach(layer => {
                this.replaceByIdInLayerConfig({
                    layerConfigs: [{
                        id: layer,
                        layer: {
                            visibility: true
                        }
                    }]
                });

                previousWorkflowForegroundLayers.push(layer);
            });

            this.setPreviousWorkflowForegroundLayers(previousWorkflowForegroundLayers);
        }
    }
};
</script>

<template>
    <div class="bimFactoryWorkflow">
        <FlatButton
            :text="$t('additional:modules.bimfactory.workflow.backToStart')"
            :interaction="() => {$emit('openWorkflow', 'start')}"
            icon="bi bi-house"
        />

        <div class="bimFactoryWorkflowContent">
            <div class="bimFactoryAccordion">
                <img
                    v-if="currentWorkflowDetails?.imgSrc"
                    :src="currentWorkflowDetails?.imgSrc"
                    :alt="$t('additional:modules.bimfactory.workflow.headerImageAlt', {workflowTitle: currentWorkflowDetails?.title})"
                    :title="$t('additional:modules.bimfactory.workflow.headerImageAlt', {workflowTitle: currentWorkflowDetails?.title})"
                    class="rounded"
                >

                <h5
                    v-else-if="currentWorkflowDetails?.title"
                    class="bimFactoryWorkflowTitle"
                >
                    {{ currentWorkflowDetails?.title }}
                </h5>

                <AccordionItem
                    v-for="(step, index) in accordionItems"
                    :id="`accordion-item-${index}`"
                    :key="index"
                    :title="step.title"
                    :is-open="step.isOpen"
                    :coloured-header="true"
                    :class="step.isError ? 'error' : ''"
                    @click="openThis($event, index)"
                >
                    <BimFactoryWorkflowStep
                        :step="step"
                    />
                </AccordionItem>
            </div>

            <div class="navigationButtons">
                <FlatButton
                    v-if="showBackButton"
                    :aria-label="$t('additional:modules.bimfactory.workflow.buttons.back')"
                    :text="$t('additional:modules.bimfactory.workflow.buttons.back')"
                    icon="bi-backspace"
                    @click="goBackwards()"
                />

                <div class="spacer-div" />

                <FlatButton
                    v-if="showNextButton"
                    :aria-label="$t('additional:modules.bimfactory.workflow.buttons.next')"
                    :text="$t('additional:modules.bimfactory.workflow.buttons.next')"
                    icon="bi-backspace-reverse"
                    @click="goForwards()"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss">

    #bim-factory {
        div.bimFactoryWorkflow {
            display: flex;
            flex-direction: column;
            height: 100%;

            h5.bimFactoryWorkflowTitle {
                margin: 0 0 0.5rem 0.5rem;
            }

            div.bimFactoryWorkflowContent {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                flex: 1;
                overflow: hidden;
            }

            div.bimFactoryAccordion {
                display: flex;
                flex-direction: column;
                justify-content: left;
                flex: 1;
                overflow: auto;

                .error {
                    border-left: 0.125rem solid $light_red;
                    border-left-style: dotted;
                }
            }

            div.navigationButtons {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                width: 100%;
                padding-top: 0.5rem;

                button.flat-button {
                    margin: 0 !important;
                }
            }
        }
    }
</style>
