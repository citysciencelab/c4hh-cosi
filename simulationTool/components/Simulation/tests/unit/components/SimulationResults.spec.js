import axios from "axios";
import {config, mount, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import Feature from "ol/Feature.js";
import layerCollection from "../../../../../../../src/core/layers/js/layerCollection";
import {Polygon} from "ol/geom";
import SimulationResults from "../../../SimulationResults.vue";
import sinon from "sinon";
import VectorSource from "ol/source/Vector.js";

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
                                currentJobID: () => "jobNo5",
                                planningScenarios: () => [
                                    {
                                        id: "planningScenarioId",
                                        simulationId: "simulationId",
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
                                ],
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
