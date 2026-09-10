import {expect} from "chai";
import getPosition from "@shared/modules/layerSwiper/utils/getPosition.js";

describe("src/shared/modules/layerSwiper/utils/getPosition.js", () => {
    const keyboardMovement = 5;
    let currentPos,
        event,
        originalInnerWidth,
        originalInnerHeight;

    beforeEach(() => {
        currentPos = 750;
        event = {pageX: "", pageY: "", type: "pointermove", key: ""};

        originalInnerWidth = window.innerWidth;
        originalInnerHeight = window.innerHeight;
        Object.defineProperty(window, "innerWidth", {configurable: true, writable: true, value: 1000});
        Object.defineProperty(window, "innerHeight", {configurable: true, writable: true, value: 1000});
    });

    afterEach(() => {
        Object.defineProperty(window, "innerWidth", {configurable: true, writable: true, value: originalInnerWidth});
        Object.defineProperty(window, "innerHeight", {configurable: true, writable: true, value: originalInnerHeight});
    });

    it("should calculate and return the horizontal position according to the event type keydown", () => {
        event.type = "keydown";
        event.key = "ArrowLeft";

        expect(getPosition(event, currentPos, keyboardMovement, "horizontal")).to.eql(745);
    });

    it("should calculate and return the vertical position according to the event type keydown", () => {
        event.type = "keydown";
        event.key = "ArrowUp";

        expect(getPosition(event, currentPos, keyboardMovement, "vertical")).to.eql(745);
    });

    it("should calculate and return the horizontal position according to the event type pointermove", () => {
        event.pageX = 730;

        expect(getPosition(event, currentPos, keyboardMovement, "horizontal")).to.eql(730);
    });

    it("should calculate and return the vertical position according to the event type pointermove", () => {
        event.pageY = 730;

        expect(getPosition(event, currentPos, keyboardMovement, "vertical")).to.eql(730);
    });

    it("should return 0 if the new horizontal position would be further to the left than the window width", () => {
        event.pageX = -10;

        expect(getPosition(event, currentPos, keyboardMovement, "horizontal")).to.eql(0);
    });

    it("should return 0 if the new vertical position would be further to the top than the window height", () => {
        event.pageY = -10;

        expect(getPosition(event, currentPos, keyboardMovement, "vertical")).to.eql(0);
    });

    it("should return the inner width of the window if the new horizontal position would be further to the right than the window width", () => {
        event.pageX = 1200;

        expect(getPosition(event, currentPos, keyboardMovement, "horizontal")).to.eql(window.innerWidth);
    });

    it("should return the inner height of the window if the new vertical position would be further to the bottom than the window height", () => {
        event.pageY = 1200;

        expect(getPosition(event, currentPos, keyboardMovement, "vertical")).to.eql(window.innerHeight);
    });
});
