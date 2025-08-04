import {config, mount, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import SimulationParameter from "../../../../components/Simulation/SimulationParameter.vue";
import sinon from "sinon";
import axios from "axios";
import getOAFFeature from "../../../../../../src/shared/js/api/oaf/getOAFFeature";

config.global.mocks.$t = key => key;

afterEach(() => {
    sinon.restore();
});

describe("addons/SimulationTool/components/Simulation/SimulationParameter.vue", () => {
    let consoleWarnSpy, store;

    const factory = {
        getShallowMount: () => {
            return shallowMount(SimulationParameter, {
                data () {
                    return {
                        currentSimulationId: "simulationId",
                        requestBody: {inputs: {}}
                    };
                },
                global: {
                    plugins: [store]
                }
            });
        },
        getMount: () => {
            return mount(SimulationParameter, {
                data () {
                    return {
                        currentSimulationId: "simulationId",
                        requestBody: {inputs: {}}
                    };
                },
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
                            actions: {
                                addFile: () => sinon.stub(),
                                jobStatusChanged: () => sinon.stub(),
                                updateFeatures: () => sinon.stub(),
                                zoomToFeature: () => sinon.stub()
                            },
                            getters: {
                                currentPlanningScenarioId: () => "planningScenarioId",
                                planningScenarios: () => [
                                    {
                                        id: "planningScenarioId",
                                        inputs: {}
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
                                setMode: sinon.stub(),
                                setCurrentPlanningScenarioId: sinon.stub(),
                                setSimulationIdForResults: sinon.stub()
                            }
                        },
                        ResizeHandle: {
                            namespaced: true,
                            getters: {
                                mainMenuWidth: () => 800,
                                secondaryMenuWidth: () => 800
                            }
                        },
                        Login: {
                            namespaced: true,
                            getters: {
                                accessToken: () => "accessToken"
                            }
                        },
                        Alerting: {
                            namespaced: true,
                            actions: {
                                addSingleAlert: () => sinon.stub()
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

        it("should render FlatButton to start a simulation", () => {
            const wrapper = factory.getMount();

            expect(wrapper.find("#startSimulation").exists()).to.be.true;
        });

        it("should render disabled FlatButton to start a simulation", async () => {
            const wrapper = factory.getMount();

            await wrapper.setData({
                oafLoadingStates: {
                    "key": true
                }
            });
            expect(wrapper.find("#startSimulation").attributes()).have.property("disabled");
        });
    });

    describe("Computed Properties", () => {
        it("outputOptions", async () => {
            const wrapper = factory.getMount();

            await wrapper.setData({
                processDescriptions: [
                    {outputs: {o1: {}, o2: {}}},
                    {outputs: {o2: {}, o3: {}}}
                ]
            });

            expect(wrapper.vm.outputOptions).to.deep.equal(
                [{code: "o2", name: "o2"}]
            );
        });

        it("should return the correct value for 'objectTypeInputs'", async () => {
            const wrapper = factory.getMount();

            await wrapper.setData({
                processDescriptions: [{
                    inputs: {
                        objectType: {schema: {type: "object"}},
                        stringType: {schema: {type: "string"}},
                        otherType: {schema: {type: "geojson"}}
                    },
                    outputs: {}
                }]
            });

            expect(wrapper.vm.nestedInputs).to.deep.equal({
                objectType: {schema: {type: "object"}}
            });
        });

        it("should return the correct value for 'stringTypeInputs'", async () => {
            const wrapper = factory.getMount();

            await wrapper.setData({
                processDescriptions: [{
                    inputs: {
                        objectType: {schema: {type: "object"}},
                        stringType: {schema: {type: "string"}},
                        otherType: {schema: {type: "geojson"}}
                    },
                    outputs: {}
                }]
            });

            expect(wrapper.vm.flatInputs).to.deep.equal({
                stringType: {schema: {type: "string"}}
            });
        });

        it("should return the correct value for 'isSomeOafLoading'", async () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.vm.isSomeOafLoading).to.be.false;
            await wrapper.setData({
                oafLoadingStates: {
                    "key": true
                }
            });
            expect(wrapper.vm.isSomeOafLoading).to.be.true;
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
        describe("getRequestBodyInputByKey", () => {
            it("should return default value if the keys are not string", () => {
                const wrapper = factory.getMount();

                expect(wrapper.vm.getRequestBodyInputByKey(null, "key2", "value")).to.equal("value");
                expect(wrapper.vm.getRequestBodyInputByKey(0, "key2", "value")).to.equal("value");
                expect(wrapper.vm.getRequestBodyInputByKey(undefined, "key2", "value")).to.equal("value");
                expect(wrapper.vm.getRequestBodyInputByKey(true, "key2", "value")).to.equal("value");
                expect(wrapper.vm.getRequestBodyInputByKey([], "key2", "value")).to.equal("value");
                expect(wrapper.vm.getRequestBodyInputByKey({}, "key2", "value")).to.equal("value");
                expect(wrapper.vm.getRequestBodyInputByKey("key1", null, "value")).to.equal("value");
                expect(wrapper.vm.getRequestBodyInputByKey("key1", 0, "value")).to.equal("value");
                expect(wrapper.vm.getRequestBodyInputByKey("key1", undefined, "value")).to.equal("value");
                expect(wrapper.vm.getRequestBodyInputByKey("key1", true, "value")).to.equal("value");
                expect(wrapper.vm.getRequestBodyInputByKey("key1", [], "value")).to.equal("value");
                expect(wrapper.vm.getRequestBodyInputByKey("key1", {}, "value")).to.equal("value");
            });

            it("should return default value if there are no set value according to the key", () => {
                const wrapper = factory.getMount();

                expect(wrapper.vm.getRequestBodyInputByKey("key1", "key2", "value")).to.equal("value");
            });

            it("should return the value according to the key", async () => {
                const wrapper = factory.getMount(),
                    inputs = {
                        "key1": {
                            "key2": "result"
                        }
                    };

                await wrapper.setData({requestBodies: [{inputs: inputs}]});
                expect(wrapper.vm.getRequestBodyInputByKey("key1", "key2", "value")).to.equal("result");
            });

            it("should return the input object if propertyKey is an empty string", async () => {
                const wrapper = factory.getMount(),
                    inputs = {
                        "key1": "result"
                    };

                await wrapper.setData({requestBodies: [{inputs: inputs}]});
                expect(wrapper.vm.getRequestBodyInputByKey("key1", "", "value")).to.equal("result");
            });
        });

        describe("removeEmptyCollections", () => {
            it("should remove empty collections from the requestBody", () => {
                const wrapper = factory.getShallowMount(),
                    oldRequestBodies = [{
                        inputs: {
                            emptyCollection: {type: "FeatureCollection", features: []},
                            nonEmptyCollection: {type: "FeatureCollection", features: [{}]},
                            differentInputType: "someValue"
                        }
                    }],
                    expectedRequestBodies = [{
                        inputs: {
                            nonEmptyCollection: {type: "FeatureCollection", features: [{}]},
                            differentInputType: "someValue"
                        }
                    }],
                    result = wrapper.vm.removeEmptyCollections(oldRequestBodies);

                expect(result).to.deep.equal(expectedRequestBodies);
                expect(oldRequestBodies).to.deep.equal(expectedRequestBodies);
            });
        });

        describe("setRequestBodyInput", () => {
            it("should not set value if the keys are not string", async () => {
                const wrapper = factory.getMount();

                await wrapper.setData({requestBodies: [{inputs: {}}]});

                await wrapper.vm.setRequestBodyInput(null, "key2", "value");
                expect(wrapper.vm.requestBodies[0].inputs).to.deep.equal({});
                await wrapper.vm.setRequestBodyInput(0, "key2", "value");
                expect(wrapper.vm.requestBodies[0].inputs).to.deep.equal({});
                await wrapper.vm.setRequestBodyInput(undefined, "key2", "value");
                expect(wrapper.vm.requestBodies[0].inputs).to.deep.equal({});
                await wrapper.vm.setRequestBodyInput(true, "key2", "value");
                expect(wrapper.vm.requestBodies[0].inputs).to.deep.equal({});
                await wrapper.vm.setRequestBodyInput([], "key2", "value");
                expect(wrapper.vm.requestBodies[0].inputs).to.deep.equal({});
                await wrapper.vm.setRequestBodyInput({}, "key2", "value");
                expect(wrapper.vm.requestBodies[0].inputs).to.deep.equal({});
            });

            it("should set value with only one level key", async () => {
                const wrapper = factory.getMount();

                await wrapper.setData({
                    processDescriptions: [{inputs: {key1: {}}}],
                    requestBodies: [{inputs: {}}]
                });
                await wrapper.vm.$nextTick();

                await wrapper.vm.setRequestBodyInput("key1", "", "value");
                await wrapper.vm.$nextTick();

                expect(wrapper.vm.requestBodies[0].inputs).to.deep.equal({
                    key1: "value"
                });
            });

            it("should set value with only two level key", async () => {
                const wrapper = factory.getMount();

                await wrapper.setData({
                    processDescriptions: [{inputs: {key1: {key2: {}}}}],
                    requestBodies: [{inputs: {}}]
                });
                await wrapper.vm.$nextTick();

                await wrapper.vm.setRequestBodyInput("key1", "key2", "value");
                await wrapper.vm.$nextTick();

                expect(wrapper.vm.requestBodies[0].inputs).to.deep.equal({
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
                    processDescriptions: [{
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
                    }]
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
                    processDescriptions: [{
                        inputs: {
                            input1: {schema: {type: "string"}, title: "Input 1"}
                        }
                    }]
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
                    processDescriptions: [{
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
                    }]
                });

                expect(wrapper.vm.getPrimaryTypeInputs()).to.deep.equal(expected);
            });
        });

        describe("getOptionalBBOXUrlInputs", () => {
            it("should return an empty object if processDescription.inputs is not an object", () => {
                const wrapper = factory.getShallowMount();

                wrapper.setData({processDescription: {inputs: null}});
                expect(wrapper.vm.getOptionalBBOXUrlInputs()).to.deep.equal({});

                wrapper.setData({processDescription: {inputs: undefined}});
                expect(wrapper.vm.getOptionalBBOXUrlInputs()).to.deep.equal({});

                wrapper.setData({processDescription: {inputs: "notAnObject"}});
                expect(wrapper.vm.getOptionalBBOXUrlInputs()).to.deep.equal({});
            });

            it("should return an empty object if no inputs match the criteria", () => {
                store = getStore({
                    id: "simulationId",
                    inputs: {
                        input1: {source: {type: "other_type"}},
                        input2: {source: {type: "optional_bbox_url"}}
                    }
                });
                const wrapper = factory.getShallowMount();

                wrapper.setData({
                    processDescription: {
                        inputs: {
                            input1: {schema: {type: "string", format: "text"}},
                            input2: {schema: {type: "object"}}
                        }
                    }
                });

                expect(wrapper.vm.getOptionalBBOXUrlInputs()).to.deep.equal({});
            });

            it("should return the correct inputs matching the criteria", () => {
                store = getStore({
                    id: "simulationId",
                    inputs: {
                        input1: {source: {type: "optional_bbox_url", url: "http://example.com/input1"}},
                        input2: {source: {type: "optional_bbox_url", url: "http://example.com/input2"}}
                    }
                });
                const wrapper = factory.getShallowMount();

                wrapper.setData({
                    processDescriptions: [{
                        inputs: {
                            input1: {schema: {type: "string", format: "uri"}},
                            input2: {schema: {type: "string", format: "uri"}}
                        }
                    }]
                });

                expect(wrapper.vm.getOptionalBBOXUrlInputs()).to.deep.equal({
                    input1: "http://example.com/input1",
                    input2: "http://example.com/input2"
                });
            });

            it("should handle mixed valid and invalid inputs", () => {
                store = getStore({
                    id: "simulationId",
                    inputs: {
                        input1: {source: {type: "optional_bbox_url", url: "http://example.com/input1"}},
                        input2: {source: {type: "other_type", url: "http://example.com/input2"}},
                        input3: {source: {type: "optional_bbox_url", url: "http://example.com/input3"}}
                    }
                });
                const wrapper = factory.getShallowMount();

                wrapper.setData({
                    processDescriptions: [{
                        inputs: {
                            input1: {schema: {type: "string", format: "uri"}},
                            input2: {schema: {type: "string", format: "text"}},
                            input3: {schema: {type: "string", format: "uri"}}
                        }
                    }]
                });

                expect(wrapper.vm.getOptionalBBOXUrlInputs()).to.deep.equal({
                    input1: "http://example.com/input1",
                    input3: "http://example.com/input3"
                });
            });
        });

        describe("toggleOptionalBBOXUrlInputs", () => {
            it("should set input and set the correct value", async () => {
                const wrapper = factory.getShallowMount(),
                    mockBBOXUrl = "http://example.com/bbox/extent/500x500.tif?coord_crs=epsg:25832";

                sinon.stub(wrapper.vm, "getOptionalBBOXUrlInputs").returns({
                    input1: "http://example.com/bbox"
                });
                sinon.stub(wrapper.vm, "getBBOXGeometry").returns({
                    getExtent: () => "extent"
                });

                await wrapper.setData({
                    processDescriptions: [{inputs: {input1: {}}}],
                    requestBodies: [{inputs: {}}],
                    currentPlanningScenario: {}
                });

                wrapper.vm.toggleOptionalBBOXUrlInputs("input1", {target: {checked: true}});

                expect(wrapper.vm.requestBodies[0].inputs.input1).to.equal(mockBBOXUrl);
            });
            it("should set the input to undefined if the checkbox is unchecked", async () => {
                const wrapper = factory.getShallowMount();

                await wrapper.setData({
                    processDescriptions: [{inputs: {input1: {}}}],
                    requestBodies: [{inputs: {}}]
                });
                wrapper.vm.toggleOptionalBBOXUrlInputs("input1");
                expect(wrapper.vm.requestBodies[0].inputs.input1).to.be.undefined;
            });
            it("should delete the property from requestBody if the checkbox is unchecked and it existed already", async () => {
                const wrapper = factory.getShallowMount();

                await wrapper.setData({
                    processDescriptions: [{inputs: {input1: {}}}],
                    requestBodies: [{inputs: {}}]
                });
                wrapper.vm.toggleOptionalBBOXUrlInputs("input1", {target: {checked: false}});

                expect(wrapper.vm.requestBodies[0].inputs.input1).to.be.undefined;
            });
        });

        describe("onOafSwitchChange", () => {
            it("should request the features if they do not exist in the scenario", async () => {
                const wrapper = factory.getMount(),
                    getStub = sinon.stub(getOAFFeature, "getOAFFeatureGet");

                sinon.stub(getOAFFeature, "getOAFGeometryFilter");

                await wrapper.vm.onOafSwitchChange({target: {checked: true}}, "anOafInput");

                expect(getStub.calledOnce).to.be.true;
            });

            it("should not request the features if they exist in the scenario", async () => {
                const wrapper = factory.getMount(),
                    getStub = sinon.stub(getOAFFeature, "getOAFFeatureGet");

                wrapper.vm.currentPlanningScenario.inputs.anOafInput = {};

                await wrapper.vm.onOafSwitchChange({target: {checked: true}}, "anOafInput");

                expect(getStub.called).to.be.false;
            });

            it("should set the input in the requestBody", async () => {
                const wrapper = factory.getMount();

                wrapper.vm.currentPlanningScenario.inputs.anOafInput = "aValue";
                await wrapper.setData({
                    processDescriptions: [{inputs: {anOafInput: {}}}],
                    requestBodies: [{inputs: {}}]
                });
                await wrapper.vm.onOafSwitchChange({target: {checked: true}}, "anOafInput");

                expect(wrapper.vm.requestBodies[0].inputs.anOafInput).to.deep.equal("aValue");
            });

            it("should remove the input from the requestBody if the switch is unchecked", async () => {
                const wrapper = factory.getMount();

                wrapper.vm.currentPlanningScenario.inputs.anOafInput = "aValue";
                await wrapper.setData({
                    processDescriptions: [{inputs: {anOafInput: {}}}],
                    requestBodies: [{inputs: {}}]
                });
                await wrapper.vm.onOafSwitchChange({target: {checked: false}}, "anOafInput");

                expect(wrapper.vm.requestBody.inputs.anOafInput).to.be.undefined;
            });
        });
    });
});
