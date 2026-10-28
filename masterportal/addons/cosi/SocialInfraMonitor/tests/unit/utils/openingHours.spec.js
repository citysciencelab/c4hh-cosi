import {expect} from "chai";
import {
    MINUTES_PER_DAY,
    MINUTES_PER_WEEK,
    hoursPerWeek,
    isOpen,
    nextChange,
    openness,
    parseOpeningHours,
    splitMinute,
    weeklyProfile,
    wrapMinute
} from "../../../utils/openingHours.js";

/**
 * Minute of the week for a day index and clock time.
 * @param {Number} day - 0 = Monday.
 * @param {String} hhmm - Clock time.
 * @returns {Number} The minute of the week.
 */
function at (day, hhmm) {
    const [h, m] = hhmm.split(":").map(Number);

    return day * MINUTES_PER_DAY + h * 60 + m;
}

describe("addons/cosi/SocialInfraMonitor/utils/openingHours.js", () => {
    describe("parseOpeningHours", () => {
        it("expands day ranges into one interval per day", () => {
            const intervals = parseOpeningHours("Mo-Fr 08:00-16:00");

            expect(intervals).to.have.length(5);
            expect(intervals[0]).to.deep.equal([at(0, "08:00"), at(0, "16:00")]);
            expect(intervals[4]).to.deep.equal([at(4, "08:00"), at(4, "16:00")]);
        });

        it("reads day lists, several rules and several times per day", () => {
            const intervals = parseOpeningHours("Mo,We 09:00-12:00, 14:30-17:00; Sa 10:00-14:00");

            expect(intervals).to.deep.equal([
                [at(0, "09:00"), at(0, "12:00")],
                [at(0, "14:30"), at(0, "17:00")],
                [at(2, "09:00"), at(2, "12:00")],
                [at(2, "14:30"), at(2, "17:00")],
                [at(5, "10:00"), at(5, "14:00")]
            ]);
        });

        it("merges overlapping intervals", () => {
            expect(parseOpeningHours("Mo 08:00-12:00; Mo 11:00-15:00")).to.deep.equal([[at(0, "08:00"), at(0, "15:00")]]);
        });

        it("runs an overnight interval into the next day", () => {
            expect(parseOpeningHours("Fr 22:00-02:00")).to.deep.equal([[at(4, "22:00"), at(5, "02:00")]]);
        });

        it("wraps a day range past Sunday", () => {
            expect(parseOpeningHours("Sa-Mo 10:00-11:00").map(([start]) => Math.floor(start / MINUTES_PER_DAY))).to.deep.equal([0, 5, 6]);
        });

        it("skips malformed rules and returns [] for empty input", () => {
            expect(parseOpeningHours("Xy 08:00-10:00; Mo 9-10")).to.deep.equal([]);
            expect(parseOpeningHours("")).to.deep.equal([]);
            expect(parseOpeningHours(undefined)).to.deep.equal([]);
        });
    });

    describe("isOpen", () => {
        const intervals = parseOpeningHours("Mo-Fr 08:00-16:00");

        it("is open inside, closed at the closing minute and outside", () => {
            expect(isOpen(intervals, at(1, "08:00"))).to.be.true;
            expect(isOpen(intervals, at(1, "15:59"))).to.be.true;
            expect(isOpen(intervals, at(1, "16:00"))).to.be.false;
            expect(isOpen(intervals, at(5, "10:00"))).to.be.false;
        });

        it("carries a Sunday-night interval over into Monday morning", () => {
            const night = parseOpeningHours("Su 22:00-02:00");

            expect(isOpen(night, at(0, "01:00"))).to.be.true;
            expect(isOpen(night, at(0, "03:00"))).to.be.false;
        });
    });

    describe("openness", () => {
        const intervals = parseOpeningHours("Mo 08:00-16:00");

        it("is fully closed well before opening and fully open mid-day", () => {
            expect(openness(intervals, at(0, "06:00")).level).to.equal(0);
            expect(openness(intervals, at(0, "12:00")).level).to.equal(1);
        });

        it("is half open exactly at opening and closing time", () => {
            expect(openness(intervals, at(0, "08:00")).level).to.be.closeTo(0.5, 1e-9);
            expect(openness(intervals, at(0, "16:00")).level).to.be.closeTo(0.5, 1e-9);
        });

        it("glows strongest right after opening and settles later", () => {
            const early = openness(intervals, at(0, "08:30")).glow,
                late = openness(intervals, at(0, "13:00")).glow;

            expect(early).to.be.greaterThan(late);
            expect(late).to.be.closeTo(0.3, 0.01);
        });
    });

    describe("weeklyProfile", () => {
        it("counts open facilities per slot", () => {
            const counts = weeklyProfile([parseOpeningHours("Mo 08:00-09:00"), parseOpeningHours("Mo 08:30-10:00")], 30);

            expect(counts).to.have.length(MINUTES_PER_WEEK / 30);
            expect(counts[16]).to.equal(1);
            expect(counts[17]).to.equal(2);
            expect(counts[18]).to.equal(1);
            expect(counts[20]).to.equal(0);
        });
    });

    describe("nextChange", () => {
        const intervals = parseOpeningHours("Mo-Fr 08:00-16:00");

        it("tells when an open facility closes", () => {
            expect(nextChange(intervals, at(2, "10:00"))).to.deep.equal({open: true, at: at(2, "16:00")});
        });

        it("tells when a closed facility opens, across the weekend", () => {
            expect(nextChange(intervals, at(5, "10:00"))).to.deep.equal({open: false, at: at(0, "08:00")});
        });

        it("returns null without opening hours", () => {
            expect(nextChange([], 0)).to.be.null;
        });
    });

    describe("helpers", () => {
        it("wraps minutes into the week", () => {
            expect(wrapMinute(-1)).to.equal(MINUTES_PER_WEEK - 1);
            expect(wrapMinute(MINUTES_PER_WEEK + 5)).to.equal(5);
        });

        it("splits a minute into day and clock time", () => {
            expect(splitMinute(at(3, "14:05"))).to.deep.equal({day: 3, time: "14:05"});
            expect(splitMinute(at(3, "14:05") + 0.7)).to.deep.equal({day: 3, time: "14:05"});
        });

        it("sums opening hours per week", () => {
            expect(hoursPerWeek(parseOpeningHours("Mo-Fr 08:00-16:00"))).to.equal(40);
        });
    });
});
