
import {mount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import TableOfContents from "../../../components/storyPlayer/TableOfContents.vue";

describe("addons/dataNarrator/tests/unit/TableOfContents.spec.js", () => {
    let steps;
    let stepsObjects;
    let store;
    let wrapper;
    let storyTitle;

    /**
     * Mock implementation for window.scrollBy in jsdom test environment.
     * Returns null to satisfy linter requirements.
     */
    function scrollByMock () {
        // mock implementation to satisfy linter
        return null;
    }

    if (typeof window !== "undefined") {
        try {
            Object.defineProperty(window, "scrollBy", {
                value: scrollByMock,
                writable: true,
                configurable: true
            });
        }
        catch (e) {
            window.scrollBy = scrollByMock;
        }
    }

    beforeEach(() => {
        // Minimal Vuex store mock for required getters
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        DataNarrator: {
                            namespaced: true,
                            state: () => ({
                                showLoadingSpinner: false,
                                autoplay: false,
                                storyConf: {
                                    title: "Test Story Title"
                                }
                            }),
                            getters: {
                                showLoadingSpinner: state => state.showLoadingSpinner,
                                autoplay: state => state.autoplay,
                                storyConf: state => state.storyConf,
                                dataNarratorMenuSide: () => "secondaryMenu"
                            }
                        }
                    }
                }
            },
            getters: {
                uiStyle: () => "DEFAULT"
            }
        });
        steps = [
            {title: "Step 1"},
            {title: "Step 2"},
            {title: "Step 3"}
        ];
        stepsObjects = [
            {
                title: "Step 1",
                depth: 0
            },
            {
                title: "Step 2",
                depth: 1,
                steps: [
                    {
                        title: "Substep 2.1",
                        depth: 2
                    }
                ]
            },
            {
                title: "Step 3",
                depth: 0
            }
        ];
        storyTitle = "Test Story Title";
        wrapper = mount(TableOfContents, {
            props: {
                steps,
                stepsObjects,
                currentStep: 1,
                storyTitle
            },
            global: {
                plugins: [store],
                mocks: {
                    $t: key => key
                }
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("renders the story title", () => {
        const h1 = wrapper.find(".toc h1");

        expect(h1.exists()).to.be.true;
        expect(h1.text()).to.equal(storyTitle);
    });

    it("renders all step titles in stepsObjects", () => {
        stepsObjects.forEach(stepObj => {
            const el = wrapper.findAll(".chapterTitle").find(e => e.text().includes(stepObj.title));

            expect(el).to.exist;
        });
    });

    it("renders nested steps in stepsObjects", () => {
        const substep = stepsObjects[1].steps[0],
            el = wrapper.findAll(".chapterTitle").find(e => e.text().includes(substep.title));

        expect(el).to.exist;
    });

    it("marks the active step with activeStep class", () => {
        const activeStepTitle = steps[1].title,
            activeEl = wrapper.findAll(".chapterTitle").find(e => e.text().includes(activeStepTitle));

        expect(activeEl.classes()).to.include("activeStep");
    });

    it("emits close-toc when a step is clicked", async () => {
        // Mock $parent.$refs.stepper using Object.defineProperty to avoid proxy error and ensure array exists
        Object.defineProperty(wrapper.vm, "$parent", {
            get: () => ({
                $refs: {
                    stepper: [
                        // Mock scrollIntoView to prevent errors during test
                        {scrollIntoView () {
                            return null;
                        }},
                        {scrollIntoView () {
                            return null;
                        }},
                        {scrollIntoView () {
                            return null;
                        }}
                    ]
                }
            })
        });

        const stepEl = wrapper.findAll(".chapterTitle").find(e => e.text().includes(stepsObjects[0].title));

        await stepEl.trigger("click");
        expect(wrapper.emitted()["close-toc"]).to.exist;
    });

    it("emits close-toc when a step is activated by keyboard", async () => {
        // Mock $parent.$refs.stepper using Object.defineProperty to avoid proxy error and ensure array exists
        Object.defineProperty(wrapper.vm, "$parent", {
            get: () => ({
                $refs: {
                    stepper: [
                        // Mock scrollIntoView to prevent errors during test
                        {scrollIntoView () {
                            return null;
                        }},
                        {scrollIntoView () {
                            return null;
                        }},
                        {scrollIntoView () {
                            return null;
                        }}
                    ]
                }
            })
        });
        const stepEl = wrapper.findAll(".chapterTitle").find(e => e.text().includes(stepsObjects[0].title));

        await stepEl.trigger("keydown", {key: "Enter"});
        expect(wrapper.emitted()["close-toc"]).to.exist;
    });
});
