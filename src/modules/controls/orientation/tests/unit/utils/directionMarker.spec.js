import {expect} from "chai";
import {
    toHeadingDegrees,
    resolveHeading,
    getMarkerDirectionStyle
} from "@modules/controls/orientation/utils/directionMarker.js";

describe("src/modules/controls/orientation/utils/directionMarker.js", () => {
    describe("toHeadingDegrees", () => {
        it("converts 0 radians to 0 degrees", () => {
            expect(toHeadingDegrees(0)).to.equal(0);
        });

        it("converts PI/2 radians to 90 degrees", () => {
            expect(toHeadingDegrees(Math.PI / 2)).to.equal(90);
        });

        it("converts PI radians to 180 degrees", () => {
            expect(toHeadingDegrees(Math.PI)).to.equal(180);
        });

        it("converts 3*PI/2 radians to 270 degrees", () => {
            expect(toHeadingDegrees(3 * Math.PI / 2)).to.equal(270);
        });

        it("wraps negative radians to 0-360 range", () => {
            expect(toHeadingDegrees(-Math.PI / 2)).to.equal(270);
        });
    });

    describe("resolveHeading", () => {
        it("returns heading when finite", () => {
            expect(resolveHeading(1.5)).to.equal(1.5);
        });

        it("returns null when heading is null", () => {
            expect(resolveHeading(null)).to.be.null;
        });

        it("returns null when heading is undefined", () => {
            expect(resolveHeading(undefined)).to.be.null;
        });

        it("returns null when heading is NaN", () => {
            expect(resolveHeading(NaN)).to.be.null;
        });

        it("returns null when heading is Infinity", () => {
            expect(resolveHeading(Infinity)).to.be.null;
        });
    });

    describe("getMarkerDirectionStyle", () => {
        it("returns empty object when showDirection is false", () => {
            expect(getMarkerDirectionStyle(false, Math.PI / 2)).to.deep.equal({});
        });

        it("returns empty object when heading is null", () => {
            expect(getMarkerDirectionStyle(true, null)).to.deep.equal({});
        });

        it("returns empty object when heading is not finite", () => {
            expect(getMarkerDirectionStyle(true, NaN)).to.deep.equal({});
        });

        it("returns style object with correct angle for valid heading and showDirection true", () => {
            const style = getMarkerDirectionStyle(true, Math.PI / 2);

            expect(style).to.have.property("--marker-heading-angle");
            expect(style["--marker-heading-angle"]).to.equal("90deg");
        });

        it("returns style object with wrapped angle for negative heading", () => {
            const style = getMarkerDirectionStyle(true, -Math.PI / 2);

            expect(style["--marker-heading-angle"]).to.equal("270deg");
        });

        it("handles zero heading", () => {
            const style = getMarkerDirectionStyle(true, 0);

            expect(style["--marker-heading-angle"]).to.equal("0deg");
        });
    });
});
