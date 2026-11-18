Error.stackTraceLimit = 50;
import {flushPromises, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import dayjs from "dayjs";
import StatisticDashboard from "@modules/statisticDashboard/components/StatisticDashboard.vue";
import FeatureHandler from "@modules/statisticDashboard/js/handleFeatures.js";
import indexStatisticDashboard from "@modules/statisticDashboard/store/indexStatisticDashboard.js";
import LegendComponent from "@modules/statisticDashboard/components/StatisticDashboardLegend.vue";
import StatisticDashboardMapSettings from "@modules/statisticDashboard/components/StatisticDashboardMapSettings.vue";
import sinon from "sinon";
import fetchData from "@modules/statisticDashboard/js/fetchData.js";
import ChartProcessor from "@modules/statisticDashboard/js/chartProcessor.js";
import Overlay from "ol/Overlay.js";
import Select from "ol/interaction/Select.js";
import mapCollection from "@core/maps/js/mapCollection.js";
import {rawLayerList} from "@masterportal/masterportalapi/src/index.js";

import {
    and as andFilter,
    equalTo as equalToFilter
} from "ol/format/filter.js";
import getOAFFeature from "@shared/js/api/oaf/getOAFFeature.js";


/**
 * mocks secondary menu
 * @returns {void}
 */
function addSecondaryMenuElement () {
    const app = document.createElement("div");

    app.setAttribute("id", "mp-menu-secondaryMenu");
    document.body.append(app);
}

describe("src/modules/statisticDashboard/components/StatisticDashboard.vue", () => {
    let store, wrapper, getOAFFeatureStreamStub, initializeDataStub;

    /**
     * Configures the given level as the only level and selects it.
     * @param {Object} level The level to select.
     * @returns {void}
     */
    function setLevel (level) {
        store.commit("Modules/StatisticDashboard/setData", [{
            levelName: "test",
            ...level,
            mappingFilter: {
                statisticsAttributes: {},
                ...level.mappingFilter
            }
        }]);
        store.commit("Modules/StatisticDashboard/setSelectedLevelName", "test");
    }

    /**
     * Sets up a selected level with two statistic attributes.
     * @returns {void}
     */
    function setStatisticsLevel () {
        const statisticsAttributes = {
            bev_maennlich: {name: "Bevölkerung maennlich", category: "Bevölkerung"},
            bev_weiblich: {name: "Bevölkerung weiblich", category: "Bevölkerung"}
        };

        setLevel({mappingFilter: {statisticsAttributes}});
        store.commit("Modules/StatisticDashboard/setSelectedStatisticsKeys", Object.keys(statisticsAttributes));
    }

    /**
     * Creates a shallow-mounted wrapper of the StatisticDashboard component
     * using the global Vuex store instance.
     *
     * @returns {Wrapper} The Vue Test Utils wrapper for the component.
     */
    function createWrapper () {
        return shallowMount(StatisticDashboard, {
            global: {
                plugins: [store]
            }
        });
    }

    const sourceStub = {
            clear: sinon.stub(),
            addFeature: sinon.stub(),
            addFeatures: sinon.stub()
        },
        featureList = [
            {
                type: "Feature",
                properties: {
                    bev_maennlich: "13",
                    bev_weiblich: "12",
                    jahr: "1890",
                    ort: "Hamburg"
                },
                geometry: null
            },
            {
                type: "Feature",
                properties: {
                    bev_maennlich: "113",
                    bev_weiblich: "112",
                    jahr: "1990",
                    ort: "Hamburg"
                },
                geometry: null
            },
            {
                type: "Feature",
                properties: {
                    bev_maennlich: "93",
                    bev_weiblich: "92",
                    jahr: "1990",
                    ort: "Bremen"
                },
                geometry: null
            }
        ];

    beforeEach(() => {
        addSecondaryMenuElement();
        const statisticDashboardState = structuredClone(indexStatisticDashboard.state);

        statisticDashboardState.data = [{
            levelName: "test",
            mappingFilter: {
                statisticsAttributes: {}
            }
        }];
        statisticDashboardState.selectedLevelName = "test";
        store = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        StatisticDashboard: {
                            ...indexStatisticDashboard,
                            state: statisticDashboardState
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    getters: {
                        projection: () => ({
                            getCode: () => "EPSG:25832"
                        })
                    },
                    actions: {
                        addNewLayerIfNotExists: () => {
                            return Promise.resolve({
                                getSource: () => sourceStub,
                                setStyle: () => sinon.stub()
                            });
                        }
                    }
                }
            }});
        // eslint-disable-next-line no-empty-function
        getOAFFeatureStreamStub = sinon.stub(getOAFFeature, "getOAFFeatureStream").returns((async function* () {})());
        initializeDataStub = sinon.stub(StatisticDashboard.methods, "initializeData");
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    describe("created", () => {
        it("should initialize the data of the already selected level when the component is created again", async () => {
            wrapper = createWrapper();
            await flushPromises();

            expect(initializeDataStub.calledOnce).to.be.true;
        });
        it("should select the first level and initialize its data only once via the watcher if no level is selected yet", async () => {
            store.commit("Modules/StatisticDashboard/setSelectedLevelName", undefined);
            wrapper = createWrapper();
            await flushPromises();

            expect(initializeDataStub.calledOnce).to.be.true;
            expect(store.state.Modules.StatisticDashboard.selectedLevelName).to.equal("test");
        });
    });

    describe("keep-alive hooks", () => {
        it("should remove the hover interaction when the dashboard is deactivated", () => {
            const removeHoverInteractionStub = sinon.stub(StatisticDashboard.methods, "removeHoverInteraction");

            wrapper = createWrapper();
            StatisticDashboard.deactivated.call(wrapper.vm);

            expect(removeHoverInteractionStub.calledOnce).to.be.true;
            removeHoverInteractionStub.restore();
        });
        it("should add the hover interaction again when the dashboard is activated with an existing layer", () => {
            const addHoverInteractionStub = sinon.stub(StatisticDashboard.methods, "addHoverInteraction");

            wrapper = createWrapper();
            addHoverInteractionStub.resetHistory();
            wrapper.vm.layer = {};
            wrapper.vm.hoverInteraction = null;
            StatisticDashboard.activated.call(wrapper.vm);

            expect(addHoverInteractionStub.calledOnce).to.be.true;
            addHoverInteractionStub.restore();
        });
        it("should not add the hover interaction when the dashboard is activated without layer or with an existing interaction", () => {
            const addHoverInteractionStub = sinon.stub(StatisticDashboard.methods, "addHoverInteraction");

            wrapper = createWrapper();
            addHoverInteractionStub.resetHistory();
            wrapper.vm.layer = undefined;
            StatisticDashboard.activated.call(wrapper.vm);
            wrapper.vm.layer = {};
            wrapper.vm.hoverInteraction = {};
            StatisticDashboard.activated.call(wrapper.vm);

            expect(addHoverInteractionStub.notCalled).to.be.true;
            addHoverInteractionStub.restore();
        });
    });
    describe("showAggregatedView", () => {
        let warnStub;

        beforeEach(() => {
            warnStub = sinon.stub(console, "warn");
            setLevel({mappingFilter: {statisticsAttributes: {
                popTotal: {name: "Population", category: "Pop", specifics: {gender: ["popM", "popMissing"]}},
                popM: {name: "Male", category: "Pop"}
            }}});
        });

        afterEach(() => {
            warnStub.restore();
        });

        it("should warn about missing specific statistics on creation if showAggregatedView is enabled", () => {
            store.commit("Modules/StatisticDashboard/setShowAggregatedView", true);
            wrapper = createWrapper();

            expect(warnStub.calledWithMatch("\"popMissing\"")).to.be.true;
        });

        it("should not warn about missing specific statistics if showAggregatedView is disabled", () => {
            wrapper = createWrapper();

            expect(warnStub.calledWithMatch("\"popMissing\"")).to.be.false;
        });

        it("should reset the selected specifics tags on resetAll", () => {
            wrapper = createWrapper();
            store.commit("Modules/StatisticDashboard/setSelectedSpecificsTags", {popTotal: ["gender"]});

            wrapper.vm.resetAll();

            expect(store.state.Modules.StatisticDashboard.selectedSpecificsTags).to.deep.equal({});
        });

        it("should reset the selected specifics tags on resetLevel", () => {
            wrapper = createWrapper();
            store.commit("Modules/StatisticDashboard/setSelectedSpecificsTags", {popTotal: ["gender"]});

            wrapper.vm.resetLevel();

            expect(store.state.Modules.StatisticDashboard.selectedSpecificsTags).to.deep.equal({});
        });
    });

    describe("Component DOM", () => {
        it("Level name as switch button should not exist", () => {
            wrapper = createWrapper();

            expect(wrapper.find(".level-switch").exists()).to.be.false;
        });

        it("The legend component should not exist", () => {
            wrapper = createWrapper();

            expect(wrapper.findComponent(LegendComponent).exists()).to.be.false;
        });

        it("The legend component should exist", async () => {
            wrapper = createWrapper();

            store.commit("Modules/StatisticDashboard/setChartTableToggle", "map");
            await wrapper.setData({statisticsData: {"Statistik": {}}});

            expect(wrapper.findComponent(LegendComponent).exists()).to.be.true;
        });

        it("The StatisticDashboardMapSettings component should not exist", async () => {
            wrapper = createWrapper();

            expect(wrapper.findComponent(StatisticDashboardMapSettings).exists()).to.be.false;
        });

        it("The StatisticDashboardMapSettings component should exist", async () => {
            wrapper = createWrapper();

            store.commit("Modules/StatisticDashboard/setChartTableToggle", "map");
            await wrapper.setData({statisticsData: {"Statistik": {}}});

            expect(wrapper.findComponent(StatisticDashboardMapSettings).exists()).to.be.true;
        });

        it("should render filter search field if showLimitView is true", async () => {
            wrapper = createWrapper();

            await wrapper.setData({
                showLimitView: true,
                showChart: true
            });

            expect(wrapper.find(".filtered-areas").exists()).to.be.true;
        });
        it("should render the loading spinner while the reference data is not loaded", async () => {
            wrapper = createWrapper();

            await wrapper.setData({loadedReferenceData: false});

            expect(wrapper.find(".statistic-dashboard-loading").exists()).to.be.true;
        });
        it("should not render the loading spinner if the reference data is loaded", async () => {
            wrapper = createWrapper();

            await wrapper.setData({loadedReferenceData: true});

            expect(wrapper.find(".statistic-dashboard-loading").exists()).to.be.false;
        });
        it("should render info text, if no statistical data is available", async () => {
            wrapper = createWrapper();

            await wrapper.setData({statisticsData: undefined});

            expect(wrapper.find(".bi-info-circle").exists()).to.be.true;
        });
        it("should not render info text, if statistical data is available", async () => {
            wrapper = createWrapper();
            const statData = {
                "Arbeitslose": {
                    "Herzogtum Lauenburg": {
                        "2020": 5785,
                        "2021": 5603
                    },
                    "Harburg": {
                        "2020": 6166,
                        "2021": 6186
                    }
                },
                "Arbeitslose 15 bis unter 25 Jahre": {
                    "Herzogtum Lauenburg": {
                        "2020": 643,
                        "2021": 597
                    },
                    "Harburg": {
                        "2020": 670,
                        "2021": 591
                    }
                }
            };

            await wrapper.setData({statisticsData: statData});

            expect(wrapper.find(".no-data-content").exists()).to.be.false;
        });

        it("should not find a statistic-name-subtitle element", () => {
            // eslint-disable-next-line no-shadow
            const wrapper = shallowMount(StatisticDashboard, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find(".statistic-name-subtitle").exists()).to.be.false;
        });

        it("should find a statistic-name-subtitle element", async () => {
            // eslint-disable-next-line no-shadow
            const wrapper = shallowMount(StatisticDashboard, {
                global: {
                    plugins: [store]
                }
            });

            await wrapper.setData({tableData: [{foo: {}}], referenceSubTitle: "title"});

            expect(wrapper.find(".statistic-name-subtitle").exists()).to.be.true;
        });

        it("should render none IconButton", async () => {
            wrapper = createWrapper();

            await wrapper.setData({showGrid: false});
            await wrapper.vm.$nextTick();

            expect(wrapper.findAllComponents({name: "IconButton"}).length).to.equal(1);
        });
    });

    describe("computed properties", () => {
        describe("statisticForStepValues", () => {
            it("should return expected statistic data", () => {
                wrapper = createWrapper();
                wrapper.setData({statisticsData: {statName: {regionName: {}}}});
                wrapper.vm.setChosenStatisticName("statName");

                expect(wrapper.vm.statisticForStepValues).to.deep.equal({regionName: {}});
            });
            it("should filter out reference region", () => {
                wrapper = createWrapper();
                wrapper.setData({statisticsData: {statName: {"refRegion": {}, "otherRegion": {}}}});
                wrapper.vm.setChosenStatisticName("statName");
                wrapper.vm.setSelectedReferenceData({type: "region", value: "refRegion"});

                expect(wrapper.vm.statisticForStepValues).to.deep.equal({"otherRegion": {}});
            });
        });

        describe("selectedStatisticsNames", () => {
            it("should return an empty array", () => {
                wrapper = createWrapper();

                expect(wrapper.vm.selectedStatisticsNames).to.be.an("array").that.is.empty;
            });
            it("should return the correct statistic names", () => {
                setStatisticsLevel();
                wrapper = createWrapper();

                expect(wrapper.vm.selectedStatisticsNames).to.deep.equal(["Bevölkerung maennlich", "Bevölkerung weiblich"]);
            });
        });
    });
    describe("watchers", () => {
        it("should not call 'checkFilterSettings' if selectedReferenceData is changed", async () => {
            wrapper = createWrapper();
            const spyCheckFilterSettings = sinon.stub(wrapper.vm, "checkFilterSettings");

            store.commit("Modules/StatisticDashboard/setSelectedReferenceData", "foo");
            await wrapper.vm.$nextTick();

            expect(spyCheckFilterSettings.calledOnce).to.be.false;
        });

        it("should call 'checkFilterSettings' if selectedReferenceData is changed", async () => {
            wrapper = createWrapper();

            wrapper.vm.setFlattenedRegions([{
                values: ["foo", "bar"]
            }]);
            wrapper.vm.setSelectedDates([{value: "too"}]);
            wrapper.vm.setSelectedRegions([{value: "too"}]);
            await wrapper.vm.$nextTick();

            const spyCheckFilterSettings = sinon.stub(wrapper.vm, "checkFilterSettings");

            wrapper.vm.setSelectedReferenceData("too");
            await wrapper.vm.$nextTick();

            expect(spyCheckFilterSettings.calledOnce).to.be.true;
        });

        it("should call 'handleChartData' if chosenStatisticName is changed", async () => {
            wrapper = createWrapper();
            sinon.stub(wrapper.vm, "getTableData");
            const spyHandleChartData = sinon.stub(wrapper.vm, "handleChartData");

            await wrapper.setData({statisticsData: {foo: {}}});
            store.commit("Modules/StatisticDashboard/setChosenStatisticName", "foo");
            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();

            expect(spyHandleChartData.calledOnce).to.be.true;
        });

        it("should call 'handleChartData' if showGrid is changed", async () => {
            wrapper = createWrapper();
            const spyHandleChartData = sinon.stub(wrapper.vm, "handleChartData");

            await wrapper.setData({showGrid: true});
            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();
            expect(spyHandleChartData.calledOnce).to.be.true;
        });
    });


    describe("methods", () => {
        describe("prepareLayer", () => {
            it("add the correct number of features", async () => {
                // eslint-disable-next-line no-shadow
                const wrapper = shallowMount(StatisticDashboard, {
                    global: {
                        plugins: [store]
                    }
                });

                await wrapper.vm.$nextTick();
                setLevel({layerId: ["33162"], mappingFilter: {}, geometryAttribute: ["geom"]});

                sinon.stub(wrapper.vm, "getSelectedLevelRegionNameAttributeInDepth").returns({attrName: ["ort"]});
                getOAFFeatureStreamStub.callsFake(async function* () {
                    yield {id: 1, properties: {name: "Feature 1"}};
                    yield {id: 2, properties: {name: "Feature 2"}};
                    yield {id: 3, properties: {name: "Feature 3"}};
                });

                wrapper.vm.layer = {
                    getSource: () => sourceStub,
                    setStyle: sinon.stub()
                };

                await wrapper.vm.prepareLayer();

                expect(sourceStub.addFeatures.calledOnce).to.be.true;
                expect(sourceStub.addFeatures.firstCall.args[0]).to.have.lengthOf(3);
            });
        });
        describe("downloadData", () => {
            it("should call onsuccess without params", () => {
                wrapper = createWrapper();
                const onsuccess = sinon.stub(),
                    statisticsData = wrapper.vm.statisticsData;

                wrapper.vm.downloadData(onsuccess);
                wrapper.vm.statisticsData = null;

                expect(onsuccess.calledWith(null)).to.be.true;
                wrapper.vm.statisticsData = statisticsData;
            });
            it("should call onsuccess with expected params", () => {
                wrapper = createWrapper();
                const statisticsTmp = {
                        "Arbeitslose": {
                            "Herzogtum Lauenburg": {
                                "2020": 5785,
                                "2021": 5603
                            },
                            "Harburg": {
                                "2020": 6166,
                                "2021": 6186
                            }
                        },
                        "Arbeitslose 15 bis unter 25 Jahre": {
                            "Herzogtum Lauenburg": {
                                "2020": 643,
                                "2021": 597
                            },
                            "Harburg": {
                                "2020": 670,
                                "2021": 591
                            }
                        }
                    },
                    onsuccess = sinon.stub(),
                    statisticsData = wrapper.vm.statisticsData,
                    expected = [
                        ["", "Arbeitslose", "Arbeitslose", "Arbeitslose 15 bis unter 25 Jahre", "Arbeitslose 15 bis unter 25 Jahre"],
                        ["Gebiet", "2021", "2020", "2021", "2020"],
                        ["Herzogtum Lauenburg", 5603, 5785, 597, 643],
                        ["Harburg", 6186, 6166, 591, 670]
                    ];

                wrapper.vm.statisticsData = statisticsTmp;
                wrapper.vm.downloadData(onsuccess);

                expect(onsuccess.getCall(0).args[0]).to.deep.equal(expected);
                wrapper.vm.statisticsData = statisticsData;
            });
        });
        describe("loadTableExportData", () => {
            it("should set exportTableData to empty object when downloadData returns null", () => {
                // eslint-disable-next-line no-shadow
                const wrapper = shallowMount(StatisticDashboard, {
                        global: {
                            plugins: [store]
                        }
                    }),
                    downloadDataStub = sinon.stub(wrapper.vm, "downloadData").callsFake((callback) => {
                        callback(null);
                    });

                wrapper.vm.loadTableExportData();

                expect(downloadDataStub.calledOnce).to.be.true;
                expect(wrapper.vm.exportTableData).to.deep.equal({});
            });
            it("should set exportTableData when downloadData returns data", () => {
                // eslint-disable-next-line no-shadow
                const wrapper = shallowMount(StatisticDashboard, {
                        global: {
                            plugins: [store]
                        }
                    }),
                    fakeData = [["header1", "header2"], ["val1", "val2"]],
                    stub = sinon.stub(wrapper.vm, "downloadData").callsFake((callback) => {
                        callback(fakeData);
                    });

                wrapper.vm.loadTableExportData();

                expect(stub.calledOnce).to.be.true;
                expect(wrapper.vm.exportTableData).to.deep.equal(fakeData);
            });
        });
        describe("getUniqueValuesForLevel", () => {
            it("should return an empty object if first parm is not an object", async () => {
                wrapper = createWrapper();

                expect(await wrapper.vm.getUniqueValuesForLevel(undefined)).to.be.an("object").that.is.empty;
                expect(await wrapper.vm.getUniqueValuesForLevel([])).to.be.an("object").that.is.empty;
                expect(await wrapper.vm.getUniqueValuesForLevel(null)).to.be.an("object").that.is.empty;
                expect(await wrapper.vm.getUniqueValuesForLevel(true)).to.be.an("object").that.is.empty;
                expect(await wrapper.vm.getUniqueValuesForLevel(false)).to.be.an("object").that.is.empty;
                expect(await wrapper.vm.getUniqueValuesForLevel(1234)).to.be.an("object").that.is.empty;
                expect(await wrapper.vm.getUniqueValuesForLevel("1234")).to.be.an("object").that.is.empty;
            });
            it("should return an empty object if first param has no child object called mappingFilter", async () => {
                wrapper = createWrapper();

                expect(await wrapper.vm.getUniqueValuesForLevel({})).to.be.an("object").that.is.empty;
            });
            it("should return an empty object if first param has a child object but not expected structure", async () => {
                wrapper = createWrapper();

                expect(await wrapper.vm.getUniqueValuesForLevel({
                    mappingFilter: {}
                })).to.be.an("object").that.is.empty;
            });
            it("should fetch and merge unique values for every layer", async () => {
                wrapper = createWrapper();
                const layerIds = ["1234", "5678"],
                    attrNamesFirstLayer = [
                        "fooBAR",
                        "fowWaw"
                    ],
                    attrNamesSecondLayer = [
                        "fooBAR",
                        "otherRegion"
                    ];

                sinon.stub(fetchData, "getUniqueValues")
                    .onCall(0).resolves({fooBAR: {"2024": true}, fowWaw: {"Hamburg": true}})
                    .onCall(1).resolves({fooBAR: {"2025": true}, otherRegion: {"Bremen": true}});
                const uniqueValues = await wrapper.vm.getUniqueValuesForLevel({
                    layerId: layerIds,
                    mappingFilter: {
                        timeAttribute: {
                            attrName: "fooBAR"
                        },
                        regionNameAttribute: {
                            attrName: ["fowWaw", "otherRegion"]
                        }
                    }
                });

                expect(fetchData.getUniqueValues.calledTwice).to.be.true;
                expect(fetchData.getUniqueValues.firstCall.calledWith(layerIds[0], attrNamesFirstLayer, undefined, undefined)).to.be.true;
                expect(fetchData.getUniqueValues.secondCall.calledWith(layerIds[1], attrNamesSecondLayer, undefined, undefined)).to.be.true;
                expect(uniqueValues).to.deep.equal({
                    fooBAR: {"2024": true, "2025": true},
                    fowWaw: {Hamburg: true},
                    otherRegion: {Bremen: true}
                });
            });
        });
        describe("getAllRegions", () => {
            it("should return an empty array if there are no regions found", () => {
                wrapper = createWrapper();

                expect(wrapper.vm.getAllRegions(undefined)).to.deep.equal([]);
                expect(wrapper.vm.getAllRegions("")).to.deep.equal([]);
                expect(wrapper.vm.getAllRegions(true)).to.deep.equal([]);
                expect(wrapper.vm.getAllRegions({})).to.deep.equal([]);
                expect(wrapper.vm.getAllRegions(true)).to.deep.equal([]);
                expect(wrapper.vm.getAllRegions(0)).to.deep.equal([]);
            });

            it("should return an array with all option", () => {
                wrapper = createWrapper();

                expect(wrapper.vm.getAllRegions(["test", "test2"])).to.deep.equal([
                    {value: ["test", "test2"], title: "Alle Gebiete"},
                    {value: "test", title: "test"},
                    {value: "test2", title: "test2"}
                ]);
            });
        });
        describe("getFilter", () => {
            it("should return undefined if given params has the same length as the data variables", () => {
                wrapper = createWrapper();
                const regions = ["foo", "bar"],
                    dates = ["01.01.1999", "01.01.2000"];

                wrapper.vm.regions = regions;
                wrapper.vm.dates = dates;
                setLevel({
                    "layerId": ["33162"],
                    "geometryAttribute": ["geom"],
                    mappingFilter: {
                        regionNameAttribute: {
                            attrName: ["bar"]
                        }
                    }
                });
                wrapper.vm.setFlattenedRegions([{
                    values: ["foo", "bar"]
                }]);

                expect(wrapper.vm.getFilter(regions, dates)).to.be.undefined;
            });
            it("should call getFilterForList with expected params if regions is the same length as the data variable", () => {
                wrapper = createWrapper();
                const regions = ["foo", "bar"],
                    dates = ["01.01.1999", "01.01.2000"],
                    getFilterForListSpy = sinon.spy(wrapper.vm, "getFilterForList");

                wrapper.vm.dates = ["01.01.1999"];
                setLevel({
                    "layerId": ["33162"],
                    "geometryAttribute": ["geom"],
                    mappingFilter: {
                        regionNameAttribute: {
                            attrName: ["bar"]
                        }
                    }
                });
                wrapper.vm.setFlattenedRegions([{
                    values: ["foo", "bar"]
                }]);
                wrapper.vm.getFilter(regions, dates);

                expect(getFilterForListSpy.calledWith(dates, undefined)).to.be.true;
            });
            it("should call getFilterForList with expected params if dates is the same length as the data variable", () => {
                wrapper = createWrapper();
                const regions = ["foo", "bar"],
                    dates = ["01.01.1999", "01.01.2000"],
                    getFilterForListSpy = sinon.spy(wrapper.vm, "getFilterForList");

                wrapper.vm.dates = dates;
                setLevel({
                    "layerId": ["33162"],
                    "geometryAttribute": ["geom"],
                    mappingFilter: {
                        regionNameAttribute: {
                            attrName: ["bar"]
                        }
                    }
                });
                wrapper.vm.setFlattenedRegions([{
                    values: ["foo"]
                }]);
                wrapper.vm.getFilter(regions, dates, "bar");

                expect(getFilterForListSpy.calledWith(regions, "bar")).to.be.true;
            });
            it("should return an and filter if given regions and dates have values but not the same length as the data values", () => {
                wrapper = createWrapper();
                const regions = ["foo"],
                    dates = ["01.01.1999"],
                    eq1 = equalToFilter("bar", "foo"),
                    eq2 = equalToFilter("bow", "01.01.1999"),
                    expected = andFilter(eq2, eq1);

                wrapper.vm.dates = [...dates, "01.01.2001"];
                setLevel({
                    "layerId": ["33162"],
                    "geometryAttribute": ["geom"],
                    mappingFilter: {
                        timeAttribute: {
                            attrName: "bow"
                        },
                        regionNameAttribute: {
                            attrName: ["bar"]
                        }
                    }
                });
                wrapper.vm.setFlattenedRegions([{
                    values: ["foo", "faw"]
                }]);

                expect(wrapper.vm.getFilter(regions, dates, "bar")).to.deep.equal(expected);
            });
            it("should call andFilter if given regions are all regions and more than one region level is defined and not parent regions have all selected", () => {
                wrapper = createWrapper();
                const regions = ["foo", "bar"],
                    dates = ["01.01.1999", "01.01.2000"],
                    getFilterForListSpy = sinon.spy(wrapper.vm, "getFilterForList");

                wrapper.vm.dates = ["01.01.1999"];
                setLevel({
                    "layerId": ["33162"],
                    "geometryAttribute": ["geom"],
                    mappingFilter: {
                        regionNameAttribute: {
                            attrName: ["bar"]
                        },
                        timeAttribute: {
                            attrName: "date"
                        }
                    }
                });
                wrapper.vm.setFlattenedRegions([
                    {attrName: ["foo"], selectedValues: ["foo"], values: ["foo"], child: "foo"},
                    {attrName: ["bar"], selectedValues: [{label: "bar"}], values: ["bar", "baz"], child: "foo"},
                    {attrName: ["baz"], selectedValues: ["bar", "baz"], values: ["bar", "baz"]}
                ]);
                wrapper.vm.getFilter(regions, dates);

                expect(getFilterForListSpy.getCall(0).args).to.deep.equal([dates, "date"]);
            });
        });
        describe("getFilterForList", () => {
            it("should return undefined if given list is not an array", () => {
                wrapper = createWrapper();

                expect(wrapper.vm.getFilterForList(undefined)).to.be.undefined;
                expect(wrapper.vm.getFilterForList({})).to.be.undefined;
                expect(wrapper.vm.getFilterForList(null)).to.be.undefined;
                expect(wrapper.vm.getFilterForList(true)).to.be.undefined;
                expect(wrapper.vm.getFilterForList(false)).to.be.undefined;
                expect(wrapper.vm.getFilterForList("1234")).to.be.undefined;
                expect(wrapper.vm.getFilterForList(1234)).to.be.undefined;
            });
            it("should return an equalTo filter", () => {
                wrapper = createWrapper();
                const result = wrapper.vm.getFilterForList(["foo"], "bar");

                expect(result.tagName_).to.be.equal("PropertyIsEqualTo");
            });
            it("should return an equalTo filter", () => {
                wrapper = createWrapper();
                const result = wrapper.vm.getFilterForList(["foo", "fow"], "bar");

                expect(result.tagName_).to.be.equal("Or");
            });
        });
        describe("updateReferenceTag", () => {
            it("should not call the method spySetSelectedReferenceValueTag", () => {
                store.commit("Modules/StatisticDashboard/setSelectedReferenceData", {});
                wrapper = createWrapper();
                const spySetSelectedReferenceValueTag = sinon.stub(wrapper.vm, "setSelectedReferenceValueTag");

                wrapper.vm.updateReferenceTag(undefined);

                expect(spySetSelectedReferenceValueTag.calledOnce).to.be.false;
            });
            it("should not call the method spySetSelectedReferenceValueTag", () => {
                store.commit("Modules/StatisticDashboard/setSelectedReferenceData", {});
                wrapper = createWrapper();
                const spySetSelectedReferenceValueTag = sinon.stub(wrapper.vm, "setSelectedReferenceValueTag");

                wrapper.vm.updateReferenceTag("2001", undefined);

                expect(spySetSelectedReferenceValueTag.calledOnce).to.be.false;
            });
            it("should not call the method spySetSelectedReferenceValueTag", () => {
                store.commit("Modules/StatisticDashboard/setSelectedReferenceData", {});
                wrapper = createWrapper();
                const spySetSelectedReferenceValueTag = sinon.stub(wrapper.vm, "setSelectedReferenceValueTag"),
                    selectedLevel = {
                        "layerId": ["28992"],
                        "geometryAttribute": "geom",
                        "timeStepsFilter": {
                            "5": "Die letzten 5 Jahre",
                            "10": "Die letzten 10 Jahre",
                            "all": "Alle Jahre"
                        },
                        "mappingFilter": {
                            "beschaeftigte": {
                                "name": "Beschäftigte",
                                "category": "Beschäftigte",
                                "useConfigName": true
                            }
                        }
                    };

                wrapper.vm.updateReferenceTag("2001", selectedLevel, undefined);

                expect(spySetSelectedReferenceValueTag.calledOnce).to.be.false;
            });
            it("should call the method getSelectedLevelDateAttribute", () => {
                store.commit("Modules/StatisticDashboard/setSelectedReferenceData", {});
                wrapper = createWrapper();
                const selectedLevel = {
                        "layerId": ["28992"],
                        "geometryAttribute": "geom",
                        "timeStepsFilter": {
                            "5": "Die letzten 5 Jahre",
                            "10": "Die letzten 10 Jahre",
                            "all": "Alle Jahre"
                        },
                        "mappingFilter": {
                            "beschaeftigte": {
                                "name": "Beschäftigte",
                                "category": "Beschäftigte",
                                "useConfigName": true
                            }
                        }
                    },
                    referenceFeatures = {
                        "2022-12-31": 70885,
                        "2021-12-31": 69010
                    },
                    spyGetSelectedLevelDateAttribute = sinon.stub(wrapper.vm, "getSelectedLevelDateAttribute");

                wrapper.vm.updateReferenceTag("2021", selectedLevel, referenceFeatures);

                expect(spyGetSelectedLevelDateAttribute.calledOnce).to.be.true;
            });
        });
        describe("setSelectedColumn", () => {
            it("should call 'getStepValue' with the correct arguments", async () => {
                store.commit("Modules/StatisticDashboard/setSelectedReferenceData", undefined);
                wrapper = createWrapper();
                sinon.stub(wrapper.vm, "setStepValues");
                const stubGetStepValue = sinon.stub(FeatureHandler, "getStepValue");

                await wrapper.setData({statisticsData: {}});
                wrapper.vm.setSelectedColumn("2022");

                expect(stubGetStepValue.calledWith({}, 5, "2022")).to.be.true;
            });
        });
        describe("prepareStatisticsData", () => {
            it("should return an object representing the statistics from the features", () => {
                setStatisticsLevel();
                store.commit("Modules/StatisticDashboard/setSelectedReferenceData", {});
                wrapper = createWrapper();
                const statistics = {
                    "Bevölkerung maennlich": {
                        Hamburg: {
                            "1890": 13,
                            "1990": 113
                        }
                    },
                    "Bevölkerung weiblich": {
                        Hamburg: {
                            "1890": 12,
                            "1990": 112
                        }
                    }
                };

                wrapper.vm.statisticsByCategory = [{
                    "bev_maennlich": {
                        "name": "Bevölkerung maennlich"
                    },
                    "bev_weiblich": {
                        "name": "Bevölkerung weiblich"
                    }
                }];

                expect(wrapper.vm.prepareStatisticsData(featureList, ["bev_maennlich", "bev_weiblich"], ["Hamburg"], ["1890", "1990"], {outputFormat: "YYYY", attrName: "jahr"}, "ort")).to.deep.equal(statistics);
            });
        });
        describe("addHoverInteraction", () => {
            const addOverlaySpy = sinon.spy(),
                addInteractionSpy = sinon.spy(),
                mockMap = {
                    addOverlay: addOverlaySpy,
                    addInteraction: addInteractionSpy,
                    removeOverlay: sinon.spy(),
                    removeInteraction: sinon.spy()
                };

            let getMapStub;

            beforeEach(() => {
                getMapStub = sinon.stub(mapCollection, "getMap").returns(mockMap);
            });

            afterEach(() => {
                getMapStub.restore();
            });
            it("should initialize overlay and interaction", () => {

                wrapper = shallowMount(StatisticDashboard, {
                    global: {
                        plugins: [store]
                    }
                });

                wrapper.vm.layer = {};

                wrapper.vm.addHoverInteraction();

                expect(wrapper.vm.overlay).to.be.instanceOf(Overlay);
                expect(wrapper.vm.hoverInteraction).to.be.instanceOf(Select);
                expect(addOverlaySpy.calledOnce).to.be.true;
                expect(addInteractionSpy.calledOnce).to.be.true;
            });
            it("should remove existing overlay and interaction before creating new ones", () => {
                const removeOverlaySpy = sinon.spy(),
                    removeInteractionSpy = sinon.spy();

                wrapper = shallowMount(StatisticDashboard, {
                    global: {
                        plugins: [store]
                    }
                });
                wrapper.vm.layer = {};

                mockMap.removeOverlay = removeOverlaySpy;
                mockMap.removeInteraction = removeInteractionSpy;

                wrapper.vm.addHoverInteraction();

                wrapper.vm.overlay = {
                    setPosition: sinon.spy()
                };

                wrapper.vm.hoverInteraction = {
                    on: sinon.spy()
                };

                wrapper.vm.addHoverInteraction();

                expect(removeOverlaySpy.calledOnce).to.be.true;
                expect(removeInteractionSpy.calledOnce).to.be.true;
            });
        });
        describe("removeHoverInteraction", () => {
            let getMapStub;

            afterEach(() => {
                getMapStub.restore();
            });

            it("should remove the overlay and the interaction from the map", () => {
                const mockMap = {addOverlay: sinon.spy(), addInteraction: sinon.spy(), removeOverlay: sinon.spy(), removeInteraction: sinon.spy()},
                    overlay = {},
                    hoverInteraction = {};

                getMapStub = sinon.stub(mapCollection, "getMap").returns(mockMap);
                wrapper = createWrapper();
                wrapper.vm.overlay = overlay;
                wrapper.vm.hoverInteraction = hoverInteraction;

                wrapper.vm.removeHoverInteraction();

                expect(mockMap.removeOverlay.calledOnceWith(overlay)).to.be.true;
                expect(mockMap.removeInteraction.calledOnceWith(hoverInteraction)).to.be.true;
                expect(wrapper.vm.overlay).to.be.null;
                expect(wrapper.vm.hoverInteraction).to.be.null;
            });
            it("should do nothing if there is no map or nothing to remove", () => {
                const mockMap = {addOverlay: sinon.spy(), addInteraction: sinon.spy(), removeOverlay: sinon.spy(), removeInteraction: sinon.spy()};

                getMapStub = sinon.stub(mapCollection, "getMap").returns(undefined);
                wrapper = createWrapper();
                wrapper.vm.overlay = {};
                wrapper.vm.removeHoverInteraction();

                expect(wrapper.vm.overlay).to.deep.equal({});

                getMapStub.returns(mockMap);
                wrapper.vm.overlay = null;
                wrapper.vm.hoverInteraction = null;
                wrapper.vm.removeHoverInteraction();

                expect(mockMap.removeOverlay.notCalled).to.be.true;
                expect(mockMap.removeInteraction.notCalled).to.be.true;
            });
        });
        describe("getChartDataOutOfDifference", () => {
            it("should return an object representing the statistics from the features", () => {
                store.commit("Modules/StatisticDashboard/setSelectedReferenceData", {});
            });

            it("should return an object representing the statistics from the features without the reference date", async () => {
                setStatisticsLevel();
                wrapper = createWrapper();
                const statistics = {
                    "Bevölkerung maennlich": {
                        Hamburg: {
                            "1890": 13,
                            "1990": 113
                        }
                    },
                    "Bevölkerung weiblich": {
                        Hamburg: {
                            "1890": 12,
                            "1990": 112
                        }
                    }
                };

                wrapper.vm.statisticsByCategory = [{
                    "bev_maennlich": {
                        "name": "Bevölkerung maennlich"
                    },
                    "bev_weiblich": {
                        "name": "Bevölkerung weiblich"
                    }
                }];

                expect(wrapper.vm.getChartDataOutOfDifference(featureList, ["bev_maennlich", "bev_weiblich"], ["Hamburg"], ["1890", "1990"], {outputFormat: "YYYY", attrName: "jahr"}, "ort")).to.deep.equal(statistics);
            });
        });
        describe("getTableData", () => {
            it("should return an empty array if there are no statistic data", () => {
                wrapper = createWrapper();
                const result = wrapper.vm.getTableData({}, "");

                expect(result).to.deep.equal([]);
            });

            it("should return the data for the table(s) from the statistics object according the chosen statistic name", () => {
                wrapper = createWrapper();
                const preparedData = {
                        "Bevölkerung maennlich": {
                            Hamburg: {
                                "1890": "13",
                                "1990": "113"
                            }
                        },
                        "Bevölkerung weiblich": {
                            Hamburg: {
                                "1890": "12",
                                "1990": "112"
                            }
                        }
                    },
                    expectedValue = [{
                        headers: [
                            {name: "Gebiet", index: 0},
                            {name: "1990", index: 1},
                            {name: "1890", index: 2}
                        ],
                        items: [{
                            "1890": "12",
                            "1990": "112",
                            "Gebiet": "Hamburg"
                        }]
                    }],
                    result = wrapper.vm.getTableData(preparedData, "Bevölkerung weiblich");

                expect(result).to.deep.equal(expectedValue);
            });
        });
        describe("handleChartData", () => {
            it("should call prepareGridCharts with expected params", () => {
                wrapper = createWrapper();
                const prepareGridChartsStub = sinon.stub(wrapper.vm, "prepareGridCharts");

                wrapper.vm.handleChartData(["foo", "bar"], [1], [], undefined, false);

                expect(prepareGridChartsStub.calledWith(["foo", "bar"], undefined, "vertical", false)).to.be.true;
            });
            it("should call prepareChartData with expected params for line chart", async () => {
                wrapper = createWrapper();
                const prepareChartDataStub = sinon.stub(wrapper.vm, "prepareChartData");

                wrapper.vm.handleChartData(["foo"], ["region1"], ["date1", "date2"], {foo: "bar"});
                await wrapper.vm.$nextTick();

                expect(prepareChartDataStub.calledWith("foo", "bar", undefined, "line")).to.be.true;
            });
            it("should call prepareChartData with expected params for bar chart", async () => {
                wrapper = createWrapper();
                const prepareChartDataStub = sinon.stub(wrapper.vm, "prepareChartData");

                wrapper.vm.handleChartData(["foo"], ["region1"], ["date1"], {foo: "bar"});
                await wrapper.vm.$nextTick();

                expect(prepareChartDataStub.calledWith("foo", "bar", undefined, "bar", "vertical")).to.be.true;
            });
            it("should call prepareChartData with expected params for bar chart horizontal", async () => {
                wrapper = createWrapper();
                const prepareChartDataStub = sinon.stub(wrapper.vm, "prepareChartData");

                wrapper.vm.handleChartData(["foo"], ["region1", "region2", "region3", "region4", "region5"], ["date1"], {foo: "bar"}, false);
                await wrapper.vm.$nextTick();

                expect(prepareChartDataStub.calledWith("foo", "bar", undefined, "bar", "horizontal")).to.be.true;
            });
        });
        describe("prepareChartData", () => {
            it("should set canvas and chart to property currentChart", () => {
                sinon.stub(ChartProcessor, "createLineChart").returns(null);
                wrapper = createWrapper();
                const topic = "fooBar",
                    canvas = document.createElement("canvas"),
                    expected = {};

                expected[topic] = {
                    chart: null
                };
                wrapper.vm.prepareChartData(topic, undefined, canvas, "line");

                expect(wrapper.vm.currentChart).to.deep.equal(expected);
            });
            it("should set canvas and chart to property currentChart for bar", () => {
                sinon.stub(ChartProcessor, "createBarChart").returns(null);
                wrapper = createWrapper();
                const topic = "fooBar",
                    canvas = document.createElement("canvas"),
                    expected = {};

                expected[topic] = {
                    chart: null
                };
                wrapper.vm.prepareChartData(topic, undefined, canvas, "bar");

                expect(wrapper.vm.currentChart).to.deep.equal(expected);
            });
            it("should destroy existing chart and set canvas and chart to property currentChart", async () => {
                sinon.stub(ChartProcessor, "createLineChart").returns(null);
                wrapper = createWrapper();
                const topic = "fooBar",
                    expected = {};

                expected[topic] = {
                    chart: null
                };
                wrapper.vm.currentChart[topic] = {
                    chart: {destroy: () => sinon.stub()}
                };
                await wrapper.vm.$nextTick();
                wrapper.vm.prepareChartData(topic, undefined, undefined, "line");

                expect(wrapper.vm.currentChart).to.deep.equal(expected);
            });
        });
        describe("hasDescription", () => {
            it("should return true if a description is present", () => {
                wrapper = createWrapper();
                const statistics = {statistik: {name: "Statistik1", description: "StatistikTest1"}};

                expect(wrapper.vm.hasDescription(statistics)).to.be.true;
            });
            it("should return false if no description is present", () => {
                wrapper = createWrapper();
                const statistics = {statistik: {name: "Statistik1"}};

                expect(wrapper.vm.hasDescription(statistics)).to.be.false;
            });
            it("should return true if at least one description is present", () => {
                wrapper = createWrapper();
                const statistics = {statistik: {name: "Statistik1"}, statitsik2: {name: "Statistik2", description: "StatistikTest2"}};

                expect(wrapper.vm.hasDescription(statistics)).to.be.true;
            });
        });
        describe("setDescriptionsOfSelectedStatistics", () => {
            it("should return a description with title and content", () => {
                wrapper = createWrapper();
                const statistics = {statistik: {name: "Statistik1", description: "StatistikTest1"}},
                    expected = [{content: "StatistikTest1", title: "Statistik1"}];

                expect(wrapper.vm.setDescriptionsOfSelectedStatistics(statistics)).to.deep.equal(expected);
            });
        });
        describe("formatFilterExpression", () => {
            it("should return the input if first param is undefined", () => {
                wrapper = createWrapper();

                expect(wrapper.vm.formatFilterExpression(undefined)).to.undefined;
            });
            it("should return the input if second param is not a boolean", () => {
                wrapper = createWrapper();

                expect(wrapper.vm.formatFilterExpression("foo", undefined)).to.be.equal("foo");
                expect(wrapper.vm.formatFilterExpression("foo", null)).to.be.equal("foo");
                expect(wrapper.vm.formatFilterExpression("foo", {})).to.be.equal("foo");
                expect(wrapper.vm.formatFilterExpression("foo", [])).to.be.equal("foo");
                expect(wrapper.vm.formatFilterExpression("foo", 1234)).to.be.equal("foo");
                expect(wrapper.vm.formatFilterExpression("foo", "1234")).to.be.equal("foo");
            });
            it("should return the input as date parsed", () => {
                wrapper = createWrapper();
                const expected = "DATE('01-01-2000')";

                expect(wrapper.vm.formatFilterExpression("01-01-2000", true)).to.be.equal(expected);
            });
            it("should return the input as string parsed", () => {
                wrapper = createWrapper();
                const expected = "'01-01-2000'";

                expect(wrapper.vm.formatFilterExpression("01-01-2000", false)).to.be.equal(expected);
            });
            it("should return the input as string parsed without single quotes", () => {
                wrapper = createWrapper();
                const expected = "10";

                expect(wrapper.vm.formatFilterExpression(10, false)).to.be.equal(expected);
            });
        });
        describe("parseOLFilterToOAF", () => {
            it("should return an empty string if the params are not as expected", () => {
                wrapper = createWrapper();

                expect(wrapper.vm.parseOLFilterToOAF(undefined)).to.be.equal("");
                expect(wrapper.vm.parseOLFilterToOAF({}, undefined)).to.be.equal("");
            });
            it("should return an empty string if the filter has no conditions or is not an filter at all", () => {
                wrapper = createWrapper();

                expect(wrapper.vm.parseOLFilterToOAF({}, {})).to.be.equal("");
            });
            it("should return a string if filter has no conditions but is an filter by itself", () => {
                wrapper = createWrapper();
                const filter = {
                        propertyName: "foo",
                        tagName_: "PropertyIsEqualTo",
                        expression: "bar"
                    },
                    expected = `${filter.propertyName} = ${wrapper.vm.formatFilterExpression(filter.expression, false)}`;

                expect(wrapper.vm.parseOLFilterToOAF(filter, {"PropertyIsEqualTo": "="})).to.be.equal(expected);
            });
            it("should return a string of a nested filter condition", () => {
                wrapper = createWrapper();
                const filter = {
                        tagName_: "And",
                        conditions: [
                            {
                                tagName_: "Or",
                                conditions: [
                                    {
                                        propertyName: "foo",
                                        tagName_: "PropertyIsEqualTo",
                                        expression: "bar"
                                    },
                                    {
                                        propertyName: "foo",
                                        tagName_: "PropertyIsEqualTo",
                                        expression: "baz"
                                    }
                                ]
                            },
                            {
                                tagName_: "Or",
                                conditions: [
                                    {
                                        propertyName: "boo",
                                        tagName_: "PropertyIsEqualTo",
                                        expression: "bar"
                                    },
                                    {
                                        propertyName: "boo",
                                        tagName_: "PropertyIsEqualTo",
                                        expression: "baz"
                                    }
                                ]
                            }
                        ]
                    },
                    expected = "(foo = 'bar' OR foo = 'baz') AND (boo = 'bar' OR boo = 'baz')";

                expect(wrapper.vm.parseOLFilterToOAF(filter, {
                    "Or": "OR",
                    "And": "AND",
                    "PropertyIsEqualTo": "=",
                    "PropertyIsNotEqualTo": "<>",
                    "PropertyIsLessThan": "<",
                    "PropertyIsLessThanOrEqualTo": "<=",
                    "PropertyIsGreaterThan": ">",
                    "PropertyIsGreaterThanOrEqualTo": ">="
                })).to.be.equal(expected);
            });
        });
        describe("getTotalProp", () => {
            it("should return an object", () => {
                wrapper = createWrapper();

                expect(wrapper.vm.getTotalProp(false)).to.deep.equal({
                    enabled: false,
                    rowTitle: true,
                    hintText: "common:modules.statisticDashboard.totalHint"
                });
                expect(wrapper.vm.getTotalProp(true)).to.deep.equal({
                    enabled: true,
                    rowTitle: true,
                    hintText: "common:modules.statisticDashboard.totalHint"
                });
            });
        });
        describe("limitingDataForChart", () => {
            const data = {
                    "Region1": {
                        "2021": 80395,
                        "2022": 73800
                    },
                    "Region2": {
                        "2021": 4478,
                        "2022": 4260
                    },
                    "Region3": {
                        "2021": 6186,
                        "2022": 6065
                    },
                    "Region4": {
                        "2021": 6186,
                        "2022": 6065
                    }
                },
                expectedObject = {
                    "Region1": {
                        "2021": 80395,
                        "2022": 73800
                    },
                    "Region2": {
                        "2021": 4478,
                        "2022": 4260
                    },
                    "Region3": {
                        "2021": 6186,
                        "2022": 6065
                    }
                },
                expectedBarObject = {
                    "Region1": {
                        "2021": 80395,
                        "2022": 73800
                    },
                    "Region2": {
                        "2021": 4478,
                        "2022": 4260
                    },
                    "Region3": {
                        "2021": 6186,
                        "2022": 6065
                    },
                    "Region4": {
                        "2021": 6186,
                        "2022": 6065
                    }
                },
                expectedArray = [
                    "Region1",
                    "Region2",
                    "Region3"
                ],
                expectedBarArray = [
                    "Region1",
                    "Region2",
                    "Region3",
                    "Region4"
                ];

            it("should return trimmed object for line charts", async () => {
                wrapper = createWrapper();

                await wrapper.setData({diagramType: "line"});

                expect(wrapper.vm.limitingDataForChart(data, 3)).to.deep.equal(expectedObject);
                expect(wrapper.vm.showLimitView).to.be.true;
                expect(wrapper.vm.selectedFilteredRegions).to.deep.equal(expectedArray);
            });
            it("should return trimmed object for bar charts", async () => {
                wrapper = createWrapper();

                await wrapper.setData({diagramType: "bar"});

                expect(wrapper.vm.limitingDataForChart(data, 4)).to.deep.equal(expectedBarObject);
                expect(wrapper.vm.showLimitView).to.be.true;
                expect(wrapper.vm.selectedFilteredRegions).to.deep.equal(expectedArray);
                expect(wrapper.vm.allFilteredRegions).to.deep.equal(expectedBarArray);
            });
        });
        describe("addSelectedFilteredRegions", () => {
            it("should add region", async () => {
                wrapper = createWrapper();

                wrapper.vm.selectedFilteredRegions = ["aaaa", "bbbb", "ccccc"];
                wrapper.vm.allFilteredRegions = ["aaaa", "bbbb", "ccccc", "ddddd"];
                wrapper.vm.addSelectedFilteredRegions("ddddd");
                await wrapper.vm.$nextTick();

                expect(wrapper.vm.selectedFilteredRegions).to.deep.equal(["ddddd", "aaaa", "bbbb", "ccccc"]);
                expect(wrapper.vm.allFilteredRegions).to.deep.equal(["ddddd", "aaaa", "bbbb", "ccccc"]);
                expect(wrapper.vm.numberOfColouredBars).to.be.equal(4);
            });
        });
        describe("removeRegion", () => {
            it("should remove selected region", async () => {
                // eslint-disable-next-line no-shadow
                const wrapper = shallowMount(StatisticDashboard, {
                    global: {
                        plugins: [store]
                    }
                });

                await wrapper.setData({diagramType: "line"});
                wrapper.vm.selectedFilteredRegions = ["aaaa", "bbbb", "ccccc", "ddddd"];
                wrapper.vm.removeRegion("ddddd");
                await wrapper.vm.$nextTick();

                expect(wrapper.vm.selectedFilteredRegions).to.deep.equal(["aaaa", "bbbb", "ccccc"]);
            });
            it("should remove region", async () => {
                // eslint-disable-next-line no-shadow
                const wrapper = shallowMount(StatisticDashboard, {
                    global: {
                        plugins: [store]
                    }
                });

                await wrapper.setData({diagramType: "bar", allFilteredRegions: ["aaaa", "bbbb", "ccccc", "ddddd"]});
                wrapper.vm.selectedFilteredRegions = ["aaaa", "bbbb", "ccccc", "ddddd"];
                wrapper.vm.allFilteredRegions = ["aaaa", "bbbb", "ccccc", "ddddd", "eeeee"];
                wrapper.vm.removeRegion("ddddd");
                await wrapper.vm.$nextTick();

                expect(wrapper.vm.selectedFilteredRegions).to.deep.equal(["aaaa", "bbbb", "ccccc"]);
                expect(wrapper.vm.allFilteredRegions).to.deep.equal(["aaaa", "bbbb", "ccccc", "eeeee", "ddddd"]);
                expect(wrapper.vm.numberOfColouredBars).to.be.equal(3);
            });
        });
        describe("createColorPalette", () => {
            it("should return expected result", () => {
                wrapper = createWrapper();

                wrapper.vm.setSelectableColorPalettes([{key: "YlGn"}]);

                expect(wrapper.vm.createColorPalette()).to.deep.equal(
                    [[255, 255, 204], [194, 230, 153], [120, 198, 121], [49, 163, 84], [0, 104, 55]]
                );
            });
        });
        describe("getSelectedLevelRegionNameAttributeInDepth", () => {
            it("should", () => {
                wrapper = createWrapper();
                const obj = {
                        "attrName": ["bundesland"],
                        "name": "Bundesland",
                        "child": {
                            "attrName": ["statistisches_gebiet"],
                            "name": "Kreise und Städte",
                            "child": {
                                "attrName": ["statistisches_gebiet"],
                                "name": "Gemeinden"
                            }
                        }
                    },
                    nameAttribute = wrapper.vm.getSelectedLevelRegionNameAttributeInDepth(obj);

                expect(nameAttribute).to.deep.equal(obj.child.child);
            });
            it("should", () => {
                wrapper = createWrapper();
                const obj = {
                        "attrName": ["bundesland"],
                        "name": "Bundesland"
                    },
                    nameAttribute = wrapper.vm.getSelectedLevelRegionNameAttributeInDepth(obj);

                expect(nameAttribute).to.deep.equal(obj);
            });
        });
        describe("flattenRegionHierarchy", () => {
            it("should flatten the given object", () => {
                wrapper = createWrapper();
                const obj = {
                    "attrName": ["bundesland"],
                    "name": "Bundesland",
                    "child": {
                        "attrName": ["statistisches_gebiet"],
                        "name": "Kreise und Städte"
                    }
                };

                wrapper = createWrapper();
                wrapper.vm.setFlattenedRegions([]);
                wrapper.vm.flattenRegionHierarchy(obj);

                expect(wrapper.vm.flattenedRegions).to.deep.equal([obj, obj.child]);
            });
        });
        describe("getRegionsOptionsForLastChild", () => {
            it("should return an empty array if flattenedRegions is empty", async () => {
                wrapper = createWrapper();

                expect(await wrapper.vm.getRegionsOptionsForLastChild()).to.be.an("array").that.is.empty;
            });
            it("should return the values of the last child if they are already present", async () => {
                wrapper = createWrapper();
                wrapper.vm.setFlattenedRegions([{attrName: "foo", values: ["foo"]}]);

                expect(await wrapper.vm.getRegionsOptionsForLastChild()).to.deep.equal(["foo"]);
            });
            it("should return an empty array if no layer is found", async () => {
                wrapper = createWrapper();
                setLevel({layerId: ["1234"]});
                wrapper.vm.setFlattenedRegions([{attrName: "foo"}]);
                sinon.stub(rawLayerList, "getLayerWhere").returns(undefined);

                expect(await wrapper.vm.getRegionsOptionsForLastChild()).to.be.an("array").that.is.empty;
            });
            it("should return an empty array if selectedLevel has no layerId", async () => {
                wrapper = createWrapper();
                setLevel({});
                wrapper.vm.setFlattenedRegions([{attrName: "foo"}]);

                expect(await wrapper.vm.getRegionsOptionsForLastChild()).to.be.an("array").that.is.empty;
            });
            it("should return an empty array if no unique object for the last child is given", async () => {
                wrapper = createWrapper();
                setLevel({layerId: ["1234"]});
                wrapper.vm.setFlattenedRegions([{attrName: "foo"}]);
                sinon.stub(rawLayerList, "getLayerWhere").returns({});
                sinon.stub(getOAFFeature, "getUniqueValuesByScheme").resolves({});

                expect(await wrapper.vm.getRegionsOptionsForLastChild()).to.be.an("array").that.is.empty;
            });
            it("should return the unique values for the last child", async () => {
                wrapper = createWrapper();
                setLevel({layerId: ["1234"]});
                wrapper.vm.setFlattenedRegions([{attrName: "foo"}]);
                sinon.stub(rawLayerList, "getLayerWhere").returns({});
                sinon.stub(getOAFFeature, "getUniqueValuesByScheme").resolves({foo: {bar: true, fob: true}});

                expect(await wrapper.vm.getRegionsOptionsForLastChild()).to.deep.equal(["bar", "fob"]);
            });
            it("should request the unique values for every layer of the selected level", async () => {
                wrapper = createWrapper();
                const getLayerWhereStub = sinon.stub(rawLayerList, "getLayerWhere"),
                    getUniqueValuesStub = sinon.stub(getOAFFeature, "getUniqueValuesByScheme").resolves({foo: {bar: true, fob: true}});

                getLayerWhereStub.withArgs({id: "1234"}).returns({url: "url1", collection: "col1"});
                getLayerWhereStub.withArgs({id: "5678"}).returns({url: "url2", collection: "col2"});
                setLevel({layerId: ["1234", "5678"]});
                wrapper.vm.setFlattenedRegions([{attrName: "foo"}]);

                expect(await wrapper.vm.getRegionsOptionsForLastChild()).to.deep.equal(["bar", "fob"]);
                expect(getUniqueValuesStub.calledWith("url1", "col1", ["foo"])).to.be.true;
                expect(getUniqueValuesStub.calledWith("url2", "col2", ["foo"])).to.be.true;
            });
        });
        describe("generateDownloadName", () => {
            it("should return a donwload name", () => {
                wrapper = createWrapper();
                wrapper.vm.setChosenStatisticName("statName");

                const date = dayjs().format("YYYY-MM-DD");

                expect(wrapper.vm.generateDownloadName()).to.equal(`statName-${date}.png`);
            });
        });
    });
});
