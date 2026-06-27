import isMobile from "@shared/js/utils/isMobile.js";
import {expect} from "chai";

describe("src/shared/js/utils/isMobile.js", () => {
    let localWindow;

    beforeAll(() => {
        localWindow = global.window;
    });

    afterAll(() => {
        global.window = localWindow;
    });

    it("should return true if window.innerwidth < 768", () => {
        global.window = {
            innerWidth: 500
        };

        expect(isMobile()).to.be.true;
    });

    it("should return true if window.innerwidth > 768", () => {
        global.window = {
            innerWidth: 1024
        };

        expect(isMobile()).to.be.false;
    });
});
