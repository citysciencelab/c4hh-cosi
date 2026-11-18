import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import StatisticDashboardControls from "@modules/statisticDashboard/components/StatisticDashboardControls.vue";
import indexStatisticDashboard from "@modules/statisticDashboard/store/indexStatisticDashboard.js";


describe("src/modules/statiscticDashboard/components/StatisticDashboardControls.vue", () => {
    const descriptions = [{
            title: "TitleOne",
            content: "ContentOne"
        },
        {
            title: "TitleTwo",
            content: "ContentTwo"
        },
        {
            title: "TitleThree",
            content: "ContentThree"
        }],
        showGrid = false;

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
                        StatisticDashboard: indexStatisticDashboard
                    }
                }
            }});
    });

    /**
     * Sets up two selected statistics and the filters required for their display.
     * @returns {void}
     */
    function setSelectedStatistics (statistics = {
        statisticOne: {name: "Statistic one", category: "Category"},
        statisticTwo: {name: "Statistic two", category: "Category"}
    }) {
        store.commit("Modules/StatisticDashboard/setData", [{
            levelName: "test",
            mappingFilter: {
                statisticsAttributes: statistics
            }
        }]);
        store.commit("Modules/StatisticDashboard/setSelectedLevelName", "test");
        store.commit("Modules/StatisticDashboard/setSelectedStatisticsKeys", Object.keys(statistics));
        store.commit("Modules/StatisticDashboard/setSelectedDates", [{value: "2024"}]);
        store.commit("Modules/StatisticDashboard/setSelectedRegions", [{value: "Region"}]);
    }


    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.exists()).to.be.true;
        });

        it("should find no description", () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    showGrid
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find(".description").exists()).to.be.false;
        });

        it("should find a description", () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    descriptions,
                    showGrid
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find(".description p").text()).to.be.equal("TitleOneContentOne");

        });

        it("should not find a back-overview element", () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    descriptions,
                    showGrid
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find(".back-overview").exists()).to.be.false;
        });

        it("should find a back to overview element", async () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    descriptions,
                    showGrid
                },
                global: {
                    plugins: [store]
                }
            });

            wrapper.vm.setChosenStatisticName("name");
            store.commit("Modules/StatisticDashboard/setChartTableToggle", "chart");
            setSelectedStatistics();
            await wrapper.vm.$nextTick();

            expect(wrapper.find(".back-overview").exists()).to.be.true;
        });

        it("should not find a statistic-name-subtitle element", async () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    descriptions,
                    showGrid
                },
                global: {
                    plugins: [store]
                }
            });

            store.commit("Modules/StatisticDashboard/setSelectedReferenceData", undefined);

            expect(wrapper.find(".statistic-name-subtitle").exists()).to.be.false;
        });

        it("should find a StatisticDashboardCarousel component", () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    descriptions,
                    showGrid
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find(".description p").text()).to.be.equal("TitleOneContentOne");
        });

        it("should not find a StatisticDashboardCarousel component", () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    descriptions,
                    showGrid
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find(".description p").text()).to.be.equal("TitleOneContentOne");
        });
    });

    describe("Computed Properties", () => {
        it("should set hasDescription to false", () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    showGrid
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.vm.hasDescription).to.be.false;
        });

        it("should set hasDescription to true", () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    descriptions,
                    showGrid
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.vm.hasDescription).to.be.true;
        });

        it("should set init description content and title", () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    descriptions,
                    showGrid
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.vm.contentDescription).to.be.equal("ContentOne");
            expect(wrapper.vm.titleDescription).to.be.equal("TitleOne");
        });

        it("should set description content and title by the current index", async () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    descriptions,
                    showGrid
                },
                global: {
                    plugins: [store]
                }
            });

            await wrapper.setData({
                currentDescriptionIndex: 1
            });

            expect(wrapper.vm.contentDescription).to.be.equal("ContentTwo");
            expect(wrapper.vm.titleDescription).to.be.equal("TitleTwo");
        });
        it("should set showStatisticnameInChart to be false", () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    descriptions,
                    showGrid
                },
                global: {
                    plugins: [store]
                }
            });

            wrapper.vm.setChosenStatisticName("");
            store.commit("Modules/StatisticDashboard/setChartTableToggle", "chart");
            expect(wrapper.vm.showStatisticnameInChart).to.be.false;
        });
        it("should set showStatisticnameInChart to be false", () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    descriptions,
                    showGrid
                },
                global: {
                    plugins: [store]
                }
            });

            wrapper.vm.setChosenStatisticName("name");
            store.commit("Modules/StatisticDashboard/setChartTableToggle", "table");
            expect(wrapper.vm.showStatisticnameInChart).to.be.false;
            wrapper.vm.setChosenStatisticName("");
            store.commit("Modules/StatisticDashboard/setChartTableToggle", "chart");
            expect(wrapper.vm.showStatisticnameInChart).to.be.false;
        });
        it("should set showStatisticnameInChart to be true", async () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    descriptions,
                    showGrid
                },
                global: {
                    plugins: [store]
                }
            });

            wrapper.vm.setChosenStatisticName("name");
            store.commit("Modules/StatisticDashboard/setChartTableToggle", "chart");
            setSelectedStatistics();
            expect(wrapper.vm.showStatisticnameInChart).to.be.true;
        });
    });

    describe("Methods", () => {
        describe("nextDescription", () => {
            it("should set currentDescriptionIndex always to 0 if only one description is available", () => {
                const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        descriptions: [descriptions[0]],
                        showGrid
                    },
                    global: {
                        plugins: [store]
                    }
                });

                wrapper.vm.nextDescription();
                expect(wrapper.vm.currentDescriptionIndex).to.be.equal(0);
                wrapper.vm.nextDescription();
                expect(wrapper.vm.currentDescriptionIndex).to.be.equal(0);

            });

            it("should set currentDescriptionIndex in the correct order", () => {
                const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        descriptions,
                        showGrid
                    },
                    global: {
                        plugins: [store]
                    }
                });

                expect(wrapper.vm.currentDescriptionIndex).to.be.equal(0);
                wrapper.vm.nextDescription();
                expect(wrapper.vm.currentDescriptionIndex).to.be.equal(1);
                wrapper.vm.nextDescription();
                expect(wrapper.vm.currentDescriptionIndex).to.be.equal(2);
                wrapper.vm.nextDescription();
                expect(wrapper.vm.currentDescriptionIndex).to.be.equal(0);

            });
        });
        describe("prevDescription", () => {
            it("should set currentDescriptionIndex always to 0 if only one description is available", () => {
                const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        descriptions: [descriptions[0]],
                        showGrid
                    },
                    global: {
                        plugins: [store]
                    }
                });

                wrapper.vm.prevDescription();
                expect(wrapper.vm.currentDescriptionIndex).to.be.equal(0);
                wrapper.vm.prevDescription();
                expect(wrapper.vm.currentDescriptionIndex).to.be.equal(0);

            });

            it("should set currentDescriptionIndex in the correct order", () => {
                const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        descriptions,
                        showGrid
                    },
                    global: {
                        plugins: [store]
                    }
                });

                expect(wrapper.vm.currentDescriptionIndex).to.be.equal(0);
                wrapper.vm.prevDescription();
                expect(wrapper.vm.currentDescriptionIndex).to.be.equal(2);
                wrapper.vm.prevDescription();
                expect(wrapper.vm.currentDescriptionIndex).to.be.equal(1);
                wrapper.vm.prevDescription();
                expect(wrapper.vm.currentDescriptionIndex).to.be.equal(0);

            });
        });
    });

    describe("User Interaction", () => {
        it("should set the description index if the user click the left chevron button", async () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        descriptions,
                        showGrid
                    },
                    global: {
                        plugins: [store]
                    }
                }),
                chevronLeftButton = wrapper.findAll("button.description-icons").at(0);

            await chevronLeftButton.trigger("click");
            expect(wrapper.vm.currentDescriptionIndex).to.be.equal(2);
        });

        it("should set the description index if the user click the right chevron button ", async () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        descriptions,
                        showGrid
                    },
                    global: {
                        plugins: [store]
                    }
                }),
                chevronRightButton = wrapper.findAll("button.description-icons").at(1);

            await chevronRightButton.trigger("click");
            expect(wrapper.vm.currentDescriptionIndex).to.be.equal(1);
        });
    });
});
