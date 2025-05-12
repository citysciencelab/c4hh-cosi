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
                                currentJobID: () => ""
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
    });
});
