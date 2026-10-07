import {vi} from "vitest";
import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {reactive} from "vue";
import sinon from "sinon";

vi.mock("chart.js", async () => {
    const actual = await vi.importActual("chart.js");

    return {
        ...actual,
        Tooltip: {
            ...actual.Tooltip,
            positioners: {
                ...actual.Tooltip?.positioners || {}
            }
        }
    };
});

import TabGraphics from "../../../components/TabGraphics.vue";

describe("addons/gfiThemes/timeSeriesChart/components/TabGraphics.vue", () => {
    let store, wrapper, queryOaf, queryPercentiles, params, statisticValuesMock, percentilesMock, addSingleAlert, setStatisticValues, allDataMock, addChartToPdf;

    beforeEach(() => {
        statisticValuesMock = reactive([
            {
                "type": "Feature",
                "id": 106420,
                "geometry": null,
                "properties": {
                    "messstellennummer": 2200,
                    "wasserstand_mnhn": 15.19,
                    "wasserstand_mugok": 10.29,
                    "datum_as_date": "2025-08-21",
                    "klassifikation_gwstand": "sehr hoch"
                }
            },
            {
                "type": "Feature",
                "id": 106421,
                "geometry": null,
                "properties": {
                    "messstellennummer": 2200,
                    "wasserstand_mnhn": 15.17,
                    "wasserstand_mugok": 10.31,
                    "datum_as_date": "2025-08-22",
                    "klassifikation_gwstand": "sehr hoch"
                }
            },
            {
                "type": "Feature",
                "id": 106422,
                "geometry": null,
                "properties": {
                    "messstellennummer": 2200,
                    "wasserstand_mnhn": 15.17,
                    "wasserstand_mugok": 10.31,
                    "datum_as_date": "2025-08-23",
                    "klassifikation_gwstand": "sehr hoch"
                }
            },
            {
                "type": "Feature",
                "id": 106423,
                "geometry": null,
                "properties": {
                    "messstellennummer": 2200,
                    "wasserstand_mnhn": 15.16,
                    "wasserstand_mugok": 10.32,
                    "datum_as_date": "2025-08-24",
                    "klassifikation_gwstand": "hoch"
                }
            }
        ]);

        allDataMock = [
            {
                type: "Feature",
                properties: {
                    messstellennummer: 2200,
                    wasserstand_mnhn: 15.0,
                    datum_as_date: "2021-01-15"
                }
            },
            {
                type: "Feature",
                properties: {
                    messstellennummer: 2200,
                    wasserstand_mnhn: 15.1,
                    datum_as_date: "2022-06-15"
                }
            },
            {
                type: "Feature",
                properties: {
                    messstellennummer: 2200,
                    wasserstand_mnhn: 15.2,
                    datum_as_date: "2023-01-01"
                }
            }
        ];

        percentilesMock = [
            {
                "messstellennummer": 2200,
                "perzentile": [
                    {
                        "PRZ_REFERENZMONAT": "01",
                        "MIN": 14.45,
                        "MIN_DESCR": "unterhalb Minimum",
                        "MIN_HEX": "A900E6",
                        "P10": 14.55,
                        "P10_DESCR": "sehr niedrig",
                        "P10_HEX": "FF0000",
                        "P25": 14.59,
                        "P25_DESCR": "niedrig",
                        "P25_HEX": "FFFF00",
                        "P75": 15,
                        "P75_DESCR": "hoch",
                        "P75_HEX": "00C5FF",
                        "P90": 15.13,
                        "P90_DESCR": "sehr hoch",
                        "P90_HEX": "005CE6",
                        "MAX": 15.37,
                        "MAX_DESCR": "oberhalb Maximum",
                        "MAX_HEX": "4C0073"
                    },
                    {
                        "PRZ_REFERENZMONAT": "02",
                        "MIN": 14.45,
                        "MIN_DESCR": "unterhalb Minimum",
                        "MIN_HEX": "A900E6",
                        "P10": 14.57,
                        "P10_DESCR": "sehr niedrig",
                        "P10_HEX": "FF0000",
                        "P25": 14.62,
                        "P25_DESCR": "niedrig",
                        "P25_HEX": "FFFF00",
                        "P75": 15.11,
                        "P75_DESCR": "hoch",
                        "P75_HEX": "00C5FF",
                        "P90": 15.23,
                        "P90_DESCR": "sehr hoch",
                        "P90_HEX": "005CE6",
                        "MAX": 15.37,
                        "MAX_DESCR": "oberhalb Maximum",
                        "MAX_HEX": "4C0073"
                    },
                    {
                        "PRZ_REFERENZMONAT": "03",
                        "MIN": 14.45,
                        "MIN_DESCR": "unterhalb Minimum",
                        "MIN_HEX": "A900E6",
                        "P10": 14.56,
                        "P10_DESCR": "sehr niedrig",
                        "P10_HEX": "FF0000",
                        "P25": 14.66,
                        "P25_DESCR": "niedrig",
                        "P25_HEX": "FFFF00",
                        "P75": 15.21,
                        "P75_DESCR": "hoch",
                        "P75_HEX": "00C5FF",
                        "P90": 15.32,
                        "P90_DESCR": "sehr hoch",
                        "P90_HEX": "005CE6",
                        "MAX": 15.37,
                        "MAX_DESCR": "oberhalb Maximum",
                        "MAX_HEX": "4C0073"
                    }
                ]
            },
            {
                "messstellennummer": 3381,
                "perzentile": [
                    {
                        "PRZ_REFERENZMONAT": "01",
                        "MIN": 9.82,
                        "MIN_DESCR": "unterhalb Minimum",
                        "MIN_HEX": "A900E6",
                        "P10": 10.62,
                        "P10_DESCR": "sehr niedrig",
                        "P10_HEX": "FF0000",
                        "P25": 10.75,
                        "P25_DESCR": "niedrig",
                        "P25_HEX": "FFFF00",
                        "P75": 11.26,
                        "P75_DESCR": "hoch",
                        "P75_HEX": "00C5FF",
                        "P90": 11.67,
                        "P90_DESCR": "sehr hoch",
                        "P90_HEX": "005CE6",
                        "MAX": 11.94,
                        "MAX_DESCR": "oberhalb Maximum",
                        "MAX_HEX": "4C0073"
                    },
                    {
                        "PRZ_REFERENZMONAT": "02",
                        "MIN": 9.82,
                        "MIN_DESCR": "unterhalb Minimum",
                        "MIN_HEX": "A900E6",
                        "P10": 10.62,
                        "P10_DESCR": "sehr niedrig",
                        "P10_HEX": "FF0000",
                        "P25": 10.94,
                        "P25_DESCR": "niedrig",
                        "P25_HEX": "FFFF00",
                        "P75": 11.66,
                        "P75_DESCR": "hoch",
                        "P75_HEX": "00C5FF",
                        "P90": 11.77,
                        "P90_DESCR": "sehr hoch",
                        "P90_HEX": "005CE6",
                        "MAX": 11.94,
                        "MAX_DESCR": "oberhalb Maximum",
                        "MAX_HEX": "4C0073"
                    },
                    {
                        "PRZ_REFERENZMONAT": "03",
                        "MIN": 9.82,
                        "MIN_DESCR": "unterhalb Minimum",
                        "MIN_HEX": "A900E6",
                        "P10": 10.62,
                        "P10_DESCR": "sehr niedrig",
                        "P10_HEX": "FF0000",
                        "P25": 11.15,
                        "P25_DESCR": "niedrig",
                        "P25_HEX": "FFFF00",
                        "P75": 11.59,
                        "P75_DESCR": "hoch",
                        "P75_HEX": "00C5FF",
                        "P90": 11.85,
                        "P90_DESCR": "sehr hoch",
                        "P90_HEX": "005CE6",
                        "MAX": 11.94,
                        "MAX_DESCR": "oberhalb Maximum",
                        "MAX_HEX": "4C0073"
                    }
                ]
            }
        ];

        queryOaf = sinon.spy();
        queryPercentiles = sinon.spy();
        addSingleAlert = sinon.spy();
        setStatisticValues = sinon.spy();
        addChartToPdf = sinon.spy();

        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        TimeSeriesChart: {
                            namespaced: true,
                            actions: {
                                queryOaf,
                                queryPercentiles,
                                addChartToPdf,
                                increaseSidebarWidth: sinon.stub()
                            },
                            getters: {
                                dataLoading: () => false,
                                oafSchema: () => ({
                                    properties: {
                                        gid: {},
                                        datum_as_date: {},
                                        messstellennummer: {"title": "Messstellennummer", "description": "Nummer der Messstelle"},
                                        wasserstand_mnhn: {"title": "Wasserstand in m ü. NHN", "description": "Tagesmittelwert des Wasserstands NHN"},
                                        wasserstand_mugok: {"title": "Wasserstand in m u. GOK", "description": "Tagesmittelwert des Wasserstands (GOK)"}
                                    }
                                }),
                                dateRange: () => ({
                                    allMonths: [],
                                    allYears: [],
                                    twelveMonthsAgoMonth: 6,
                                    twelveMonthsAgoYear: 2023,
                                    endMonth: 6,
                                    endYear: 2024,
                                    allDataStartMonth: 1,
                                    allDataStartYear: 2015
                                }),
                                statisticValues: () => statisticValuesMock,
                                percentiles: () => percentilesMock,
                                allData: () => allDataMock
                            },
                            mutations: {
                                setStatisticValues,
                                setDataLoading: sinon.stub(),
                                setPercentiles: sinon.stub()
                            }
                        }
                    }
                },
                Alerting: {
                    namespaced: true,
                    actions: {
                        addSingleAlert
                    }
                }
            },
            getters: {
                isMobile: () => false
            }
        });

        params = {
            oafParams: {
                url: "https://some/oaf/api",
                collection: "grundwassermessstellen",
                filterCRS: "http://www.opengis.net/def/crs/EPSG/0/25832"
            },
            disclaimer: {
                text: "",
                data: ""
            },
            chartThemes: [
                {
                    chartId: 1,
                    chartTitle: "Wasserstand",
                    queryParams: {
                        properties: [
                            "gid",
                            "datum_as_date",
                            "messstellennummer",
                            "wasserstand_mnhn",
                            "wasserstand_mugok",
                            "klassifikation_gwstand"
                        ],
                        literalFilters: {
                            queryAttribute: "messstellennummer",
                            sortBy: "datum_as_date"
                        }
                    },
                    chartParams: {
                        xAxis: "datum_as_date",
                        yAxisLeft: "wasserstand_mnhn",
                        yAxisRight: "wasserstand_mugok",
                        rightAxisTransform: {
                            referenceAttribute: "gok",
                            operator: "subtract",
                            factor: 1,
                            reverse: false
                        }
                    }
                }
            ]
        };

        wrapper = shallowMount(TabGraphics, {
            global: {
                plugins: [store]
            },
            props: {
                params,
                allAttributes: {}
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
        sinon.restore();
    });

    it("should render the TabGraphics component", () => {
        expect(wrapper.find("#TabGraphics").exists()).to.be.true;
    });

    it("should call queryOaf with the right params when attributes change", async () => {
        const clock = sinon.useFakeTimers(new Date(2024, 5, 15).getTime());

        await wrapper.setProps({
            allAttributes: {
                messstellennummer: "12345"
            }
        });

        expect(queryOaf.lastCall.args[1]).to.deep.equal({
            params: {
                url: "https://some/oaf/api",
                collections: "grundwassermessstellen",
                queryField: "messstellennummer",
                queryProperties: [
                    "gid",
                    "datum_as_date",
                    "messstellennummer",
                    "wasserstand_mnhn",
                    "wasserstand_mugok",
                    "klassifikation_gwstand"
                ],
                literalFilters: {
                    sortby: "datum_as_date"
                },
                queryValue: "12345",
                queryCrs: "http://www.opengis.net/def/crs/EPSG/0/25832",
                dateField: "datum_as_date",
                startDate: undefined,
                endDate: undefined
            },
            queryPurpose: "getAllData",
            epsg: undefined
        });

        clock.restore();
    });

    it("should return all properties from oafSchema when excludeCsvParams is not given", () => {
        expect(wrapper.vm.getCsvParams()).to.deep.equal([
            "gid",
            "datum_as_date",
            "messstellennummer",
            "wasserstand_mnhn",
            "wasserstand_mugok"
        ]);
    });

    it("should exclude the given excludeCsvParams from the oafSchema properties", async () => {
        await wrapper.setProps({
            params: {
                ...params,
                chartThemes: [
                    {
                        ...params.chartThemes[0],
                        excludeCsvParams: ["gid", "wasserstand_mnhn", "wasserstand_mugok"]
                    }
                ]
            }
        });

        expect(wrapper.vm.getCsvParams()).to.deep.equal([
            "datum_as_date",
            "messstellennummer"
        ]);
    });

    it("should only return properties which are set in the oafSchema", async () => {
        await wrapper.setProps({
            params: {
                ...params,
                chartThemes: [
                    {
                        ...params.chartThemes[0],
                        excludeCsvParams: ["gid", "abc"]
                    }
                ]
            }
        });

        expect(wrapper.vm.getCsvParams()).to.deep.equal([
            "datum_as_date",
            "messstellennummer",
            "wasserstand_mnhn",
            "wasserstand_mugok"
        ]);
    });

    it("should return csvParams directly when set on the chart theme", async () => {
        await wrapper.setProps({
            params: {
                ...params,
                chartThemes: [
                    {
                        ...params.chartThemes[0],
                        csvParams: ["messstellennummer"]
                    }
                ]
            }
        });

        expect(wrapper.vm.getCsvParams()).to.deep.equal(["messstellennummer"]);
    });

    it("should detect if data are available and show an info message otherwise", async () => {
        expect(wrapper.vm.hasData).to.be.true;
        expect(wrapper.find("p.noDataInfo").exists()).to.be.false;

        delete statisticValuesMock[0].properties.wasserstand_mnhn;
        delete statisticValuesMock[0].properties.wasserstand_mugok;

        await wrapper.vm.$nextTick();

        expect(wrapper.vm.hasData).to.be.true;
        expect(wrapper.find("p.noDataInfo").exists()).to.be.false;

        statisticValuesMock.forEach(dataset => {
            delete dataset.properties.wasserstand_mnhn;
            delete dataset.properties.wasserstand_mugok;
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.vm.hasData).to.be.false;
        expect(wrapper.find("p.noDataInfo").exists()).to.be.true;
    });

    it("should detect if a right axis shall be drawn", async () => {
        expect(wrapper.vm.hasRightAxis).to.be.true;

        await wrapper.setProps({
            params: {
                ...params,
                chartThemes: [
                    {
                        ...params.chartThemes[0],
                        chartParams: {
                            yAxisRight: false
                        }
                    }
                ]
            }
        });

        expect(wrapper.vm.hasRightAxis).to.be.false;

        await wrapper.setProps({
            params: {
                ...params,
                chartThemes: [
                    {
                        ...params.chartThemes[0],
                        chartParams: {
                            yAxisRight: ""
                        }
                    }
                ]
            }
        });

        expect(wrapper.vm.hasRightAxis).to.be.false;
    });

    it("should get the correct line chart title", async () => {
        await wrapper.setProps({
            allAttributes: {
                messstellennummer: "12345"
            }
        });

        expect(wrapper.vm.getLineChartTitle).to.equal("Messstellennummer 12345");
    });

    it("should get the correct line chart axis values for the left axis", async () => {
        expect(wrapper.vm.minDataValueLeft).to.equal(15.16);
        expect(wrapper.vm.maxDataValueLeft).to.equal(15.19);
        expect(wrapper.vm.stepSizeLeft).to.equal(0.01);
        expect(wrapper.vm.minScaleLeft).to.equal(15.1);
        expect(wrapper.vm.maxScaleLeft).to.equal(15.2);

        statisticValuesMock[0].properties.wasserstand_mnhn = 20.9;

        expect(wrapper.vm.maxDataValueLeft).to.equal(20.9);
        expect(wrapper.vm.stepSizeLeft).to.equal(0.5);
        expect(wrapper.vm.minScaleLeft).to.equal(14.6);
        expect(wrapper.vm.maxScaleLeft).to.equal(21.4);

        expect(wrapper.vm.leftScaleRangeFromPercentiles).to.deep.equal({min: null, max: null});
    });

    it("should get the correct line chart axis values for the right axis", async () => {
        await wrapper.setProps({
            allAttributes: {
                gok: 25.48
            }
        });

        expect(wrapper.vm.minDataValueRight).to.equal(10.29);
        expect(wrapper.vm.maxDataValueRight).to.equal(10.32);
        expect(wrapper.vm.stepSizeRight).to.equal(0.01);
        expect(Number(wrapper.vm.minScaleRight.toFixed(2))).to.equal(10.28);
        expect(Number(wrapper.vm.maxScaleRight.toFixed(2))).to.equal(10.38);

        statisticValuesMock[0].properties.wasserstand_mugok = 19.9;
        statisticValuesMock[0].properties.wasserstand_mnhn = 24.8;

        expect(wrapper.vm.maxDataValueRight).to.equal(19.9);
        expect(wrapper.vm.stepSizeRight).to.equal(0.5);
        expect(Number(wrapper.vm.minScaleRight.toFixed(2))).to.equal(0.18);
        expect(Number(wrapper.vm.maxScaleRight.toFixed(2))).to.equal(10.88);
    });

    describe("percentiles handling", () => {
        it("should find the percentiles for this dataset", async () => {
            await wrapper.setProps({
                params: {
                    ...params,
                    chartThemes: [
                        {
                            ...params.chartThemes[0],
                            chartParams: {
                                yAxisLeft: "wasserstand_mnhn",
                                percentiles: "data available"
                            }
                        }
                    ]
                },
                allAttributes: {
                    messstellennummer: "2200"
                }
            });

            wrapper.vm.getPercentilesForThisData();

            expect(wrapper.vm.percentile).to.be.an("object");
            expect(wrapper.vm.percentile).to.deep.equal(percentilesMock[0]);
            expect(wrapper.vm.leftScaleRangeFromPercentiles).to.deep.equal({min: 13.095, max: 16.852});
            expect(wrapper.vm.minScaleLeft).to.equal(13.095);
            expect(wrapper.vm.maxScaleLeft).to.equal(16.852);
        });

        it("should fall back to scale calculation form data when data our of percentiles", async () => {
            percentilesMock[0].perzentile.forEach(percentage => {
                percentage.P10 = percentage.P10 + 3;
            });

            await wrapper.setProps({
                params: {
                    ...params,
                    chartThemes: [
                        {
                            ...params.chartThemes[0],
                            chartParams: {
                                yAxisLeft: "wasserstand_mnhn",
                                percentiles: "data available"
                            }
                        }
                    ]
                },
                allAttributes: {
                    messstellennummer: "2200"
                }
            });

            wrapper.vm.getPercentilesForThisData();

            expect(wrapper.vm.percentile).to.be.an("object");
            expect(wrapper.vm.percentile).to.deep.equal(percentilesMock[0]);
            expect(wrapper.vm.leftScaleRangeFromPercentiles).to.deep.equal({min: 15.795, max: 16.852});
            expect(wrapper.vm.minScaleLeft).to.equal(15.1);
            expect(wrapper.vm.maxScaleLeft).to.equal(16.852);
        });

        it("should find the correct basis data from the percentiles for this dataset", async () => {
            await wrapper.setProps({
                params: {
                    ...params,
                    chartThemes: [
                        {
                            ...params.chartThemes[0],
                            chartParams: {
                                yAxisLeft: "wasserstand_mnhn",
                                percentiles: "data available"
                            }
                        }
                    ]
                },
                allAttributes: {
                    messstellennummer: "2200"
                }
            });

            wrapper.vm.generatePercentileChartBasis();

            expect(wrapper.vm.percentileChartBasis).to.be.an("object");
            expect(Object.keys(wrapper.vm.percentileChartBasis)).to.have.lengthOf(6);
            expect(wrapper.vm.percentileChartBasis.MIN).to.deep.equal({"title": "unterhalb Minimum", "color": "A900E6"});
        });

        it("should find the correct month key from the date field", () => {
            expect(wrapper.vm.monthKeyFromLabel("20.05.2014")).to.equal("05");
            expect(wrapper.vm.monthKeyFromLabel("20.5.2014")).to.equal("05");
            expect(wrapper.vm.monthKeyFromLabel("05.2014")).to.equal("05");
            expect(wrapper.vm.monthKeyFromLabel("5.2014")).to.equal("05");
            expect(wrapper.vm.monthKeyFromLabel("20/05/2014")).to.equal("05");
            expect(wrapper.vm.monthKeyFromLabel("20/5/2014")).to.equal("05");
            expect(wrapper.vm.monthKeyFromLabel("05/2014")).to.equal("05");
            expect(wrapper.vm.monthKeyFromLabel("5/2014")).to.equal("05");
            expect(wrapper.vm.monthKeyFromLabel("2014-05-20")).to.equal("05");
            expect(wrapper.vm.monthKeyFromLabel("2014-05")).to.equal("05");
        });
    });

    describe("filter methods", () => {
        let clock;

        beforeEach(() => {
            clock = sinon.useFakeTimers(new Date(2024, 5, 15).getTime());
            queryOaf.resetHistory();
            setStatisticValues.resetHistory();
        });

        afterEach(() => {
            clock.restore();
        });

        describe("setDateLastYear", () => {
            it("should set filterRange to 'last-year', clear manual filters and set rangeEndDate to now", () => {
                wrapper.vm.filterRange = "manual";
                wrapper.vm.filterStartMonth = 3;

                wrapper.vm.setDateLastYear();

                expect(wrapper.vm.filterRange).to.equal("last-year");
                expect(wrapper.vm.filterStartMonth).to.be.undefined;
                expect(wrapper.vm.rangeStartDate).to.deep.equal(new Date(2023, 5, 1));
                expect(wrapper.vm.rangeEndDate).to.deep.equal(new Date(2024, 5, 30, 23, 59, 59, 999));
            });
        });

        describe("setDateAllTime", () => {
            it("should set filterRange to 'all-time' and compute the range from dateRange getter", () => {
                wrapper.vm.setDateAllTime();

                expect(wrapper.vm.filterRange).to.equal("all-time");
                expect(wrapper.vm.rangeStartDate).to.deep.equal(new Date(2015, 0, 1));
                expect(wrapper.vm.rangeEndDate).to.deep.equal(new Date(2024, 5, 30, 23, 59, 59, 999));
            });
        });

        describe("filterByManualRange", () => {
            it("should show an alert and not query when start is after end", () => {
                wrapper.vm.filterByManualRange(2023, 6, 2023, 5);

                expect(addSingleAlert.calledOnce).to.be.true;
                expect(addSingleAlert.firstCall.args[1]).to.deep.include({
                    class: "Info",
                    displayClass: "info"
                });
                expect(queryOaf.called).to.be.false;
            });

            it("should set filterRange to 'manual' and compute the correct range", () => {
                wrapper.vm.filterByManualRange(2022, 3, 2022, 8);

                expect(wrapper.vm.filterRange).to.equal("manual");
                expect(wrapper.vm.filterStartYear).to.equal(2022);
                expect(wrapper.vm.filterStartMonth).to.equal(3);
                expect(wrapper.vm.filterEndYear).to.equal(2022);
                expect(wrapper.vm.filterEndMonth).to.equal(8);
                expect(wrapper.vm.rangeStartDate).to.deep.equal(new Date(2022, 2, 1));
                expect(wrapper.vm.rangeEndDate).to.deep.equal(new Date(2022, 7, 31, 23, 59, 59, 999));
                expect(addSingleAlert.called).to.be.false;
            });

        });

        describe("filterFromAllData", () => {
            it("should call setStatisticValues with only the items inside the given date range", async () => {
                clock.restore();
                const {startDate, endDate} = wrapper.vm.setRangeDates(2022, 1, 2022, 12);

                await wrapper.vm.filterFromAllData(startDate, endDate);

                expect(setStatisticValues.called).to.be.true;
                expect(setStatisticValues.lastCall.args[1]).to.deep.equal([allDataMock[1]]);
            });

            it("should call setStatisticValues with an empty array when no items match the range", async () => {
                clock.restore();
                const {startDate, endDate} = wrapper.vm.setRangeDates(2030, 1, 2030, 12);

                await wrapper.vm.filterFromAllData(startDate, endDate);

                expect(setStatisticValues.lastCall.args[1]).to.deep.equal([]);
            });

            it("should include items exactly on the start and end boundary dates", async () => {
                clock.restore();
                const {startDate, endDate} = wrapper.vm.setRangeDates(2021, 1, 2023, 1);

                await wrapper.vm.filterFromAllData(startDate, endDate);

                expect(setStatisticValues.lastCall.args[1]).to.deep.equal(allDataMock);
            });

            it("should return an empty array when allData is empty", async () => {
                allDataMock.length = 0;
                clock.restore();
                const {startDate, endDate} = wrapper.vm.setRangeDates(2021, 1, 2023, 1);

                await wrapper.vm.filterFromAllData(startDate, endDate);

                expect(setStatisticValues.lastCall.args[1]).to.deep.equal([]);
            });

            it("should return an empty array when the end date is before the start date and both are older than 12 months", async () => {
                clock.restore();
                const {startDate, endDate} = wrapper.vm.setRangeDates(2023, 1, 2021, 1);

                await wrapper.vm.filterFromAllData(startDate, endDate);

                expect(setStatisticValues.lastCall.args[1]).to.deep.equal([]);
            });
        });
    });

    describe("disclaimer methods", () => {
        it("should detect if disclaimer shall be shown", async () => {
            await wrapper.setProps({
                params: {
                    ...params,
                    disclaimer: null
                }
            });

            expect(wrapper.vm.hasDisclaimer).to.be.false;
            expect(wrapper.find("div.dataDisclaimerContainer").exists()).to.be.false;

            await wrapper.setProps({
                params: {
                    ...params,
                    disclaimer: {}
                }
            });

            expect(wrapper.vm.hasDisclaimer).to.be.false;
            expect(wrapper.find("div.dataDisclaimerContainer").exists()).to.be.false;

            await wrapper.setProps({
                params: {
                    ...params,
                    disclaimer: {
                        text: "blabla"
                    }
                }
            });

            expect(wrapper.vm.hasDisclaimer).to.be.false;
            expect(wrapper.find("div.dataDisclaimerContainer").exists()).to.be.false;

            await wrapper.setProps({
                params: {
                    ...params,
                    disclaimer: {
                        text: "blabla",
                        data: "blabla"
                    }
                }
            });

            expect(wrapper.vm.hasDisclaimer).to.be.true;
            expect(wrapper.find("div.dataDisclaimerContainer").exists()).to.be.true;
        });

        it("should find all parts of the disclaimer text", async () => {
            const disclaimerParts = {before: "", linkText: "", after: ""};

            await wrapper.setProps({
                params: {
                    ...params,
                    disclaimer: {}
                }
            });
            expect(wrapper.vm.disclaimerParts).to.deep.equal(disclaimerParts);

            await wrapper.setProps({
                params: {
                    ...params,
                    disclaimer: {
                        text: "blabla",
                        data: "blabla"
                    }
                }
            });
            disclaimerParts.before = "blabla";
            expect(wrapper.vm.disclaimerParts).to.deep.equal(disclaimerParts);

            await wrapper.setProps({
                params: {
                    ...params,
                    disclaimer: {
                        text: "blabla<link>text</link>",
                        data: "blabla"
                    }
                }
            });
            disclaimerParts.before = "blabla";
            disclaimerParts.linkText = "text";
            expect(wrapper.vm.disclaimerParts).to.deep.equal(disclaimerParts);

            await wrapper.setProps({
                params: {
                    ...params,
                    disclaimer: {
                        text: "<link>text</link> blabla",
                        data: "blabla"
                    }
                }
            });
            disclaimerParts.before = "";
            disclaimerParts.linkText = "text";
            disclaimerParts.after = " blabla";
            expect(wrapper.vm.disclaimerParts).to.deep.equal(disclaimerParts);

            await wrapper.setProps({
                params: {
                    ...params,
                    disclaimer: {
                        text: "Ungeprüfte Rohdaten. Bitte beachten Sie den <link>Haftungsausschluss</link>.",
                        data: "blabla"
                    }
                }
            });
            disclaimerParts.before = "Ungeprüfte Rohdaten. Bitte beachten Sie den ";
            disclaimerParts.linkText = "Haftungsausschluss";
            disclaimerParts.after = ".";
            expect(wrapper.vm.disclaimerParts).to.deep.equal(disclaimerParts);
        });
    });

    describe("captureChartImage and downloadChartAsPdf", () => {
        let toDataURL, offscreenEl;

        beforeEach(() => {
            toDataURL = sinon.stub().returns("data:image/png;base64,xxx");
            offscreenEl = {
                toDataURL,
                width: 800,
                height: 400
            };
            wrapper.vm.$.refs.offscreenLineChart = {$el: offscreenEl};

            // requestAnimationFrame is not implemented in jsdom by default
            sinon.stub(global, "requestAnimationFrame").callsFake(cb => {
                cb();
                return 0;
            });
        });

        describe("captureChartImage", () => {
            it("should return null when the offscreen chart ref is not available", async () => {
                wrapper.vm.$.refs.offscreenLineChart = null;

                const result = await wrapper.vm.captureChartImage();

                expect(result).to.be.null;
            });

            it("should return imgData, width and height from the offscreen canvas", async () => {
                const result = await wrapper.vm.captureChartImage();

                expect(toDataURL.calledOnceWith("image/png")).to.be.true;
                expect(result).to.deep.equal({
                    imgData: "data:image/png;base64,xxx",
                    width: 800,
                    height: 400
                });
            });
        });

        describe("downloadChartAsPdf", () => {
            it("should not call addChartToPdf when captureChartImage returns null", async () => {
                sinon.stub(wrapper.vm, "captureChartImage").resolves(null);

                await wrapper.vm.downloadChartAsPdf();

                expect(addChartToPdf.called).to.be.false;
                wrapper.vm.captureChartImage.restore();
            });

            it("should call addChartToPdf with an empty titleArray when no pdfParams are configured", async () => {
                await wrapper.vm.downloadChartAsPdf();

                expect(addChartToPdf.calledOnce).to.be.true;
                expect(addChartToPdf.firstCall.args[1]).to.deep.equal({
                    imgData: "data:image/png;base64,xxx",
                    width: 800,
                    height: 400,
                    titleArray: [],
                    useHamburgDesign: undefined,
                    logoPath: undefined
                });
            });

            it("should build titleArray entries with label and postfix when configured", async () => {
                await wrapper.setProps({
                    allAttributes: {
                        messstellennummer: "12345",
                        gok: 25.48,
                        test: "value"
                    },
                    params: {
                        ...params,
                        chartThemes: [
                            {
                                ...params.chartThemes[0],
                                pdfParams: {
                                    useHamburgDesign: true,
                                    base64LogoPath: "data:image/png;base64,logo",
                                    titleAttributes: {
                                        messstellennummer: {
                                            label: "Messstelle"
                                        },
                                        gok: {
                                            label: "GOK",
                                            postfix: "m"
                                        },
                                        test: ""
                                    }
                                }
                            }
                        ]
                    }
                });

                // eslint-disable-next-line require-atomic-updates -- synchronous test setup, no concurrent access
                wrapper.vm.$.refs.offscreenLineChart = {$el: offscreenEl};

                await wrapper.vm.downloadChartAsPdf();

                expect(addChartToPdf.lastCall.args[1]).to.deep.equal({
                    imgData: "data:image/png;base64,xxx",
                    width: 800,
                    height: 400,
                    titleArray: ["Messstelle: 12345", "GOK: 25,48 m", "value"],
                    useHamburgDesign: true,
                    logoPath: "data:image/png;base64,logo"
                });
            });
        });

        describe("table generation", () => {
            beforeEach(async () => {
                await wrapper.setProps({
                    params: {
                        ...params,
                        chartThemes: [
                            {
                                ...params.chartThemes[0],
                                tableParams: ["datum_as_date", "messstellennummer", "wasserstand_mnhn", "klassifikation_gwstand"]
                            }
                        ]
                    }
                });
            });

            it("should build headers with displayName from oafSchema title", () => {
                expect(wrapper.vm.tableData.headers).to.deep.equal([
                    {name: "datum_as_date", displayName: "datum_as_date", index: 0},
                    {name: "messstellennummer", displayName: "Messstellennummer", index: 1},
                    {name: "wasserstand_mnhn", displayName: "Wasserstand in m ü. NHN", index: 2},
                    {name: "klassifikation_gwstand", displayName: "klassifikation_gwstand", index: 3}
                ]);
            });

            it("should return empty headers and an item per dataset (with no keys) when tableParams is not configured", async () => {
                await wrapper.setProps({
                    params: {
                        ...params,
                        chartThemes: [
                            {
                                ...params.chartThemes[0],
                                tableParams: undefined
                            }
                        ]
                    }
                });

                expect(wrapper.vm.tableData).to.deep.equal({
                    headers: [],
                    items: statisticValuesMock.map(() => ({}))
                });
            });

            it("should build items from statisticValues using only the configured tableParams keys", () => {
                expect(wrapper.vm.tableData.items).to.deep.equal([
                    {datum_as_date: "21/08/2025", messstellennummer: 2200, wasserstand_mnhn: 15.19, klassifikation_gwstand: "sehr hoch"},
                    {datum_as_date: "22/08/2025", messstellennummer: 2200, wasserstand_mnhn: 15.17, klassifikation_gwstand: "sehr hoch"},
                    {datum_as_date: "23/08/2025", messstellennummer: 2200, wasserstand_mnhn: 15.17, klassifikation_gwstand: "sehr hoch"},
                    {datum_as_date: "24/08/2025", messstellennummer: 2200, wasserstand_mnhn: 15.16, klassifikation_gwstand: "hoch"}
                ]);
            });

            it("should format date-like values as DD/MM/YYYY", () => {
                expect(wrapper.vm.checkValueAndFormatDate("2025-08-21")).to.equal("21/08/2025");
            });

            it("should return '-' for null or undefined values", () => {
                expect(wrapper.vm.checkValueAndFormatDate(null)).to.equal("-");
                expect(wrapper.vm.checkValueAndFormatDate(undefined)).to.equal("-");
            });

            it("should return non-date values unchanged", () => {
                expect(wrapper.vm.checkValueAndFormatDate("sehr hoch")).to.equal("sehr hoch");
                expect(wrapper.vm.checkValueAndFormatDate(2200)).to.equal(2200);
            });

            it("should return an empty items array when statisticValues is empty", async () => {
                statisticValuesMock.length = 0;
                await wrapper.vm.$nextTick();

                expect(wrapper.vm.tableData.items).to.deep.equal([]);
            });
        });

        describe("additional lines in chart", () => {
            beforeEach(async () => {
                await wrapper.setProps({
                    params: {
                        ...params,
                        chartThemes: [
                            {
                                ...params.chartThemes[0],
                                chartParams: {
                                    ...params.chartThemes[0].chartParams,
                                    "additionalLines": {
                                        "buttonTitle": "Lage der Filterstrecke",
                                        "upper": "filteroberkante",
                                        "lower": "filterunterkante"
                                    }
                                }
                            }
                        ]
                    }
                });
            });

            it("should return false for additional lines, if config is not complete", async () => {
                await wrapper.setProps({
                    params: {
                        ...params,
                        chartThemes: [
                            {
                                ...params.chartThemes[0],
                                chartParams: {
                                    ...params.chartThemes[0].chartParams,
                                    "additionalLines": { }
                                }
                            }
                        ]
                    }
                });

                expect(wrapper.vm.additionalLines).to.be.false;

                await wrapper.setProps({
                    params: {
                        ...params,
                        chartThemes: [
                            {
                                ...params.chartThemes[0],
                                chartParams: {
                                    ...params.chartThemes[0].chartParams,
                                    "additionalLines": {
                                        "buttonTitle": "Lage der Filterstrecke",
                                        "lower": "filterunterkante"
                                    }
                                }
                            }
                        ]
                    }
                });

                expect(wrapper.vm.additionalLines).to.be.false;

                await wrapper.setProps({
                    params: {
                        ...params,
                        chartThemes: [
                            {
                                ...params.chartThemes[0],
                                chartParams: {
                                    ...params.chartThemes[0].chartParams,
                                    "additionalLines": {
                                        "upper": "filteroberkante"
                                    }
                                }
                            }
                        ]
                    }
                });

                expect(wrapper.vm.additionalLines).to.deep.equal({"upper": "filteroberkante"});
            });

            it("should have correct minScaleLeft, if additionalLines are configured", () => {
                expect(wrapper.vm.minScaleLeft).to.equal(15.1);

                statisticValuesMock.forEach(dataset => {
                    dataset.properties.filteroberkante = 12;
                    dataset.properties.filterunterkante = 10;
                });

                expect(wrapper.vm.minScaleLeft).to.equal(15.1);

                wrapper.vm.showAdditionalLines = true;

                expect(wrapper.vm.minScaleLeft).to.equal(9);
            });

            it("should have correct maxScaleLeft, if additionalLines are configured", () => {
                expect(wrapper.vm.maxScaleLeft).to.equal(15.2);

                statisticValuesMock.forEach(dataset => {
                    dataset.properties.filteroberkante = 25;
                    dataset.properties.filterunterkante = 12;
                });

                expect(wrapper.vm.maxScaleLeft).to.equal(15.2);

                wrapper.vm.showAdditionalLines = true;

                expect(wrapper.vm.maxScaleLeft).to.equal(26);
            });
        });
    });

    describe("sliderSelectedValuesModel", () => {
        it("should accept only two-item arrays in the setter", () => {
            wrapper.vm.sliderSelectedValuesModel = ["2025-08-22", "2025-08-23"];

            expect(wrapper.vm.selectedSliderRange).to.deep.equal([
                "2025-08-22",
                "2025-08-23"
            ]);

            const invalidPayloads = [
                null,
                "2025-08-22",
                [],
                ["2025-08-22"],
                ["2025-08-22", "2025-08-23", "2025-08-24"]
            ];

            invalidPayloads.forEach((payload) => {
                wrapper.vm.sliderSelectedValuesModel = payload;

                expect(wrapper.vm.selectedSliderRange).to.deep.equal([
                    "2025-08-22",
                    "2025-08-23"
                ]);
            });
        });

        it("should initialize selectedSliderRange from sliderRange when chart labels change", async () => {
            wrapper.vm.selectedSliderRange = ["2022-06-15", "2022-06-15"];

            wrapper.vm.setDateAllTime();
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.sliderRange).to.deep.equal([
                "2021-01-15",
                "2023-01-01"
            ]);
            expect(wrapper.vm.selectedSliderRange).to.deep.equal([
                "2021-01-15",
                "2023-01-01"
            ]);
        });
    });
});
