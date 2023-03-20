import getColorFromNumber from "../getColorFromNumber";
import {expect} from "chai";

describe("getColorFromNumber", () => {
    it("should convert number to color", () => {
        expect(getColorFromNumber(0, 10)).to.be.eql([255, 179, 0]);
        expect(getColorFromNumber(0, 1)).to.be.eql([255, 179, 0]);
        expect(getColorFromNumber(1, 10)).to.be.eql([128, 62, 117]);
        expect(getColorFromNumber(2, 10)).to.be.eql([255, 104, 0]);
    });
<<<<<<< HEAD
    it("should return random rgb as array", () => {
        expect(getColorFromNumber(-1, 0)).to.be.an("array").with.lengthOf(3);
        expect(getColorFromNumber(100, 10)).to.be.an("array").with.lengthOf(3);
=======
    it("should convert number to color outside range", () => {
        expect(getColorFromNumber(-1, 0)).to.be.eql([128, 64, 64]);
        expect(getColorFromNumber(100, 10)).to.be.eql([128, 64, 128]);
>>>>>>> cd4746c6 (add new addons_3_0_0 structure-add missing addons)
    });
});
