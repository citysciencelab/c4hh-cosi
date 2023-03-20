import {expect} from "chai";
import sinon from "sinon";

import {
    getPointStyle,
    getPolygonStyle
} from "../../../utils/createVectorLayer";
import store from "../../../../../src/app-store";

describe("addons/valuationPrint/utils/translator.getFixedMap.js", () => {

    beforeEach(() => {
        store.getters = {
            "Maps/projection": {
                getCode: () => "EPSG:25832"
            }
        };
    });
    afterEach(sinon.restore);

    describe("getPointStyle", () => {
        it("should return the default point style", () => {
            expect(getPointStyle(undefined).image_.radius_).to.equal(4);
            expect(getPointStyle(undefined).image_.fill_.color_).to.deep.equal([228, 26, 28, 1]);
            expect(getPointStyle(undefined).image_.renderOptions_.strokeStyle).to.equal("rgba(228,26,28,1)");

            expect(getPointStyle(null).image_.radius_).to.equal(4);
            expect(getPointStyle(null).image_.fill_.color_).to.deep.equal([228, 26, 28, 1]);
            expect(getPointStyle(null).image_.renderOptions_.strokeStyle).to.equal("rgba(228,26,28,1)");

            expect(getPointStyle([]).image_.radius_).to.equal(4);
            expect(getPointStyle([]).image_.fill_.color_).to.deep.equal([228, 26, 28, 1]);
            expect(getPointStyle([]).image_.renderOptions_.strokeStyle).to.equal("rgba(228,26,28,1)");

            expect(getPointStyle(true).image_.radius_).to.equal(4);
            expect(getPointStyle(true).image_.fill_.color_).to.deep.equal([228, 26, 28, 1]);
            expect(getPointStyle(true).image_.renderOptions_.strokeStyle).to.equal("rgba(228,26,28,1)");

            expect(getPointStyle("string").image_.radius_).to.equal(4);
            expect(getPointStyle("string").image_.fill_.color_).to.deep.equal([228, 26, 28, 1]);
            expect(getPointStyle("string").image_.renderOptions_.strokeStyle).to.equal("rgba(228,26,28,1)");
        });

        it("should return the point style with configured and default style", () => {
            let style = {
                "pointSize": 3
            };

            expect(getPointStyle(style).image_.radius_).to.equal(3);
            expect(getPointStyle(style).image_.fill_.color_).to.deep.equal([228, 26, 28, 1]);
            expect(getPointStyle(style).image_.renderOptions_.strokeStyle).to.equal("rgba(228,26,28,1)");

            style = {
                "color": [
                    226,
                    26,
                    28,
                    1
                ]
            };

            expect(getPointStyle(style).image_.radius_).to.equal(4);
            expect(getPointStyle(style).image_.fill_.color_).to.deep.equal([226, 26, 28, 1]);
            expect(getPointStyle(style).image_.renderOptions_.strokeStyle).to.equal("rgba(226,26,28,1)");
        });

        it("should return the configured point style", () => {
            const style = {
                "pointSize": 3,
                "color": [
                    228,
                    26,
                    30,
                    1
                ]
            };

            expect(getPointStyle(style).image_.radius_).to.equal(3);
            expect(getPointStyle(style).image_.fill_.color_).to.deep.equal([228, 26, 30, 1]);
            expect(getPointStyle(style).image_.renderOptions_.strokeStyle).to.equal("rgba(228,26,30,1)");
        });
    });

    describe("getPolygonStyle", () => {
        it("should return the default polygon style", () => {
            expect(getPolygonStyle(undefined).fill_.color_).to.deep.equal([255, 255, 255, 0]);
            expect(getPolygonStyle(undefined).stroke_.color_).to.deep.equal([255, 255, 255, 1]);
            expect(getPolygonStyle(undefined).stroke_.width_).to.equal(4);

            expect(getPolygonStyle(null).fill_.color_).to.deep.equal([255, 255, 255, 0]);
            expect(getPolygonStyle(null).stroke_.color_).to.deep.equal([255, 255, 255, 1]);
            expect(getPolygonStyle(null).stroke_.width_).to.equal(4);

            expect(getPolygonStyle([]).fill_.color_).to.deep.equal([255, 255, 255, 0]);
            expect(getPolygonStyle([]).stroke_.color_).to.deep.equal([255, 255, 255, 1]);
            expect(getPolygonStyle([]).stroke_.width_).to.equal(4);

            expect(getPolygonStyle(true).fill_.color_).to.deep.equal([255, 255, 255, 0]);
            expect(getPolygonStyle(true).stroke_.color_).to.deep.equal([255, 255, 255, 1]);
            expect(getPolygonStyle(true).stroke_.width_).to.equal(4);

            expect(getPolygonStyle("string").fill_.color_).to.deep.equal([255, 255, 255, 0]);
            expect(getPolygonStyle("string").stroke_.color_).to.deep.equal([255, 255, 255, 1]);
            expect(getPolygonStyle("string").stroke_.width_).to.equal(4);
        });

        it("should return the polygon style with configured and default style", () => {
            let style = {
                "borderSize": 3
            };

            expect(getPolygonStyle(style).stroke_.width_).to.equal(3);
            expect(getPolygonStyle(style).fill_.color_).to.deep.equal([255, 255, 255, 0]);
            expect(getPolygonStyle(style).stroke_.color_).to.deep.equal([255, 255, 255, 1]);

            style = {
                "color": [
                    226,
                    26,
                    28,
                    1
                ]
            };

            expect(getPolygonStyle(style).stroke_.width_).to.equal(4);
            expect(getPolygonStyle(style).fill_.color_).to.deep.equal([255, 255, 255, 0]);
            expect(getPolygonStyle(style).stroke_.color_).to.deep.equal([226, 26, 28, 1]);
        });

        it("should return the configured polygon style", () => {
            const style = {
                "borderSize": 3,
                "color": [
                    228,
                    26,
                    30,
                    1
                ]
            };

            expect(getPolygonStyle(style).stroke_.width_).to.equal(3);
            expect(getPolygonStyle(style).fill_.color_).to.deep.equal([255, 255, 255, 0]);
            expect(getPolygonStyle(style).stroke_.color_).to.deep.equal([228, 26, 30, 1]);
        });
    });
});
