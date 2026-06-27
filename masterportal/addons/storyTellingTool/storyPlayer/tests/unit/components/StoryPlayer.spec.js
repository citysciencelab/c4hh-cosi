import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import {createStore} from "vuex";

import StoryPlayer from "../../../components/StoryPlayer.vue";

describe("addons/storyPlayer/tests/unit/components/StoryPlayer.spec.js", () => {
    let wrapper,
        store,
        originalXMLHttpRequest,
        originalIntersectionObserver,
        originalScrollIntoView;

    beforeEach(() => {
        // Save original XMLHttpRequest
        originalXMLHttpRequest = global.XMLHttpRequest;
        originalIntersectionObserver = global.IntersectionObserver;
        originalScrollIntoView = global.HTMLElement?.prototype?.scrollIntoView;

        if (global.HTMLElement && global.HTMLElement.prototype) {
            global.HTMLElement.prototype.scrollIntoView = sinon.stub();
        }

        // Mock XMLHttpRequest
        global.XMLHttpRequest = class {
            /**
             * mock implementation to satisfy linter
             */
            open () {
                return null;
            }
            /**
             * mock implementation to satisfy linter
             */
            send () {
                return null;
            }
            /**
             * mock implementation to satisfy linter
             */
            setRequestHeader () {
                return null;
            }
            /**
             * mock implementation to satisfy linter
             */
            abort () {
                return null;
            }
            /**
             * mock implementation to satisfy linter
             */
            addEventListener () {
                return null;
            }
            /**
             * mock implementation to satisfy linter
             */
            removeEventListener () {
                return null;
            }
            /**
             * mock implementation to satisfy linter
             */
            get responseText () {
                return "";
            }
            /**
             * mock implementation to satisfy linter
             */
            get readyState () {
                return 4;
            }
            /**
             * mock implementation to satisfy linter
             */
            get status () {
                return 200;
            }
        };

        // Mock IntersectionObserver for jsdom test environment
        global.IntersectionObserver = class {
            /**
             * mock implementation to satisfy linter
             */
            constructor () {
                return null;
            }
            /**
             * mock implementation to satisfy linter
             */
            observe () {
                return null;
            }
            /**
             * mock implementation to satisfy linter
             */
            unobserve () {
                return null;
            }
            /**
             * mock implementation to satisfy linter
             */
            disconnect () {
                return null;
            }
            /**
             * mock implementation to satisfy linter
             */
            takeRecords () {
                return [];
            }
        };

        if (typeof window !== "undefined") {
            window.IntersectionObserver = global.IntersectionObserver;
        }

        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        StoryPlayer: {
                            namespaced: true,
                            state: () => ({
                                showLoadingSpinner: false,
                                autoplay: true,
                                fixedStoryPath: "",
                                fixedStoryName: "",
                                storyConf: {
                                    title: "Geschichten mit Karten erzählen",
                                    chapters: [
                                        {title: "Chapter 1", layers: [1], content: []},
                                        {title: "Chapter 2", layers: [2], content: []}
                                    ],
                                    displayType: "dipas"
                                },
                                mode: "2D",
                                storyConfJson: "mockConfigJsStoryConf.json"
                            }),
                            getters: {
                                showLoadingSpinner: state => state.showLoadingSpinner,
                                autoplay: state => state.autoplay,
                                fixedStoryPath: (state) => state.fixedStoryPath,
                                fixedStoryName: (state) => state.fixedStoryName,
                                storyConf: state => state.storyConf,
                                mode: state => state.mode,
                                storyConfJson: state => state.storyConfJson,
                                storyPlayerMenuSide: () => "secondaryMenu"
                            },
                            mutations: {
                                setShowLoadingSpinner (state, payload) {
                                    state.showLoadingSpinner = payload;
                                },
                                setStoryConf (state, payload) {
                                    state.setStoryConf = payload;
                                },
                                setMode: (state, payload) => {
                                    state.mode = payload;
                                }
                            }
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    actions: {
                        changeMapMode: sinon.stub()
                    },
                    getters: {
                        mode: () => "2D"
                    }
                },
                Menu: {
                    namespaced: true,
                    actions: {
                        changeCurrentComponent: sinon.stub(),
                        resetMenu: sinon.stub()
                    },
                    getters: {
                        mainMenu: () => ({sections: []}),
                        secondaryMenu: () => ({sections: []}),
                        expanded: () => sinon.stub()
                    },
                    mutations: {
                        setExpandedBySide: (state, {expanded, side}) => {
                            state[`${side}Expanded`] = expanded;
                        }
                    }
                }
            },
            state: {
                configJs: {
                    storyConf: "mockConfigJsStoryConf.json"
                }
            },
            getters: {
                configJs: state => state.configJs,
                allLayerConfigs: () => [],
                layerConfigsByAttributes: () => []
            }
        });

        wrapper = shallowMount(StoryPlayer, {
            props: {
                storyConfProp: {
                    title: "Geschichten mit Karten erzählen",
                    chapters: [
                        {title: "Chapter 1", layers: [1], content: []},
                        {title: "Chapter 2", layers: [2], content: []}
                    ],
                    displayType: "dipas",
                    author: "Test Author",
                    created: "2026-06-08",
                    description: "Test Description"
                },
                imageAssetsById: {}
            },
            global: {
                mocks: {
                    $t: key => key,
                    mapCollection: {
                        getMap: sinon.stub().returns({
                            getView: sinon.stub().returns({
                                animate: sinon.stub()
                            }),
                            getPixelFromCoordinate: sinon.stub().returns([0, 0]),
                            getCoordinateFromPixel: sinon.stub().returns([0, 0])
                        }),
                        getMap3d: sinon.stub().returns({
                            getCesiumScene: sinon.stub().returns({
                                camera: {
                                    flyTo: sinon.stub()
                                }
                            })
                        })
                    },
                    Cesium: {
                        Cartesian3: {fromDegrees: sinon.stub()},
                        EasingFunction: {QUADRATIC_OUT: sinon.stub()}
                    }
                },
                plugins: [store]
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }

        // Restore original XMLHttpRequest
        global.XMLHttpRequest = originalXMLHttpRequest;
        global.IntersectionObserver = originalIntersectionObserver;

        if (typeof window !== "undefined") {
            window.IntersectionObserver = originalIntersectionObserver;
        }

        sinon.restore();
    });

    if (global.HTMLElement && global.HTMLElement.prototype) {
        global.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    }

    describe("Component DOM", () => {
        it("StoryPlayer should exist", async () => {
            expect(wrapper.exists()).to.be.true;
        });

        it("renders the main story title from storyConf.title in the DOM", () => {
            const storyTitleElement = wrapper.find(".story-title");

            expect(storyTitleElement.exists()).to.be.true;
            expect(storyTitleElement.text()).to.equal("Geschichten mit Karten erzählen");
        });

        it("should not render the sticky header when showStickyHeader is false", async () => {
            wrapper.vm.showStickyHeader = false;
            await wrapper.vm.$nextTick();
            const stickyHeader = wrapper.find(".sticky-top");

            expect(stickyHeader.exists()).to.be.false;
        });

        it("should render the sticky header when showStickyHeader is true", async () => {
            wrapper.vm.showStickyHeader = true;
            await wrapper.vm.$nextTick();
            const stickyHeader = wrapper.find(".sticky-top");

            expect(stickyHeader.exists()).to.be.true;
        });

        it("should display the correct chapter number in the sticky header", async () => {
            wrapper.vm.showStickyHeader = true;
            wrapper.vm.currentChapterIndex = 1;
            await wrapper.vm.$nextTick();
            const chapterText = wrapper.find(".number-of-chapters").text();

            expect(chapterText).to.include("Kapitel 2 von 2");
        });

        it("renders step titles in the DOM from mocked chapters", () => {
            const stepElements = wrapper.findAll(".stepper");

            wrapper.vm.storyConf.chapters.forEach(chapter => {
                const el = stepElements.find(e => e.text().includes(chapter.title));

                expect(el).to.exist;
            });

            expect(stepElements.length).to.equal(wrapper.vm.storyConf.chapters.length);
        });

        it("each .stepper has correct index and class for first/last step", () => {
            const stepElements = wrapper.findAll(".stepper");
            const chaptersLength = wrapper.vm.storyConf.chapters.length;

            expect(stepElements.length).to.equal(chaptersLength);

            stepElements.forEach((el, idx) => {
                // Check firstStep class
                if (idx === 0) {
                    expect(el.classes()).to.include("firstStep");
                }
                else {
                    expect(el.classes()).to.not.include("firstStep");
                }

                // Check lastStep class
                if (idx === chaptersLength - 1) {
                    expect(el.classes()).to.include("lastStep");
                }
                else {
                    expect(el.classes()).to.not.include("lastStep");
                }
            });
        });
    });

    describe("Methods", () => {
        describe("getFixedStoryList", () => {
            it("should not call getFixedStoryList", () => {
                const getFixedStoryListSpy = sinon.spy(wrapper.vm, "getFixedStoryList");

                expect(getFixedStoryListSpy.called).to.be.false;
            });

            it("should call getFixedStoryList", async () => {
                const getFixedStoryListStub = sinon.stub(StoryPlayer.methods, "getFixedStoryList").resolves();

                store.commit("Modules/StoryPlayer/setStoryConf", {});

                wrapper = shallowMount(StoryPlayer, {props: {
                    storyConfProp: {},
                    imageAssetsById: {}
                },
                global: {plugins: [store]
                }});

                await wrapper.vm.$nextTick();

                expect(getFixedStoryListStub.calledOnce).to.be.true;
            });
        });

        it("should call loadChapter when currentChapterIndex changes", async () => {
            const loadChapterSpy = sinon.spy(wrapper.vm, "loadChapter");

            wrapper.vm.currentChapterIndex = 1;
            await wrapper.vm.$nextTick();

            expect(loadChapterSpy.called).to.be.true;
            loadChapterSpy.restore();
        });

        it("should activate tool when activateTool is called", () => {
            const changeCurrentComponentStub = sinon.stub(wrapper.vm, "changeCurrentComponent");

            wrapper.vm.activateTool("testTool");
            expect(changeCurrentComponentStub.called).to.be.true;
            changeCurrentComponentStub.restore();
        });

        it("should deactivate tool when deactivateTool is called", () => {
            const resetMenuStub = sinon.stub(wrapper.vm, "resetMenu");

            wrapper.vm.deactivateTool(["testTool"]);
            expect(resetMenuStub.called).to.be.true;
            resetMenuStub.restore();
        });

        it("should enableLayer and disableLayer call toggleLayer", () => {
            const toggleLayerStub = sinon.stub(wrapper.vm, "toggleLayer");

            wrapper.vm.enableLayer({id: 1});
            expect(toggleLayerStub.calledWith({id: 1}, true)).to.be.true;
            wrapper.vm.disableLayer({id: 2});
            expect(toggleLayerStub.calledWith({id: 2}, false)).to.be.true;
            toggleLayerStub.restore();
        });

        it("should return storyConfPath from store when available", () => {
            // storyConfJson is set in the store state
            expect(wrapper.vm.storyConfPath).to.equal("mockConfigJsStoryConf.json");
        });

        describe("Chevron Navigation Tests", () => {
            beforeEach(() => {
                wrapper.vm.storyConf.chapters = [
                    {title: "Step 1", content: []},
                    {title: "Step 2", content: []},
                    {title: "Step 3", content: []}
                ];
            });

            it("should navigate to next and previous steps", async () => {
                wrapper.vm.currentChapterIndex = 1;
                wrapper.vm.goToNextStep();
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.currentChapterIndex).to.equal(2);

                wrapper.vm.goToPreviousStep();
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.currentChapterIndex).to.equal(1);
            });

            it("should not exceed step boundaries", async () => {
                wrapper.vm.currentChapterIndex = 0;
                wrapper.vm.goToPreviousStep();
                expect(wrapper.vm.currentChapterIndex).to.equal(0);

                wrapper.vm.currentChapterIndex = wrapper.vm.storyConf.chapters.length - 1;
                wrapper.vm.goToNextStep();
                expect(wrapper.vm.currentChapterIndex).to.equal(wrapper.vm.storyConf.chapters.length - 1);
            });

            it("should render chevron navigation icons correctly", async () => {
                wrapper.vm.currentChapterIndex = 1;
                await wrapper.vm.$nextTick();

                const chevronUp = wrapper.find(".chevron-up .bi-arrow-up");
                const chevronDown = wrapper.find(".chevron-down .bi-arrow-down");

                expect(chevronUp.exists()).to.be.true;
                expect(chevronDown.exists()).to.be.true;
            });

            it("should hide chevrons at step boundaries", async () => {
                wrapper.vm.currentChapterIndex = 0;
                await wrapper.vm.$nextTick();
                expect(wrapper.find(".chevron-up").exists()).to.be.false;

                wrapper.vm.currentChapterIndex = wrapper.vm.storyConf.chapters.length - 1;
                await wrapper.vm.$nextTick();
                expect(wrapper.find(".chevron-down").exists()).to.be.false;
            });

            it("should call navigation methods when chevron buttons are clicked", async () => {
                wrapper.vm.currentChapterIndex = 1;
                await wrapper.vm.$nextTick();

                const goNextSpy = sinon.spy(wrapper.vm, "goToNextStep");
                const goPrevSpy = sinon.spy(wrapper.vm, "goToPreviousStep");

                await wrapper.find(".chevron-down .btn-chevron").trigger("click");
                expect(goNextSpy.called).to.be.true;

                await wrapper.find(".chevron-up .btn-chevron").trigger("click");
                expect(goPrevSpy.called).to.be.true;

                goNextSpy.restore();
                goPrevSpy.restore();
            });
        });
    });
});
