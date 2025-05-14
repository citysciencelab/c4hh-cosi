import {config, mount, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import SimulationResults from "../../../SimulationResults.vue";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("addons/SimulationTool/components/Simulation/SimulationResults.vue", () => {
    let store;

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

    beforeEach(() => {
        store = createStore({
            namespaced: true,
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        SimulationTool: {
                            getters: {
                                currentJobID: () => "jobNo5",
                                planningScenarios: () => [
                                    {jobs: {jobNo5: {requestBody: {inputs:
                                        {anInput: {aProperty: "aValue"}}
                                    }}}}
                                ],
                                simulations: () => []
                            },
                            namespaced: true
                        }
                    }
                }
            }
        });
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
});
