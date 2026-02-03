import {expect} from "chai";
import {changeDateFormat, disabledDates} from "../../utils/dateHelpers.js";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import duration from "dayjs/plugin/duration";

dayjs.extend(isBetween);
dayjs.extend(duration);
/**
 * Run only these tests via command:
 * npm run test:watch -- --grep="addons/vpiDashboard/test/ dateHelpers"
 */
describe("addons/vpiDashboard/test/ dateHelpers", () => {
    describe("disabledDates", () => {
        it("should return true if the date is not in range", () => {
            expect(disabledDates(1)(new Date("2025-01-09"), [new Date("2025-01-01")])).to.be.true;
        });
        it("should return false if the date is in range", () => {
            expect(disabledDates(1)(new Date("2025-01-06"), [new Date("2025-01-01")])).to.be.false;
        });
    });
    describe("changeDateFormat", () => {
        it("should return the correctly formatted date", () => {
            const inputDate = "2023-06-01",
                expectedOutput = "06-2023",

                result = changeDateFormat(inputDate);

            expect(result).to.equal(expectedOutput);
        });
    });
});
