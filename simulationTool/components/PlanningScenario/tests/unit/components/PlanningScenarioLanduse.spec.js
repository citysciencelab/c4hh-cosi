import {config, mount, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import getFeature from "../../../../../../../src/shared/js/api/oaf/getOAFFeature.js";
import PlanningScenarioLanduse from "../../../PlanningScenarioLanduse.vue";
import sinon from "sinon";
import layerCollection from "../../../../../../../src/core/layers/js/layerCollection.js";

config.global.mocks.$t = key => key;

describe("addons/SimulationTool/components/PlanningScenario/PlanningScenarioLanduse.vue", () => {
    let store;

    const factory = {
            getShallowMount: () => {
                return shallowMount(PlanningScenarioLanduse, {
                    global: {
                        plugins: [store]
                    }
                });
            },
            getMount: () => {
                return mount(PlanningScenarioLanduse, {
                    global: {
                        plugins: [store]
                    }
                });
            }
        },
        simulations = [
            {
                "id": "noise_v4:traffic_noise_propagation",
                "inputs": {
                    "buildings": {
                        "editable": true,
                        "label": "Gebäude"
                    },
                    "crs": "http://www.opengis.net/def/crs/EPSG/0/25832",
                    "hospitals": {
                        "editable": true,
                        "label": "Krankenhäuser"
                    }
                }
            }
        ],
        planningScenarios = [{
            "id": "Szenario1",
            "name": "Planungsszenario 1",
            "simulationId": "noise_v4:traffic_noise_propagation",
            "featuresLoaded": true,
            "inputs": {
                "buildings": {
                    "type": "FeatureCollection",
                    "features": [
                        {
                            "type": "Feature",
                            "id": "DEHHALKA10007tqf-piece",
                            "geometry": {
                                "type": "Polygon",
                                "coordinates": [
                                    [[566691.619, 5934737.624], [566678.396, 5934719.947], [566678.335, 5934719.865], [566691.619, 5934737.624]]
                                ]
                            },
                            "properties": {
                                "id": 117244,
                                "building_height": 30.352
                            }
                        },
                        {
                            "type": "Feature",
                            "id": "EHHALKA10007tqf-piece",
                            "geometry": {
                                "type": "Polygon",
                                "coordinates": [
                                    [[566691.619, 5934737.624], [566678.396, 5934719.947], [566678.335, 5934719.865], [566691.619, 5934737.624]]
                                ]
                            },
                            "properties": {
                                "id": 117245,
                                "building_height": 30.352
                            }
                        },
                        {
                            "type": "Feature",
                            "id": "DEHHALKA10007tqf-piece2",
                            "geometry": {
                                "type": "Polygon",
                                "coordinates": [
                                    [[566692.619, 5934737.624], [566678.396, 5934719.947], [566678.335, 5934719.865], [566692.619, 5934737.624]]
                                ]
                            },
                            "properties": {
                                "id": 117244,
                                "building_height": 20.352,
                                "created": true
                            }
                        }
                    ]
                },
                "roads": {}
            }
        },
        {
            "id": "Szenario2",
            "name": "Planungsszenario 2",
            "inputs": {
                "buildings": {
                    "editable": true,
                    "source": {
                        "type": "oaf",
                        "url": "https://ump-lgv.germanywestcentral.cloudapp.azure.com/oaf/buildings_footprint/collections/buildings/"
                    }
                },
                "dem": {
                    "menu": "nowhere",
                    "source": {
                        "type": "string",
                        "url": "url to source"
                    }
                },
                "ground_absorption": {
                    "menu": "nowhere",
                    "source": {
                        "type": "oaf",
                        "url": "https://ump-lgv.germanywestcentral.cloudapp.azure.com/oaf/ground_absorption/collections/ground"
                    }
                },
                "roads": {
                    "editable": true,
                    "source": {
                        "type": "oaf",
                        "url": "https://ump-lgv.germanywestcentral.cloudapp.azure.com/oaf/streets_traffic/collections/streets/"
                    }
                }
            },
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
        layer = {
            getLayerSource: () => ({
                clear: () => undefined,
                hasFeature: () => undefined,
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
                            getters: {
                                currentPlanningScenarioId: (state) => state.currentPlanningScenarioId,
                                planningScenarios: (state) => state.planningScenarios,
                                simulations: () => simulations
                            },
                            mutations: {
                                setPlanningScenarios (state, value) {
                                    state.planningScenarios = value;
                                }
                            },
                            state: {
                                currentPlanningScenarioId: "Szenario1",
                                planningScenarios: planningScenarios
                            }
                        }
                    }
                }
            }
        });

        sinon.stub(layerCollection, "getLayerById").returns(layer);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.exists()).to.be.true;
        });

        it("should render two inputs with type radio", async () => {
            let radioInputs = [];
            const wrapper = factory.getShallowMount();

            await wrapper.vm.$nextTick();
            radioInputs = wrapper.findAll("input[type='radio']");

            expect(radioInputs).to.have.lengthOf(2);
            expect(radioInputs.at(0).attributes("id")).to.be.equal("buildings");
            expect(radioInputs.at(1).attributes("id")).to.be.equal("hospitals");
        });

        it("should not render SpinnerItem when features are not loaded", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.findComponent({name: "SpinnerItem"}).exists()).to.be.false;
        });

        it("should render correct number of existing buildings as default view", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.vm.$nextTick();

            expect(wrapper.get(".tab-pane.active").findAll(".list-group-item")).to.have.lengthOf(2);
        });

        it("should render SwitchInput when currentEditableInput is 'buildings'", async () => {
            const wrapper = shallowMount(PlanningScenarioLanduse, {
                global: {
                    plugins: [store]
                },
                computed: {
                    isLoaded: () => true
                }
            });

            await wrapper.vm.$nextTick();

            expect(wrapper.findComponent({name: "SwitchInput"}).exists()).to.be.true;
        });

        it("should render NavTab when currentEditableInput is 'buildings'", async () => {
            const wrapper = factory.getShallowMount();

            wrapper.vm.currentEditableInput = "buildings";
            await wrapper.vm.$nextTick();

            expect(wrapper.findComponent({name: "NavTab"}).exists()).to.be.true;
        });
    });

    describe("Watchers", () => {
        it("should call method 'parseAndAddFeatures' if data 'currentEditableInput' is changed", async () => {
            const stubParseAndAddFeatures = sinon.stub(PlanningScenarioLanduse.methods, "parseAndAddFeatures"),
                wrapper = factory.getShallowMount();

            await wrapper.vm.$nextTick();
            await wrapper.setData({
                currentEditableInput: "Ich habe mich geaendert"
            });

            expect(stubParseAndAddFeatures.called).to.be.true;
        });
    });

    describe("methods", () => {
        describe("changeHeight", () => {
            it("should set correct value, no matter if object structure already exists or not", () => {
                const wrapper = factory.getShallowMount(),
                    building1 = {
                        properties: {
                            building_height: 20
                        }
                    },
                    building2 = {},
                    event = {
                        target: {
                            valueAsNumber: 30
                        }
                    };

                wrapper.vm.changeHeight(event, building1);
                wrapper.vm.changeHeight(event, building2);

                expect(building1.properties.building_height).to.equal(30);
                expect(building2.properties.building_height).to.equal(30);
            });
        });
        describe("fetchFeatures", () => {
            it("should set the expected features in the scenario parameter object", async () => {
                sinon.stub(getFeature, "getOAFFeatureGet").resolves("features");
                sinon.stub(getFeature, "getOAFGeometryFilter");

                const wrapper = factory.getShallowMount(),
                    scenario = {
                        simulationId: "simId",
                        inputs: {
                            anEditableInput: {}
                        }
                    },
                    scopeSimulations = [
                        {
                            id: "simId",
                            inputs: {
                                aNotEditableInput: {},
                                anEditableInput: {
                                    editable: true,
                                    source: {
                                        type: "oaf",
                                        collection: "buildings",
                                        url: "https://a.url.com"
                                    }
                                }
                            }
                        }
                    ];

                await wrapper.vm.fetchFeatures(scenario, scopeSimulations[0].inputs, [0, 1, 0, 1], "CRS");

                expect(scenario.inputs.anEditableInput).to.deep.equal({features: "features"});
            });
        });
    });
});
