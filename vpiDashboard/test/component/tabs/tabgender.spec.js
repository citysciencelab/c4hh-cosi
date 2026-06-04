import TabGenders from "../../../components/Tabs/TabGenders.vue";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Vuex from "vuex";


config.global.mocks.$t = key => key;

/**
 * Run only these tests via command:
 * npm run test:watch -- --grep="addons/vpiDashboard/test/ gender tab component"
 */
describe("addons/vpiDashboard/test/ gender tab component", () => {
    let wrapper = null,
        store = null;

    beforeAll(() => {
        store = new Vuex.Store({
            state: {},
            modules: {
                "Modules/VpiDashboard": {
                    namespaced: true,
                    getters: {
                        gendersChartLabels () {
                            return [];
                        },
                        gendersMonthlyXLabels () {
                            return [];
                        },
                        yearList () {
                            return [2021, 2022, 2023, 2024];
                        },
                        gendersMonthlyDataLine () {
                            return {2023: []};
                        },
                        gendersMonthlyData () {
                            return {2023: []};
                        },
                        selectedLocationId () {
                            return "";
                        },
                        gendersYears () {
                            return [];
                        },
                        gendersPieChartLabels () {
                            return [];
                        },
                        gendersYearlyData () {
                            return {2023: []};
                        },
                        sliderData () {
                            return [];
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
                        getGendersData () {
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
        wrapper = shallowMount(TabGenders, {
            global: {
                plugins: [store]
            }
        });
    });

    afterEach(() => {
        wrapper.unmount();
        wrapper = null;
    });

    it("renders the gender component", () => {
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
