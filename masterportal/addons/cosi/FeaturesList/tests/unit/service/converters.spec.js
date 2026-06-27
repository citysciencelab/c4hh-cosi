import {DbRangeConverter} from "../../../utils/converters";
import {expect} from "chai";

describe("converters", () => {
    it("should convert db range", async () => {
        const conv = new DbRangeConverter();

        expect(conv.convert("> 55 - 60 dB(A)")).to.be.equal(57.5);
        expect(conv.convert("> 10 - 20 dB(A)")).to.be.equal(15);
        expect(conv.convert("> 75 dB(A)")).to.be.equal(75);
    });
    it("should convert invalid db range to null", async () => {
        const conv = new DbRangeConverter();

        expect(conv.convert("")).to.be.null;
        expect(conv.convert("text")).to.null;
        expect(conv.convert(">55 - 60 dB(A)")).to.be.null;
        expect(conv.convert("> 55 - dB(A)")).to.be.null;
    });
});
