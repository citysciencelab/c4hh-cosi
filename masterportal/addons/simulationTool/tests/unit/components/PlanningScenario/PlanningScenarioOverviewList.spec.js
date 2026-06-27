import {config, mount, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import PlanningScenarioOverviewList from "../../../../components/PlanningScenario/PlanningScenarioOverviewList.vue";
import sinon from "sinon";
import layerCollection from "../../../../../../src/core/layers/js/layerCollection.js";

config.global.mocks.$t = key => key;


describe("addons/SimulationTool/components/PlanningScenario/PlanningScenarioOverviewList.vue", () => {
    let store;

    const factory = {
            getShallowMount: () => {
                return shallowMount(PlanningScenarioOverviewList, {
                    global: {
                        plugins: [store]
                    }
                });
            },
            getMount: () => {
                return mount(PlanningScenarioOverviewList, {
                    global: {
                        plugins: [store]
                    }
                });
            }
        },
        planningScenarios = [{
            "id": "Scenario1",
            "name": "Planungsszenario 1",
            "scenarioFeature": {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [
                                [[10.004718316195724, 53.497158760096], [10.004989573473514, 53.49918395251746], [10.001050308002908, 53.498579259213344], [10.004718316195724, 53.497158760096]]
                            ]
                        }
                    }
                ]
            }
        },
        {
            "id": "Scenario2",
            "name": "Planungsszenario 2",
            "scenarioFeature": {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [
                                [[10.004718316195724, 53.497158760096], [10.004989573473514, 53.49918395251746], [10.001050308002908, 53.498579259213344], [10.004718316195724, 53.497158760096]]
                            ]
                        }
                    }
                ]
            }
        },
        {
            "id": "Scenario3",
            "name": "Planungsszenario 3",
            "scenarioFeature": {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [
                                [[10.004718316195724, 53.497158760096], [10.004989573473514, 53.49918395251746], [10.001050308002908, 53.498579259213344], [10.004718316195724, 53.497158760096]]
                            ]
                        }
                    }
                ]
            }
        }],
        currentPlanningScenarioId = "Scenario3",
        layer = {
            getLayerSource: () => ({
                clear: () => undefined,
                addFeature: () => undefined,
                addFeatures: () => undefined
            })
        };

    beforeEach(() => {
        store = createStore({
            namespaced: true,
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        SimulationTool: {
                            namespaced: true,
                            actions: {
                                updateFeatures: () => sinon.stub(),
                                zoomToFeature: () => sinon.stub()
                            },
                            getters: {
                                planningScenarios: (state) => state.planningScenarios,
                                currentPlanningScenarioId: (state) => state.currentPlanningScenarioId
                            },
                            mutations: {
                                setMode: sinon.stub(),
                                setPlanningScenarios (state, value) {
                                    state.planningScenarios = value;
                                },
                                setCurrentPlanningScenarioId (state, value) {
                                    state.currentPlanningScenarioId = value;
                                },
                                setPreviousComponentOfSimulation: sinon.stub()
                            },
                            state: {
                                planningScenarios: planningScenarios,
                                currentPlanningScenarioId: currentPlanningScenarioId
                            }
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    actions: {
                        zoomToExtent: sinon.spy()
                    }
                }
            }
        });
        sinon.stub(layerCollection, "getLayerById").returns(layer);
        sinon.stub(PlanningScenarioOverviewList.methods, "updateFeatures").returns("");
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.exists()).to.be.true;
        });

        it("should find a list group with three items", () => {
            const wrapper = factory.getShallowMount(),
                listGroupWrapper = wrapper.find(".list-group"),
                listGroupItemsWrapper = listGroupWrapper.findAll(".list-group-item");

            expect(listGroupWrapper.exists()).to.be.true;
            expect(listGroupItemsWrapper).to.have.lengthOf(3);
        });

        it("should find four icon button components per list item", () => {
            const wrapper = factory.getShallowMount(),
                listGroupWrapper = wrapper.find(".list-group"),
                listGroupItemWrapper = listGroupWrapper.findAll(".list-group-item").at(0),
                iconComponentsWrapper = listGroupItemWrapper.findAll("icon-button-stub");

            expect(iconComponentsWrapper).to.have.lengthOf(4);
        });
    });

    describe("Methods", () => {
        describe("removeScenarioById", () => {
            it("should remove a scenario by the passed id from the list of scenarios", () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.removeScenarioById(wrapper.vm.planningScenarios, "Scenario2");

                expect(wrapper.vm.planningScenarios).to.have.lengthOf(2);
                expect(wrapper.vm.planningScenarios.find(scenario => scenario.id === "Scenario2")).to.be.undefined;
            });
        });
        describe("toggleList", () => {
            it("should set new scenario id", () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.toggleList("Scenario2");

                expect(wrapper.vm.currentPlanningScenarioId).to.be.equal("Scenario2");
            });
            it("should set new scenario id", () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.toggleList("Scenario2");

                expect(wrapper.vm.currentPlanningScenarioId).to.be.equal("Scenario2");
            });
        });
    });

    describe("User Interaction", () => {
        it("should call 'openSimulationParameter' if user clicks the button to open simulation parameter component", async () => {
            const wrapper = factory.getMount(),
                buttonListWrapper = wrapper.findAll("button"),
                spyOpenSimulationParameter = sinon.spy(wrapper.vm, "openSimulationParameter");

            await buttonListWrapper.at(0).trigger("click");
            expect(spyOpenSimulationParameter.calledOnce).to.be.true;
        });

        it("should call 'removeScenarioById' if user clicks the button to remove a scenario", async () => {
            const wrapper = factory.getMount(),
                buttonListWrapper = wrapper.findAll("button"),
                spyRemoveScenarioById = sinon.spy(wrapper.vm, "removeScenarioById");

            // delete first scenario
            await buttonListWrapper.at(3).trigger("click");
            expect(spyRemoveScenarioById.calledOnce).to.be.true;
        });
    });
});
