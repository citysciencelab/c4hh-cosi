import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import StatisticDashboardCarousel from "@modules/statisticDashboard/components/StatisticDashboardCarousel.vue";

describe("src/modules/statiscticDashboard/components/StatisticDashboardCarousel.vue", () => {
    let store;

    beforeAll(() => {
        i18next.init({
            lng: "cimode",
            debug: false
        });
    });

    beforeEach(() => {
        store = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        StatisticDashboard: {
                            namespaced: true,
                            mutations: {
                                setChosenStatisticName: (state, value) => {
                                    state.chosenStatisticName = value;
                                }
                            },
                            getters: {
                                chosenStatisticName: (state) => state.chosenStatisticName,
                                selectedDatesValues: () => [""],
                                selectedReferenceData: () => "",
                                selectedRegionsValues: () => [""],
                                selectedStatistics: () => {
                                    return {
                                        "arbeitnehmer_inland_tausend": {
                                            "key": "arbeitnehmer_inland_tausend",
                                            "name": "Arbeitnehmer (Inland) in 1.000",
                                            "category": "Beschäftigte",
                                            "selectedOrder": 0
                                        },
                                        "arbeitslose_jahresdurchschnitt": {
                                            "key": "arbeitslose_jahresdurchschnitt",
                                            "name": "Arbeitslose",
                                            "category": "Beschäftigte",
                                            "selectedOrder": 1
                                        }
                                    };
                                }
                            }
                        }
                    }
                }
            }});
    });


    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(StatisticDashboardCarousel, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.exists()).to.be.true;
        });

        it("should find an IconButton component", () => {
            const wrapper = shallowMount(StatisticDashboardCarousel, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.findComponent({name: "IconButton"}).exists()).to.be.true;
        });

        it("should find a static-name container", () => {
            const wrapper = shallowMount(StatisticDashboardCarousel, {
                global: {
                    plugins: [store]
                }
            });

            wrapper.vm.setChosenStatisticName("name");

            expect(wrapper.find(".static-name").exists()).to.be.true;
        });

        it("should find a button element", () => {
            const wrapper = shallowMount(StatisticDashboardCarousel, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find("button").exists()).to.be.true;
        });

        it("should find a statistic-list element", async () => {
            const wrapper = shallowMount(StatisticDashboardCarousel, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find("#statistic-list").exists()).to.be.true;
        });
    });

    describe("Computed Properties", () => {
        it("should set isStatisticsSelected to true", () => {
            const wrapper = shallowMount(StatisticDashboardCarousel, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.vm.isStatisticsSelected).to.be.true;
        });

        it("should set referenceSubTitle to true", () => {
            const wrapper = shallowMount(StatisticDashboardCarousel, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.vm.referenceSubTitle).to.be.true;
        });

        it("should set totalStatistics to 2", () => {
            const wrapper = shallowMount(StatisticDashboardCarousel, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.vm.totalStatistics).to.equal(2);
        });
    });

    describe("Methods", () => {
        describe("prevStatistic", () => {
            it("should set the chosenStatisticName to the previous name", async () => {
                const wrapper = shallowMount(StatisticDashboardCarousel, {
                        global: {
                            plugins: [store]
                        }
                    }),
                    statistics = {
                        "arbeitnehmer_inland_tausend": {
                            "key": "arbeitnehmer_inland_tausend",
                            "name": "Arbeitnehmer (Inland) in 1.000",
                            "category": "Beschäftigte",
                            "selectedOrder": 0
                        },
                        "arbeitslose_jahresdurchschnitt": {
                            "key": "arbeitslose_jahresdurchschnitt",
                            "name": "Arbeitslose",
                            "category": "Beschäftigte",
                            "selectedOrder": 1
                        }
                    };

                wrapper.vm.prevStatistic(1, statistics);
                await wrapper.vm.$nextTick();

                expect(wrapper.vm.chosenStatisticName).to.be.equal("Arbeitnehmer (Inland) in 1.000");
            });
        });
        describe("nextStatistic", () => {
            it("should set the chosenStatisticName to the next name", async () => {
                const wrapper = shallowMount(StatisticDashboardCarousel, {
                        global: {
                            plugins: [store]
                        }
                    }),
                    statistics = {
                        "arbeitnehmer_inland_tausend": {
                            "key": "arbeitnehmer_inland_tausend",
                            "name": "Arbeitnehmer (Inland) in 1.000",
                            "category": "Beschäftigte",
                            "selectedOrder": 0
                        },
                        "arbeitslose_jahresdurchschnitt": {
                            "key": "arbeitslose_jahresdurchschnitt",
                            "name": "Arbeitslose",
                            "category": "Beschäftigte",
                            "selectedOrder": 1
                        }
                    };

                wrapper.vm.nextStatistic(0, statistics);
                await wrapper.vm.$nextTick();

                expect(wrapper.vm.chosenStatisticName).to.be.equal("Arbeitslose");
            });
        });
    });
});
