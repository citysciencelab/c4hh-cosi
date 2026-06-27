import axios from "axios";
import {config, mount, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import Feature from "ol/Feature.js";
import layerCollection from "../../../../../../src/core/layers/js/layerCollection.js";
import {Point, Polygon} from "ol/geom.js";
import {Select} from "ol/interaction.js";
import SimulationResults from "../../../../components/Simulation/SimulationResults.vue";
import sinon from "sinon";
import VectorSource from "ol/source/Vector.js";
import layerFactory from "@core/layers/js/layerFactory.js";
import {Style} from "ol/style.js";

config.global.mocks.$t = key => key;

describe("addons/SimulationTool/components/Simulation/SimulationResults.vue", () => {
    let consoleWarnSpy, store;

    const factory = {
            getShallowMount: () => {
                return shallowMount(SimulationResults, {
                    global: {
                        plugins: [store]
                    }
                });
            },

            getMount: () => {
                return mount(SimulationResults, {
                    global: {
                        plugins: [store]
                    }
                });
            }
        },
        layer = {
            getLayer: () => ({
                setVisible: () => undefined
            }),
            getLayerSource: () => new VectorSource()
        };

    /**
     * Creates a Vuex store with a mock state and getters for the SimulationTool module.
     */
    function getStore () {
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
                                updateFeatures: () => sinon.stub(),
                                zoomToFeature: () => sinon.stub()
                            },
                            getters: {
                                onJobStatusChange: () => 0,
                                planningScenarios: () => [
                                    {
                                        id: "planningScenarioId",
                                        simulationId: "simulationId",
                                        simulations: {
                                            simulationId: {
                                                name: "Neue Simulation",
                                                jobs: {
                                                    jobNo5: {
                                                        requestBody: {inputs: {anInput: {aProperty: "aValue"}}},
                                                        jobResult: {
                                                            "noise_day": {
                                                                "type": "FeatureCollection",
                                                                "features": [{
                                                                    "type": "Feature",
                                                                    "properties": {},
                                                                    "geometry": {
                                                                        "coordinates": [
                                                                            9.984960104804372,
                                                                            53.55774883772011
                                                                        ],
                                                                        "type": "Point"
                                                                    }
                                                                }]
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                ],
                                simulationIdForResults: () => "simulationId",
                                simulations: () => []
                            },
                            mutations: {
                                setMode: sinon.stub()
                            }
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    actions: {
                        zoomToExtent: sinon.stub()
                    }
                },
                Menu: {
                    namespaced: true,
                    getters: {
                        mainMenu: () => ({}),
                        mainExpanded: () => true
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
        sinon.stub(layerCollection, "getLayerById").returns(layer);
    });


    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = factory.getMount();

            expect(wrapper.exists()).to.be.true;
        });

        it("should render inputs accordeon", () => {
            const wrapper = factory.getMount();

            expect(wrapper.findAllComponents({name: "AccordionItem"})
                .find(accordionWrapper => accordionWrapper.vm.id === "simulation-results-accordion-inputs")
                .exists()).to.be.true;
        });

        it("should render correct inputs", () => {
            const wrapper = factory.getMount(),
                inputsAccordion = wrapper.findAllComponents({name: "AccordionItem"})
                    .find(accordionWrapper => accordionWrapper.vm.id === "simulation-results-accordion-inputs");

            expect(inputsAccordion.text()).to.include("aProperty");
            expect(inputsAccordion.text()).to.include("aValue");
        });
    });

    describe("Methods", () => {
        describe("addSelectInteractionForGivenLayer", () => {
            it("should return immediately if layerId is undefined", () => {
                const wrapper = factory.getShallowMount(),
                    addInteractionStub = sinon.stub(wrapper.vm, "addInteraction");

                wrapper.vm.addSelectInteractionForGivenLayer();
                expect(Object.keys(wrapper.vm.outputSelectInteraction)).to.have.length(0);
                expect(addInteractionStub.called).to.be.false;
            });
            it("should return immediately if interaction already exists", () => {
                const addInteractionStub = sinon.stub(SimulationResults.methods, "addInteraction"),
                    wrapper = factory.getShallowMount();

                wrapper.vm.outputSelectInteraction.layer1 = {select: new Select()};
                wrapper.vm.addSelectInteractionForGivenLayer("layer1", new Select(), "select");
                expect(addInteractionStub.called).to.be.false;
            });
            it("should create new Select interaction and register listener", () => {
                const addInteractionStub = sinon.stub(SimulationResults.methods, "addInteraction"),
                    wrapper = factory.getShallowMount(),
                    interaction = {on: sinon.stub()};

                wrapper.vm.addSelectInteractionForGivenLayer("layer1", interaction, "select");
                expect(wrapper.vm.outputSelectInteraction.layer1.select).to.deep.equal(interaction);

                expect(addInteractionStub.calledWith(interaction)).to.be.true;
            });
        });
        describe("createOrUpdateLayer", () => {
            it("should return existing layer and call clear", () => {
                const wrapper = factory.getShallowMount(),
                    clearStub = sinon.stub(),
                    resultLayer = {
                        getLayerSource: () => {
                            return {clear: clearStub};
                        }
                    };

                layerCollection.getLayerById.restore();
                sinon.stub(layerCollection, "getLayerById").returns(resultLayer);
                expect(wrapper.vm.createOrUpdateLayer("test")).to.deep.equal(resultLayer);
                expect(clearStub.calledOnce).to.be.true;
            });
            it("should call create createLayer", () => {
                const wrapper = factory.getShallowMount(),
                    createLayerStub = sinon.stub(layerFactory, "createLayer").returns({layer: {setZIndex: sinon.stub()}});

                layerCollection.getLayerById.restore();
                sinon.stub(layerCollection, "getLayerById").returns(undefined);
                wrapper.vm.createOrUpdateLayer("test");
                expect(createLayerStub.calledOnce).to.be.true;
            });
        });
        describe("formatKeyValuePairs", () => {
            it("should trim keys with prefix before padding", () => {
                const wrapper = factory.getMount(),
                    input = [
                        ["foo1.5", "fooValue"],
                        ["bar0.5", "barValue"]
                    ],
                    result = wrapper.vm.formatKeyValuePairs(input, "foo"),
                    expected = "1.5m: fooValue\n0.5m: barValue";

                expect(result).to.be.equal(expected);
            });
            it("should handle when maxKeyLength is 0 gracefully", () => {
                const wrapper = factory.getMount(),
                    input = [],
                    result = wrapper.vm.formatKeyValuePairs(input, "");

                expect(result).to.equal("");
            });
            it("should gracefully handle non-string keys or values", () => {
                const wrapper = factory.getMount(),
                    input = [
                        [42, true],
                        [false, 100],
                        [undefined, null]
                    ],
                    result = wrapper.vm.formatKeyValuePairs(input, "");

                expect(result).to.include("42m       : true");
                expect(result).to.include("falsem    : 100");
                expect(result).to.include("undefinedm: null");
            });
            it("should align output with maxKeyLength for multiple entries", () => {
                const wrapper = factory.getMount(),
                    input = [
                        ["short", "foo"],
                        ["muchLongerKey", "bar"]
                    ],
                    result = wrapper.vm.formatKeyValuePairs(input, "");

                expect(result.split("\n")[0].indexOf(":")).to.equal(result.split("\n")[1].indexOf(":"));
            });
        });
        describe("getAllZValuesFromTableFeature", () => {
            it("should return an empty array if no custom-z-* properties exist", () => {
                const wrapper = factory.getShallowMount(),
                    feature = {
                        getProperties: () => ({
                            "name": "testFeature",
                            "height": 25
                        })
                    },
                    result = wrapper.vm.getAllZValuesFromTableFeature(feature);

                expect(result).to.deep.equal([]);
            });

            it("should return all custom-z-* properties sorted by descending numeric Z", () => {
                const wrapper = factory.getShallowMount(),
                    feature = {
                        getProperties: () => ({
                            "custom-z-100": "value1",
                            "custom-z-50": "value2",
                            "custom-z-200": "value3"
                        })
                    },
                    result = wrapper.vm.getAllZValuesFromTableFeature(feature);

                expect(result).to.deep.equal([
                    ["custom-z-200", "value3"],
                    ["custom-z-100", "value1"],
                    ["custom-z-50", "value2"]
                ]);
            });

            it("should correctly parse float Z values and sort them descending", () => {
                const wrapper = factory.getShallowMount(),
                    feature = {
                        getProperties: () => ({
                            "custom-z-10.5": "a",
                            "custom-z-2.75": "b",
                            "custom-z-99.99": "c"
                        })
                    },
                    result = wrapper.vm.getAllZValuesFromTableFeature(feature);

                expect(result).to.deep.equal([
                    ["custom-z-99.99", "c"],
                    ["custom-z-10.5", "a"],
                    ["custom-z-2.75", "b"]
                ]);
            });

            it("should ignore keys that don’t start with custom-z-", () => {
                const wrapper = factory.getShallowMount(),
                    feature = {
                        getProperties: () => ({
                            "custom-z-5": "value",
                            "other-z-10": "shouldBeIgnored",
                            "z-20": "alsoIgnored"
                        })
                    },
                    result = wrapper.vm.getAllZValuesFromTableFeature(feature);

                expect(result).to.deep.equal([
                    ["custom-z-5", "value"]
                ]);
            });

            it("should handle an empty properties object", () => {
                const wrapper = factory.getShallowMount(),
                    feature = {
                        getProperties: () => ({})
                    },
                    result = wrapper.vm.getAllZValuesFromTableFeature(feature);

                expect(result).to.deep.equal([]);
            });
        });
        describe("processAndStylePointFeaturesForTable", () => {
            it("should initialize feature collections and add select/translate interactions", () => {
                const wrapper = factory.getShallowMount(),
                    layerId = "layer123",
                    simulationId = "simulationABC",
                    currentSimulation = {},
                    featureStub = new Feature({
                        geometry: new Point([0, 0])
                    }),
                    tmpLayer = {
                        layer: {},
                        getLayerSource: () => new VectorSource()
                    },
                    layerSource = {
                        addFeatures: sinon.stub()
                    };

                sinon.stub(wrapper.vm, "storeTranslatedPointAndCreateLine");
                sinon.stub(wrapper.vm, "getFeatureStyleCircle").returns(new Style());
                sinon.stub(wrapper.vm, "getFeatureStyleTable").returns(new Style());
                sinon.stub(wrapper.vm, "formatKeyValuePairs").returns("formatted");
                sinon.stub(wrapper.vm, "getAllZValuesFromTableFeature").returns([["custom-z-10", 10]]);
                sinon.stub(wrapper.vm, "addSelectInteractionForGivenLayer");
                sinon.stub(wrapper.vm, "onFeatureSelect");
                sinon.stub(wrapper.vm, "onFeatureMove");

                wrapper.vm.processAndStylePointFeaturesForTable(
                    layerId,
                    tmpLayer,
                    layerSource,
                    [featureStub],
                    simulationId,
                    currentSimulation
                );

                expect(wrapper.vm.tableFeaturesCollection[layerId]).to.be.an("object");
                expect(wrapper.vm.lineFeaturesCollection[layerId]).to.be.an("object");
                expect(wrapper.vm.storeTranslatedPointAndCreateLine.calledOnce).to.be.true;
                expect(featureStub.get("simulationId")).to.be.equal("simulationABC");
                expect(featureStub.getStyle()).to.be.an.instanceof(Style);

                expect(layerSource.addFeatures.calledOnce).to.be.true;
                expect(wrapper.vm.addSelectInteractionForGivenLayer.calledTwice).to.be.true;
            });

            it("should skip styling for non-point geometries", () => {
                const wrapper = factory.getShallowMount(),
                    layerId = "layer456",
                    jobID = "jobXYZ",
                    currentSimulation = {},
                    featureStub = new Feature({
                        geometry: new Polygon([]) // dummy polygon
                    }),
                    tmpLayer = {
                        layer: {},
                        getLayerSource: () => new VectorSource()
                    },
                    layerSource = {
                        addFeatures: sinon.stub()
                    };
                let storeStub = null,
                    setStyleSpy = null;

                featureStub.getGeometry = () => ({
                    getType: () => "Polygon"
                });

                storeStub = sinon.stub(wrapper.vm, "storeTranslatedPointAndCreateLine");
                setStyleSpy = sinon.spy(featureStub, "setStyle");

                sinon.stub(wrapper.vm, "getFeatureStyleCircle").returns(new Style());
                sinon.stub(wrapper.vm, "getFeatureStyleTable").returns(new Style());
                sinon.stub(wrapper.vm, "formatKeyValuePairs").returns("formatted");
                sinon.stub(wrapper.vm, "getAllZValuesFromTableFeature").returns([]);
                sinon.stub(wrapper.vm, "addSelectInteractionForGivenLayer");

                wrapper.vm.processAndStylePointFeaturesForTable(
                    layerId,
                    tmpLayer,
                    layerSource,
                    [featureStub],
                    jobID,
                    currentSimulation
                );

                expect(storeStub.called).to.be.false;
                expect(setStyleSpy.calledOnce).to.be.true;
                expect(setStyleSpy.firstCall.args[0]).to.be.an.instanceof(Style);
            });

            it("should handle empty feature list gracefully", () => {
                const wrapper = factory.getShallowMount(),
                    layerId = "layerEmpty",
                    jobID = "jobEMPTY",
                    currentSimulation = {},
                    tmpLayer = {
                        layer: {},
                        getLayerSource: () => new VectorSource()
                    },
                    layerSource = {
                        addFeatures: sinon.stub()
                    };

                sinon.stub(wrapper.vm, "addSelectInteractionForGivenLayer");
                wrapper.vm.tableFeaturesCollection[layerId] = {};
                wrapper.vm.lineFeaturesCollection[layerId] = {};

                wrapper.vm.processAndStylePointFeaturesForTable(layerId, tmpLayer, layerSource, [], jobID, currentSimulation);

                expect(layerSource.addFeatures.calledOnce).to.be.true;
                expect(layerSource.addFeatures.firstCall.args[0]).to.deep.equal([]);
            });
        });
        describe("onFeatureSelect", () => {
            it("should apply style and remove line features if a feature is selected", () => {
                const wrapper = factory.getShallowMount(),
                    layerId = "layer1",
                    customZKey = "custom-z-",
                    coords = [10, 20, 30],
                    key = "10,20",
                    feature = new Feature({geometry: new Point(coords)}),
                    tableFeature = new Feature(),
                    lineFeature = new Feature(),
                    layerSource = {
                        removeFeatures: sinon.stub(),
                        addFeatures: sinon.stub()
                    },
                    event = {
                        selected: [feature],
                        deselected: []
                    };

                wrapper.vm.tableFeaturesCollection[layerId] = {
                    [key]: tableFeature
                };
                wrapper.vm.lineFeaturesCollection[layerId] = {
                    [key + "-1"]: lineFeature
                };

                sinon.stub(tableFeature, "setStyle");
                sinon.stub(wrapper.vm, "getFeatureStyleTable").returns(new Style());
                sinon.stub(wrapper.vm, "formatKeyValuePairs").returns("formatted");
                sinon.stub(wrapper.vm, "getAllZValuesFromTableFeature").returns([]);

                wrapper.vm.onFeatureSelect(event, layerId, layerSource, customZKey);

                expect(tableFeature.setStyle.calledOnce).to.be.true;
                expect(layerSource.removeFeatures.calledOnceWith([lineFeature])).to.be.true;
                expect(layerSource.addFeatures.called).to.be.false;
            });

            it("should apply style and add line features if a feature is deselected", () => {
                const wrapper = factory.getShallowMount(),
                    layerId = "layer1",
                    customZKey = "custom-z-",
                    coords = [10, 20, 30],
                    key = "10,20",
                    feature = new Feature({geometry: new Point(coords)}),
                    tableFeature = new Feature(),
                    lineFeature = new Feature(),
                    layerSource = {
                        removeFeatures: sinon.stub(),
                        addFeatures: sinon.stub()
                    },
                    event = {
                        selected: [],
                        deselected: [feature]
                    };

                wrapper.vm.tableFeaturesCollection[layerId] = {
                    [key]: tableFeature
                };
                wrapper.vm.lineFeaturesCollection[layerId] = {
                    [key + "-1"]: lineFeature
                };

                // Stubs
                sinon.stub(tableFeature, "setStyle");
                sinon.stub(wrapper.vm, "getFeatureStyleTable").returns(new Style());
                sinon.stub(wrapper.vm, "formatKeyValuePairs").returns("formatted");
                sinon.stub(wrapper.vm, "getAllZValuesFromTableFeature").returns([]);

                wrapper.vm.onFeatureSelect(event, layerId, layerSource, customZKey);

                expect(tableFeature.setStyle.calledOnce).to.be.true;
                expect(layerSource.addFeatures.calledOnceWith([lineFeature])).to.be.true;
                expect(layerSource.removeFeatures.called).to.be.false;
            });

            it("should do nothing if no matching table feature exists", () => {
                const wrapper = factory.getShallowMount(),
                    layerId = "layer2",
                    customZKey = "custom-z-",
                    coords = [100, 200, 300],
                    feature = new Feature({geometry: new Point(coords)}),
                    layerSource = {
                        removeFeatures: sinon.stub(),
                        addFeatures: sinon.stub()
                    },
                    event = {
                        selected: [feature],
                        deselected: []
                    };

                wrapper.vm.tableFeaturesCollection[layerId] = {};
                wrapper.vm.lineFeaturesCollection[layerId] = {};

                wrapper.vm.onFeatureSelect(event, layerId, layerSource, customZKey);

                expect(layerSource.removeFeatures.called).to.be.false;
                expect(layerSource.addFeatures.called).to.be.false;
            });
        });
        describe("onFeatureMove", () => {
            it("should update coordinates of matching line features", () => {
                const wrapper = factory.getShallowMount(),
                    layerId = "layer1",
                    originalXYKey = "og-xy",
                    customZKey = "custom-z-",
                    originalXY = "10,20",
                    zKey1 = "custom-z-50",
                    zKey2 = "custom-z-75",
                    featureCoords = [100, 200, 300],
                    tableFeature = new Feature({geometry: new Point(featureCoords)}),
                    lineFeature1 = new Feature(),
                    lineFeature2 = new Feature(),
                    expectedCoords1 = [[10, 20, 50], featureCoords],
                    expectedCoords2 = [[10, 20, 75], featureCoords],
                    event = {
                        features: {
                            getLength: () => 1,
                            getArray: () => [tableFeature]
                        }
                    };
                let setCoordinatesSpy1 = null,
                    setCoordinatesSpy2 = null;

                tableFeature.setProperties({
                    [originalXYKey]: originalXY,
                    [zKey1]: "irrelevant",
                    [zKey2]: "alsoIrrelevant"
                });

                lineFeature1.setGeometry(new Point([]));
                lineFeature2.setGeometry(new Point([]));

                setCoordinatesSpy1 = sinon.spy(lineFeature1.getGeometry(), "setCoordinates");
                setCoordinatesSpy2 = sinon.spy(lineFeature2.getGeometry(), "setCoordinates");

                wrapper.vm.lineFeaturesCollection[layerId] = {
                    "10,20,50": lineFeature1,
                    "10,20,75": lineFeature2
                };

                wrapper.vm.onFeatureMove(event, layerId, originalXYKey, customZKey);

                expect(setCoordinatesSpy1.calledOnce).to.be.true;
                expect(setCoordinatesSpy2.calledOnce).to.be.true;

                expect(setCoordinatesSpy1.firstCall.args[0]).to.deep.equal(expectedCoords1);
                expect(setCoordinatesSpy2.firstCall.args[0]).to.deep.equal(expectedCoords2);
            });

            it("should do nothing if event.features is empty", () => {
                const wrapper = factory.getShallowMount(),
                    layerId = "layer1",
                    originalXYKey = "og-xy",
                    customZKey = "custom-z-",
                    event = {
                        features: {
                            getLength: () => 0,
                            getArray: () => []
                        }
                    };

                let lineSetSpyCalled = false;

                wrapper.vm.lineFeaturesCollection[layerId] = {
                    "10,20,50": {
                        getGeometry: () => ({
                            setCoordinates: () => {
                                lineSetSpyCalled = true;
                            }
                        })
                    }
                };
                wrapper.vm.onFeatureMove(event, layerId, originalXYKey, customZKey);

                expect(lineSetSpyCalled).to.be.false;
            });

            it("should handle missing geometry gracefully", () => {
                const wrapper = factory.getShallowMount(),
                    layerId = "layer1",
                    originalXYKey = "og-xy",
                    customZKey = "custom-z-",
                    tableFeature = new Feature(),
                    lineFeature = new Feature(),
                    event = {
                        features: {
                            getLength: () => 1,
                            getArray: () => [tableFeature]
                        }
                    };
                let spy = null;

                tableFeature.setProperties({
                    [originalXYKey]: "1,2",
                    "custom-z-100": true
                });

                tableFeature.getGeometry = () => null; // simulate invalid geometry

                lineFeature.setGeometry(new Point([]));
                spy = sinon.spy(lineFeature.getGeometry(), "setCoordinates");

                wrapper.vm.lineFeaturesCollection[layerId] = {
                    "1,2,100": lineFeature
                };

                wrapper.vm.onFeatureMove(event, layerId, originalXYKey, customZKey);

                expect(spy.called).to.be.false;
            });
        });


        describe("setFeatureStyle", () => {
            it("should set null as style to feature if style is not in right format", async () => {
                const wrapper = factory.getMount(),
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

                await wrapper.vm.setFeatureStyle(feature, null);
                expect(feature.getStyle()).to.be.null;
                await wrapper.vm.setFeatureStyle(feature, false);
                expect(feature.getStyle()).to.be.null;
                await wrapper.vm.setFeatureStyle(feature, "");
                expect(feature.getStyle()).to.be.null;
                await wrapper.vm.setFeatureStyle(feature, []);
                expect(feature.getStyle()).to.be.null;
                await wrapper.vm.setFeatureStyle(feature, 0);
                expect(feature.getStyle()).to.be.null;
            });

            it("should set null as style to feature if style object does not have styles", async () => {
                const wrapper = factory.getMount(),
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

                await wrapper.vm.setFeatureStyle(feature, {property: "ISOLABEL"});
                expect(feature.getStyle()).to.be.null;
            });

            it("should set style to feature according to the style object if type is polygon", async () => {
                const wrapper = factory.getMount(),
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
                    styles = [
                        {
                            value: "< 35",
                            style: {
                                fillColor: [187, 201, 204, 1],
                                strokeColor: [187, 201, 204, 1],
                                strokeWidth: 1
                            }
                        },
                        {
                            value: "35-40",
                            style: {
                                fillColor: [194, 206, 214, 1],
                                strokeColor: [194, 206, 214, 1],
                                strokeWidth: 1
                            }
                        }
                    ];

                await feature.set("ISOLABEL", "< 35");
                await wrapper.vm.setFeatureStyle(feature, {property: "ISOLABEL", styles: styles, type: "polygon"});
                expect(feature.getStyle().stroke_.color_).to.deep.equal([187, 201, 204, 1]);
            });
        });

        describe("getLegendValue", () => {
            it("should return an empty array if the parameter is not an object", async () => {
                const wrapper = factory.getMount();

                expect(wrapper.vm.getLegendValue(null)).to.deep.equal([]);
                expect(wrapper.vm.getLegendValue(0)).to.deep.equal([]);
                expect(wrapper.vm.getLegendValue("")).to.deep.equal([]);
                expect(wrapper.vm.getLegendValue(undefined)).to.deep.equal([]);
                expect(wrapper.vm.getLegendValue([])).to.deep.equal([]);
                expect(wrapper.vm.getLegendValue(false)).to.deep.equal([]);
            });

            it("should return an empty array if the parameter does not contain a key 'type' or the 'type' is not 'polygon'", async () => {
                const wrapper = factory.getMount();

                expect(wrapper.vm.getLegendValue({})).to.deep.equal([]);
                expect(wrapper.vm.getLegendValue({"type": "point"})).to.deep.equal([]);
            });

            it("should return an empty array if the parameter does not contain a key 'styles'", async () => {
                const wrapper = factory.getMount();

                expect(wrapper.vm.getLegendValue({"type": "polygon"})).to.deep.equal([]);
            });

            it("should return an legend object in array", async () => {
                const wrapper = factory.getMount(),
                    resultStyle = {
                        "type": "polygon",
                        "styles": [{
                            "value": "< 35",
                            "style": {
                                "fillColor": [187, 201, 204, 1],
                                "strokeColor": [187, 201, 204, 1],
                                "strokeWidth": 1
                            }
                        }
                        ]},
                    expectedLegendValue = [{
                        "graphic": "data:image/svg+xml;charset=utf-8,<svg height='35' width='35' version='1.1' xmlns='http://www.w3.org/2000/svg'><polygon points='5,5 30,5 30,30 5,30' style='fill:rgb(187, 201, 204);fill-opacity:1;stroke:rgb(187, 201, 204);stroke-opacity:1;stroke-width:1;stroke-linecap:round;stroke-dasharray:;'/></svg>",
                        "name": "< 35"
                    }];

                expect(wrapper.vm.getLegendValue(resultStyle)).to.deep.equal(expectedLegendValue);
            });
        });
    });
});
