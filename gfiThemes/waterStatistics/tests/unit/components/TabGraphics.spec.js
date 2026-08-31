import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {reactive} from "vue";
import sinon from "sinon";
import TabGraphics from "../../../components/TabGraphics.vue";

describe("addons/gfiThemes/waterStatistics/components/TabGraphics.vue", () => {
    let store, wrapper, queryOaf, queryPercentiles, params, statisticValuesMock, percentilesMock, addSingleAlert, setStatisticValues, allDataMock;

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
                        "MIN": 14.45,
                        "P10": 14.55,
                        "P25": 14.59,
                        "P75": 15,
                        "P90": 15.13,
                        "MAX": 15.37
                    },
                    {
                        "MIN": 14.45,
                        "P10": 14.57,
                        "P25": 14.62,
                        "P75": 15.11,
                        "P90": 15.23,
                        "MAX": 15.37
                    },
                    {
                        "MIN": 14.45,
                        "P10": 14.56,
                        "P25": 14.66,
                        "P75": 15.21,
                        "P90": 15.32,
                        "MAX": 15.37
                    }
                ]
            },
            {
                "messstellennummer": 3381,
                "perzentile": [
                    {
                        "MIN": 9.82,
                        "P10": 10.62,
                        "P25": 10.75,
                        "P75": 11.26,
                        "P90": 11.67,
                        "MAX": 11.94
                    },
                    {
                        "MIN": 9.82,
                        "P10": 10.62,
                        "P25": 10.94,
                        "P75": 11.66,
                        "P90": 11.77,
                        "MAX": 11.94
                    },
                    {
                        "MIN": 9.82,
                        "P10": 10.62,
                        "P25": 11.15,
                        "P75": 11.59,
                        "P90": 11.85,
                        "MAX": 11.94
                    }
                ]
            }
        ];

        queryOaf = sinon.spy();
        queryPercentiles = sinon.spy();
        addSingleAlert = sinon.spy();
        setStatisticValues = sinon.spy();

        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        WaterStatistics: {
                            namespaced: true,
                            actions: {
                                queryOaf,
                                queryPercentiles
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
                                setStatisticValues
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
                            factor: 1
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
                expect(wrapper.vm.rangeStartDate).to.be.undefined;
                expect(wrapper.vm.rangeEndDate).to.deep.equal(new Date(Date.now()));
            });
        });

        describe("setDateAllTime", () => {
            it("should set filterRange to 'all-time' and compute the range from dateRange getter", () => {
                wrapper.vm.setDateAllTime();

                expect(wrapper.vm.filterRange).to.equal("all-time");
                expect(wrapper.vm.rangeStartDate).to.deep.equal(new Date(2015, 0, 1));
                expect(wrapper.vm.rangeEndDate).to.deep.equal(new Date());
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
                expect(wrapper.vm.rangeEndDate).to.deep.equal(new Date(2022, 8, 0));
                expect(addSingleAlert.called).to.be.false;
            });

        });

        describe("filterFromAllData", () => {
            it("should call setStatisticValues with only the items inside the given date range", () => {
                wrapper.vm.filterFromAllData(2022, 1, 2022, 12);

                expect(setStatisticValues.calledOnce).to.be.true;
                expect(setStatisticValues.lastCall.args[1]).to.deep.equal([allDataMock[1]]);
            });

            it("should call setStatisticValues with an empty array when no items match the range", () => {
                wrapper.vm.filterFromAllData(2030, 1, 2030, 12);

                expect(setStatisticValues.lastCall.args[1]).to.deep.equal([]);
            });

            it("should include items exactly on the start and end boundary dates", () => {
                wrapper.vm.filterFromAllData(2021, 1, 2023, 1);

                expect(setStatisticValues.lastCall.args[1]).to.deep.equal(allDataMock);
            });

            it("should return an empty array when allData is empty", async () => {
                allDataMock.length = 0;

                wrapper.vm.filterFromAllData(2021, 1, 2023, 1);

                expect(setStatisticValues.lastCall.args[1]).to.deep.equal([]);
            });

            it("should return an empty array when the end date is before the start date and both are older than 12 months", () => {
                wrapper.vm.filterFromAllData(2023, 1, 2021, 1);

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
});
