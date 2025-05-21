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
                            getters: {
                                currentJobID: () => "jobNo5",
                                planningScenarios: () => [
                                    {
                                        id: "planningScenarioId",
                                        simulationId: "simulationId",
                                        jobs: {jobNo5: {requestBody: {inputs: {anInput: {aProperty: "aValue"}}}}}
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
        describe("setData", () => {
            it("should return undefined, if the first param is not correct", () => {
                const wrapper = factory.getMount();

                expect(wrapper.vm.setData(null)).to.equal(undefined);
                expect(wrapper.vm.setData(undefined)).to.equal(undefined);
                expect(wrapper.vm.setData("")).to.equal(undefined);
                expect(wrapper.vm.setData(123)).to.equal(undefined);
                expect(wrapper.vm.setData("str")).to.equal(undefined);
                expect(wrapper.vm.setData([])).to.equal(undefined);
                expect(wrapper.vm.setData()).to.equal(undefined);
            });

            it("should return undefined, if the second param is not a string", () => {
                const wrapper = factory.getMount(),
                    obj = {foo: 123};

                expect(wrapper.vm.setData(obj, null)).to.equal(undefined);
                expect(wrapper.vm.setData(obj, undefined)).to.equal(undefined);
                expect(wrapper.vm.setData(obj, 123)).to.equal(undefined);
                expect(wrapper.vm.setData(obj, [])).to.equal(undefined);
                expect(wrapper.vm.setData(obj, {})).to.equal(undefined);
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

        describe("showFeatures", () => {
            it("should not call function zoomToExtent if there are no job result or job id", async () => {
                const wrapper = factory.getMount(),
                    spyZoomToExtent = sinon.spy(wrapper.vm, "zoomToExtent");

                await wrapper.vm.showFeatures(null);
                expect(spyZoomToExtent.calledOnce).to.be.false;
                await wrapper.vm.showFeatures(0);
                expect(spyZoomToExtent.calledOnce).to.be.false;
                await wrapper.vm.showFeatures(false);
                expect(spyZoomToExtent.calledOnce).to.be.false;
                await wrapper.vm.showFeatures("");
                expect(spyZoomToExtent.calledOnce).to.be.false;
                await wrapper.vm.showFeatures([]);
                expect(spyZoomToExtent.calledOnce).to.be.false;
                await wrapper.vm.showFeatures({jobs: {"id": {}}}, null);
                expect(spyZoomToExtent.calledOnce).to.be.false;
                await wrapper.vm.showFeatures({jobs: {"id": {}}}, 0);
                expect(spyZoomToExtent.calledOnce).to.be.false;
                await wrapper.vm.showFeatures({jobs: {"id": {}}}, false);
                expect(spyZoomToExtent.calledOnce).to.be.false;
                await wrapper.vm.showFeatures({jobs: {"id": {}}}, []);
                expect(spyZoomToExtent.calledOnce).to.be.false;
                await wrapper.vm.showFeatures({jobs: {"id": {}}}, {});
                expect(spyZoomToExtent.calledOnce).to.be.false;
            });

            it("should not call function zoomToExtent if there the job id is not in scenario", async () => {
                const wrapper = factory.getMount(),
                    spyZoomToExtent = sinon.spy(wrapper.vm, "zoomToExtent");

                await wrapper.vm.showFeatures({jobs: {"id1": {}}}, "id2");
                expect(spyZoomToExtent.calledOnce).to.be.false;
                await wrapper.vm.showFeatures({jobs: {"id1": {}}}, "id3");
                expect(spyZoomToExtent.calledOnce).to.be.false;
            });

            it("should call function zoomToExtent", async () => {
                const wrapper = factory.getMount(),
                    spyZoomToExtent = sinon.spy(wrapper.vm, "zoomToExtent");

                await wrapper.vm.showFeatures({jobs: {"id1": {"jobResult": {}}}}, "id1");
                expect(spyZoomToExtent.calledOnce).to.be.true;
            });
        });
    });
});
