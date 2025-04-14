import {createStore} from "vuex";
import {config, mount, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import PlanningScenarioCreate from "../../../PlanningScenarioCreate.vue";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("addons/SimulationTool/components/PlanningScenario/PlanningScenarioCreate.vue", () => {
    let selectedDrawType,
        selectedDrawTypeMain,
        store;

    const factory = {
        getMount: () => {
            return mount(PlanningScenarioCreate, {
                global: {
                    plugins: [store]
                }
            });
        },
        getShallowMount: () => {
            return shallowMount(PlanningScenarioCreate, {
                global: {
                    plugins: [store]
                }
            });
        }
    };

    before(() => {
        mapCollection.clear();
        const map = {
            id: "ol",
            mode: "2D",
            addLayer: sinon.spy(),
            getLayers: () => {
                return {
                    getArray: () => []
                };
            }
        };

        mapCollection.addMap(map, "2D");
    });

    beforeEach(() => {
        selectedDrawType = "";
        selectedDrawTypeMain = "";

        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        SimulationTool: {
                            namespaced: true,
                            actions: {},
                            getters: {
                                planningScenarioCurrentLayout: () => {
                                    return {
                                        fillColor: [55, 126, 184],
                                        fillTransparency: 0,
                                        strokeColor: [0, 0, 0],
                                        strokeWidth: 1
                                    };
                                },
                                planningScenarioDrawIcons: () => {
                                    return {
                                        box: "bi-square",
                                        polygon: "bi-octagon"
                                    };
                                },
                                planningScenarioDrawTypesMain: () => ["polygon", "box"],
                                planningScenarioSelectedDrawType: () => selectedDrawType,
                                planningScenarioSelectedDrawTypeMain: () => selectedDrawTypeMain,
                                selectedInteraction: () => "draw",
                                planningScenarioStrokeRange: () => [1, 16]
                            }
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
            const wrapper = factory.getShallowMount();

            expect(wrapper.exists()).to.be.true;
        });
        it("should render draw types", () => {
            const wrapper = factory.getShallowMount(),
                drawTypes = wrapper.find("#draw-types");

            expect(drawTypes.exists()).to.be.true;
        });
        it("should render delete button", () => {
            const wrapper = factory.getShallowMount(),
                deleteButton = wrapper.find(".delete-all");

            expect(deleteButton.exists()).to.be.true;
        });
        it("should render draw layout", () => {
            const wrapper = factory.getShallowMount(),
                drawLayout = wrapper.find("#draw-layouts");

            expect(drawLayout.exists()).to.be.true;
        });
        it("should render input text for simulation name", () => {
            const wrapper = factory.getShallowMount(),
                input = wrapper.find("#plsn-descr");

            expect(input.exists()).to.be.true;
        });
        it("should render dropdown for simulation", () => {
            const wrapper = factory.getShallowMount(),
                dropdown = wrapper.find("#simulateForPlanning");

            expect(dropdown.exists()).to.be.true;
        });
        it("should render back button", () => {
            const wrapper = factory.getShallowMount(),
                backButton = wrapper.find("#back");

            expect(backButton.exists()).to.be.true;
        });
        it("should render save button", () => {
            const wrapper = factory.getShallowMount(),
                saveButton = wrapper.find("#save");

            expect(saveButton.exists()).to.be.true;
        });
        it("should render invalid input field", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                isValid: false,
                scenarioName: ""
            });

            expect(wrapper.find(".invalid-info").exists()).to.be.true;
        });
        it("should render disabled button", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                isValid: false,
                scenarioName: ""
            });

            await wrapper.vm.$nextTick();

            expect(wrapper.find("#save").attributes("disabled")).to.equal("true");
        });
    });

    describe("User Interaction", () => {
        it("should call 'deleteSource' if user start drawing", async () => {
            const spyDeleteSource = sinon.spy(PlanningScenarioCreate.methods, "deleteSource"),
                wrapper = factory.getMount();

            await wrapper.find("#draw-polygon").trigger("drawstart");
            expect(spyDeleteSource.calledOnce).to.be.true;
        });
    });
    describe("Methods", () => {
        it("should set isValid to true if input is not an empty string", () => {
            const wrapper = factory.getMount();

            wrapper.vm.checkInputString("PlanningScenario 1");

            expect(wrapper.vm.isValid).to.be.equal(true);
        });
        it("should set isValid to false if input is an empty string", () => {
            const wrapper = factory.getMount();

            wrapper.vm.checkInputString("");

            expect(wrapper.vm.isValid).to.be.equal(false);
        });
    });
});
