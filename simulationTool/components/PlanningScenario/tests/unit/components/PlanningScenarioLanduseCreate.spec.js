import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import layerFactory from "../../../../../../../src/core/layers/js/layerFactory";
import PlanningScenarioLanduseCreate from "../../../PlanningScenarioLanduseCreate.vue";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("addons/SimulationTool/components/PlanningScenario/PlanningScenarioLanduseCreate.vue", () => {
    let selectedDrawType,
        selectedDrawTypeMain,
        store;

    const factory = {
            getShallowMount: () => {
                return shallowMount(PlanningScenarioLanduseCreate, {
                    global: {
                        plugins: [store]
                    }
                });
            }
        },
        layer = layerFactory.createLayer({
            typ: "VECTORBASE",
            id: "planning-scenario",
            name: "planning-scenario",
            alwaysOnTop: true
        });

    beforeEach(() => {
        sinon.stub(PlanningScenarioLanduseCreate.methods, "getLayerSource").returns(layer.getLayerSource());
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
                                landuseCurrentLayout: () => {
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
                                planningScenarioStrokeRange: () => [1, 16],
                                planningScenarioSelectedInteraction: () => null,
                                currentInputName: () => "buildings"
                            }
                        }
                    }
                }
            }
        });
        afterEach(() => {
            sinon.restore();
        });
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
        it("should render draw layouts", () => {
            const wrapper = factory.getShallowMount(),
                drawLayouts = wrapper.find("#draw-layouts");

            expect(drawLayouts.exists()).to.be.true;
        });
    });
});
