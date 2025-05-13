import {config, mount, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import SimulationResults from "../../../SimulationResults.vue";
import sinon from "sinon";
import axios from "axios";

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
    });
});
