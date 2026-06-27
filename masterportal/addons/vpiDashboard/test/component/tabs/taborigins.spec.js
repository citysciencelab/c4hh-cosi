import TabOriginsComponent from "../../../components/Tabs/TabOrigins.vue";
import axios from "axios";
import sinon from "sinon";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Vuex from "vuex";

config.global.mocks.$t = key => key;

describe("addons/vpiDashboard/components/Tabs/TabOrigins.vue", () => {
    let wrapper = null,
        store = null;

    beforeAll(() => {
        store = new Vuex.Store({
            state: {},
            modules: {
                "Modules/VpiDashboard": {
                    namespaced: true,
                    getters: {
                        selectedLocationId: () => "",
                        yearList: () => [2024, 2025],
                        allOriginsMonthlyData: () => ({
                            2024: [{data: [1, 2, 3]}],
                            2025: [{data: [4, 5, 6]}]
                        }),
                        allOriginsMonthlyDataLine: () => ({
                            2024: [{data: [7, 8, 9]}],
                            2025: [{data: [10, 11, 12]}]
                        }),
                        originsMonthlyXLabels: () => ["Jan", "Feb", "Mar"],
                        currentIndex: () => 0,
                        lineChartOptions: () => ({})
                    },
                    actions: {
                        getOriginsCities: () => Promise.resolve()
                    },
                    mutations: {
                        setLoader: (state, isLoaderShown) => {
                            state.showLoader = isLoaderShown;
                        },
                        setCurrentIndex: (state, index) => {
                            state.currentIndex = index;
                        }
                    }
                }
            }
        });

        sinon.stub(axios, "get").resolves({status: 200, data: {}});
        sinon.stub(axios, "post").resolves({status: 200, data: {}});
    });

    beforeEach(() => {
        wrapper = shallowMount(TabOriginsComponent, {
            global: {
                plugins: [store]
            }
        });
    });

    afterEach(() => {
        wrapper.unmount();
        wrapper = null;
    });

    afterAll(() => {
        sinon.restore();
    });

    it("renders the origins component", () => {
        /* vorübergebend wurden die Karten deaktiviert, da der Dienst nicht performant genug ist
        expect(wrapper.find(".cards").exists()).to.be.true;
        expect(wrapper.findComponent({name: "DataCard"}).exists()).to.be.true;
        */

        expect(wrapper.find(".chartDataSelection").exists()).to.be.true;

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

    it("fetches and updates chart data for monthlyoverview", () => {
        wrapper.vm.selectedChartData = "monthlyoverview";
        wrapper.vm.getCurrentChartsData();

        expect(wrapper.vm.chartdata.bar.datasets).to.deep.equal(wrapper.vm.allOriginsMonthlyData[2024]);
        expect(wrapper.vm.chartdata.line.datasets).to.deep.equal(wrapper.vm.allOriginsMonthlyDataLine[2024]);
        expect(wrapper.vm.chartdata.bar.labels).to.deep.equal(wrapper.vm.originsMonthlyXLabels);
    });

    it("translates keys correctly", () => {
        const translatedKey = wrapper.vm.translate("additional:modules.tools.vpidashboard.unique.monthlyOverview");

        expect(translatedKey).to.equal("additional:modules.tools.vpidashboard.unique.monthlyOverview");
    });


    it("updates chart values", () => {
        const barChartDatasets = [{data: [1, 2, 3]}],
            lineChartDatasets = [{data: [4, 5, 6]}],
            labels = ["Jan", "Feb", "Mar"];

        wrapper.vm.updateChartValues(barChartDatasets, lineChartDatasets, labels);

        expect(wrapper.vm.chartdata.bar.datasets).to.deep.equal(barChartDatasets);
        expect(wrapper.vm.chartdata.line.datasets).to.deep.equal(lineChartDatasets);
        expect(wrapper.vm.chartdata.bar.labels).to.deep.equal(labels);
        expect(wrapper.vm.chartdata.line.labels).to.deep.equal(labels);
    });

});
