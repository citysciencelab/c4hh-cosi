import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import {createStore} from "vuex";

import StoryPlayer from "../../../components/storyPlayer/StoryPlayer.vue";

describe("addons/dataNarrator/tests/unit/components/StoryPlayer.spec.js", () => {
    let wrapper,
        store,
        originalXMLHttpRequest;

    beforeEach(() => {
        // Save original XMLHttpRequest
        originalXMLHttpRequest = global.XMLHttpRequest;

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

        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        DataNarrator: {
                            namespaced: true,
                            state: () => ({
                                showLoadingSpinner: false,
                                autoplay: true,
                                storyConf: {
                                    steps: [
                                        {title: "Step 1", layers: [1]},
                                        {title: "Step 2", layers: [2]}
                                    ],
                                    displayType: "dipas"
                                },
                                mode: "2D",
                                storyConfJson: "mockConfigJsStoryConf.json"
                            }),
                            getters: {
                                showLoadingSpinner: state => state.showLoadingSpinner,
                                autoplay: state => state.autoplay,
                                storyConf: state => state.storyConf,
                                mode: state => state.mode,
                                storyConfJson: state => state.storyConfJson,
                                dataNarratorMenuSide: () => "secondaryMenu"
                            },
                            mutations: {
                                setShowLoadingSpinner (state, payload) {
                                    state.showLoadingSpinner = payload;
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
                storyConfPath: null
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
    });

    it("StoryPlayer should exist", () => {
        expect(wrapper.exists()).to.be.true;
    });

    it("should render DipasPlayer component when showMode is 'dipas'", async () => {
        // Set Vuex state directly, not computed
        wrapper.vm.$store.state.Modules.DataNarrator.storyConf = {
            steps: [
                {title: "Die Daten der Stadt"},
                {title: "Hamburg ist Grün"},
                {title: "Hamburg ist Blau"}
            ]
        };
        wrapper.vm.$store.state.Modules.DataNarrator.autoplay = true;
        wrapper.vm.showMode = "dipas";
        wrapper.vm.currentStepIndex = 0;
        wrapper.vm.steps = [
            {title: "Die Daten der Stadt"},
            {title: "Hamburg ist Grün"},
            {title: "Hamburg ist Blau"}
        ];
        wrapper.vm.$forceUpdate();
        await wrapper.vm.$nextTick();

        const dipasPlayer = wrapper.findComponent({name: "DipasPlayer"});

        expect(dipasPlayer.exists()).to.be.true;
    });

    it("should call loadStep when currentStepIndex changes", async () => {
        const loadStepSpy = sinon.spy(wrapper.vm, "loadStep");

        wrapper.vm.currentStepIndex = 2;
        await wrapper.vm.$nextTick();

        expect(loadStepSpy.called).to.be.true;
        loadStepSpy.restore();
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

    it("should createStepArray flatten steps", () => {
        const steps = [
            {title: "Step 1"},
            {title: "Step 2",
                steps: [
                    {title: "Step 2.1"}
                ]
            },
            {title: "Step 3"}
        ];

        wrapper.vm.steps = [];
        wrapper.vm.createStepArray(steps);
        expect(wrapper.vm.steps.length).to.equal(4);
        expect(wrapper.vm.steps[0].title).to.equal("Step 1");
        expect(wrapper.vm.steps[1].title).to.equal("Step 2");
        expect(wrapper.vm.steps[2].title).to.equal("Step 2.1");
        expect(wrapper.vm.steps[3].title).to.equal("Step 3");
    });

    it("should assignDepth add depth property", () => {
        const arr = [
            {title: "Step 1",
                steps: [{title: "Step 1.1"}
                ]},
            {title: "Step 2"}
        ];

        wrapper.vm.assignDepth(arr);

        expect(arr[0].depth).to.equal(0);
        expect(arr[0].steps[0].depth).to.equal(1);
        expect(arr[1].depth).to.equal(0);
    });

    it("should return storyConfURL from URL parameter if storyConfJson is set in config.json is not set", () => {
        wrapper.vm.$store.state.storyConfJson = null;

        // Stub the getConfPathfromUrl method to return the mocked URL parameter
        const stub = sinon.stub(wrapper.vm, "getConfPathfromUrl").returns("mockConfigJsStoryConf.json");

        expect(wrapper.vm.storyConfPath).to.equal("mockConfigJsStoryConf.json");

        stub.restore();
    });
});
