import TabsComponent from "../../components/DashboardTabs.vue";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Vuex from "vuex";
import sinon from "sinon";

/**
 * Run only these tests via command:
 * npm run test:watch -- --grep="addons/vpiDashboard/test/ Tabs component"
 */
describe("addons/vpiDashboard/test/ Tabs component", () => {
    let wrapper = null;

    beforeEach(() => {
        const store = new Vuex.Store({
            state: {
                currentTabIndex: 0
            },
            modules: {
                "Modules/VpiDashboard": {
                    namespaced: true,
                    state: {
                        selectedLocationId: null,
                        selectInteraction: {
                            getFeatures: () => {
                                return {
                                    clear: () => {
                                        return true;
                                    }
                                };
                            }
                        }
                    },
                    mutations: {
                        setSelectLocationBInMap: sinon.spy(),
                        setSelectedLocationId: sinon.spy(),
                        setCurrentTabIndex: sinon.spy()
                    },
                    getters: {
                        currentTabIndex: () => {
                            return 0;
                        },
                        selectedLocationBId: () => {
                            return "";
                        }
                    },
                    actions: {
                        toggleLayer: sinon.spy()
                    }
                }
            }
        });

        wrapper = shallowMount(TabsComponent, {
            global: {
                plugins: [store]
            }, propsData: {
                tabItems: [{showLocationSelectMenu: false, name: "Tab 1"}, {showLocationSelectMenu: false, name: "Tab 2"}, {showLocationSelectMenu: false, name: "Tab 3"}]
            }
        });
    });

    afterEach(() => {
        wrapper.unmount();
        wrapper = null;
    });

    it("renders the tabs component", () => {
        expect(wrapper.find("#vpiDashboard-tabs").exists()).to.be.true;
    });
});
