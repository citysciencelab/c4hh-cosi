import TabHeatmap from "../../../components/Tabs/TabHeatMap.vue";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Vuex from "vuex";
import sinon from "sinon";


config.global.mocks.$t = key => key;

/**
 * Run only these tests via command:
 * npm run test:watch -- --grep="addons/vpiDashboard/test/ heatmap tab component"
 */
describe("addons/vpiDashboard/test/ heatmap tab component", () => {
    let wrapper = null;

    const toggleLayerSpy = sinon.spy();

    beforeAll(() => {
        const store = new Vuex.Store({
            state: {},
            modules: {
                "Modules/GetFeatureInfo": {
                    namespaced: true,
                    action: {
                        collectGfiFeatures: sinon.spy()
                    }
                },
                "Maps": {
                    namespaced: true,
                    getters: {
                        clickCoordinate: () => [1, 2]
                    }
                },
                "Modules/VpiDashboard": {
                    namespaced: true,
                    getters: {
                        layerConfigs () {
                            return [];
                        },
                        heatmapLayers () {
                            return [];
                        }
                    },
                    actions: {
                        getGendersData () {
                            return {};
                        },
                        toggleLayer: toggleLayerSpy
                    },
                    mutations: {
                        setLayerConfigs () {
                            return "";
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(
            TabHeatmap, {
                global: {
                    plugins: [store]
                }
            }
        );
    });

    it("renders the heatmap component", () => {
        expect(wrapper.find(".vpi-dashboard-heatmap").exists()).to.be.true;
    });

    it("toggles the heatmap layer", () => {
        wrapper.vm.toggleHeatmapLayer("1");

        expect(toggleLayerSpy.callCount).to.equal(1);
        expect(wrapper.vm.activeLayerId).to.equal("1");
    });
});
