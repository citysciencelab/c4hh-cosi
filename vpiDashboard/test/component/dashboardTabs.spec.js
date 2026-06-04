import {config, shallowMount} from "@vue/test-utils";
import DashboardTabs from "../../components/DashboardTabs.vue";
import {expect} from "chai";
import Vuex from "vuex";
import sinon from "sinon";

config.global.mocks.$t = key => key;

/**
 * Run only these tests via command:
 * npm run test:watch -- --grep="addons/vpiDashboard/test/ DashboardTabs"
 */
describe("addons/vpiDashboard/test/ DashboardTabs", () => {
    let wrapper = null;
    const tabItems = [
            {name: "Tab 1", selected: true},
            {name: "Tab 2", selected: false},
            {name: "Tab 3", selected: false}
        ],
        spySetCurrentTabIndex = sinon.spy();

    beforeAll(() => {
        mapCollection.clear();
        const map = {
            id: "ol",
            mode: "2D",
            getLayers: () => {
                return {
                    getArray: () => {
                        return [{
                            get: (key) => {
                                if (key === "id") {
                                    return "vpi-grid-cells";
                                }
                                return {};
                            },
                            set: () => sinon.stub(),
                            getSource: () => {
                                return {
                                    getFeatures: () => {
                                        return [];
                                    }
                                };
                            }
                        }];
                    }
                };
            }
        };

        mapCollection.addMap(map, "2D");
    });

    beforeEach(() => {
        spySetCurrentTabIndex.resetHistory();
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
                    actions: {
                        toggleLayer: sinon.spy()
                    },
                    mutations: {
                        setSelectLocationBInMap: sinon.spy(),
                        setSelectedLocationId: sinon.spy(),
                        setCurrentTabIndex: spySetCurrentTabIndex
                    },
                    getters: {
                        currentTabIndex: () => {
                            return 0;
                        },
                        selectedLocationBId: () => {
                            return "";
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(
            DashboardTabs, {
                global: {
                    plugins: [store]
                },
                propsData: {
                    tabItems: tabItems
                }
            }
        );
    });

    afterEach(() => {
        wrapper.unmount();
        wrapper = null;
    });

    it("renders the component", () => {
        expect(wrapper.exists()).to.equal(true);
    });

    it("sets the default data values", () => {
        expect(wrapper.vm.currentTabIndex).to.equal(0);
    });

    it("renders tab items", () => {
        const tabLinks = wrapper.findAll(".nav-link");

        expect(tabLinks.length).to.equal(tabItems.length);
        tabItems.forEach((tab, index) => {
            expect(tabLinks.at(index).text()).to.equal(tab.name);
        });
    });

    it("changes tab when clicked", async () => {
        const secondTabLink = wrapper.findAll(".nav-link").at(1);

        await secondTabLink.trigger("click");

        expect(spySetCurrentTabIndex.callCount).to.equal(2);
        expect(tabItems[1].selected).to.equal(true);
        expect(tabItems[0].selected).to.equal(false);
    });
});
