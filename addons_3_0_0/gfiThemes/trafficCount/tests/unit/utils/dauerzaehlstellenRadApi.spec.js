import {expect} from "chai";
import {DauerzaehlstellenRadApi} from "../../../utils/dauerzaehlstellenRadApi";
import dayjs from "dayjs";

// change language from day.js to german
require("dayjs/locale/de.js");
dayjs.locale("de");

describe("addons/trafficCount/utils/dauerzaehlstellenRadApi.js", () => {
    let dummyApi = null;

    beforeEach(() => {
        // this sets the cache with a boolean true as api without starting the real api
        // use param trafficCountApiOpt to emulate the api for testing methods calling the api
        dummyApi = new DauerzaehlstellenRadApi({
            getProperties: () => ({
                jahrgangslinie: "",
                wochenlinie: "",
                tageslinie: ""
            }),
            getId: () => "testId"
        }, () => {
            // onerror
        },
        () => {
            // callLinkDownload
        });
    });

    describe("featureExists", () => {
        it("should recognize an object with a certain structure as a feature", () => {
            const api = new DauerzaehlstellenRadApi({
                getProperties: () => false,
                getId: () => false
            });

            expect(api.featureExists()).to.be.true;
        });
    });
    describe("DauerzaehlstellenRadApi.constructor (simple test)", () => {
        it("should create internal structures for feature and phenomenonMoments", () => {
            expect(dummyApi.gurlittMomentsYear).to.be.an("array").and.to.be.empty;
            expect(dummyApi.gurlittMomentsWeek).to.be.an("array").and.to.be.empty;
            expect(dummyApi.gurlittMomentsDay).to.be.an("array").and.to.be.empty;
        });
    });
    describe("parseCSVData", () => {
        it("should return false if the given input is not a string", () => {
            expect(dummyApi.parseCSVData(undefined)).to.be.false;
            expect(dummyApi.parseCSVData(null)).to.be.false;
            expect(dummyApi.parseCSVData(1234)).to.be.false;
            expect(dummyApi.parseCSVData(true)).to.be.false;
            expect(dummyApi.parseCSVData(false)).to.be.false;
            expect(dummyApi.parseCSVData([])).to.be.false;
            expect(dummyApi.parseCSVData({})).to.be.false;
        });
        it("should return an empty array if an empty string is given", () => {
            expect(dummyApi.parseCSVData("")).to.deep.equal([]);
        });
        it("should return an array representing the csv data of the given string", () => {
            const csv = "a,b,c\nd,e,f\r\ng,h,i",
                expected = [
                    ["a", "b", "c"],
                    ["d", "e", "f"],
                    ["g", "h", "i"]
                ];

            expect(dummyApi.parseCSVData(csv, ",", 0)).to.deep.equal(expected);
        });
    });
    describe("createGurlittMomentDataDay", () => {
        it("should return false if anything but an array is given", () => {
            expect(dummyApi.createGurlittMomentDataDay(undefined)).to.be.false;
            expect(dummyApi.createGurlittMomentDataDay(null)).to.be.false;
            expect(dummyApi.createGurlittMomentDataDay("string")).to.be.false;
            expect(dummyApi.createGurlittMomentDataDay(1234)).to.be.false;
            expect(dummyApi.createGurlittMomentDataDay(true)).to.be.false;
            expect(dummyApi.createGurlittMomentDataDay(false)).to.be.false;
            expect(dummyApi.createGurlittMomentDataDay({})).to.be.false;
        });
        it("should return an empty array if an empty array is given", () => {
            expect(dummyApi.createGurlittMomentDataDay([])).to.be.an("array").and.to.be.empty;
        });
        it("should return an array of GurlittMoment for days if parsed csv data is given", () => {
            const parsedCsvData = [
                    ["29.08.2021", "22:00", 1],
                    ["29.08.2021", "23:00", 2],
                    ["30.08.2021", "00:00", 3],
                    ["30.08.2021", "01:00", 4],
                    ["30.08.2021", "02:00", 5]
                ],
                result = dummyApi.createGurlittMomentDataDay(parsedCsvData);

            expect(result).to.be.an("array").and.to.have.lengthOf(5);
            expect(result[0]).to.be.an("object");
            expect(result[0].result).to.equal(1);
            expect(result[0].momentStart instanceof dayjs).to.be.true;
            expect(result[0].momentEnd instanceof dayjs).to.be.true;
            expect(result[1].result).to.equal(2);
            expect(result[1].momentStart instanceof dayjs).to.be.true;
            expect(result[1].momentEnd instanceof dayjs).to.be.true;
            expect(result[2].result).to.equal(3);
            expect(result[2].momentStart instanceof dayjs).to.be.true;
            expect(result[2].momentEnd instanceof dayjs).to.be.true;
            expect(result[3].result).to.equal(4);
            expect(result[3].momentStart instanceof dayjs).to.be.true;
            expect(result[3].momentEnd instanceof dayjs).to.be.true;
            expect(result[4].result).to.equal(5);
            expect(result[4].momentStart instanceof dayjs).to.be.true;
            expect(result[4].momentEnd instanceof dayjs).to.be.true;
        });
    });
    describe("createGurlittMomentDataWeek", () => {
        it("should return false if anything but an array is given", () => {
            expect(dummyApi.createGurlittMomentDataWeek(undefined)).to.be.false;
            expect(dummyApi.createGurlittMomentDataWeek(null)).to.be.false;
            expect(dummyApi.createGurlittMomentDataWeek("string")).to.be.false;
            expect(dummyApi.createGurlittMomentDataWeek(1234)).to.be.false;
            expect(dummyApi.createGurlittMomentDataWeek(true)).to.be.false;
            expect(dummyApi.createGurlittMomentDataWeek(false)).to.be.false;
            expect(dummyApi.createGurlittMomentDataWeek({})).to.be.false;
        });
        it("should return an empty array if an empty array is given", () => {
            expect(dummyApi.createGurlittMomentDataWeek([])).to.be.an("array").and.to.be.empty;
        });
        it("should return an array of GurlittMoment for weeks if parsed csv data is given", () => {
            const parsedCsvData = [
                    ["29.08.2021", "22:00", 1],
                    ["29.08.2021", "23:00", 2],
                    ["30.08.2021", "00:00", 3],
                    ["30.08.2021", "01:00", 4],
                    ["30.08.2021", "02:00", 5]
                ],
                result = dummyApi.createGurlittMomentDataWeek(parsedCsvData);

            expect(result).to.be.an("array").and.to.have.lengthOf(2);
            expect(result[0]).to.be.an("object");
            expect(result[0].result).to.equal(3);
            expect(result[0].momentStart instanceof dayjs).to.be.true;
            expect(result[0].momentEnd instanceof dayjs).to.be.true;
            expect(result[1].result).to.equal(12);
            expect(result[1].momentStart instanceof dayjs).to.be.true;
            expect(result[1].momentEnd instanceof dayjs).to.be.true;
        });
    });
    describe("createGurlittMomentDataYear", () => {
        it("should return false if anything but an array is given", () => {
            expect(dummyApi.createGurlittMomentDataYear(undefined)).to.be.false;
            expect(dummyApi.createGurlittMomentDataYear(null)).to.be.false;
            expect(dummyApi.createGurlittMomentDataYear("string")).to.be.false;
            expect(dummyApi.createGurlittMomentDataYear(1234)).to.be.false;
            expect(dummyApi.createGurlittMomentDataYear(true)).to.be.false;
            expect(dummyApi.createGurlittMomentDataYear(false)).to.be.false;
            expect(dummyApi.createGurlittMomentDataYear({})).to.be.false;
        });
        it("should return an empty array if an empty array is given", () => {
            expect(dummyApi.createGurlittMomentDataYear([])).to.be.an("array").and.to.be.empty;
        });
        it("should return an array of GurlittMoment for years if parsed csv data is given", () => {
            const parsedCsvData = [
                    ["29.08.2021", "22:00", 1],
                    ["29.08.2021", "23:00", 2],
                    ["30.08.2021", "00:00", 3],
                    ["30.08.2021", "01:00", 4],
                    ["30.08.2021", "02:00", 5]
                ],
                result = dummyApi.createGurlittMomentDataYear(parsedCsvData);

            expect(result).to.be.an("array").and.to.have.lengthOf(2);
            expect(result[0]).to.be.an("object");
            expect(result[0].result).to.equal(3);
            expect(result[0].momentStart instanceof dayjs).to.be.true;
            expect(result[0].momentEnd instanceof dayjs).to.be.true;
            expect(result[1].result).to.equal(12);
            expect(result[1].momentStart instanceof dayjs).to.be.true;
            expect(result[1].momentEnd instanceof dayjs).to.be.true;
        });
    });
    describe("waitingListForCallLinkDownload", () => {
        it("should set a handler for updateDataset if csv data is not loaded yet", () => {
            const api = new DauerzaehlstellenRadApi({
                getProperties: () => false,
                getId: () => false
            }, () => {
                // onerror
            }, () => {
                // callLinkDownload
            });
            let onstartCalled = false;

            api.updateDataset("thingId", "meansOfTransport", "timeSettings", "onupdate", "onerror", () => {
                onstartCalled = true;
            }, "oncomplete");

            expect(onstartCalled).to.be.false;
            expect(api.waitingListForCallLinkDownload).to.be.an("array").and.to.have.lengthOf(1);
        });
    });
    describe("updateWorkingDayAverage", () => {
        const api = new DauerzaehlstellenRadApi({
                getProperties: () => false,
                getId: () => false
            }, () => {
                // onerror
            }, () => {
                // callLinkDownload
            }),
            holidays = ["newYearsDay"],
            expectedDate = "2020-12-31",
            expectedResult = 15;
        let lastResult = false,
            lastDate = false;

        api.gurlittMomentsWeek = [
            {
                "result": 14,
                "momentStart": dayjs("2020-12-30T23:00:00.000Z"),
                "momentEnd": dayjs("2020-12-31T23:00:00.000Z")
            },
            {
                "result": 1,
                "momentStart": dayjs("2020-12-31T23:00:00.000Z"),
                "momentEnd": dayjs("2021-01-01T23:00:00.000Z")
            },
            {
                "result": 2,
                "momentStart": dayjs("2021-01-01T23:00:00.000Z"),
                "momentEnd": dayjs("2021-01-02T23:00:00.000Z")
            },
            {
                "result": 3,
                "momentStart": dayjs("2021-01-02T23:00:00.000Z"),
                "momentEnd": dayjs("2021-01-03T23:00:00.000Z")
            },
            {
                "result": 16,
                "momentStart": dayjs("2021-01-03T23:00:00.000Z"),
                "momentEnd": dayjs("2021-01-04T23:00:00.000Z")
            }
        ];

        api.updateWorkingDayAverage("thingId", "meansOfTransport", 365, holidays, (date, result) => {
            lastDate = date;
            lastResult = result;
        }, "onerror", "onstart", "oncomplete");

        expect(lastResult).to.equal(expectedResult);
        expect(lastDate).to.equal(expectedDate);
    });
});
