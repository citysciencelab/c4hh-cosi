import {config, mount, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import Feature from "ol/Feature.js";
import getFeature from "../../../../../../src/shared/js/api/oaf/getOAFFeature.js";
import layerCollection from "../../../../../../src/core/layers/js/layerCollection.js";
import PlanningScenarioLanduse from "../../../../components/PlanningScenario/PlanningScenarioLanduse.vue";
import sinon from "sinon";
import VectorSource from "ol/source/Vector.js";

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
        dataSources = [
            {
                "id": "default",
                "title": "Gebäude und Straßen (für Lärm- und Windsimulation)",
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
        simulations = [
            {
                "id": "noise_v4:traffic_noise_propagation",
                "inputs": {
                    "buildings": {
                        "editable": true
                    },
                    "hospitals": {
                        "editable": true
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
        }],
        layer = {
            getLayer: () => ({
                setVisible: () => undefined
            }),
            getLayerSource: () => new VectorSource()
        },
        stubSetPlanningScenario = sinon.stub();

    beforeEach(() => {
        store = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        SimulationTool: {
                            namespaced: true,
                            getters: {
                                currentEditableInput: (state) => state.currentEditableInput,
                                currentPlanningScenarioId: (state) => state.currentPlanningScenarioId,
                                dataSources: (state) => state.dataSources,
                                planningScenarios: (state) => state.planningScenarios,
                                currentInputName: (state) => state.currentInputName,
                                currentPlanningComponent: (state) => state.currentPlanningComponent,
                                landuseActiveTab: (state) => state.landuseActiveTab,
                                planningScenarioHighlightFeatureStyle: (state) => state.planningScenarioHighlightFeatureStyle,
                                planningScenarioSelectInteraction: (state) => state.planningScenarioSelectInteraction,
                                simulations: () => simulations
                            },
                            mutations: {
                                setPlanningScenarios: stubSetPlanningScenario,
                                setCurrentEditableInput (state, value) {
                                    state.currentEditableInput = value;
                                },
                                setCurrentPlanningComponent (state, value) {
                                    state.currentPlanningComponent = value;
                                },
                                setCurrentInputName (state, value) {
                                    state.currentInputName = value;
                                },
                                setLanduseActiveTab (state, value) {
                                    state.landuseActiveTab = value;
                                },
                                setPlanningScenarioSelectInteraction (state, value) {
                                    state.planningScenarioSelectInteraction = value;
                                }
                            },
                            state: {
                                currentPlanningScenarioId: "Szenario1",
                                dataSources: dataSources,
                                planningScenarios: planningScenarios,
                                currentEditableInput: "buildings",
                                currentInputName: "",
                                currentPlanningComponent: "",
                                landuseActiveTab: "existing",
                                planningScenarioHighlightFeatureStyle: sinon.stub(),
                                planningScenarioSelectInteraction: sinon.stub()
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

        sinon.stub(layerCollection, "getLayerById").returns(layer);
    });


    describe("Component DOM", () => {
        it("should exist", async function () {
            const wrapper = factory.getShallowMount();

            await wrapper.vm.$nextTick();
            expect(wrapper.exists()).to.be.true;
        });

        it("should render two inputs with type radio", async function () {
            let radioInputs = [];
            const wrapper = factory.getShallowMount();

            await wrapper.vm.$nextTick();
            radioInputs = wrapper.findAll("input[type='radio']");

            expect(radioInputs).to.have.lengthOf(2);
            expect(radioInputs.at(0).attributes("id")).to.be.equal("buildings");
            expect(radioInputs.at(1).attributes("id")).to.be.equal("hospitals");
        });

        it("should not render SpinnerItem when features are not loaded", async function () {
            const wrapper = factory.getShallowMount();

            await wrapper.vm.$nextTick();
            expect(wrapper.findComponent({name: "SpinnerItem"}).exists()).to.be.false;
        });

        it("should render SwitchInput when currentEditableInput is 'buildings'", async function () {
            const wrapper = factory.getShallowMount();

            await wrapper.vm.$nextTick();

            expect(wrapper.findComponent({name: "SwitchInput"}).exists()).to.be.true;
        });

        it("should render NavTab when currentEditableInput is 'buildings'", async function () {
            const wrapper = factory.getShallowMount();

            await wrapper.vm.$nextTick();

            expect(wrapper.findComponent({name: "NavTab"}).exists()).to.be.true;
        });

        it("should render text of button when currentEditableInput is 'buildings'", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.vm.$nextTick();

            expect(wrapper.findAllComponents({name: "FlatButton"}).at(0).attributes().text).to.be.equal("additional:modules.tools.simulationTool.newBuilding");
        });

        it("should render text of button when currentEditableInput is not 'buildings'", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.vm.$nextTick();
            wrapper.vm.setCurrentEditableInput("roads");
            await wrapper.vm.$nextTick();

            expect(wrapper.findAllComponents({name: "FlatButton"}).at(0).attributes().text).to.be.equal("additional:modules.tools.simulationTool.newRoad");
        });

        it("should render text of button when currentEditableInput is not 'buildings'", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.vm.$nextTick();
            wrapper.vm.setCurrentEditableInput("roads");
            await wrapper.vm.$nextTick();

            expect(wrapper.findAllComponents({name: "FlatButton"}).at(0).attributes().text).to.be.equal("additional:modules.tools.simulationTool.newRoad");
        });

        it("should not render alert info when features are not loaded", async function () {
            const wrapper = shallowMount(PlanningScenarioLanduse, {
                global: {
                    plugins: [store]
                },
                computed: {
                    currentEditableInput: sinon.stub(),
                    isEmptyFeature: () => true,
                    isLoaded: () => false,
                    landuseActiveTab: sinon.stub()
                }
            });

            await wrapper.vm.$nextTick();
            expect(wrapper.find(".alert-danger").exists()).to.be.false;
        });

        it("should render alert info when features are not loaded", async function () {
            const wrapper = shallowMount(PlanningScenarioLanduse, {
                global: {
                    plugins: [store]
                },
                computed: {
                    currentEditableInput: sinon.stub(),
                    isEmptyFeature: () => true,
                    isLoaded: () => true,
                    landuseActiveTab: sinon.stub()
                }
            });

            await wrapper.vm.$nextTick();
            expect(wrapper.find(".alert-danger").exists()).to.be.true;
        });
        it("should render cancel text in button when features are not loaded", async function () {
            const wrapper = shallowMount(PlanningScenarioLanduse, {
                global: {
                    plugins: [store]
                },
                computed: {
                    currentEditableInput: sinon.stub(),
                    isEmptyFeature: () => true,
                    isLoaded: () => true,
                    landuseActiveTab: sinon.stub()
                }
            });

            await wrapper.vm.$nextTick();
            expect(wrapper.findAllComponents({name: "FlatButton"}).at(1).attributes().text).to.be.equal("additional:modules.tools.simulationTool.planningScenarioCancel");
        });
    });

    describe("Watchers", () => {
        it("should call method 'updateFeatures' if data 'currentEditableInput' is changed", async function () {
            const stubUpdateFeatures = sinon.stub(PlanningScenarioLanduse.methods, "updateFeatures"),
                wrapper = factory.getShallowMount();

            await wrapper.vm.$nextTick();
            wrapper.vm.setCurrentEditableInput("Ich habe mich geaendert");
            await wrapper.vm.$nextTick();

            expect(stubUpdateFeatures.called).to.be.true;
        });
    });

    describe("User Interaction", () => {
        it("should call 'setCurrentPlanningComponent' if user clicks the button to open PlanningScenarioLanduseCreate", async function () {
            const wrapper = factory.getMount(),
                buttonListWrapper = wrapper.findAll("button"),
                spyOpenLanduseCreate = sinon.spy(wrapper.vm, "setCurrentPlanningComponent");

            await buttonListWrapper.at(2).trigger("click");
            expect(spyOpenLanduseCreate.calledOnce).to.be.true;
        });

        it("should call 'setCurrentInputName' if user clicks the button to open PlanningScenarioLanduseCreate", async function () {
            const wrapper = factory.getMount(),
                buttonListWrapper = wrapper.findAll("button"),
                spyOpenLanduseCreate = sinon.spy(wrapper.vm, "setCurrentInputName"),
                spyCurrentPlanningComponent = sinon.spy(wrapper.vm, "setCurrentPlanningComponent");

            await buttonListWrapper.at(2).trigger("click");
            expect(spyOpenLanduseCreate.calledOnce).to.be.true;
            expect(spyCurrentPlanningComponent.calledOnce).to.be.true;
        });

        it("should call 'save' if user clicks the button to save planning scenario", async function () {
            const wrapper = mount(PlanningScenarioLanduse, {
                    global: {
                        plugins: [store]
                    },
                    computed: {
                        currentEditableInput: () => "buildings",
                        isEmptyFeature: () => false,
                        isLoaded: () => true,
                        landuseActiveTab: () => "buildings"
                    }
                }),
                buttonListWrapper = wrapper.findAll("button"),
                spySave = sinon.spy(wrapper.vm, "save");

            await buttonListWrapper.at(3).trigger("click");
            expect(spySave.calledOnce).to.be.true;
        });
    });

    describe("methods", () => {
        describe("initializeShowExistingItems", () => {
            it("should set the correct value to showExistingItems", async () => {
                const wrapper = factory.getShallowMount();

                await wrapper.vm.$nextTick();
                wrapper.vm.planningScenarios[0].showExistingItems = undefined;
                wrapper.vm.initializeShowExistingItems();
                expect(wrapper.vm.planningScenarios[0].showExistingItems).to.deep.equal({
                    buildings: true,
                    hospitals: true
                });
            });
            it("should not set the object if showExistingItems is already set", async () => {
                const wrapper = factory.getShallowMount();

                await wrapper.vm.$nextTick();
                wrapper.vm.planningScenarios[0].showExistingItems = {};
                wrapper.vm.initializeShowExistingItems();
                expect(wrapper.vm.planningScenarios[0].showExistingItems).to.deep.equal({});
            });
        });
        describe("fetchFeatures", () => {
            it("should set the expected features in the scenario parameter object", async function () {
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

                expect(scenario.inputs.anEditableInput).to.deep.equal({type: "FeatureCollection", features: "features"});
            });
        });

        describe("setFeatureAttribute", () => {
            it("should set correct value to the correct feature", async () => {
                const wrapper = factory.getShallowMount();

                await wrapper.vm.$nextTick();
                wrapper.vm.setFeatureAttribute(20, "building_height", "DEHHALKA10007tqf-piece");
                expect(planningScenarios[0].inputs.buildings.features[0].properties.building_height).to.equal(20);
            });
        });

        describe("setFeatureStyle", () => {
            it("should set null style to the feature", async function () {
                const wrapper = factory.getShallowMount(),
                    feature = new Feature();

                feature.setId("DEHHALKA10007tqf-piece");
                await wrapper.vm.$nextTick();
                wrapper.vm.setFeatureStyle(feature);

                expect(feature.getStyle()).to.be.null;
            });
            it("should set a style to the feature", async function () {
                const wrapper = factory.getShallowMount(),
                    feature = new Feature();

                feature.setId("EHHALKA10007tqf-piece");
                await wrapper.vm.$nextTick();
                wrapper.vm.setFeatureStyle(feature);

                expect(feature.getStyle()).to.be.not.null;
            });
        });
        describe("removeFeature", () => {
            it("should remove the correct feature", async () => {
                const wrapper = factory.getShallowMount();

                await wrapper.vm.$nextTick();
                wrapper.vm.removeFeature("DEHHALKA10007tqf-piece2");
                expect(planningScenarios[0].inputs.buildings.features.find(feature => feature.id === "DEHHALKA10007tqf-piece2")).to.be.undefined;
            });
        });
        describe("updateFeatures", () => {
            it("should call getInputFeatures with the correct parameter", () => {
                const wrapper = factory.getShallowMount(),
                    editableInput = "testInput",
                    getInputFeaturesStub = sinon.stub(wrapper.vm, "getInputFeatures").returns(undefined);

                wrapper.vm.updateFeatures(editableInput);

                expect(getInputFeaturesStub.calledOnceWith(editableInput)).to.be.true;
            });

            it("should call clearFeatures and parseAndAddFeatures when features are returned", () => {
                const wrapper = factory.getShallowMount(),
                    editableInput = "testInput",
                    features = ["feature1", "feature2"],
                    clearFeaturesStub = sinon.stub(wrapper.vm, "clearFeatures"),
                    parseAndAddFeaturesStub = sinon.stub(wrapper.vm, "parseAndAddFeatures");

                sinon.stub(wrapper.vm, "getInputFeatures").returns(features);

                wrapper.vm.updateFeatures(editableInput);

                expect(clearFeaturesStub.calledOnce).to.be.true;
                expect(parseAndAddFeaturesStub.calledOnceWith(features)).to.be.true;
            });
        });
        describe("cancel", () => {
            it("should call setPlanningScenario", () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.cancel();

                expect(stubSetPlanningScenario.calledOnce).to.be.true;
            });
            it("should call clear features", () => {
                const wrapper = factory.getShallowMount(),
                    spyClearFeatures = sinon.spy(wrapper.vm, "clearFeatures");

                wrapper.vm.cancel();

                expect(spyClearFeatures.calledOnce).to.be.true;
            });
        });
    });
});
