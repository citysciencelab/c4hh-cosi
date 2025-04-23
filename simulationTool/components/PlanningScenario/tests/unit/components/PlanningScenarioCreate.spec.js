import {createStore} from "vuex";
import {config, mount, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Feature from "ol/Feature.js";
import layerFactory from "../../../../../../../src/core/layers/js/layerFactory";
import PlanningScenarioCreate from "../../../PlanningScenarioCreate.vue";
import {Polygon} from "ol/geom";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("addons/SimulationTool/components/PlanningScenario/PlanningScenarioCreate.vue", () => {
    let selectedDrawType,
        selectedDrawTypeMain,
        store;

    const factory = {
            getMount: () => {
                return mount(PlanningScenarioCreate, {
                    global: {
                        plugins: [store]
                    }
                });
            },
            getShallowMount: () => {
                return shallowMount(PlanningScenarioCreate, {
                    global: {
                        plugins: [store]
                    }
                });
            }
        },
        layer = layerFactory.createLayer({
            typ: "VECTORBASE",
            id: "planning-scenario",
            name: "planning-scenario",
            alwaysOnTop: true
        });

    beforeEach(() => {
        sinon.stub(PlanningScenarioCreate.methods, "getLayerSource").returns(layer.getLayerSource());
        selectedDrawType = "";
        selectedDrawTypeMain = "";

        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        SimulationTool: {
                            namespaced: true,
                            actions: {},
                            getters: {
                                planningScenarioCurrentLayout: () => {
                                    return {
                                        fillColor: [55, 126, 184],
                                        fillTransparency: 0,
                                        strokeColor: [0, 0, 0],
                                        strokeWidth: 1
                                    };
                                },
                                planningScenarioDrawIcons: () => {
                                    return {
                                        box: "bi-square",
                                        polygon: "bi-octagon"
                                    };
                                },
                                planningScenarioDrawTypesMain: () => ["polygon", "box"],
                                planningScenarioSelectedDrawType: () => selectedDrawType,
                                planningScenarioSelectedDrawTypeMain: () => selectedDrawTypeMain,
                                selectedInteraction: () => "draw",
                                planningScenarioStrokeRange: () => [1, 16],
                                planningScenarioSelectedInteraction: () => null,
                                simulationAreaStyle: () => "",
                                simulations: () => []
                            }
                        }
                    },
                    Maps: {
                        namespaced: true,
                        getters: {
                            projectionCode: () => sinon.stub(),
                            resolution: 0
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    actions: {
                        addInteraction: sinon.stub(),
                        removeInteraction: sinon.stub()
                    }
                }
            }
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.exists()).to.be.true;
        });
        it("should render draw types", () => {
            const wrapper = factory.getShallowMount(),
                drawTypes = wrapper.find("#draw-types");

            expect(drawTypes.exists()).to.be.true;
        });
        it("should render delete button", () => {
            const wrapper = factory.getShallowMount(),
                deleteButton = wrapper.find(".delete-all");

            expect(wrapper.findComponent({name: "IconButton"}).exists()).to.be.true;
            expect(deleteButton.exists()).to.be.true;
        });
        it("should not render edit Icon", () => {
            const wrapper = factory.getShallowMount(),
                editButton = wrapper.find(".edit");

            expect(editButton.exists()).to.be.false;
        });
        it("should render draw layout", () => {
            const wrapper = factory.getShallowMount(),
                drawLayout = wrapper.find("#draw-layouts");

            expect(drawLayout.exists()).to.be.true;
        });
        it("should render input text for simulation name", () => {
            const wrapper = factory.getShallowMount(),
                input = wrapper.find("#plsn-descr");

            expect(input.exists()).to.be.true;
        });
        it("should render input text for buffer", () => {
            const wrapper = factory.getShallowMount(),
                inputBuffer = wrapper.find("#buffer");

            expect(inputBuffer.exists()).to.be.true;
        });
        it("should render dropdown for simulation", () => {
            const wrapper = factory.getShallowMount(),
                dropdown = wrapper.find("#simulateForPlanning");

            expect(dropdown.exists()).to.be.true;
        });
        it("should render back button", () => {
            const wrapper = factory.getShallowMount(),
                backButton = wrapper.find("#back");

            expect(backButton.exists()).to.be.true;
        });
        it("should render save button", () => {
            const wrapper = factory.getShallowMount(),
                saveButton = wrapper.find("#save");

            expect(saveButton.exists()).to.be.true;
        });
        it("should render invalid input field", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                isValid: false,
                scenarioName: ""
            });

            expect(wrapper.find(".invalid-info").exists()).to.be.true;
        });
        it("should render disabled button", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                isValid: false,
                scenarioName: ""
            });

            await wrapper.vm.$nextTick();

            expect(wrapper.find("#save").attributes("disabled")).to.equal("true");
        });
    });

    describe("Lifecycle Hooks", () => {
        it("should set correct source in created", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.vm.source).to.not.be.null;
            expect(wrapper.vm.source).to.deep.equal(layer.getLayerSource());
        });
    });

    describe("User Interaction", () => {
        it("should call 'resetInteraction' if user start drawing", async () => {
            const spyResetInteraction = sinon.spy(PlanningScenarioCreate.methods, "resetInteraction"),
                wrapper = factory.getMount();

            await wrapper.find("#draw-polygon").trigger("drawstart");
            expect(spyResetInteraction.calledOnce).to.be.true;
        });

        it("should call 'addBBOX' if user stop drawing", async () => {
            const stubAddBBOX = sinon.stub(PlanningScenarioCreate.methods, "addBBOX"),
                wrapper = factory.getMount();

            await wrapper.find("#draw-polygon").trigger("drawend");
            expect(stubAddBBOX.calledOnce).to.be.true;
        });
    });
    describe("Methods", () => {
        describe("isValid", () => {
            it("should set isValid to true if input is not an empty string", () => {
                const wrapper = factory.getMount();

                wrapper.vm.checkInputString("PlanningScenario 1");

                expect(wrapper.vm.isValid).to.be.equal(true);
            });
            it("should set isValid to false if input is an empty string", () => {
                const wrapper = factory.getMount();

                wrapper.vm.checkInputString("");

                expect(wrapper.vm.isValid).to.be.equal(false);
            });
        });

        describe("addBBOX", () => {
            it("should add a feature with the extent geometry of the passed feature (planning scenario) to the source", () => {
                const wrapper = factory.getShallowMount(),
                    feature = new Feature({
                        geometry: new Polygon([[
                            [574729.649, 5927590.856],
                            [574676.641, 5927642.08],
                            [574690.16, 5927655.429],
                            [574705.504, 5927640.191],
                            [574711.97, 5927633.768],
                            [574742.688, 5927603.26],
                            [574729.649, 5927590.856]]])
                    }),
                    extent = [574676.641, 5927590.856, 574742.688, 5927655.429];

                wrapper.vm.addBBOX({feature});

                expect(wrapper.vm.source.getFeatures()[0].get("name")).to.be.equal("simulation-area");
                expect(wrapper.vm.source.getFeatures()[0].getGeometry().getExtent()).to.deep.equal(extent);
            });
        });

        describe("modifyBBoxByBuffer", () => {
            it("should not modify BBox feature if there is no feature", async () => {
                const wrapper = factory.getShallowMount(),
                    spyAddBBoxFeature = sinon.spy(PlanningScenarioCreate.methods, "addBBoxFeature"),
                    spyRemoveBBoxFeature = sinon.spy(PlanningScenarioCreate.methods, "removeBBoxFeature");

                wrapper.vm.modifyBBoxByBuffer("10");
                await wrapper.vm.$nextTick();

                expect(spyAddBBoxFeature.notCalled).to.be.true;
                expect(spyRemoveBBoxFeature.notCalled).to.be.true;
            });

            it("should not modify BBox feature if there is no planning scenario feature", async () => {
                const wrapper = factory.getShallowMount(),
                    feature = new Feature({
                        geometry: new Polygon([[
                            [574729.649, 5927590.856],
                            [574676.641, 5927642.08],
                            [574690.16, 5927655.429],
                            [574705.504, 5927640.191],
                            [574711.97, 5927633.768],
                            [574742.688, 5927603.26],
                            [574729.649, 5927590.856]]])
                    }),
                    spyAddBBoxFeature = sinon.spy(PlanningScenarioCreate.methods, "addBBoxFeature"),
                    spyRemoveBBoxFeature = sinon.spy(PlanningScenarioCreate.methods, "removeBBoxFeature");

                wrapper.vm.addBBOX({feature});
                await wrapper.vm.$nextTick();
                wrapper.vm.modifyBBoxByBuffer("10");
                await wrapper.vm.$nextTick();

                expect(spyAddBBoxFeature.notCalled).to.be.true;
                expect(spyRemoveBBoxFeature.notCalled).to.be.true;
            });
        });

        describe("removeBBoxFeature", () => {
            it("should remove BBox feature", async () => {
                const wrapper = factory.getShallowMount(),
                    feature = new Feature({
                        geometry: new Polygon([[
                            [574729.649, 5927590.856],
                            [574676.641, 5927642.08],
                            [574690.16, 5927655.429],
                            [574705.504, 5927640.191],
                            [574711.97, 5927633.768],
                            [574742.688, 5927603.26],
                            [574729.649, 5927590.856]]])
                    });

                wrapper.vm.source.clear();
                wrapper.vm.addBBOX({feature});
                await wrapper.vm.$nextTick();
                wrapper.vm.removeBBoxFeature();
                await wrapper.vm.$nextTick();

                expect(wrapper.vm.source.getFeatures().length).to.be.equal(0);
            });
        });
    });
});
