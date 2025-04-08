import {config, mount, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import PlanningScenarioLanduse from "../../../PlanningScenarioLanduse.vue";

config.global.mocks.$t = key => key;

describe("addons/SimulationTool/components/PlanningScenario/PlanningScenarioLanduse.vue", () => {
    let store;

    const factory = {
            getShallowMount: () => {
                return shallowMount(PlanningScenarioLanduse, {
                    global: {
                        plugins: [store]
                    }
                });
            },
            getMount: () => {
                return mount(PlanningScenarioLanduse, {
                    global: {
                        plugins: [store]
                    }
                });
            }
        },
        planningScenarios = [{
            "id": "Scenario1",
            "name": "Planungsszenario 1",
            "features": {
                "building": {
                    "type": "FeatureCollection",
                    "features": [
                        {
                            "type": "Feature",
                            "id": "DEHHALKA10007tqf-piece",
                            "geometry": {
                                "type": "Polygon",
                                "coordinates": [
                                    [[566691.619, 5934737.624], [566678.396, 5934719.947], [566678.335, 5934719.865], [566691.619, 5934737.624]]
                                ]
                            },
                            "properties": {
                                "id": 117244,
                                "building_height": 30.352
                            }
                        },
                        {
                            "type": "Feature",
                            "id": "EHHALKA10007tqf-piece",
                            "geometry": {
                                "type": "Polygon",
                                "coordinates": [
                                    [[566691.619, 5934737.624], [566678.396, 5934719.947], [566678.335, 5934719.865], [566691.619, 5934737.624]]
                                ]
                            },
                            "properties": {
                                "id": 117245,
                                "building_height": 30.352
                            }
                        },
                        {
                            "type": "Feature",
                            "id": "DEHHALKA10007tqf-piece2",
                            "geometry": {
                                "type": "Polygon",
                                "coordinates": [
                                    [[566692.619, 5934737.624], [566678.396, 5934719.947], [566678.335, 5934719.865], [566692.619, 5934737.624]]
                                ]
                            },
                            "properties": {
                                "id": 117244,
                                "building_height": 20.352,
                                "created": true
                            }
                        }
                    ]
                },
                "street": {}
            }
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
                                currentPlanningScenarioId: (state) => state.currentPlanningScenarioId,
                                planningScenarios: (state) => state.planningScenarios
                            },
                            mutations: {
                                setPlanningScenarios (state, value) {
                                    state.planningScenarios = value;
                                }
                            },
                            state: {
                                currentPlanningScenarioId: "Scenario1",
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

        it("should render correct number of existing buildings as default view", () => {
            const wrapper = factory.getShallowMount(),
                activeTab = wrapper.get(".tab-pane.active");

            expect(activeTab.findAll(".list-group-item")).to.have.lengthOf(2);
        });
    });

    describe("methods", () => {
        describe("changeHeight", () => {
            it("should set correct value, no matter if object structure already exists or not", () => {
                const wrapper = factory.getShallowMount(),
                    building1 = {
                        properties: {
                            building_height: 20
                        }
                    },
                    building2 = {},
                    event = {
                        target: {
                            valueAsNumber: 30
                        }
                    };

                wrapper.vm.changeHeight(event, building1);
                wrapper.vm.changeHeight(event, building2);

                expect(building1.properties.building_height).to.equal(30);
                expect(building2.properties.building_height).to.equal(30);
            });
        });
    });
});
