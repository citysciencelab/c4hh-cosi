import {expect} from "chai";
import {formatDate} from "../../js/formatDate.js";

describe("addons/heavyRain/shared/js/formatDate.js", () => {
    it("should format a date of the service as DD.MM.YYYY", () => {
        expect(formatDate("2026-09-28")).to.equal("28.09.2026");
    });

    it("should ignore a time zone or time added by the service", () => {
        expect(formatDate("2026-09-28Z")).to.equal("28.09.2026");
        expect(formatDate("2026-09-28+02:00")).to.equal("28.09.2026");
        expect(formatDate("2026-09-28T10:15:00Z")).to.equal("28.09.2026");
    });

    it("should use the given format", () => {
        expect(formatDate("2026-09-28", "YYYY")).to.equal("2026");
    });

    it("should return an empty string if there is no date", () => {
        expect(formatDate(undefined)).to.equal("");
        expect(formatDate(null)).to.equal("");
        expect(formatDate("")).to.equal("");
    });

    it("should return the given value if it is no date of the service", () => {
        expect(formatDate("28.09.2026")).to.equal("28.09.2026");
        expect(formatDate("unbekannt")).to.equal("unbekannt");
    });
});
