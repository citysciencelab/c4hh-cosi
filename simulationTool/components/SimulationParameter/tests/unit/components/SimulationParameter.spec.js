import {config, mount, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import SimulationParameter from "../../../SimulationParameter.vue";
import sinon from "sinon";
import axios from "axios";

config.global.mocks.$t = key => key;

describe("addons/SimulationTool/components/SimulationParameter/SimulationParameter.vue", () => {
    let consoleWarnSpy, store;

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
        consoleWarnSpy = sinon.spy();
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
        sinon.stub(console, "warn").callsFake(consoleWarnSpy);
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

        it("should render AccordionItem component", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.findComponent({name: "AccordionItem"}).exists()).to.be.true;
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

    describe("Methods", () => {
        describe("getParameterValue", () => {
            it("should return default value if the keys are not string", () => {
                const wrapper = factory.getShallowMount();

                expect(wrapper.vm.getParameterValue(null, "key2", "value")).to.equal("value");
                expect(wrapper.vm.getParameterValue(0, "key2", "value")).to.equal("value");
                expect(wrapper.vm.getParameterValue(undefined, "key2", "value")).to.equal("value");
                expect(wrapper.vm.getParameterValue(true, "key2", "value")).to.equal("value");
                expect(wrapper.vm.getParameterValue([], "key2", "value")).to.equal("value");
                expect(wrapper.vm.getParameterValue({}, "key2", "value")).to.equal("value");
                expect(wrapper.vm.getParameterValue("key1", null, "value")).to.equal("value");
                expect(wrapper.vm.getParameterValue("key1", 0, "value")).to.equal("value");
                expect(wrapper.vm.getParameterValue("key1", undefined, "value")).to.equal("value");
                expect(wrapper.vm.getParameterValue("key1", true, "value")).to.equal("value");
                expect(wrapper.vm.getParameterValue("key1", [], "value")).to.equal("value");
                expect(wrapper.vm.getParameterValue("key1", {}, "value")).to.equal("value");
            });

            it("should return default value if there are no set value according to the key", () => {
                const wrapper = factory.getShallowMount();

                expect(wrapper.vm.getParameterValue("key1", "key2", "value")).to.equal("value");
            });

            it("should return the value according to the key", async () => {
                const wrapper = factory.getShallowMount(),
                    parameterValue = {},
                    key = "key1-key2";

                parameterValue[key] = "result";

                await wrapper.setData({parameterValue: parameterValue});
                expect(wrapper.vm.getParameterValue("key1", "key2", "value")).to.equal("result");
            });
        });

        describe("setParameterValue", () => {
            it("should not set value if the keys are not string", async () => {
                const wrapper = factory.getShallowMount();

                await wrapper.setData({parameterValue: {}});

                await wrapper.vm.setParameterValue(null, "key2", "value");
                expect(wrapper.vm.parameterValue).to.deep.equal({});
                await wrapper.vm.setParameterValue(0, "key2", "value");
                expect(wrapper.vm.parameterValue).to.deep.equal({});
                await wrapper.vm.setParameterValue(undefined, "key2", "value");
                expect(wrapper.vm.parameterValue).to.deep.equal({});
                await wrapper.vm.setParameterValue(true, "key2", "value");
                expect(wrapper.vm.parameterValue).to.deep.equal({});
                await wrapper.vm.setParameterValue([], "key2", "value");
                expect(wrapper.vm.parameterValue).to.deep.equal({});
                await wrapper.vm.setParameterValue({}, "key2", "value");
                expect(wrapper.vm.parameterValue).to.deep.equal({});
            });

            it("should set value", async () => {
                const wrapper = factory.getShallowMount();

                await wrapper.setData({parameterValue: {}});

                await wrapper.vm.setParameterValue("key1", "key2", "value");
                expect(wrapper.vm.parameterValue["key1-key2"]).to.equal("value");
            });
        });
    });
});
