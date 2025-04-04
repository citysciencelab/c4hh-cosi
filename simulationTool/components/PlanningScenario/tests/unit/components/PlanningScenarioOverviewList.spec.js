import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import PlanningScenarioOverviewList from "../../../PlanningScenarioOverviewList.vue";

config.global.mocks.$t = key => key;

describe("addons/SimulationTool/components/PlanningScenario/PlanningScenarioOverviewList.vue", () => {
    let store;

    const factory = {
            getShallowMount: () => {
                return shallowMount(PlanningScenarioOverviewList, {
                    global: {
                        plugins: [store]
                    }
                });
            }
        },
        planningScenarios = [{
            "id": "Szenario1",
            "name": "Planungsszenario 1"
        },
        {
            "id": "Szenario2",
            "name": "Planungsszenario 2"
        },
        {
            "id": "Szenario3",
            "name": "Planungsszenario 3"
        }];

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
                                planningScenarios: () => planningScenarios
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

        it("should find a list group with three items", () => {
            const wrapper = factory.getShallowMount(),
                listGroupWrapper = wrapper.find(".list-group"),
                listGroupItemsWrapper = listGroupWrapper.findAll(".list-group-item");

            expect(listGroupWrapper.exists()).to.be.true;
            expect(listGroupItemsWrapper).to.have.lengthOf(3);
        });

        it("should find four icon button components per list item", () => {
            const wrapper = factory.getShallowMount(),
                listGroupWrapper = wrapper.find(".list-group"),
                listGroupItemWrapper = listGroupWrapper.findAll(".list-group-item").at(0),
                iconComponentsWrapper = listGroupItemWrapper.findAll("icon-button-stub");

            expect(iconComponentsWrapper).to.have.lengthOf(4);
        });
    });
});
