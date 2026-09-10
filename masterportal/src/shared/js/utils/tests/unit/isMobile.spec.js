import isMobile from "@shared/js/utils/isMobile.js";
import {expect} from "chai";

describe("src/shared/js/utils/isMobile.js", () => {
    let originalInnerWidthDescriptor;

    beforeAll(() => {
        originalInnerWidthDescriptor = Object.getOwnPropertyDescriptor(window, "innerWidth");
    });

    afterEach(() => {
        if (originalInnerWidthDescriptor) {
            Object.defineProperty(window, "innerWidth", originalInnerWidthDescriptor);
        }
    });

    it("should return true if window.innerwidth < 768", () => {
        Object.defineProperty(window, "innerWidth", {value: 500, configurable: true});

        expect(isMobile()).to.be.true;
    });

    it("should return true if window.innerwidth > 768", () => {
        Object.defineProperty(window, "innerWidth", {value: 1024, configurable: true});

        expect(isMobile()).to.be.false;
    });
});
