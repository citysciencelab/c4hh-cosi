import {expect} from "chai";
import {areaRadius, euroPerVisit, formatEuro, formatNumber, legendValues, niceFloor} from "../../../utils/format.js";

describe("addons/cosi/SocialInfraMonitor/utils/format.js", () => {
    describe("areaRadius", () => {
        it("scales the area, not the radius, with the value", () => {
            const full = areaRadius(100, 100, 20),
                quarter = areaRadius(25, 100, 20);

            expect(full).to.equal(20);
            expect(quarter).to.equal(10);
        });

        it("clamps to the minimum and to the maximum value", () => {
            expect(areaRadius(0, 100, 20, 5)).to.equal(5);
            expect(areaRadius(1, 100, 20, 5)).to.equal(5);
            expect(areaRadius(400, 100, 20, 5)).to.equal(20);
            expect(areaRadius(10, 0, 20, 5)).to.equal(5);
        });
    });

    describe("legendValues", () => {
        it("picks nice values below the maximum", () => {
            expect(niceFloor(1217490)).to.equal(1000000);
            expect(niceFloor(815)).to.equal(500);
            expect(legendValues(1217490)).to.deep.equal([100000, 500000, 1000000]);
            expect(legendValues(815)).to.deep.equal([50, 250, 500]);
        });

        it("returns nothing usable for zero", () => {
            expect(legendValues(0)).to.deep.equal([]);
        });
    });

    describe("formatEuro", () => {
        it("abbreviates millions and thousands", () => {
            expect(formatEuro(1217490)).to.equal("1,22 Mio. €");
            expect(formatEuro(646410)).to.equal("646 Tsd. €");
            expect(formatEuro(-680340)).to.equal("-680 Tsd. €");
        });

        it("keeps small amounts exact and cents below 100 €", () => {
            expect(formatEuro(5300)).to.equal("5.300 €");
            expect(formatEuro(12.4)).to.equal("12,40 €");
            expect(formatEuro(646410, false)).to.equal("646.410 €");
        });

        it("shows a dash for missing values", () => {
            expect(formatEuro(null)).to.equal("–");
            expect(formatNumber(undefined)).to.equal("–");
        });
    });

    describe("euroPerVisit", () => {
        it("spreads annual funding over 52 weeks of visits", () => {
            expect(euroPerVisit(52000, 100)).to.equal(10);
            expect(euroPerVisit(52000, 0)).to.be.null;
        });
    });
});
