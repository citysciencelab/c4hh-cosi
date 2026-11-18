import {expect} from "chai";
import {
    STANDARD_PALETTE, OTHER_COLOR, categoryColors, classOf, colorWithAlpha, computeBreaks, expandRamp, fmtBreak, jenksBreaks
} from "../../utils/classify.js";

describe("addons/cosi/LayerStyler/utils/classify", () => {
    it("finds the natural gaps (Jenks)", () => {
        expect(jenksBreaks([1, 2, 3, 10, 11, 12, 50, 51], 3)).to.deep.equal([3, 12]);
    });

    it("computes distinct bounds per method", () => {
        const values = Array.from({length: 100}, (_, i) => i + 1);

        expect(computeBreaks(values, "equalInterval", 4)).to.deep.equal([25.75, 50.5, 75.25]);
        expect(computeBreaks(values, "quantile", 4)).to.deep.equal([25.75, 50.5, 75.25]);
        expect(computeBreaks(values, "jenks", 4)).to.have.length(3);
        expect(computeBreaks(values, "stddev", 4)).to.have.length(3);
        // fewer distinct values than classes, a constant, nothing
        expect(computeBreaks([1, 1, 2, 2], "quantile", 5)).to.deep.equal([1.5]);
        expect(computeBreaks([3, 3, 3], "jenks", 5)).to.equal(null);
        expect(computeBreaks([], "jenks", 5)).to.equal(null);
    });

    it("puts values into classes, non-numbers into none", () => {
        expect([0, 3, 4, 12, 13].map(v => classOf(v, [3, 12]))).to.deep.equal([0, 0, 1, 1, 2]);
        expect(classOf("x", [3])).to.equal(-1);
    });

    it("expands and reverses ramps", () => {
        const c = expandRamp("blues", 3);

        expect(c).to.deep.equal(["#eff3ff", "#6baed6", "#08519c"]);
        expect(expandRamp("blues", 3, true)).to.deep.equal(c.slice().reverse());
    });

    it("adds alpha to hex and rgb colours", () => {
        expect(colorWithAlpha("#ff0000", 0.5)).to.equal("rgba(255,0,0,0.5)");
        expect(colorWithAlpha("#f00", 1)).to.equal("rgba(255,0,0,1)");
        expect(colorWithAlpha("rgba(1,2,3,0.1)", 0.7)).to.equal("rgba(1,2,3,0.7)");
        expect(colorWithAlpha("red", 0.7)).to.equal("red");
    });

    it("formats bounds for people", () => {
        expect(fmtBreak(2009)).to.equal("2009");
        expect(fmtBreak(12345)).to.equal("12.345");
        expect(fmtBreak(2.5)).to.equal("2,5");
    });

    it("colours categories by sorted value, collapses the rare rest beyond the palette", () => {
        const few = categoryColors(new Map([["b", 1], ["a", 5]]), {b: "#000000"});

        expect(few).to.deep.equal({colors: {a: STANDARD_PALETTE[0], b: "#000000"}, otherColor: null});

        const many = new Map(Array.from({length: 30}, (_, i) => [`v${i}`, 100 - i])),
            {colors, otherColor} = categoryColors(many);

        expect(Object.keys(colors)).to.have.length(STANDARD_PALETTE.length - 1);
        expect(colors.v0).to.equal(STANDARD_PALETTE[0]);
        expect(colors.v29).to.equal(undefined);
        expect(otherColor).to.equal(OTHER_COLOR);
    });
});
