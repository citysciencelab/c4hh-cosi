import {expect} from "chai";
import {
    getAbsTrafficCount,
    getKfzTrafficCount,
    getPhenomenonTimeRange
} from "../../verkehrsfunctions";
import dayjs from "dayjs";

describe("ADDON: Verkehrsfunctions", () => {
    describe("getPhenomenonTimeRange", () => {
        it("should parse the right time format", function () {
            const startTime = "2020-03-26T18:45:01.000Z",
                endTime = "2020-03-26T19:00:00.000Z",
                expectedStart = dayjs(startTime).format("DD.MM.YYYY, HH:mm"),
                expectedEnd = dayjs(endTime).format("HH:mm");

            expect(getPhenomenonTimeRange(startTime, endTime)).to.equal(expectedStart + " Uhr - " + expectedEnd + " Uhr");
        });
    });

    describe("getAbsTrafficCount", function () {
        it("should return text with 'No data'", function () {
            const dataStreamValue = null;

            expect(getAbsTrafficCount(dataStreamValue)).to.equal("No data");
        });

        it("should parse the right the absolute count", function () {
            const dataStreamValue = "219";

            expect(getAbsTrafficCount(dataStreamValue)).to.equal("219");
        });
    });

    describe("getKfzTrafficCount", function () {
        const absTrafficCount = "219 | 35";

        let layerName = "Anzahl_Kfz_Zaehlstelle_15-Min | Anzahl_SV_Zaehlstelle_15-Min",
            type;

        it("should return a value for Kfz", function () {
            type = "Anzahl_Kfz";
            expect(getKfzTrafficCount(absTrafficCount, layerName, type)).to.equal("219");
        });

        it("should return a value for SV", function () {
            type = "Anzahl_SV";
            expect(getKfzTrafficCount(absTrafficCount, layerName, type)).to.equal("35");
        });

        it("should return a NO data", function () {
            layerName = "Anzahl_Rad_Zaehlstelle_15-Min | Anzahl_SV_Zaehlstelle_15-Min";
            type = "Anzahl_Kfz";
            expect(getKfzTrafficCount(absTrafficCount, layerName, type)).to.equal("No data");
        });
    });
});
