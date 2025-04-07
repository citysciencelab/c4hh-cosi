import {config, mount, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import PlanningScenarioOverviewList from "../../../PlanningScenarioOverviewList.vue";
import sinon from "sinon";

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
            },
            getMount: () => {
                return mount(PlanningScenarioOverviewList, {
                    global: {
                        plugins: [store]
                    }
                });
            }
        },
        planningScenarios = [{
            "id": "Scenario1",
            "name": "Planungsszenario 1"
        },
        {
            "id": "Scenario2",
            "name": "Planungsszenario 2"
        },
        {
            "id": "Scenario3",
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
                                planningScenarios: (state) => state.planningScenarios
                            },
                            mutations: {
                                setPlanningScenarios (state, value) {
                                    state.planningScenarios = value;
                                }
                            },
                            state: {
                                planningScenarios: planningScenarios
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

    describe("Methods", () => {
        describe("removeScenarioById", () => {
            it("should remove a scenario by the passed id from the list of scenarios", () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.removeScenarioById(wrapper.vm.planningScenarios, "Scenario2");

                expect(wrapper.vm.planningScenarios).to.have.lengthOf(2);
                expect(wrapper.vm.planningScenarios.find(scenario => scenario.id === "Scenario2")).to.be.undefined;
            });
        });
    });

    describe("User Interaction", () => {
        it("should call 'removeScenarioById' if user clicks the button to remove a scenario", async () => {
            const wrapper = factory.getMount(),
                buttonListWrapper = wrapper.findAll("button"),
                spyRemoveScenarioById = sinon.spy(wrapper.vm, "removeScenarioById");

            // delete first scenario
            await buttonListWrapper.at(3).trigger("click");
            expect(spyRemoveScenarioById.calledOnce).to.be.true;
        });
    });
});
