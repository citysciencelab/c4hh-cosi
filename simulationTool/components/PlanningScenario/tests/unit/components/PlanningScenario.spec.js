import {config, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import PlanningScenario from "../../../PlanningScenario.vue";
import PlanningScenarioOverview from "../../../PlanningScenarioOverview.vue";
import PlanningScenarioCreate from "../../../PlanningScenarioCreate.vue";
import SimulationToolModule from "../../../../../store/index";

config.global.mocks.$t = key => key;

describe("addons/SimulationTool/components/PlanningScenario/PlanningScenario.vue", () => {
    let wrapper, store;

    beforeEach(() => {
        store = createStore({
            namespaces: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        SimulationTool: SimulationToolModule
                    }
                }
            }
        });
        wrapper = shallowMount(PlanningScenario, {
            global: {
                plugins: [store]
            }
        });
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            expect(wrapper.exists()).to.be.true;
        });

        it("should find component PlanningScenarioOverview", () => {
            expect(wrapper.findComponent(PlanningScenarioOverview).exists()).to.be.true;
            expect(wrapper.findComponent(PlanningScenarioCreate).exists()).to.be.false;
        });

        it("should find component PlanningScenarioCreate", async () => {
            store.commit("Modules/SimulationTool/setCurrentPlanningComponent", "create");
            await wrapper.vm.$nextTick();

            expect(wrapper.findComponent(PlanningScenarioOverview).exists()).to.be.false;
            expect(wrapper.findComponent(PlanningScenarioCreate).exists()).to.be.true;
        });
    });
});
