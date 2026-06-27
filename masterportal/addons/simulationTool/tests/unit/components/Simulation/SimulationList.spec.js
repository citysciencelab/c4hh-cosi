import {config, mount, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import SimulationList from "../../../../components/Simulation/SimulationList.vue";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("addons/SimulationTool/components/Simulation/SimulationList.vue", () => {
    let store;

    const factory = {
        getShallowMount: () => {
            return shallowMount(SimulationList, {
                global: {
                    plugins: [store]
                }
            });
        },
        getMount: () => {
            return mount(SimulationList, {
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
                            namespaced: true,
                            getters: {
                                planningScenarios: () => [],
                                simulationIdForResults: () => null
                            },
                            mutations: {
                                setCurrentPlanningComponent: sinon.stub(),
                                setMode: sinon.stub()
                            }
                        }
                    }
                }
            }
        });
    });


    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.exists()).to.be.true;
        });

        it("should render SectionHeader component", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.findComponent({name: "SectionHeader"}).exists()).to.be.true;
        });

        it("should render FlatButton component", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.findComponent({name: "FlatButton"}).exists()).to.be.true;
        });
    });
});
