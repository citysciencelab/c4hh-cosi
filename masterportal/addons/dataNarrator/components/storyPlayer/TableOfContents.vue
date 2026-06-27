<script>

import {mapGetters} from "vuex";
import getters from "../../store/gettersDataNarrator";

export default {
    name: "TableOfContents",
    model: {
        prop: "steps",
        event: "click"
    },
    props: {
        // All steps of the current story
        steps: {
            type: Array,
            default: null
        },
        stepsObjects: {
            type: Array,
            default: null
        },
        currentStep: {
            type: Number,
            default: 0
        },
        storyTitle: {
            type: String,
            default: ""
        }
    },
    emits: ["close-toc"],
    data () {
        return {
            tocMaxHeight: "80dvh"
        };
    },
    computed: {
        ...mapGetters("Modules/DataNarrator", Object.keys(getters)),
        ...mapGetters(["uiStyle"]),
        activeStepTitle () {
            return this.steps[this.currentStep] ? this.steps[this.currentStep].title : 0;
        }
    },
    mounted () {
        this.updateMaxHeight();

        if (this.dataNarratorMenuSide === "secondaryMenu") {
            this.parentContainer = document.getElementById("mp-body-secondaryMenu");
        }
        else if (this.dataNarratorMenuSide === "mainMenu") {
            this.parentContainer = document.getElementById("mp-body-mainMenu");
        }

        if (this.parentContainer) {
            this.parentContainer.addEventListener("scroll", this.updateMaxHeight);
        }
        window.addEventListener("resize", this.updateMaxHeight);
    },
    beforeUnmount () {
        if (this.parentContainer) {
            this.parentContainer.removeEventListener("scroll", this.updateMaxHeight);
        }
        window.removeEventListener("resize", this.updateMaxHeight);
    },
    methods: {
        scrollToStep (evt, stepTitle, isKeyboard = false) {
            const scrollToStepIndex = this.steps.findIndex(step => {
                return step.title === stepTitle;
            });

            this.$nextTick(() => {
                window.parent.scrollBy(0, -1);
            });

            this.$emit("close-toc");

            setTimeout(() => {
                if (!this.$parent.$refs.stepper || this.$parent.$refs.stepper?.length === 0) {
                    return;
                }

                const stepDiv = this.$parent.$refs.stepper[scrollToStepIndex];

                // if the event is triggered by keyboard interaction, the default behavior of the key press
                // needs to be prevented for the story to be scrolled to the correct position
                if (isKeyboard) {
                    evt.preventDefault();
                }

                let container;

                if (this.dataNarratorMenuSide === "secondaryMenu") {
                    container = document.getElementById("mp-body-secondaryMenu");
                }
                else if (this.dataNarratorMenuSide === "mainMenu") {
                    container = document.getElementById("mp-body-mainMenu");
                }

                if (container) {
                    const containerRect = container.getBoundingClientRect(),
                        stepElRect = stepDiv.getBoundingClientRect(),
                        scrollTop = container.scrollTop + stepElRect.top - containerRect.top - 40;

                    container.scrollTo({top: scrollTop, behavior: "smooth"});
                }
                else {
                    stepDiv.scrollIntoView({block: "start"});
                }
            }, 300);

            // as the nested list elements also trigger the click events of the parent list element
            // the events of the parent elements need to be stopped from executing
            evt.stopImmediatePropagation();
        },
        handleKeydown (event, stepTitle) {
            if (event.key === "Enter" || event.key === " ") {
                this.scrollToStep(event, stepTitle, true);
            }
        },
        updateMaxHeight () {
            this.$nextTick(() => {
                const tocEl = this.$el;

                if (tocEl) {
                    const rect = tocEl.getBoundingClientRect(),
                        availableHeight = window.innerHeight - rect.top - 20;

                    this.tocMaxHeight = `${Math.max(availableHeight, 150)}px`;
                }
            });
        }
    }
};
</script>

<template>
    <div
        class="toc"
        :style="{ maxHeight: tocMaxHeight }"
    >
        <div
            class="tob-list"
        >
            <h1>
                {{ storyTitle }}
            </h1>

            <ul
                class="list-unstyled step-list"
                :class="{tableList: uiStyle.toUpperCase() === 'TABLE'}"
            >
                <li
                    v-for="(step, stepIndex) in stepsObjects"
                    :key="stepIndex + step.title"
                    role="link"
                    tabindex="0"
                    @click="scrollToStep($event, step.title)"
                    @keydown="handleKeydown($event, step.title)"
                >
                    <div class="chapter">
                        <div
                            :style="{ marginLeft: (step.depth * 10) + 'px' }"
                            :class="{activeStep: step.title === activeStepTitle}"
                            class="chapterTitle mainTitle"
                            tabindex="0"
                        >
                            {{ step.title }}
                        </div>

                        <div v-if="step.steps">
                            <li
                                v-for="(s, i) in step.steps"
                                :key="i + 1 + stepIndex + s.title"
                                role="link"
                                tabindex="0"
                                @click="scrollToStep($event, s.title)"
                                @keydown="handleKeydown($event, s.title)"
                            >
                                <div
                                    :style="{ marginLeft: (s.depth * 10) + 'px' }"
                                    :class="{activeStep: s.title === activeStepTitle}"
                                    class="chapterTitle"
                                >
                                    {{ s.title }}
                                </div>

                                <div v-if="s.steps">
                                    <li
                                        v-for="(s2, j) in s.steps"
                                        :key="j + 1 + stepIndex + s2.title"
                                        role="link"
                                        tabindex="0"
                                        @click="scrollToStep($event, s2.title)"
                                        @keydown="handleKeydown($event, s2.title)"
                                    >
                                        <div
                                            :style="{ marginLeft: (s2.depth * 10) + 'px' }"
                                            :class="{activeStep: s2.title === activeStepTitle}"
                                            class="chapterTitle"
                                        >
                                            {{ s2.title }}
                                        </div>
                                    </li>
                                </div>
                            </li>
                        </div>
                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>

<style lang="scss" scoped>

h1 {
    margin: 2rem 1rem 1rem 1rem;
}

.toc {
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .tob-list {
        opacity: 0.99;
        background-color: white;
        z-index: 1;
        display: flex;
        flex-direction: column;
        margin: 15px 20px 10px 10px;
        overflow-y: auto;
        overscroll-behavior: contain;
        flex: 1 1 auto;
        min-height: 0;  // important: allows flex child to shrink below its content size

        ul.step-list {
            cursor: pointer;
            padding-left: 0;
            width: 100%;
            line-height: 1.5rem;
            list-style-type: none;

            &.tableList {
                align-self: flex-end;
            }

            .mainTitle {
                font-weight: bold;
                font-size: 1.25rem;
            }

            li {
                font-size: 1.125rem;
                padding: 5px;

                div.chapter {
                    border: 2px solid #E0E0E0;
                    box-shadow: 0 3px 6px 0 #00000029;
                    padding: 8px 10px 8px 10px;
                    border-radius: 5px;
                    display: block;

                    div.chapterTitle {
                        &.activeStep {
                            font-weight: bold;
                            color: #003063;
                        }

                        &:hover {
                            text-decoration: underline;
                        }
                    }
                }

                div.chapter::first-line {
                    text-indent: 0;
                }
            }
        }
    }
}
</style>
