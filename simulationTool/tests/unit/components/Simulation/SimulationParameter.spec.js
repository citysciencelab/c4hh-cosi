
import {config, mount, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import SimulationParameter from "../../../../components/Simulation/SimulationParameter.vue";
import sinon from "sinon";
import axios from "axios";
import getOAFFeature from "../../../../../../src/shared/js/api/oaf/getOAFFeature.js";

config.global.mocks.$t = key => key;

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


    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = factory.getMount();

            expect(wrapper.exists()).to.be.true;
        });

        it("should exist", () => {
            const wrapper = factory.getMount({
                props: {
                    simulation: {
                        id: "simulationId",
                        inputs: {},
                        processes: []
                    }
                }
            });

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

            const wrapper = factory.getMount({
                data () {
                    return {
                        processHandlers: []
                    };
                }
            });

            wrapper.vm.processDescriptions = [
                {outputs: {o1: {}, o2: {}}},
                {outputs: {o2: {}, o3: {}}}
            ];

            expect(wrapper.vm.outputOptions).to.deep.equal([
                {code: "o2", name: "o2"}
            ]);
        });
        it("should return the correct value for 'objectTypeInputs'", async () => {
            const wrapper = factory.getMount({
                props: {
                    simulation: {
                        id: "simulationId",
                        inputs: {
                            objectType: {menu: "primary"},
                            stringType: {menu: "primary"},
                            otherType: {menu: "primary"}
                        }
                    }
                }
            });

            wrapper.setData({
                processDescriptions: [{
                    inputs: {
                        objectType: {schema: {type: "object"}},
                        stringType: {schema: {type: "string"}},
                        otherType: {schema: {type: "geojson"}}
                    },
                    outputs: {}
                }]
            });

            expect(wrapper.vm.combinedInputs).to.deep.equal({
                objectType: {schema: {type: "object"}},
                stringType: {schema: {type: "string"}},
                otherType: {schema: {type: "geojson"}}
            });
        });
        it("should return the correct value for 'stringTypeInputs'", () => {
            const wrapper = factory.getMount();

            wrapper.vm.nestedInputs = {};
            wrapper.vm.flatInputs = {};

            Object.defineProperty(wrapper.vm, "simulation", {
                value: {
                    id: "simulationId",
                    inputs: {
                        objectType: {menu: "primary"},
                        stringType: {menu: "primary"},
                        otherType: {menu: "primary"}
                    }
                },
                configurable: true
            });

            wrapper.vm.$options.watch.combinedInputs.call(wrapper.vm, {
                objectType: {schema: {type: "object"}},
                stringType: {schema: {type: "string"}},
                otherType: {schema: {type: "geojson"}}
            });

            expect(wrapper.vm.flatInputs).to.deep.equal({
                stringType: {schema: {type: "string"}}
            });

            expect(wrapper.vm.nestedInputs).to.deep.equal({
                objectType: {schema: {type: "object"}}
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
                expect(wrapper.vm.getRequestBodyInputByKey("key1", "key2", "result")).to.equal("result");
            });
            it("should return the input object if propertyKey is an empty string", () => {
                const wrapper = factory.getMount(),
                    inputs = {
                        key1: {
                            value: "result",
                            type: "string"
                        }
                    };

                wrapper.vm.requestBodies = [{inputs}];

                expect(wrapper.vm.getRequestBodyInputByKey("key1", "", "val")).to.deep.equal({
                    value: "result",
                    type: "string"
                });
            });
            it("should return the input value if propertyKey is an empty string", () => {
                const wrapper = factory.getMount(),
                    inputs = {
                        key1: "result"
                    };

                wrapper.vm.requestBodies = [{inputs}];

                expect(wrapper.vm.getRequestBodyInputByKey("key1", "", "val")).to.equal("result");
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
            it("should not set value if the key is null", async () => {
                const wrapper = factory.getMount();

                wrapper.vm.requestBodies = [{inputs: {}}];

                await wrapper.vm.setRequestBodyInput(null, "key2", "value");
                expect(wrapper.vm.requestBodies[0].inputs).to.deep.equal({});
            });
            it("should not set value if the key is 0", async () => {
                const wrapper = factory.getMount();

                wrapper.vm.requestBodies = [{inputs: {}}];

                await wrapper.vm.setRequestBodyInput(0, "key2", "value");
                expect(wrapper.vm.requestBodies[0].inputs).to.deep.equal({});
            });
            it("should not set value if the key is undefined", async () => {
                const wrapper = factory.getMount();

                wrapper.vm.requestBodies = [{inputs: {}}];

                await wrapper.vm.setRequestBodyInput(undefined, "key2", "value");
                expect(wrapper.vm.requestBodies[0].inputs).to.deep.equal({});
            });
            it("should not set value if the key is true", async () => {
                const wrapper = factory.getMount();

                wrapper.vm.requestBodies = [{inputs: {}}];

                await wrapper.vm.setRequestBodyInput(true, "key2", "value");
                expect(wrapper.vm.requestBodies[0].inputs).to.deep.equal({});
            });
            it("should not set value if the key is []", async () => {
                const wrapper = factory.getMount();

                wrapper.vm.requestBodies = [{inputs: {}}];

                await wrapper.vm.setRequestBodyInput([], "key2", "value");
                expect(wrapper.vm.requestBodies[0].inputs).to.deep.equal({});
            });
            it("should not set value if the key is {}", async () => {
                const wrapper = factory.getMount();

                wrapper.vm.requestBodies = [{inputs: {}}];

                await wrapper.vm.setRequestBodyInput({}, "key2", "value");
                expect(wrapper.vm.requestBodies[0].inputs).to.deep.equal({});
            });

            it("should set value with only one level key", async () => {
                const wrapper = factory.getMount();

                await wrapper.setData({
                    processDescriptions: [{inputs: {key1: {}}}],
                    requestBodies: [{inputs: {}}]
                });
                wrapper.vm.processDescriptions = [{inputs: {key1: {}}}];
                wrapper.vm.requestBodies = [{inputs: {}}];

                await wrapper.vm.setRequestBodyInput("key1", "", "value");

                expect(wrapper.vm.requestBodies[0].inputs).to.deep.equal({
                    key1: "value"
                });
            });

            it("should set value with only two level key", async () => {
                const wrapper = factory.getMount();

                wrapper.vm.processDescriptions = [{inputs: {key1: {key2: {}}}}];
                wrapper.vm.requestBodies = [{inputs: {}}];


                await wrapper.vm.setRequestBodyInput("key1", "key2", "value");

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
                            inputKey: "input1",
                            propertyKey: "prop1"
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
                            inputKey: "input1",
                            propertyKey: null,
                            default: undefined,
                            minimum: undefined,
                            maximum: undefined
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
                            inputKey: "input1",
                            propertyKey: "prop1"
                        },
                        input2: {
                            type: "string",
                            inputKey: "input2",
                            propertyKey: null,
                            default: undefined,
                            minimum: undefined,
                            maximum: undefined
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
            it("should call setRequestBodyInput with the correct bbox url when checkbox is checked", async () => {
                const wrapper = factory.getShallowMount();
                const spySetRequestBodyInput = sinon.spy(wrapper.vm, "setRequestBodyInput");

                sinon.stub(wrapper.vm, "getOptionalBBOXUrlInputs").returns({
                    input1: "http://example.com/bbox"
                });

                await wrapper.setData({
                    currentPlanningScenario: {
                        scenarioFeature: {
                            features: [{
                                properties: {id: "simulation-area"},
                                geometry: {type: "Polygon", coordinates: []}
                            }]
                        }
                    }
                });

                await wrapper.vm.toggleOptionalBBOXUrlInputs("input1", {target: {checked: true}});

                expect(spySetRequestBodyInput.calledOnce).to.be.true;

                const args = spySetRequestBodyInput.firstCall.args;

                expect(args[0]).to.equal("input1");
                expect(args[1]).to.equal("");
                expect(args[2]).to.include("http://example.com/bbox/");
                expect(args[2]).to.include("500x500.tif?coord_crs=epsg:25832");

                spySetRequestBodyInput.restore();
            });

            it("should call setRequestBodyInput with undefined if the checkbox is unchecked", async () => {
                const wrapper = factory.getShallowMount();
                const spySetRequestBodyInput = sinon.spy(wrapper.vm, "setRequestBodyInput");

                await wrapper.vm.toggleOptionalBBOXUrlInputs("input1", {target: {checked: false}});

                expect(spySetRequestBodyInput.calledOnce).to.be.true;

                expect(spySetRequestBodyInput.firstCall.args).to.deep.equal([
                    "input1",
                    "",
                    undefined
                ]);

                spySetRequestBodyInput.restore();
            });

            it("should call setRequestBodyInput with undefined if checkbox event is missing", async () => {
                const wrapper = factory.getShallowMount();
                const spySetRequestBodyInput = sinon.spy(wrapper.vm, "setRequestBodyInput");

                await wrapper.vm.toggleOptionalBBOXUrlInputs("input1");

                expect(spySetRequestBodyInput.calledOnce).to.be.true;

                expect(spySetRequestBodyInput.firstCall.args).to.deep.equal([
                    "input1",
                    "",
                    undefined
                ]);

                spySetRequestBodyInput.restore();
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
            it("should set a top-level input in the request body", () => {
                const wrapper = factory.getMount();

                wrapper.vm.processDescriptions = [
                    {inputs: {anInput: {}}}
                ];
                wrapper.vm.requestBodies = [
                    {inputs: {}}
                ];

                wrapper.vm.setRequestBodyInput("anInput", "", "aValue");

                expect(wrapper.vm.requestBodies[0].inputs.anInput).to.equal("aValue");
            });
            it("should set a nested property in the request body", () => {
                const wrapper = factory.getMount();

                wrapper.vm.processDescriptions = [
                    {inputs: {anInput: {}}}
                ];
                wrapper.vm.requestBodies = [
                    {inputs: {}}
                ];

                wrapper.vm.setRequestBodyInput("anInput", "aProperty", "aValue");

                expect(wrapper.vm.requestBodies[0].inputs.anInput).to.deep.equal({
                    aProperty: "aValue"
                });
            });
            it("should create a request body entry if it does not exist", () => {
                const wrapper = factory.getMount();

                wrapper.vm.processDescriptions = [
                    {inputs: {anInput: {}}}
                ];
                wrapper.vm.requestBodies = [];

                wrapper.vm.setRequestBodyInput("anInput", "", "aValue");

                expect(wrapper.vm.requestBodies[0]).to.deep.equal({
                    inputs: {
                        anInput: "aValue"
                    }
                });
            });
            it("should create inputs object if it does not exist", () => {
                const wrapper = factory.getMount();

                wrapper.vm.processDescriptions = [
                    {inputs: {anInput: {}}}
                ];
                wrapper.vm.requestBodies = [{}];

                wrapper.vm.setRequestBodyInput("anInput", "", "aValue");

                expect(wrapper.vm.requestBodies[0].inputs).to.deep.equal({
                    anInput: "aValue"
                });
            });
            it("should update only the value of a top-level enum input", () => {
                const wrapper = factory.getMount();

                wrapper.vm.processDescriptions = [
                    {inputs: {anInput: {}}}
                ];
                wrapper.vm.requestBodies = [{
                    inputs: {
                        anInput: {
                            value: "oldValue",
                            label: "Old Label"
                        }
                    }
                }];

                wrapper.vm.setRequestBodyInput("anInput", "", "newValue", true);

                expect(wrapper.vm.requestBodies[0].inputs.anInput).to.deep.equal({
                    value: "newValue",
                    label: "Old Label"
                });
            });
            it("should update only the value of a nested enum input", () => {
                const wrapper = factory.getMount();

                wrapper.vm.processDescriptions = [
                    {inputs: {anInput: {}}}
                ];
                wrapper.vm.requestBodies = [{
                    inputs: {
                        anInput: {
                            aProperty: {
                                value: "oldValue",
                                label: "Old Label"
                            }
                        }
                    }
                }];

                wrapper.vm.setRequestBodyInput("anInput", "aProperty", "newValue", true);

                expect(wrapper.vm.requestBodies[0].inputs.anInput.aProperty).to.deep.equal({
                    value: "newValue",
                    label: "Old Label"
                });
            });
            it("should only update request bodies for matching process descriptions", () => {
                const wrapper = factory.getMount();

                wrapper.vm.processDescriptions = [
                    {inputs: {otherInput: {}}},
                    {inputs: {anInput: {}}}
                ];
                wrapper.vm.requestBodies = [
                    {inputs: {}},
                    {inputs: {}}
                ];

                wrapper.vm.setRequestBodyInput("anInput", "", "aValue");

                expect(wrapper.vm.requestBodies[0].inputs).to.deep.equal({});
                expect(wrapper.vm.requestBodies[1].inputs).to.deep.equal({
                    anInput: "aValue"
                });
            });
            it("should pass OAF input to setRequestBodyInput when switch is enabled", async () => {
                const wrapper = factory.getMount(),
                    spySetRequestBodyInput = sinon.spy(wrapper.vm, "setRequestBodyInput");

                wrapper.vm.currentPlanningScenario.inputs.anOafInput = "aValue";

                await wrapper.vm.onOafSwitchChange({target: {checked: true}}, "anOafInput");

                expect(spySetRequestBodyInput.calledOnce).to.be.true;
                expect(spySetRequestBodyInput.firstCall.args).to.deep.equal([
                    "anOafInput",
                    "",
                    "aValue"
                ]);

                spySetRequestBodyInput.restore();
            });
            it("should pass OAF input to setRequestBodyInput", async () => {
                const wrapper = factory.getMount();
                const spySetRequestBodyInput = sinon.spy(wrapper.vm, "setRequestBodyInput");

                wrapper.vm.currentPlanningScenario.inputs.anOafInput = "aValue";

                await wrapper.vm.onOafSwitchChange({target: {checked: true}}, "anOafInput");

                expect(spySetRequestBodyInput.calledOnce).to.be.true;
                expect(spySetRequestBodyInput.firstCall.args).to.deep.equal([
                    "anOafInput",
                    "",
                    "aValue"
                ]);

                spySetRequestBodyInput.restore();
            });
            it("should set the input in the requestBody", () => {
                const wrapper = factory.getMount();

                wrapper.vm.processDescriptions = [{inputs: {anOafInput: {}}}];
                wrapper.vm.requestBodies = [{inputs: {}}];

                wrapper.vm.setRequestBodyInput("anOafInput", "", "aValue");

                expect(wrapper.vm.requestBodies[0].inputs.anOafInput).to.equal("aValue");
            });
            it("should call setRequestBodyInput with undefined when switch is unchecked", async () => {
                const wrapper = factory.getMount();
                const spySetRequestBodyInput = sinon.spy(wrapper.vm, "setRequestBodyInput");

                wrapper.vm.currentPlanningScenario.inputs.anOafInput = "aValue";

                await wrapper.vm.onOafSwitchChange({target: {checked: false}}, "anOafInput");

                expect(spySetRequestBodyInput.calledOnce).to.be.true;
                expect(spySetRequestBodyInput.firstCall.args).to.deep.equal([
                    "anOafInput",
                    "",
                    undefined
                ]);

                spySetRequestBodyInput.restore();
            });
            it("should remove the input from the requestBody", () => {
                const wrapper = factory.getMount();

                wrapper.vm.processDescriptions = [{inputs: {anOafInput: {}}}];
                wrapper.vm.requestBodies = [{
                    inputs: {
                        anOafInput: "aValue"
                    }
                }];

                wrapper.vm.setRequestBodyInput("anOafInput", "", undefined);

                expect(wrapper.vm.requestBodies[0].inputs.anOafInput).to.be.undefined;
            });
        });
    });
});
