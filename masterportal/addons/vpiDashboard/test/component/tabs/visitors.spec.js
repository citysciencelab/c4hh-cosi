import TabVisitorsComponent from "../../../components/Tabs/TabVisitors.vue";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Vuex from "vuex";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

config.global.mocks.$t = key => key;

/**
 * Run only these tests via command:
 * npm run test:watch -- --grep="addons/vpiDashboard/test/ visitors tab component"
 */
describe("addons/vpiDashboard/test/ visitors tab component", () => {
    let wrapper = null,
        store = null;

    beforeAll(() => {
        store = new Vuex.Store({
            state: {},
            modules: {
                "Modules/VpiDashboard": {
                    namespaced: true,
                    state: {
                        barChartData: {},
                        lineChartData: {}
                    },
                    actions: {
                        getVisitors () {
                            return {};
                        }
                    },
                    getters: {
                        selectedLocationId: () => "",
                        yearList: () => [2024, 2025],
                        barChartMonthlyData: () => ({}),
                        lineChartMonthlyData: () => ({}),
                        monthlyXLabels: () => [],
                        sliderData: () => [],
                        currentLocale () {
                            return "de-DE";
                        },
                        barChartOptions: () => ({}),
                        lineChartOptions: () => ({}),
                        currentIndex: () => 0
                    },
                    mutations: {
                        setLoader: (state, isLoaderShown) => {
                            state.showLoader = isLoaderShown;
                        },
                        setCurrentIndex: (state, index) => {
                            state.currentIndex = index;
                        },
                        setSliderSelectedValues: (state, values) => {
                            state.sliderSelectedValues = values;
                        },
                        setSliderData: (state, data) => {
                            state.sliderData = data;
                        },
                        setBarChartMonthlyData: (state, year) => {
                            state.barChartMonthlyData = {year};
                        },
                        setLineChartMonthlyData: (state, year) => {
                            state.lineChartMonthlyData = {year};
                        },
                        setBarChartDailyData: (state, payload) => {
                            state.barChartDailyData = payload;
                        },
                        setLineChartDailyData: (state, payload) => {
                            state.lineChartDailyData = payload;
                        }
                    }
                }
            }
        });
    });

    beforeEach(() => {
        wrapper = shallowMount(TabVisitorsComponent, {
            global: {
                plugins: [store]
            }
        });
    });

    afterEach(() => {
        wrapper.unmount();
        wrapper = null;
    });

    it("renders the visitors component", () => {
        expect(wrapper.find(".chartDataSelection").exists()).to.be.true;
    });

    it("recognizes the selectedChartData that needs user interaction", () => {
        wrapper.vm.selectedChartData = "hourly";
        expect(wrapper.vm.isVisitorsChartType).to.be.true;
        wrapper.vm.selectedChartData = "daily";
        expect(wrapper.vm.isVisitorsChartType).to.be.true;
        wrapper.vm.selectedChartData = "overview";
        expect(wrapper.vm.isVisitorsChartType).to.be.false;
        wrapper.vm.selectedChartData = "dailyoverview";
        expect(wrapper.vm.isVisitorsChartType).to.be.false;
        wrapper.vm.selectedChartData = "monthlyoverview";
        expect(wrapper.vm.isVisitorsChartType).to.be.false;
    });

    it("sets the correct charttype", async () => {
        wrapper.vm.showChart = true;
        wrapper.vm.setChartType("bar");
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.chartType).to.equal("bar");
    });

    it("create chart data", () => {
        wrapper.vm.selectedChartData = "hourly";

        const responseData = [
                {
                    "properties": {
                        "datum": "2024-01-01T00:00:00Z",
                        "startuhrzeit": 0,
                        "besucher": 42
                    }
                },
                {
                    "properties": {
                        "datum": "2024-01-01T01:00:00Z",
                        "startuhrzeit": 1,
                        "besucher": 50
                    }
                }
            ],
            testvalue = wrapper.vm.createChartData(responseData, "bar", "hourly");

        expect(testvalue).to.be.an("object");
        expect(testvalue).to.have.property("labels");
        expect(testvalue.labels).to.be.an("array");
        expect(testvalue.labels).to.have.members(["Mo, 01.01.2024 0:00", "Mo, 01.01.2024 1:00"]);

        expect(testvalue).to.have.property("datasets");
        expect(testvalue.datasets).to.have.lengthOf(2);

        // Check the first dataset (Monday to Saturday)
        expect(testvalue.datasets[0]).to.have.property("data");
        expect(testvalue.datasets[0].data).to.be.an("array");
        expect(testvalue.datasets[0].data).to.have.members([42, 50]);

        // Check the second dataset (Sunday)
        expect(testvalue.datasets[1]).to.have.property("data");
        expect(testvalue.datasets[1].data).to.be.an("array");
        expect(testvalue.datasets[1].data).to.have.members([null, null]);
    });

    it("change month in data card", () => {
        wrapper.vm.monthHasChanged(2);

        expect(wrapper.vm.currentlySelectedMonth).to.equal(2);
    });
});
