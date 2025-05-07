import {config, mount, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import SimulationParameter from "../../../SimulationParameter.vue";
import sinon from "sinon";
import axios from "axios";

config.global.mocks.$t = key => key;

describe("addons/SimulationTool/components/SimulationParameter/SimulationParameter.vue", () => {
    let store;

    const factory = {
        getShallowMount: () => {
            return shallowMount(SimulationParameter, {
                global: {
                    plugins: [store]
                }
            });
        },
        getMount: () => {
            return mount(SimulationParameter, {
                global: {
                    plugins: [store]
                }
            });
        }
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
                            getters: {
                                currentPlanningScenarioId: () => "planningScenarioId",
                                planningScenarios: () => [
                                    {
                                        id: "planningScenarioId",
                                        simulationId: "simulationId"
                                    }
                                ],
                                previousComponentOfSimulation: sinon.stub(),
                                simulations: () => [
                                    {
                                        id: "simulationId",
                                        url: "http://www.simulation.hamburg"
                                    }
                                ]
                            },
                            mutations: {
                                setCurrentPlanningComponent: sinon.stub(),
                                setMode: sinon.stub()
                            }
                        }
                    }
                }
            }
        });

        sinon.stub(axios, "get").resolves({data: {}});
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.exists()).to.be.true;
        });

        it("should render SectionHeader component", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.findComponent({name: "SectionHeader"}).exists()).to.be.true;
        });

        it("should render FlatButton component", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.findComponent({name: "FlatButton"}).exists()).to.be.true;
        });

        it("should render FileUpload component", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.findComponent({name: "FileUpload"}).exists()).to.be.true;
        });
    });

    describe("Computed Properties", () => {
        it("should return the correct value for 'objectTypeInputs'", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                processDescription: {
                    inputs: {
                        objectType: {schema: {type: "object"}},
                        stringType: {schema: {type: "string"}},
                        otherType: {schema: {type: "geojson"}}
                    }
                }
            });

            expect(wrapper.vm.objectTypeInputs).to.deep.equal({
                objectType: {schema: {type: "object"}}
            });
        });

        it("should return the correct value for 'stringTypeInputs'", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                processDescription: {
                    inputs: {
                        objectType: {schema: {type: "object"}},
                        stringType: {schema: {type: "string"}},
                        otherType: {schema: {type: "geojson"}}
                    }
                }
            });

            expect(wrapper.vm.stringTypeInputs).to.deep.equal({
                stringType: {schema: {type: "string"}}
            });
        });
    });

    describe("User Interaction", () => {
        it("should call 'openCreatePlanningScenario' if user clicks the button to create a new planning scenario", async () => {
            const wrapper = factory.getMount(),
                buttonListWrapper = wrapper.findAll("button"),
                spyOenCreatePlanningScenario = sinon.spy(wrapper.vm, "openCreatePlanningScenario");

            await buttonListWrapper.at(0).trigger("click");
            expect(spyOenCreatePlanningScenario.calledOnce).to.be.true;
        });

        it("should call 'backToPrevious' if user clicks the button back to previous component", async () => {
            const wrapper = factory.getMount(),
                button = wrapper.find("#back"),
                spyBackToPrevious = sinon.spy(wrapper.vm, "backToPrevious");

            await button.trigger("click");
            expect(spyBackToPrevious.calledOnce).to.be.true;
        });
    });
});
