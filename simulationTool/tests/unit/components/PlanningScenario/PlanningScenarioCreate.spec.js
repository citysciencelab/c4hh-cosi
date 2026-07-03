import {createStore} from "vuex";
import {config, mount, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Feature from "ol/Feature.js";
import PlanningScenarioCreate from "../../../../components/PlanningScenario/PlanningScenarioCreate.vue";
import {Polygon} from "ol/geom.js";
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
        mockFeatures = [],
        layer = {
            getLayerSource: () => ({
                addFeature: (feature) => mockFeatures.push(feature),
                clear: () => {
                    mockFeatures.length = 0;
                },
                getFeatures: () => mockFeatures,
                removeFeature: (feature) => {
                    const index = mockFeatures.indexOf(feature);

                    if (index > -1) {
                        mockFeatures.splice(index, 1);
                    }
                }
            })
        };

    beforeEach(() => {
        mockFeatures.length = 0;
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
                                currentPlanningScenarioId: () => null,
                                dataSources: () => [
                                    {
                                        id: "default",
                                        title: "Test Data Source",
                                        maxSideLength: 1000
                                    }
                                ],
                                drawTypeLabels: () => {
                                    return [];
                                },
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
                                planningScenarios: () => [],
                                planningScenarioSelectedDrawType: () => selectedDrawType,
                                planningScenarioSelectedDrawTypeMain: () => selectedDrawTypeMain,
                                selectedInteraction: () => "draw",
                                planningScenarioStrokeRange: () => [1, 16],
                                planningScenarioSelectedInteraction: () => null,
                                simulationAreaStyle: () => "",
                                simulationAreaStyleInvalid: () => "",
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
                        removeInteraction: sinon.stub(),
                        zoomToExtent: sinon.stub()
                    }
                }
            }
        });
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
        it("should render dropdown for data source", () => {
            const wrapper = factory.getShallowMount(),
                dropdown = wrapper.find("#dataSourceForPlanning");

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
            expect(wrapper.vm.source.getFeatures()).to.deep.equal(layer.getLayerSource().getFeatures());
        });
    });

    describe("Methods", () => {
        describe("Side Length Validation", () => {
            describe("maxSideLengthFromConfig", () => {
                it("should return maxSideLength from current data source", () => {
                    const wrapper = factory.getMount();

                    expect(wrapper.vm.maxSideLengthFromConfig).to.equal(1000);
                });

                it("should return fallback value of 450 if no maxSideLength in data source", () => {
                    const wrapper = factory.getMount();

                    sinon.stub(wrapper.vm, "currentDataSource").get(() => ({
                        id: "default",
                        title: "Test Data Source"
                    }));

                    expect(wrapper.vm.maxSideLengthFromConfig).to.equal(450);
                });
            });

            describe("checkBboxSideLengthConstraint", () => {
                it("should return false if no bboxFeature provided", () => {
                    const wrapper = factory.getMount();

                    expect(wrapper.vm.checkBboxSideLengthConstraint(null, true)).to.be.false;
                });

                it("should return false if bbox side length is within limits", () => {
                    const wrapper = factory.getMount(),
                        bboxFeature = {
                            getGeometry: () => ({
                                getType: () => "Polygon",
                                getCoordinates: () => [[[0, 0], [500, 0], [500, 500], [0, 500], [0, 0]]]
                            })
                        };

                    expect(wrapper.vm.checkBboxSideLengthConstraint(bboxFeature, true)).to.be.false;
                });

                it("should return true if bbox side length exceeds limits", () => {
                    const wrapper = factory.getMount(),
                        bboxFeature = {
                            getGeometry: () => ({
                                getType: () => "Polygon",
                                getCoordinates: () => [[[0, 0], [1500, 0], [1500, 1500], [0, 1500], [0, 0]]]
                            })
                        };

                    expect(wrapper.vm.checkBboxSideLengthConstraint(bboxFeature, true)).to.be.true;
                });
            });

            describe("bufferConstraintStatus", () => {
                it("should return sideLengthExceeded false if no features", () => {
                    const wrapper = factory.getMount();

                    expect(wrapper.vm.bufferConstraintStatus.sideLengthExceeded).to.be.false;
                });
            });

            describe("isMaxConstraintExceeded", () => {
                it("should return false if no constraints are exceeded", () => {
                    const wrapper = factory.getMount();

                    expect(wrapper.vm.isMaxConstraintExceeded).to.be.false;
                });

                it("should return true if side length constraint is exceeded", () => {
                    const wrapper = factory.getMount(),
                        bboxFeature = {
                            get: (key) => key === "id" ? "simulation-area" : null,
                            getGeometry: () => ({
                                getType: () => "Polygon",
                                getCoordinates: () => [[[0, 0], [1500, 0], [1500, 1500], [0, 1500], [0, 0]]]
                            })
                        },
                        constraintExceeded = wrapper.vm.checkBboxSideLengthConstraint(bboxFeature, true);

                    expect(constraintExceeded).to.be.true;
                });
            });

            describe("constraintExceededInfoText", () => {
                it("should return empty string if no constraints exceeded", () => {
                    const wrapper = factory.getMount();

                    sinon.stub(wrapper.vm, "bufferConstraintStatus").get(() => ({
                        sideLengthExceeded: false
                    }));

                    expect(wrapper.vm.constraintExceededInfoText()).to.equal("");
                });

                it("should return info text if side length exceeded", () => {
                    const wrapper = factory.getMount();

                    sinon.stub(wrapper.vm, "bufferConstraintStatus").get(() => ({
                        sideLengthExceeded: true
                    }));
                    wrapper.vm.currentSideLength = [1500, 1200];

                    expect(wrapper.vm.constraintExceededInfoText()).to.include("additional:modules.tools.simulationTool.maxSideLengthExceeded");
                });
            });
        });

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
            it("should add a feature with the geometry of the passed feature (planning scenario) to the source", () => {
                const wrapper = factory.getShallowMount(),
                    feature = new Feature({
                        geometry: new Polygon([[
                            [0, 0],
                            [0, 1],
                            [1, 1],
                            [1, 0],
                            [0, 0]]])
                    }),
                    expectedCoords = feature.getGeometry().getCoordinates().flat(3),
                    addFeatureStub = sinon.stub(wrapper.vm.source, "addFeature");

                wrapper.vm.addBBOX({feature});

                expect(addFeatureStub.calledWith(
                    sinon.match.hasNested("values_.id", "simulation-area")
                )).to.be.true;
                expect(addFeatureStub.calledWith(
                    sinon.match.hasNested("values_.geometry.flatCoordinates", sinon.match.array.deepEquals(expectedCoords))
                )).to.be.true;
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
