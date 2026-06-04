import TabAgeGroups from "../../../components/Tabs/TabAgeGroups.vue";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Vuex from "vuex";


config.global.mocks.$t = key => key;

/**
 * Run only these tests via command:
 * npm run test:watch -- --grep="addons/vpiDashboard/test/ age groups tab component"
 */
describe("addons/vpiDashboard/test/ age groups tab component", () => {
    let wrapper = null,
        store = null;

    beforeAll(() => {
        store = new Vuex.Store({
            state: {},
            modules: {
                "Modules/VpiDashboard": {
                    namespaced: true,
                    getters: {
                        ageGroupChartLabels () {
                            return [];
                        },
                        ageGroupMonthlyXLabels () {
                            return [];
                        },
                        yearList () {
                            return [2021, 2022, 2023, 2024];
                        },
                        allAgeGroupsMonthlyDataLine () {
                            return {2023: []};
                        },
                        allAgeGroupsMonthlyData () {
                            return {2023: []};
                        },
                        selectedLocationId () {
                            return "";
                        },
                        allAgeGroupsYears () {
                            return [];
                        },
                        ageGroupPieChartLabels () {
                            return [];
                        },
                        ageGroupsYearlyData () {
                            return {2023: []};
                        },
                        sliderData () {
                            return {2023: []};
                        },
                        barChartOptions () {
                            return {};
                        },
                        lineChartOptions () {
                            return {};
                        },
                        currentIndex () {
                            return 0;
                        }
                    },
                    actions: {
                        getAllAgeGroupsData () {
                            return {};
                        }
                    },
                    mutations: {
                        setSliderSelectedValues () {
                            return "";
                        },
                        setSliderData () {
                            return "";
                        }
                    }
                }
            }
        });
    });

    beforeEach(() => {
        wrapper = shallowMount(TabAgeGroups, {
            global: {
                plugins: [store]
            }
        });
    });

    afterEach(() => {
        wrapper.unmount();
        wrapper = null;
    });

    it("renders the age groups component", () => {
        expect(wrapper.find(".piechart").exists()).to.be.true;
    });

    it("sets the correct charttype", async () => {
        wrapper.vm.showChart = true;
        wrapper.vm.setChartType("bar");
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.chartType).to.equal("bar");
        expect(wrapper.find(".bar").exists()).to.be.true;
        expect(wrapper.find(".line").exists()).to.be.false;

        wrapper.vm.setChartType("line");
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.chartType).to.equal("line");
        expect(wrapper.find(".bar").exists()).to.be.false;
        expect(wrapper.find(".line").exists()).to.be.true;
    });
});
