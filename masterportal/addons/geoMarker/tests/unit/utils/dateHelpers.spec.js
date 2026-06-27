import {expect} from "chai";
import {formatDateTime} from "../../../utils/dateHelpers";

/**
 * Run only utils tests via command:
 * npm run test:watch -- --grep="addons/geoMarker/tests/unit/utils/"
 */
describe("addons/geoMarker/utils/dateHelpers", () => {
    describe("formatDateTime", () => {
        it("should format ISO date string to 'DD.MM.YYYY HH:mm'", () => {
            const input = "2023-09-12T15:30:00Z",
                result = formatDateTime(input, "DD.MM.YYYY HH:mm");

            // Accept any valid DD.MM.YYYY HH:mm output, as local time may differ
            expect(result).to.match(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/);
        });

        it("should return empty string for empty input", () => {
            expect(formatDateTime("")).to.equal("");
            expect(formatDateTime(null)).to.equal("");
            expect(formatDateTime(undefined)).to.equal("");
        });

        it("should use custom format if provided", () => {
            const input = "2023-09-12T15:30:00Z",
                result = formatDateTime(input, "YYYY/MM/DD");

            expect(result).to.match(/^\d{4}\/\d{2}\/\d{2}$/);
        });
    });
});
