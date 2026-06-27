import {expect} from "chai";

import createVectorLayer from "../../createVectorLayer.js";
import store from "../../../../../../src/app-store/index.js";

describe("addons/shared/js/mapfishUtils/createVectorLayer.js", () => {

    beforeEach(() => {
        store.getters = {
            "Maps/projection": {
                getCode: () => "EPSG:25832"
            }
        };
    });

    describe("getPointStyle", () => {
        it("should return the default point style", () => {
            expect(createVectorLayer.getPointStyle(undefined).image_.radius).to.equal(4);
            expect(createVectorLayer.getPointStyle(undefined).image_.fill_.color_).to.deep.equal([228, 26, 28, 1]);
            expect(createVectorLayer.getPointStyle(undefined).image_.renderOptions_.strokeStyle).to.equal("rgba(228,26,28,1)");

            expect(createVectorLayer.getPointStyle(null).image_.radius).to.equal(4);
            expect(createVectorLayer.getPointStyle(null).image_.fill_.color_).to.deep.equal([228, 26, 28, 1]);
            expect(createVectorLayer.getPointStyle(null).image_.renderOptions_.strokeStyle).to.equal("rgba(228,26,28,1)");

            expect(createVectorLayer.getPointStyle([]).image_.radius).to.equal(4);
            expect(createVectorLayer.getPointStyle([]).image_.fill_.color_).to.deep.equal([228, 26, 28, 1]);
            expect(createVectorLayer.getPointStyle([]).image_.renderOptions_.strokeStyle).to.equal("rgba(228,26,28,1)");

            expect(createVectorLayer.getPointStyle(true).image_.radius).to.equal(4);
            expect(createVectorLayer.getPointStyle(true).image_.fill_.color_).to.deep.equal([228, 26, 28, 1]);
            expect(createVectorLayer.getPointStyle(true).image_.renderOptions_.strokeStyle).to.equal("rgba(228,26,28,1)");

            expect(createVectorLayer.getPointStyle("string").image_.radius).to.equal(4);
            expect(createVectorLayer.getPointStyle("string").image_.fill_.color_).to.deep.equal([228, 26, 28, 1]);
            expect(createVectorLayer.getPointStyle("string").image_.renderOptions_.strokeStyle).to.equal("rgba(228,26,28,1)");
        });

        it("should return the point style with configured and default style", () => {
            let style = {
                "pointSize": 3
            };

            expect(createVectorLayer.getPointStyle(style).image_.radius).to.equal(3);
            expect(createVectorLayer.getPointStyle(style).image_.fill_.color_).to.deep.equal([228, 26, 28, 1]);
            expect(createVectorLayer.getPointStyle(style).image_.renderOptions_.strokeStyle).to.equal("rgba(228,26,28,1)");

            style = {
                "color": [
                    226,
                    26,
                    28,
                    1
                ]
            };

            expect(createVectorLayer.getPointStyle(style).image_.radius).to.equal(4);
            expect(createVectorLayer.getPointStyle(style).image_.fill_.color_).to.deep.equal([226, 26, 28, 1]);
            expect(createVectorLayer.getPointStyle(style).image_.renderOptions_.strokeStyle).to.equal("rgba(226,26,28,1)");
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

            expect(createVectorLayer.getPointStyle(style).image_.radius).to.equal(3);
            expect(createVectorLayer.getPointStyle(style).image_.fill_.color_).to.deep.equal([228, 26, 30, 1]);
            expect(createVectorLayer.getPointStyle(style).image_.renderOptions_.strokeStyle).to.equal("rgba(228,26,30,1)");
        });
    });

    describe("getPolygonStyle", () => {
        it("should return the default polygon style", () => {
            expect(createVectorLayer.getPolygonStyle(undefined).fill_.color_).to.deep.equal([255, 255, 255, 0]);
            expect(createVectorLayer.getPolygonStyle(undefined).stroke_.color_).to.deep.equal([255, 255, 255, 1]);
            expect(createVectorLayer.getPolygonStyle(undefined).stroke_.width_).to.equal(4);

            expect(createVectorLayer.getPolygonStyle(null).fill_.color_).to.deep.equal([255, 255, 255, 0]);
            expect(createVectorLayer.getPolygonStyle(null).stroke_.color_).to.deep.equal([255, 255, 255, 1]);
            expect(createVectorLayer.getPolygonStyle(null).stroke_.width_).to.equal(4);

            expect(createVectorLayer.getPolygonStyle([]).fill_.color_).to.deep.equal([255, 255, 255, 0]);
            expect(createVectorLayer.getPolygonStyle([]).stroke_.color_).to.deep.equal([255, 255, 255, 1]);
            expect(createVectorLayer.getPolygonStyle([]).stroke_.width_).to.equal(4);

            expect(createVectorLayer.getPolygonStyle(true).fill_.color_).to.deep.equal([255, 255, 255, 0]);
            expect(createVectorLayer.getPolygonStyle(true).stroke_.color_).to.deep.equal([255, 255, 255, 1]);
            expect(createVectorLayer.getPolygonStyle(true).stroke_.width_).to.equal(4);

            expect(createVectorLayer.getPolygonStyle("string").fill_.color_).to.deep.equal([255, 255, 255, 0]);
            expect(createVectorLayer.getPolygonStyle("string").stroke_.color_).to.deep.equal([255, 255, 255, 1]);
            expect(createVectorLayer.getPolygonStyle("string").stroke_.width_).to.equal(4);
        });

        it("should return the polygon style with configured and default style", () => {
            let style = {
                "borderSize": 3
            };

            expect(createVectorLayer.getPolygonStyle(style).stroke_.width_).to.equal(3);
            expect(createVectorLayer.getPolygonStyle(style).fill_.color_).to.deep.equal([255, 255, 255, 0]);
            expect(createVectorLayer.getPolygonStyle(style).stroke_.color_).to.deep.equal([255, 255, 255, 1]);

            style = {
                "color": [
                    226,
                    26,
                    28,
                    1
                ]
            };

            expect(createVectorLayer.getPolygonStyle(style).stroke_.width_).to.equal(4);
            expect(createVectorLayer.getPolygonStyle(style).fill_.color_).to.deep.equal([255, 255, 255, 0]);
            expect(createVectorLayer.getPolygonStyle(style).stroke_.color_).to.deep.equal([226, 26, 28, 1]);
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

            expect(createVectorLayer.getPolygonStyle(style).stroke_.width_).to.equal(3);
            expect(createVectorLayer.getPolygonStyle(style).fill_.color_).to.deep.equal([255, 255, 255, 0]);
            expect(createVectorLayer.getPolygonStyle(style).stroke_.color_).to.deep.equal([228, 26, 30, 1]);
        });
    });
});
