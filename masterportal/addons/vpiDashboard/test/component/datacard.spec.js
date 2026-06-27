import DataCardComponent from "../../components/DataCard.vue";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Vuex from "vuex";
import sinon from "sinon";

config.global.mocks.$t = key => key;

/**
 * Run only these tests via command:
 * npm run test:watch -- --grep="addons/vpiDashboard/test/ data card component"
 */
describe("addons/vpiDashboard/test/ data card component", () => {
    let wrapper = null,
        store = null;
    const spyCurrentIndex = sinon.spy(),
        spyCurrentDayIndex = sinon.spy(),
        spyCurrentMonthIndex = sinon.spy(),
        fixedStartYear = 2024;

    beforeEach(() => {
        spyCurrentIndex.resetHistory();
        spyCurrentDayIndex.resetHistory();
        spyCurrentMonthIndex.resetHistory();

        store = new Vuex.Store({
            state: {},
            modules: {
                "Modules/VpiDashboard": {
                    namespaced: true,
                    state: {
                        sumVisitorsPerMonth: [],
                        averageVisitorsPerDay: [],
                        visitorsPerYear: "",
                        currentIndex: 0,
                        currentMonthIndex: 0
                    },
                    getters: {
                        yearList () {
                            const thisYear = new Date().getFullYear(),
                                yearListReturnArray = [];

                            let startYear = fixedStartYear;

                            while (startYear <= thisYear) {
                                yearListReturnArray.push(startYear);
                                startYear++;
                            }

                            return yearListReturnArray;
                        },
                        currentIndex () {
                            return 0;
                        },
                        currentDayIndex () {
                            return 0;
                        },
                        currentMonthIndex () {
                            return 0;
                        }
                    },
                    mutations: {
                        setCurrentIndex: spyCurrentIndex,
                        setCurrentDayIndex: spyCurrentDayIndex,
                        setCurrentMonthIndex: spyCurrentMonthIndex
                    }
                },
                "Language": {
                    namespaced: true,
                    actions: {
                        currentLocale () {
                            return [];
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(
            DataCardComponent, {
                global: {
                    plugins: [store]
                },
                props: {
                    title: "Data-Card",
                    detail: "visitors",
                    navigation: true,
                    subtitle: "Test: Untertitel Data Card"
                }
            }
        );
    });

    afterEach(() => {
        wrapper.unmount();
        wrapper = null;
    });

    it("renders the data card component", () => {
        expect(wrapper.find("#cardData-Card").exists()).to.be.true;
    });

    it("changes the index correctly for visitors", () => {
        wrapper = shallowMount(
            DataCardComponent, {
                global: {
                    plugins: [store]
                },
                props: {
                    title: "Data-Card",
                    detail: "visitors",
                    navigation: true,
                    subtitle: "Test: Untertitel Data Card"
                }
            }
        );
        wrapper.vm.changeIndex(1);

        expect(spyCurrentIndex.callCount).to.equal(1);
        expect(spyCurrentDayIndex.callCount).to.equal(0);
        expect(spyCurrentMonthIndex.callCount).to.equal(0);

        expect(wrapper.emitted().indexChanged[0]).to.deep.equal([1]);
    });

    it("changes the index correctly for daily", () => {
        wrapper = shallowMount(
            DataCardComponent, {
                global: {
                    plugins: [store]
                },
                props: {
                    title: "Data-Card",
                    detail: "daily",
                    navigation: true,
                    subtitle: "Test: Untertitel Data Card"
                }
            }
        );

        wrapper.vm.changeIndex(2);

        expect(spyCurrentIndex.callCount).to.equal(0);
        expect(spyCurrentDayIndex.callCount).to.equal(1);
        expect(spyCurrentMonthIndex.callCount).to.equal(0);

        expect(wrapper.emitted().indexChanged[0]).to.deep.equal([2]);
    });

    it("changes the index correctly for monthly", () => {
        wrapper = shallowMount(
            DataCardComponent, {
                global: {
                    plugins: [store]
                },
                props: {
                    title: "Data-Card",
                    detail: "monthly",
                    navigation: true,
                    subtitle: "Test: Untertitel Data Card"
                }
            }
        );

        wrapper.vm.changeIndex(3);

        expect(spyCurrentIndex.callCount).to.equal(0);
        expect(spyCurrentDayIndex.callCount).to.equal(0);
        expect(spyCurrentMonthIndex.callCount).to.equal(1);

        expect(wrapper.emitted().indexChanged[0]).to.deep.equal([3]);
    });

    it("get list of years for paginator", () => {
        const thisYear = new Date().getFullYear();

        wrapper = shallowMount(
            DataCardComponent, {
                global: {
                    plugins: [store]
                },
                props: {
                    title: "Data-Card",
                    detail: "visitors",
                    navigation: true,
                    subtitle: "Test: Untertitel Data Card"
                }
            }
        );

        expect(wrapper.vm.paginatorData).to.be.an("array");
        expect(wrapper.vm.paginatorData.length).to.equal(thisYear - fixedStartYear + 1);
        expect(wrapper.vm.paginatorData[0]).to.equal(fixedStartYear);
    });
});
