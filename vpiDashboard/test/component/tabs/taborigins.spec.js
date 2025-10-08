import TabOriginsComponent from "../../../components/Tabs/TabOrigins.vue";
import sinon from "sinon";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Vuex from "vuex";

config.global.mocks.$t = key => key;

/**
 * Run only these tests via command:
 * npm run test:watch -- --grep="addons/vpiDashboard/test/ origins tab component"
 */
describe("addons/vpiDashboard/test/ origins tab component", () => {
    let wrapper = null;

    before(() => {
        const store = new Vuex.Store({
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

        wrapper = shallowMount(TabOriginsComponent, {
            global: {
                plugins: [store]
            }
        });
    });

    after(() => {
        sinon.restore();
    });

    it("renders the origins component", () => {
        /* vorübergebend wurden die Karten deaktiviert, da der Dienst nicht performant genug ist
        expect(wrapper.find(".cards").exists()).to.be.true;
        expect(wrapper.findComponent({name: "DataCard"}).exists()).to.be.true;
        */

        expect(wrapper.find(".chartDataSelection").exists()).to.be.true;

    });
    describe.skip("skipped", () => {
        it("sets the correct charttype", () => {
            wrapper.vm.setChartType("bar");

            expect(wrapper.vm.chartType).to.equal("bar");
            expect(wrapper.find(".bar").exists()).to.be.true;
            expect(wrapper.find(".line").exists()).to.be.false;

            wrapper.vm.setChartType("line");
            wrapper.vm.$nextTick(() => {
                expect(wrapper.vm.chartType).to.equal("line");
                expect(wrapper.find(".bar").exists()).to.be.false;
                expect(wrapper.find(".line").exists()).to.be.true;
            });
        });
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
