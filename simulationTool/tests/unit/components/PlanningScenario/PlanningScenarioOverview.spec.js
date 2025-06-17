import {config, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import PlanningScenarioOverview from "../../../../components/PlanningScenario/PlanningScenarioOverview.vue";

config.global.mocks.$t = key => key;

describe("addons/SimulationTool/components/PlanningScenario/PlanningScenarioOverview.vue", () => {
    let store;

    const factory = {
            getShallowMount: () => {
                return shallowMount(PlanningScenarioOverview, {
                    global: {
                        plugins: [store]
                    }
                });
            }
        },
        planningScenarios = [];


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

        it("should find a overview list component", () => {
            const wrapper = factory.getShallowMount(),
                overviewListWrapper = wrapper.find("planning-scenario-overview-list-stub");

            expect(overviewListWrapper.exists()).to.be.true;
        });

        it("should find a flat button component to create a scenario", () => {
            const wrapper = factory.getShallowMount(),
                flatButtonWrapper = wrapper.findAll("flat-button-stub");

            expect(flatButtonWrapper.at(0).attributes("text")).to.be.equal("additional:modules.tools.simulationTool.planningScenarioCreate");
        });

        it("should find a flat button component to download all scenario", () => {
            const wrapper = factory.getShallowMount(),
                flatButtonWrapper = wrapper.findAll("flat-button-stub");

            expect(flatButtonWrapper.at(1).attributes("text")).to.be.equal("additional:modules.tools.simulationTool.planningScenarioDownloads");
        });

        it("should disable button if no planningScenarios are present", () => {
            const wrapper = factory.getShallowMount(),
                flatButtonWrapper = wrapper.findAll("flat-button-stub").at(1);

            expect(flatButtonWrapper.attributes().disabled).to.be.equal("true");
        });

        it("should not disable button if planningScenarios are present", async () => {
            const wrapper = factory.getShallowMount(),
                scenarios = [{
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
                }],
                flatButtonWrapper = wrapper.findAll("flat-button-stub").at(1);

            await store.commit("Modules/SimulationTool/setPlanningScenarios", scenarios);

            expect(flatButtonWrapper.attributes().disabled).to.be.equal("false");
        });

        it("should find file upload component", () => {
            const wrapper = factory.getShallowMount(),
                fileUploadWrapper = wrapper.find("file-upload-stub");

            expect(fileUploadWrapper.exists()).to.be.true;
        });
    });
});
