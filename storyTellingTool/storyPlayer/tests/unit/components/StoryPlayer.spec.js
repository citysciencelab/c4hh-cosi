import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import {createStore} from "vuex";

import StoryPlayer from "../../../components/StoryPlayer.vue";

describe("addons/storyPlayer/tests/unit/components/StoryPlayer.spec.js", () => {
    let wrapper,
        store,
        map,
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
                                imageAssetsById: {},
                                showLoadingSpinner: false,
                                fixedStoryPath: "",
                                fixedStoryName: "",
                                originalLayerConfig: undefined,
                                storyConf: {
                                    title: "Geschichten mit Karten erzählen",
                                    chapters: [
                                        {title: "Chapter 1", layers: [1], content: []},
                                        {title: "Chapter 2", layers: [2], content: []}
                                    ],
                                    displayType: "dipas"
                                },
                                mode: "2D"
                            }),
                            getters: {
                                imageAssetsById: state => state.imageAssetsById,
                                showLoadingSpinner: state => state.showLoadingSpinner,
                                fixedStoryPath: (state) => state.fixedStoryPath,
                                fixedStoryName: (state) => state.fixedStoryName,
                                currentStoryName: () => null,
                                originalLayerConfig: (state) => state.originalLayerConfig,
                                storyConf: state => state.storyConf,
                                mode: state => state.mode,
                                storyConfJson: state => state.storyConfJson,
                                storyPlayerMenuSide: () => "secondaryMenu"
                            },
                            mutations: {
                                setOriginalLayerConfig (state, payload) {
                                    state.originalLayerConfig = payload;
                                },
                                setShowLoadingSpinner (state, payload) {
                                    state.showLoadingSpinner = payload;
                                },
                                setStoryConf (state, payload) {
                                    state.storyConf = payload;
                                },
                                setMode: (state, payload) => {
                                    state.mode = payload;
                                }
                            }
                        },
                        ShareView: {
                            namespaced: true,
                            getters: {
                                url: () => "https://example.com/portal?test=1"
                            }
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    actions: {
                        changeMapMode: sinon.stub(),
                        placingPointMarker: sinon.spy(),
                        removePointMarker: sinon.spy(),
                        zoomToExtent: sinon.spy()
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
                },
                Alerting: {
                    namespaced: true,
                    actions: {
                        addSingleAlert: sinon.stub()
                    }
                }
            },
            state: {
                configJs: {
                    storyConf: "mockConfigJsStoryConf.json"
                }
            },
            getters: {
                addLayerButton: () => sinon.stub(),
                allLayerConfigs: () => [],
                configJs: state => state.configJs,
                layerConfig: () => sinon.stub(),
                layerConfigsByAttributes: () => () => [],
                layerConfigById: () => (id) => {
                    if (id === "1") {
                        return "conf";
                    }
                    return false;
                },
                visibleBaselayerConfigs: () => []
            },
            actions: {
                addLayerToLayerConfig: () => sinon.stub(),
                addOrReplaceLayer: () => sinon.stub(),
                updateLayerConfigs: () => sinon.stub()
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
                    $t: (key, params) => {
                        if (key === "additional:modules.storyPlayer.numberOfChapters" && params) {
                            return `Kapitel ${params.current} von ${params.total}`;
                        }
                        return key;
                    },
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

        mapCollection.clear();
        map = {
            id: "ol",
            mode: "2D",
            getLayers: () => {
                return {
                    getArray: () => {
                        return [];
                    }
                };
            },
            getView: () => {
                return {
                    animate: sinon.spy(),
                    getZoom: () => sinon.stub(),
                    getCenter: () => []
                };
            },
            addOverlay: sinon.spy(),
            removeOverlay: sinon.spy()
        };
        mapCollection.addMap(map, "2D");
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

        it("should render floating-button", async () => {
            wrapper.vm.showStickyHeader = true;
            await wrapper.vm.$nextTick();
            const floatingButton = wrapper.findComponent({name: "IconButton"});

            expect(floatingButton.exists()).to.be.true;
        });

        it("should not render StoryPlayerFeature component", () => {
            expect(wrapper.findComponent({name: "StoryPlayerFeature"}).exists()).to.be.false;
        });

        it("should render StoryPlayerFeature component", async () => {
            await wrapper.setData({featureAttributes: {}});

            expect(wrapper.findComponent({name: "StoryPlayerFeature"}).exists()).to.be.true;
        });

        it("should not render AlertMessage component", () => {
            expect(wrapper.findComponent({name: "AlertMessage"}).exists()).to.be.false;
        });

        it("should render AlertMessage component", async () => {
            await wrapper.setData({showImportWarning3D: [false, true]});

            expect(wrapper.findComponent({name: "AlertMessage"}).exists()).to.be.true;
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

        it("should not in enableLayer to call addLayerToLayerConfig and addOrReplaceLayer", async () => {
            const addOrReplaceLayerStub = sinon.stub(wrapper.vm, "addOrReplaceLayer"),
                addLayerToLayerConfigStub = sinon.stub(wrapper.vm, "addLayerToLayerConfig");

            await wrapper.vm.enableLayer(null);
            expect(addLayerToLayerConfigStub.called).to.be.false;
            expect(addOrReplaceLayerStub.called).to.be.false;
            await wrapper.vm.enableLayer(false);
            expect(addLayerToLayerConfigStub.called).to.be.false;
            expect(addOrReplaceLayerStub.called).to.be.false;
            await wrapper.vm.enableLayer(0);
            expect(addLayerToLayerConfigStub.called).to.be.false;
            expect(addOrReplaceLayerStub.called).to.be.false;
            await wrapper.vm.enableLayer({});
            expect(addLayerToLayerConfigStub.called).to.be.false;
            expect(addOrReplaceLayerStub.called).to.be.false;
            await wrapper.vm.enableLayer([]);
            expect(addLayerToLayerConfigStub.called).to.be.false;
            expect(addOrReplaceLayerStub.called).to.be.false;
            await wrapper.vm.enableLayer(undefined);
            expect(addLayerToLayerConfigStub.called).to.be.false;
            expect(addOrReplaceLayerStub.called).to.be.false;
            addOrReplaceLayerStub.restore();
            addLayerToLayerConfigStub.restore();
        });

        it("should in enableLayer to call addLayerToLayerConfig and addOrReplaceLayer if the id is a string", async () => {
            const addOrReplaceLayerStub = sinon.stub(wrapper.vm, "addOrReplaceLayer"),
                addLayerToLayerConfigStub = sinon.stub(wrapper.vm, "addLayerToLayerConfig");

            await wrapper.vm.enableLayer("1");
            expect(addLayerToLayerConfigStub.called).to.be.false;
            expect(addOrReplaceLayerStub.called).to.be.true;
            addOrReplaceLayerStub.restore();
            addLayerToLayerConfigStub.restore();
        });

        it("should in enableLayer to call addLayerToLayerConfig and addOrReplaceLayer if the id is an array", async () => {
            const addOrReplaceLayerStub = sinon.stub(wrapper.vm, "addOrReplaceLayer"),
                addLayerToLayerConfigStub = sinon.stub(wrapper.vm, "addLayerToLayerConfig");

            await wrapper.vm.enableLayer(["1", "2"]);
            expect(addLayerToLayerConfigStub.called).to.be.false;
            expect(addOrReplaceLayerStub.called).to.be.true;
            addOrReplaceLayerStub.restore();
            addLayerToLayerConfigStub.restore();
        });

        describe("Chevron Navigation Tests", () => {
            beforeEach(() => {
                wrapper.vm.storyConf.chapters = [
                    {title: "Step 1", content: []},
                    {title: "Step 2", content: []},
                    {title: "Step 3", content: []}
                ];
            });

            it("should call function deactivateSubjectLayer", async () => {
                const deactivateSubjectLayerStub = sinon.stub(wrapper.vm, "deactivateSubjectLayer");

                wrapper.vm.currentChapterIndex = 1;
                wrapper.vm.goToNextStep();
                await wrapper.vm.$nextTick();
                expect(deactivateSubjectLayerStub.called).to.be.true;
                deactivateSubjectLayerStub.restore();
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

                const buttons = wrapper.findAllComponents({name: "IconButton"});

                expect(buttons.length).to.equal(2);
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

                const buttons = wrapper.findAllComponents({name: "IconButton"});

                await buttons.at(1).props("interaction")();
                expect(goNextSpy.calledOnce).to.be.true;

                await buttons.at(0).props("interaction")();
                expect(goPrevSpy.calledOnce).to.be.true;

                goNextSpy.restore();
                goPrevSpy.restore();
            });
        });

        describe("openFeaturePopup", () => {
            it("should not call placingPointMarker", () => {
                const placingPointMarkerSpy = sinon.spy(wrapper.vm, "placingPointMarker");

                wrapper.vm.openFeaturePopup(null);
                expect(placingPointMarkerSpy.called).to.be.false;

                wrapper.vm.openFeaturePopup(0);
                expect(placingPointMarkerSpy.called).to.be.false;

                wrapper.vm.openFeaturePopup([]);
                expect(placingPointMarkerSpy.called).to.be.false;

                wrapper.vm.openFeaturePopup(true);
                expect(placingPointMarkerSpy.called).to.be.false;

                wrapper.vm.openFeaturePopup("");
                expect(placingPointMarkerSpy.called).to.be.false;

                wrapper.vm.openFeaturePopup(undefined);
                expect(placingPointMarkerSpy.called).to.be.false;
            });

            it("should call placingPointMarker", () => {
                const placingPointMarkerSpy = sinon.spy(wrapper.vm, "placingPointMarker");

                wrapper.vm.openFeaturePopup({coordinate: [1, 1]});
                expect(placingPointMarkerSpy.called).to.be.true;
            });

            it("should render StoryPlayerFeature component", async () => {
                await wrapper.setData({featureAttributes: undefined});
                expect(wrapper.findComponent({name: "StoryPlayerFeature"}).exists()).to.be.false;

                await wrapper.vm.openFeaturePopup({coordinate: [1, 1], title: "title"});
                expect(wrapper.findComponent({name: "StoryPlayerFeature"}).exists()).to.be.true;
            });
        });
    });
});
