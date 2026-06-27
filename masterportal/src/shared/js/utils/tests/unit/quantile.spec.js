import quantile from "@shared/js/utils/quantile.js";
import {expect} from "chai";

describe("src/shared/js/utils/quantile.js", () => {
    it("should calculate correct quantiles", () => {
        expect(quantile([1], 0.1)).to.equal(1);
        expect(quantile([1, 2], 0.1)).to.equal(1);
        expect(quantile([1, 2], 0.9)).to.equal(2);
        expect(quantile([1, 2, 3], 0.5)).to.equal(2);
    });
});
