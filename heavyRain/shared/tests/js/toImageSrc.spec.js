import {expect} from "chai";
import {toImageSrc} from "../../js/toImageSrc.js";

describe("addons/heavyRain/shared/js/toImageSrc.js", () => {
    it("should keep an image saved as data url", () => {
        expect(toImageSrc("data:image/png;base64,iVBOR")).to.equal("data:image/png;base64,iVBOR");
    });

    it("should add a data url prefix to an image saved as plain base64", () => {
        expect(toImageSrc("iVBOR")).to.equal("data:image/*;base64,iVBOR");
    });

    it("should return an empty string if there is no image", () => {
        expect(toImageSrc(undefined)).to.equal("");
        expect(toImageSrc(null)).to.equal("");
        expect(toImageSrc("")).to.equal("");
        expect(toImageSrc("  ")).to.equal("");
    });
});
