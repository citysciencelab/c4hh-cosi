import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Feature from "ol/Feature.js";
import getOAFFeature from "../../../../../../src/shared/js/api/oaf/getOAFFeature.js";
import PlanningScenarioLanduseCreate from "../../../../components/PlanningScenario/PlanningScenarioLanduseCreate.vue";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("addons/SimulationTool/components/PlanningScenario/PlanningScenarioLanduseCreate.vue", () => {
    let getCollectionSchemaStub,
        selectedDrawType,
        selectedDrawTypeMain,
        store;

    const factory = {
            getShallowMount: () => {
                return shallowMount(PlanningScenarioLanduseCreate, {
                    global: {
                        plugins: [store]
                    }
                });
            }
        },
        layer = {
            getLayerSource: () => ({
                getFeatures: () => []
            })},
        dataSources = [
            {
                "id": "default",
                "inputs": {
                    "buildings": {
                        "editable": true,
                        "label": "Gebäude",
                        "source": {
                            "type": "oaf",
                            "collection": "buildings",
                            "url": "https://ump-lgv.germanywestcentral.cloudapp.azure.com/oaf/buildings_footprint"
                        }
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
            "dataSourceId": "default",
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
                            },
                            "style": {
                                "fillColor": [0, 0, 0],
                                "fillTransparency": 0,
                                "strokeColor": [0, 0, 0],
                                "strokeWidth": 2
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
            },
            "scenarioFeature": {
                "type": "FeatureCollection",
                "features": []
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
                        },
                        "properties": {
                            "id": "simulation-area"
                        }
                    }
                ]
            }
        }];

    beforeEach(() => {
        sinon.stub(PlanningScenarioLanduseCreate.methods, "getLayerSource").returns(layer.getLayerSource());
        getCollectionSchemaStub = sinon.stub(getOAFFeature, "getCollectionSchema").resolves([]);
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
                                currentEditableInput: () => "buildings",
                                currentPlanningScenarioId: () => "Szenario1",
                                drawTypeLabels: () => [],
                                landuseCurrentLayout: () => {
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
                                planningScenarioSelectInteraction: () => sinon.stub(),
                                selectedInteraction: () => "draw",
                                planningScenarioStrokeRange: () => [1, 16],
                                planningScenarioSelectedInteraction: () => null,
                                planningScenarios: () => planningScenarios,
                                dataSources: () => dataSources,
                                currentInputName: () => "buildings"
                            }
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
    describe("Component DOM", () => {
        it("should exist", async function () {
            const wrapper = factory.getShallowMount();

            await wrapper.vm.$nextTick();
            expect(wrapper.exists()).to.be.true;
        });
        it("should render draw types", async function () {
            const wrapper = factory.getShallowMount(),
                drawTypes = wrapper.find("#draw-types");

            await wrapper.vm.$nextTick();
            expect(drawTypes.exists()).to.be.true;
        });
        it("should render draw layouts", async function () {
            const wrapper = factory.getShallowMount(),
                drawLayouts = wrapper.find("#draw-layouts");

            await wrapper.vm.$nextTick();
            expect(drawLayouts.exists()).to.be.true;
        });
    });

    describe("Hooks", () => {
        it("should call 'getCollectionSchema' when component is mounted", async function () {
            const wrapper = factory.getShallowMount();

            await wrapper.vm.$nextTick();
            expect(getCollectionSchemaStub.calledOnce).to.be.true;
        });
    });

    describe("Methods", () => {
        describe("setFeatureProperties", () => {
            it("should set the given properties to the passed feature", async function () {
                const feature = new Feature(),
                    wrapper = factory.getShallowMount();

                await wrapper.vm.$nextTick();
                expect(wrapper.vm.setFeatureProperties(feature, ["cool", "hot"]).getProperties()).to.have.all.keys(["cool", "hot", "created", "id"]);
            });
        });
    });
});
