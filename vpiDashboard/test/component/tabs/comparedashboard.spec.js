import TabCompareDashboard from "../../../components/Tabs/TabCompareDashboard.vue";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Vuex from "vuex";
import sinon from "sinon";


config.global.mocks.$t = key => key;

/**
 * Run only these tests via command:
 * npm run test:watch -- --grep="addons/vpiDashboard/test/ compare dashboard tab component"
 */
describe("addons/vpiDashboard/test/ compare dashboard tab component", () => {
    let wrapper = null;

    beforeAll(() => {
        mapCollection.clear();
        const store = new Vuex.Store({
            state: {},
            modules: {
                "Modules/VpiDashboard": {
                    namespaced: true,
                    getters: {
                        selectedLocationBId: () => "exampleId"
                    },
                    actions: {
                    },
                    mutations: {
                        setSelectLocationBInMap: sinon.spy(),
                        setSelectedLocationId: sinon.spy(),
                        setSelectCount: sinon.spy()
                    }
                }
            }
        });

        wrapper = shallowMount(
            TabCompareDashboard, {
                global: {
                    plugins: [store]
                }
            }
        );
    });

    it("renders the compare dashboard component", () => {
        expect(wrapper.find(".chartDataSelection").exists()).to.be.true;
    });

    it("renders the character selection", () => {
        expect(wrapper.find(".chartDataSelection").exists()).to.be.true;
    });

    it("renders the datepicker", () => {
        expect(wrapper.find(".pickADate").exists()).to.be.true;
    });
});
