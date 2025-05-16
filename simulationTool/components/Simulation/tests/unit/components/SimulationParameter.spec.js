import {config, mount, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import SimulationParameter from "../../../SimulationParameter.vue";
import sinon from "sinon";
import axios from "axios";
import getOAFFeature from "../../../../../../../src/shared/js/api/oaf/getOAFFeature";

config.global.mocks.$t = key => key;

describe("addons/SimulationTool/components/Simulation/SimulationParameter.vue", () => {
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

    /**
     * Creates a Vuex store with a mock state and getters for the SimulationTool module.
     */
    function getStore (simulations) {
        return createStore({
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
                                        inputs: {},
                                        simulationId: "simulationId"
                                    }
                                ],
                                previousComponentOfSimulation: sinon.stub(),
                                simulations: () => [
                                    simulations ||
                                    {
                                        id: "simulationId",
                                        inputs: {
                                            input1: {
                                                menu: "primary",
                                                primaryProperties: ["prop1"]
                                            },
                                            input2: {menu: "primary"},
                                            anOafInput: {source: {}}
                                        }
                                    }
                                ]
                            },
                            mutations: {
                                setCurrentPlanningComponent: sinon.stub(),
                                setMode: sinon.stub()
                            }
                        },
                        ResizeHandle: {
                            namespaced: true,
                            getters: {
                                mainMenuWidth: () => 800,
                                secondaryMenuWidth: () => 800
                            }
                        }
                    }
                }
            }
        });
    }

    beforeEach(() => {
        consoleWarnSpy = sinon.spy();
        store = getStore();

        sinon.stub(axios, "get").resolves({data: {}});
        sinon.stub(console, "warn").callsFake(consoleWarnSpy);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = factory.getMount();

            expect(wrapper.exists()).to.be.true;
        });

        it("should render SectionHeader component", () => {
            const wrapper = factory.getMount();

            expect(wrapper.findComponent({name: "SectionHeader"}).exists()).to.be.true;
        });

        it("should render FlatButton component", () => {
            const wrapper = factory.getMount();

            expect(wrapper.findComponent({name: "FlatButton"}).exists()).to.be.true;
        });

        it("should render FileUpload component", () => {
            const wrapper = factory.getMount();

            expect(wrapper.findComponent({name: "FileUpload"}).exists()).to.be.true;
        });
    });

    describe("Computed Properties", () => {
        it("should return an array of Objects with code and name property for select options", async () => {
            const wrapper = factory.getMount(),
                expected = [
                    {
                        "code": "noise_day",
                        "name": "Noise isosurface day"
                    },
                    {
                        "code": "noise_den",
                        "name": "Noise isosurface day-evening-night"
                    },
                    {
                        "code": "noise_evening",
                        "name": "Noise isosurface evening"
                    },
                    {
                        "code": "noise_night",
                        "name": "Noise isosurface night"
                    }
                ];

            await wrapper.setData({
                processDescription: {
                    outputs: {
                        "noise_day": {
                            "title": "Noise isosurface day"
                        },
                        "noise_den": {
                            "title": "Noise isosurface day-evening-night"
                        },
                        "noise_evening": {
                            "title": "Noise isosurface evening"
                        },
                        "noise_night": {
                            "title": "Noise isosurface night"
                        }
                    }
                }
            });

            expect(wrapper.vm.outputOptions).to.deep.equal(expected);
        });

        it("should return the correct value for 'objectTypeInputs'", async () => {
            const wrapper = factory.getMount();

            await wrapper.setData({
                processDescription: {
                    inputs: {
                        objectType: {schema: {type: "object"}},
                        stringType: {schema: {type: "string"}},
                        otherType: {schema: {type: "geojson"}}
                    },
                    outputs: {}
                }
            });

            expect(wrapper.vm.objectTypeInputs).to.deep.equal({
                objectType: {schema: {type: "object"}}
            });
        });

        it("should return the correct value for 'stringTypeInputs'", async () => {
            const wrapper = factory.getMount();

            await wrapper.setData({
                processDescription: {
                    inputs: {
                        objectType: {schema: {type: "object"}},
                        stringType: {schema: {type: "string"}},
                        otherType: {schema: {type: "geojson"}}
                    },
                    outputs: {}
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
        describe("getInputsValue", () => {
            it("should return default value if the keys are not string", () => {
                const wrapper = factory.getMount();

                expect(wrapper.vm.getInputsValue(null, "key2", "value")).to.equal("value");
                expect(wrapper.vm.getInputsValue(0, "key2", "value")).to.equal("value");
                expect(wrapper.vm.getInputsValue(undefined, "key2", "value")).to.equal("value");
                expect(wrapper.vm.getInputsValue(true, "key2", "value")).to.equal("value");
                expect(wrapper.vm.getInputsValue([], "key2", "value")).to.equal("value");
                expect(wrapper.vm.getInputsValue({}, "key2", "value")).to.equal("value");
                expect(wrapper.vm.getInputsValue("key1", null, "value")).to.equal("value");
                expect(wrapper.vm.getInputsValue("key1", 0, "value")).to.equal("value");
                expect(wrapper.vm.getInputsValue("key1", undefined, "value")).to.equal("value");
                expect(wrapper.vm.getInputsValue("key1", true, "value")).to.equal("value");
                expect(wrapper.vm.getInputsValue("key1", [], "value")).to.equal("value");
                expect(wrapper.vm.getInputsValue("key1", {}, "value")).to.equal("value");
            });

            it("should return default value if there are no set value according to the key", () => {
                const wrapper = factory.getMount();

                expect(wrapper.vm.getInputsValue("key1", "key2", "value")).to.equal("value");
            });

            it("should return the value according to the key", async () => {
                const wrapper = factory.getMount(),
                    inputsValue = {
                        "key1": {
                            "key2": "result"
                        }
                    };

                await wrapper.setData({inputsValue: inputsValue});
                expect(wrapper.vm.getInputsValue("key1", "key2", "value")).to.equal("result");
            });
        });

        describe("setInputsValue", () => {
            it("should not set value if the keys are not string", async () => {
                const wrapper = factory.getMount();

                await wrapper.setData({inputsValue: {}});

                await wrapper.vm.setInputsValue(null, "key2", "value");
                expect(wrapper.vm.inputsValue).to.deep.equal({});
                await wrapper.vm.setInputsValue(0, "key2", "value");
                expect(wrapper.vm.inputsValue).to.deep.equal({});
                await wrapper.vm.setInputsValue(undefined, "key2", "value");
                expect(wrapper.vm.inputsValue).to.deep.equal({});
                await wrapper.vm.setInputsValue(true, "key2", "value");
                expect(wrapper.vm.inputsValue).to.deep.equal({});
                await wrapper.vm.setInputsValue([], "key2", "value");
                expect(wrapper.vm.inputsValue).to.deep.equal({});
                await wrapper.vm.setInputsValue({}, "key2", "value");
                expect(wrapper.vm.inputsValue).to.deep.equal({});
            });

            it("should set value with only one level key", async () => {
                const wrapper = factory.getMount();

                await wrapper.setData({inputsValue: {}});
                await wrapper.vm.$nextTick();

                await wrapper.vm.setInputsValue("key1", "", "value");
                await wrapper.vm.$nextTick();

                expect(wrapper.vm.inputsValue).to.deep.equal({
                    key1: "value"
                });
            });

            it("should set value with only two level key", async () => {
                const wrapper = factory.getMount();

                await wrapper.setData({inputsValue: {}});
                await wrapper.vm.$nextTick();

                await wrapper.vm.setInputsValue("key1", "key2", "value");
                await wrapper.vm.$nextTick();

                expect(wrapper.vm.inputsValue).to.deep.equal({
                    key1: {
                        key2: "value"
                    }
                });
            });
        });

        describe("getPrimaryTypeInputs", () => {
            it("should return an empty object if processDescription.inputs is not an object", async () => {
                const wrapper = factory.getShallowMount();

                await wrapper.vm.$nextTick();
                wrapper.setData({processDescription: {inputs: null}});
                expect(wrapper.vm.getPrimaryTypeInputs()).to.deep.equal({});

                wrapper.setData({processDescription: {inputs: undefined}});
                expect(wrapper.vm.getPrimaryTypeInputs()).to.deep.equal({});

                wrapper.setData({processDescription: {inputs: "notAnObject"}});
                expect(wrapper.vm.getPrimaryTypeInputs()).to.deep.equal({});
            });

            it("should return an empty object if no inputs have 'menu' set to 'primary'", async () => {
                store = getStore({
                    id: "simulationId",
                    inputs: {
                        input1: {menu: "secondary"},
                        input2: {menu: "secondary"}
                    }
                });
                const wrapper = factory.getShallowMount();

                await wrapper.vm.$nextTick();
                wrapper.setData({
                    processDescription: {
                        inputs: {
                            input1: {schema: {type: "object"}},
                            input2: {schema: {type: "string"}}
                        }
                    }
                });

                expect(wrapper.vm.getPrimaryTypeInputs()).to.deep.equal({});
            });

            it("should extract properties of type 'object' with primary properties", async () => {
                const wrapper = factory.getShallowMount(),
                    expected = {
                        prop1: {
                            type: "string",
                            inputKey: "input1"
                        }
                    };

                await wrapper.vm.$nextTick();

                await wrapper.setData({
                    processDescription: {
                        inputs: {
                            input1: {
                                schema: {
                                    type: "object",
                                    properties: {
                                        prop1: {type: "string"},
                                        prop2: {type: "number"}
                                    }
                                }
                            }
                        }
                    }
                });

                expect(wrapper.vm.getPrimaryTypeInputs()).to.deep.equal(expected);
            });

            it("should extract inputs of type 'string'", () => {
                const wrapper = factory.getMount(),
                    expected = {
                        input1: {
                            type: "string",
                            inputKey: "input1"
                        }
                    };

                wrapper.setData({
                    processDescription: {
                        inputs: {
                            input1: {schema: {type: "string"}, title: "Input 1"}
                        }
                    }
                });

                expect(wrapper.vm.getPrimaryTypeInputs()).to.deep.equal(expected);
            });

            it("should handle a mix of object and string inputs", () => {
                const wrapper = factory.getMount(),
                    expected = {
                        prop1: {
                            type: "string",
                            inputKey: "input1"
                        },
                        input2: {
                            type: "string",
                            inputKey: "input2"
                        }
                    };

                wrapper.setData({
                    processDescription: {
                        inputs: {
                            input1: {
                                schema: {
                                    type: "object",
                                    properties: {
                                        prop1: {type: "string"},
                                        prop2: {type: "number"}
                                    }
                                }
                            },
                            input2: {schema: {type: "string"}, title: "Input 2"}
                        }
                    }
                });

                expect(wrapper.vm.getPrimaryTypeInputs()).to.deep.equal(expected);
            });
        });

        describe("onOafSwitchChange", () => {
            it("should request the features if they do not exist in the scenario", async () => {
                const wrapper = factory.getMount(),
                    getStub = sinon.stub(getOAFFeature, "getOAFFeatureGet");

                sinon.stub(getOAFFeature, "getOAFGeometryFilter");

                wrapper.vm.onOafSwitchChange({target: {checked: true}}, "anOafInput");

                expect(getStub.calledOnce).to.be.true;
            });

            it("should not request the features if they exist in the scenario", async () => {
                const wrapper = factory.getMount(),
                    getStub = sinon.stub(getOAFFeature, "getOAFFeatureGet");

                wrapper.vm.currentPlanningScenario.inputs.anOafInput = {};

                wrapper.vm.onOafSwitchChange({target: {checked: true}}, "anOafInput");

                expect(getStub.called).to.be.false;
            });

            it("should set the input in the requestBody", async () => {
                const wrapper = factory.getMount();

                wrapper.vm.requestBody.inputs = {};
                wrapper.vm.currentPlanningScenario.inputs.anOafInput = "aValue";
                wrapper.vm.onOafSwitchChange({target: {checked: true}}, "anOafInput");

                expect(wrapper.vm.requestBody.inputs.anOafInput).to.deep.equal("aValue");
            });

            it("should remove the input from the requestBody if the switch is unchecked", async () => {
                const wrapper = factory.getMount();

                wrapper.vm.requestBody.inputs = {anOafInput: "aValue"};
                wrapper.vm.currentPlanningScenario.inputs.anOafInput = "aValue";
                wrapper.vm.onOafSwitchChange({target: {checked: false}}, "anOafInput");

                expect(wrapper.vm.requestBody.inputs.anOafInput).to.be.undefined;
            });
        });
    });
});
