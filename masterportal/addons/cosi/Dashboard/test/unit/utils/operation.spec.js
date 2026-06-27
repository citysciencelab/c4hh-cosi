import {
    getXYPairs,
    getAverage,
    getTotal
} from "../../../utils/operations.js";
import {expect} from "chai/index";

describe("Dashboard/utils/operation", () => {
    describe("getXYPairs", () => {
        it("should return empty array", () => {
            expect(getXYPairs({}, {}, [], [], "")).to.be.deep.equal([]);
        });

        it("should return data", () => {
            const datasetA = {
                    39003: {
                        jahr_2019: "2370",
                        jahr_2020: "2390"
                    },
                    Lokstedt: {
                        jahr_2019: "29373",
                        jahr_2020: "30302"
                    }
                },
                datasetB = {
                    39003: {
                        jahr_2019: "2370",
                        jahr_2020: "2390"
                    },
                    Lokstedt: {
                        jahr_2019: "29373",
                        jahr_2020: "30302"
                    }
                },
                districtNames = ["39003", "Lokstedt"],
                timestamps = [2019, 2020],
                timestampPrefix = "jahr_";

            expect(getXYPairs(datasetA, datasetB, districtNames, timestamps, timestampPrefix)).to.be.deep.equal([
                {
                    "district": "39003",
                    "timestamp": 2019,
                    "x": 2370,
                    "y": 2370
                },
                {
                    "district": "39003",
                    "timestamp": 2020,
                    "x": 2390,
                    "y": 2390
                },
                {
                    "district": "Lokstedt",
                    "timestamp": 2019,
                    "x": 29373,
                    "y": 29373
                },
                {
                    "district": "Lokstedt",
                    "timestamp": 2020,
                    "x": 30302,
                    "y": 30302
                }
            ]);
        });
    });

    describe("getAverage", () => {
        it("should return value -", () => {
            expect(getAverage({}, [], 0, "")).to.be.equal("-");
            expect(getAverage({valueType: false}, [], 0, "")).to.be.equal("-");
        });
    });

    describe("getTotal", () => {
        it("should return value -", () => {
            expect(getTotal({}, [], 0, "", false)).to.be.equal("-");
            expect(getTotal({valueType: ""}, [], 0, "", false)).to.be.equal("-");
        });

        it("should return value 0", () => {
            expect(getTotal({}, [], 0, "", true)).to.be.equal(0);
            expect(getTotal(undefined, [], undefined, undefined, true)).to.be.equal(0);
        });

        it("should return total value", () => {
            const item = {
                    Lokstedt: {
                        "jahr_2020": "3205"
                    }
                },
                districtNames = ["Lokstedt", "Stellingen"],
                timestamp = 2020,
                timestampPrefix = "jahr_";

            expect(getTotal(item, districtNames, timestamp, timestampPrefix, true)).to.be.equal(3205);
        });
    });
});
