import {
    generateGraphObj,
    generateScatterGraphObj,
    generateChartForDistricts,
    generateChartForCorrelation,
    generateChartsForItems
} from "../../../utils/chart.js";
import {expect} from "chai/index";

describe("Dashboard/utils/chart", () => {
    const graphData = [{
            "label": "39003",
            "data": [
                "2252",
                "2292",
                "2321",
                "2362",
                "2523",
                "2378",
                "2370",
                "2390"
            ]
        },
        {
            "label": "Lokstedt",
            "data": [
                "27493",
                "28053",
                "28252",
                "28426",
                "28534",
                "28793",
                "29373",
                "30302"
            ]
        }
        ],
        timestamps = [
            2020,
            2019,
            2018,
            2017,
            2016,
            2015,
            2014,
            2013
        ];

    describe("generateGraphObj", () => {
        const districtLevelLabel = "Statistische Gebiete",
            category = "Bevölkerung insgesamt";

        it("should return chart attributes", () => {
            expect(generateGraphObj(graphData, districtLevelLabel, category, timestamps).name).to.be.equal("Statistische Gebiete - Bevölkerung insgesamt");
            expect(generateGraphObj(graphData, districtLevelLabel, category, timestamps).scaleLabels).to.be.deep.equal(["Bevölkerung insgesamt", "Jahre"]);
            expect(generateGraphObj(graphData, districtLevelLabel, category, timestamps).data.datasets).to.be.deep.equal(graphData);
            expect(generateGraphObj(graphData, districtLevelLabel, category, timestamps).data.labels).to.be.deep.equal([2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020]);
        });
    });

    describe("generateScatterGraphObj", () => {
        const categoryX = "Statistische Gebiete",
            categoryY = "Bevölkerung insgesamt";

        it("should return chart attributes", () => {
            expect(generateScatterGraphObj(graphData, categoryX, categoryY).name).to.be.equal("Bevölkerung insgesamt / Statistische Gebiete");
            expect(generateScatterGraphObj(graphData, categoryX, categoryY).scaleLabels).to.be.deep.equal(["Bevölkerung insgesamt", "Statistische Gebiete"]);
            expect(generateScatterGraphObj(graphData, categoryX, categoryY).data.datasets).to.be.deep.equal(graphData);
        });
    });

    describe("generateChartForDistricts", () => {
        const data = {
                39003: {
                    "kategorie": "Bevölkerung insgesamt",
                    "group": "Bevölkerung",
                    "stat_gebiet": "39003",
                    "stadtteil": "Lokstedt",
                    "jahr_2013": "2252",
                    "jahr_2014": "2292",
                    "jahr_2015": "2321",
                    "jahr_2016": "2362",
                    "jahr_2017": "2523",
                    "jahr_2018": "2378",
                    "jahr_2019": "2370",
                    "jahr_2020": "2390"
                },
                Lokstedt: {
                    "kategorie": "Bevölkerung insgesamt",
                    "group": "Bevölkerung",
                    "stadtteil": "Lokstedt",
                    "bezirk": "Eimsbüttel",
                    "jahr_2013": "27493",
                    "jahr_2014": "28053",
                    "jahr_2015": "28252",
                    "jahr_2016": "28426",
                    "jahr_2017": "28534",
                    "jahr_2018": "28793",
                    "jahr_2019": "29373",
                    "jahr_2020": "30302"
                },
                category: "Bevölkerung insgesamt",
                years: [2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013]
            },
            districtCols = [{
                text: "39003",
                value: "39003"
            }, {
                text: "Lokstedt",
                value: "Lokstedt"
            }],
            districtLevelLabel = "Statistische Gebiete",
            timestampPrefix = "jahr_";

        it("should return chart attributes", () => {
            expect(generateChartForDistricts(data, districtCols, districtLevelLabel, timestampPrefix).name).to.be.equal("Statistische Gebiete - Bevölkerung insgesamt");
            expect(generateChartForDistricts(data, districtCols, districtLevelLabel, timestampPrefix).scaleLabels).to.be.deep.equal(["Bevölkerung insgesamt", "Jahre"]);
            expect(generateChartForDistricts(data, districtCols, districtLevelLabel, timestampPrefix).data.datasets).to.be.deep.equal(graphData);
        });
    });

    describe("generateChartForCorrelation", () => {
        const correlation = {
                "data": [
                    {
                        "district": "39003",
                        "timestamp": 2020,
                        "x": 2390,
                        "y": 2390,
                        "yEst": 2390,
                        "stdDev": 0
                    },
                    {
                        "district": "39003",
                        "timestamp": 2019,
                        "x": 2370,
                        "y": 2370,
                        "yEst": 2370,
                        "stdDev": 0
                    },
                    {
                        "district": "39003",
                        "timestamp": 2018,
                        "x": 2378,
                        "y": 2378,
                        "yEst": 2378,
                        "stdDev": 0
                    },
                    {
                        "district": "39003",
                        "timestamp": 2017,
                        "x": 2523,
                        "y": 2523,
                        "yEst": 2523,
                        "stdDev": 0
                    },
                    {
                        "district": "39003",
                        "timestamp": 2016,
                        "x": 2362,
                        "y": 2362,
                        "yEst": 2362,
                        "stdDev": 0
                    },
                    {
                        "district": "39003",
                        "timestamp": 2015,
                        "x": 2321,
                        "y": 2321,
                        "yEst": 2321,
                        "stdDev": 0
                    },
                    {
                        "district": "39003",
                        "timestamp": 2014,
                        "x": 2292,
                        "y": 2292,
                        "yEst": 2292,
                        "stdDev": 0
                    },
                    {
                        "district": "39003",
                        "timestamp": 2013,
                        "x": 2252,
                        "y": 2252,
                        "yEst": 2252,
                        "stdDev": 0
                    }
                ],
                "standardDeviation": 0,
                "covariance": 610793618186.757,
                "correlation": 0.9999999999999996
            },
            categoryX = "Statistische Gebiete",
            categoryY = "Bevölkerung insgesamt";

        it("should return chart attributes", () => {
            expect(generateChartForCorrelation(correlation, categoryX, categoryY).name).to.be.equal("Bevölkerung insgesamt / Statistische Gebiete");
            expect(generateChartForCorrelation(correlation, categoryX, categoryY).scaleLabels).to.be.deep.equal(["Bevölkerung insgesamt", "Statistische Gebiete"]);
            expect(generateChartForCorrelation(correlation, categoryX, categoryY).data.datasets[0]).to.be.deep.equal({
                label: "39003",
                data: [
                    {
                        "district": "39003",
                        "timestamp": 2020,
                        "x": 2390,
                        "y": 2390,
                        "yEst": 2390,
                        "stdDev": 0
                    },
                    {
                        "district": "39003",
                        "timestamp": 2019,
                        "x": 2370,
                        "y": 2370,
                        "yEst": 2370,
                        "stdDev": 0
                    },
                    {
                        "district": "39003",
                        "timestamp": 2018,
                        "x": 2378,
                        "y": 2378,
                        "yEst": 2378,
                        "stdDev": 0
                    },
                    {
                        "district": "39003",
                        "timestamp": 2017,
                        "x": 2523,
                        "y": 2523,
                        "yEst": 2523,
                        "stdDev": 0
                    },
                    {
                        "district": "39003",
                        "timestamp": 2016,
                        "x": 2362,
                        "y": 2362,
                        "yEst": 2362,
                        "stdDev": 0
                    },
                    {
                        "district": "39003",
                        "timestamp": 2015,
                        "x": 2321,
                        "y": 2321,
                        "yEst": 2321,
                        "stdDev": 0
                    },
                    {
                        "district": "39003",
                        "timestamp": 2014,
                        "x": 2292,
                        "y": 2292,
                        "yEst": 2292,
                        "stdDev": 0
                    },
                    {
                        "district": "39003",
                        "timestamp": 2013,
                        "x": 2252,
                        "y": 2252,
                        "yEst": 2252,
                        "stdDev": 0
                    }
                ]
            });
            expect(generateChartForCorrelation(correlation, categoryX, categoryY).data.datasets[1]).to.be.deep.equal({
                "correlation": 0.9999999999999996,
                "covariance": 610793618186.757,
                "data": [
                    {
                        "x": 2390,
                        "y": 2390
                    },
                    {
                        "x": 2370,
                        "y": 2370
                    },
                    {
                        "x": 2378,
                        "y": 2378
                    },
                    {
                        "x": 2523,
                        "y": 2523
                    },
                    {
                        "x": 2362,
                        "y": 2362
                    },
                    {
                        "x": 2321,
                        "y": 2321
                    },
                    {
                        "x": 2292,
                        "y": 2292
                    },
                    {
                        "x": 2252,
                        "y": 2252
                    }
                ],
                "label": "Regression",
                "options": {
                    "showLine": true
                },
                "type": "line"
            }
            );
        });
    });

    describe("generateChartsForItems", () => {
        const data = [
                {
                    39003: {
                        "kategorie": "Bevölkerung insgesamt",
                        "group": "Bevölkerung",
                        "stat_gebiet": "39003",
                        "stadtteil": "Lokstedt",
                        "jahr_2013": "2252",
                        "jahr_2014": "2292",
                        "jahr_2015": "2321",
                        "jahr_2016": "2362",
                        "jahr_2017": "2523",
                        "jahr_2018": "2378",
                        "jahr_2019": "2370",
                        "jahr_2020": "2390"
                    },
                    years: [
                        2020,
                        2019,
                        2018,
                        2017,
                        2016,
                        2015,
                        2014,
                        2013
                    ]
                },
                {
                    Lokstedt: {
                        "kategorie": "Bevölkerung insgesamt",
                        "group": "Bevölkerung",
                        "stadtteil": "Lokstedt",
                        "bezirk": "Eimsbüttel",
                        "jahr_2013": "27493",
                        "jahr_2014": "28053",
                        "jahr_2015": "28252",
                        "jahr_2016": "28426",
                        "jahr_2017": "28534",
                        "jahr_2018": "28793",
                        "jahr_2019": "29373",
                        "jahr_2020": "30302"
                    },
                    years: [
                        2020,
                        2019,
                        2018,
                        2017,
                        2016,
                        2015,
                        2014,
                        2013
                    ]
                }
            ],
            districtCols = [{
                text: "39003",
                value: "39003"
            }, {
                text: "Lokstedt",
                value: "Lokstedt"
            }],
            districtLevelLabel = "Statistische Gebiete",
            timestampPrefix = "jahr_";

        it("should return trend value", () => {
            expect(generateChartsForItems(data, districtCols, districtLevelLabel, timestampPrefix)).to.have.lengthOf(2);
            expect(generateChartsForItems(data, districtCols, districtLevelLabel, timestampPrefix)[0].name).to.be.equal("Statistische Gebiete - 39003");
            expect(generateChartsForItems(data, districtCols, districtLevelLabel, timestampPrefix)[0].scaleLabels).to.be.deep.equal(["", "Jahre"]);
            expect(generateChartsForItems(data, districtCols, districtLevelLabel, timestampPrefix)[0].data.datasets[0].data).to.be.deep.equal([2252, 2292, 2321, 2362, 2523, 2378, 2370, 2390]);
        });
    });
});
