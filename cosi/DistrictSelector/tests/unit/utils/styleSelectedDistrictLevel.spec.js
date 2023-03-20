import {getFeatureStyle, getSelectedFillStyle, getSelectedStrokeStyle, styleSelectedDistrictLevels} from "../../../utils/styleSelectedDistrictLevels";
import {expect} from "chai";
import sinon from "sinon";
import Feature from "ol/Feature.js";
import {Fill, Stroke, Style} from "ol/style.js";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";

describe("addons/DistrictSelector/utils/styleSelectedDistrictLevels.js", () => {
    const feature = new Feature(),
        featureTwo = new Feature(),
        styleValues = {
            fill: {
                color: [255, 255, 255, 0]
            },
            stroke: {
                color: [51, 153, 204, 1],
                width: 3
            }
        },
        styleValuesTwo = {
            fill: {
                color: [0, 0, 0, 0]
            },
            stroke: {
                color: [51, 153, 204, 1],
                width: 3
            }
        },
        districtLevels = [
            {
                layerId: "selectedLevelId",
                layer: new VectorLayer({
                    source: new VectorSource({
                        features: [feature]
                    })
                })
            },
            {
                layerId: "selectedLevelIdTwo",
                layer: new VectorLayer({
                    source: new VectorSource({
                        features: [featureTwo]
                    })
                })
            }
        ];


    describe("getFeatureStyle", () => {
        beforeEach(function () {
            sinon.spy(console, "error");
        });

        afterEach(function () {
            console.error.restore();
            sinon.restore();
        });

        it("should return undefined if the given parameter is an object", () => {
            expect(getFeatureStyle({})).to.be.undefined;
        });

        it("should return undefined if the given parameter is undefined", () => {
            expect(getFeatureStyle(undefined)).to.be.undefined;
        });

        it("should return undefined if the given parameter is a boolean", () => {
            expect(getFeatureStyle(true)).to.be.undefined;
        });

        it("should return undefined if the given parameter is an array", () => {
            expect(getFeatureStyle([])).to.be.undefined;
        });

        it("should return undefined if the given parameter is null", () => {
            expect(getFeatureStyle(null)).to.be.undefined;
        });

        it("should return undefined if the given parameter is a string", () => {
            expect(getFeatureStyle("")).to.be.undefined;
        });

        it("should return undefined if the given parameter is a number", () => {
            expect(getFeatureStyle(666)).to.be.undefined;
        });

        it("should call an error if the given parameter is not a function", () => {
            getFeatureStyle(false);
            expect(console.error.calledOnce).to.be.true;
        });

        it("should return undefined if the given parameter is an object", () => {
            expect(getFeatureStyle(() => styleValues, {})).to.be.undefined;
        });

        it("should return undefined if the second given parameter is undefined", () => {
            expect(getFeatureStyle(() => styleValues)).to.be.undefined;
        });

        it("should return undefined if the second given parameter is a boolean", () => {
            expect(getFeatureStyle(() => styleValues, true)).to.be.undefined;
        });

        it("should return undefined if the second given parameter is an array", () => {
            expect(getFeatureStyle(() => styleValues, [])).to.be.undefined;
        });

        it("should return undefined if the second given parameter is null", () => {
            expect(getFeatureStyle(() => styleValues, null)).to.be.undefined;
        });

        it("should return undefined if the second given parameter is a string", () => {
            expect(getFeatureStyle(() => styleValues, "")).to.be.undefined;
        });

        it("should return undefined if the second given parameter is a number", () => {
            expect(getFeatureStyle(() => styleValues, 666)).to.be.undefined;
        });

        it("should return undefined if the second given parameter is a function", () => {
            expect(getFeatureStyle(() => styleValues, () => 666)).to.be.undefined;
        });

        it("should call an error if the second given parameter is not a feature", () => {
            getFeatureStyle(() => styleValues, "");
            expect(console.error.calledOnce).to.be.true;
        });

        it("should return the style as object of the passed feature", () => {
            expect(getFeatureStyle(() => styleValues, feature)).to.deep.equal(styleValues);
        });

        it("should return the first style as object of the passed feature if ", () => {
            expect(getFeatureStyle(() => [styleValuesTwo, styleValues], feature)).to.deep.equal(styleValuesTwo);
        });

        it("should return undefined if the passed style function return undefined", () => {
            expect(getFeatureStyle(() => undefined, feature)).to.be.undefined;
        });
    });

    describe("getSelectedFillStyle", () => {
        it("should return null if the third given parameter is undefined", () => {
            expect(getSelectedFillStyle(undefined, styleValues, undefined, 0.6)).to.be.null;
        });

        it("should return null if the third given parameter is a string", () => {
            expect(getSelectedFillStyle(undefined, styleValues, "", 0.6)).to.be.null;
        });

        it("should return null if the third given parameter is a boolean", () => {
            expect(getSelectedFillStyle(undefined, styleValues, true, 0.6)).to.be.null;
        });

        it("should return null if the third given parameter is an object", () => {
            expect(getSelectedFillStyle(undefined, styleValues, {}, 0.6)).to.be.null;
        });

        it("should return null if the third given parameter is a number", () => {
            expect(getSelectedFillStyle(undefined, styleValues, 666, 0.6)).to.be.null;
        });

        it("should return null if the third given parameter is null", () => {
            expect(getSelectedFillStyle(undefined, styleValues, null, 0.6)).to.be.null;
        });

        it("should return null if the third given parameter is a function", () => {
            expect(getSelectedFillStyle(undefined, styleValues, () => "", 0.6)).to.be.null;
        });

        it("should return null if the fourth given parameter is undefined", () => {
            expect(getSelectedFillStyle(undefined, styleValues, undefined, undefined)).to.be.null;
        });

        it("should return null if the fourth given parameter is a string", () => {
            expect(getSelectedFillStyle(undefined, styleValues, undefined, "")).to.be.null;
        });

        it("should return null if the fourth given parameter is a boolean", () => {
            expect(getSelectedFillStyle(undefined, styleValues, undefined, true)).to.be.null;
        });

        it("should return null if the fourth given parameter is an object", () => {
            expect(getSelectedFillStyle(undefined, styleValues, undefined, {})).to.be.null;
        });

        it("should return null if the fourth given parameter is an array", () => {
            expect(getSelectedFillStyle(undefined, styleValues, undefined, [])).to.be.null;
        });

        it("should return null if the fourth given parameter is null", () => {
            expect(getSelectedFillStyle(undefined, styleValues, undefined, null)).to.be.null;
        });

        it("should return null if the fourth given parameter is a function", () => {
            expect(getSelectedFillStyle(undefined, styleValues, undefined, () => styleValues)).to.be.null;
        });

        it("should return a fill style with the given styleValues and opacity", () => {
            const expectedFillStyle = new Fill({
                color: [255, 255, 255, 0.5]
            });

            expect(getSelectedFillStyle(undefined, styleValues, [], 0.5)).to.deep.equal(expectedFillStyle);
        });

        it("should return the given Style with the passed opacity", () => {
            const givenStyle = new Style({
                    fill: new Fill({
                        color: [255, 255, 255, 0.3]
                    })
                }),
                expectedFillStyle = new Fill({
                    color: [255, 255, 255, 0.8]
                });

            expect(getSelectedFillStyle(givenStyle, styleValues, [], 0.8)).to.deep.equal(expectedFillStyle);
        });

        it("should return a fill style with the given color", () => {
            const fillStyle = new Fill({
                color: [255, 255, 255, 0.8]
            });

            expect(getSelectedFillStyle(undefined, undefined, [255, 255, 255], 0.8)).to.deep.equal(fillStyle);
        });

        it("should return a fill style with the given color and a changed opacity", () => {
            const fillStyle = new Fill({
                color: [255, 255, 255, 0.5]
            });

            expect(getSelectedFillStyle(undefined, undefined, [255, 255, 255, 0.8], 0.5)).to.deep.equal(fillStyle);
        });
    });

    describe("getSelectedStrokeStyle", () => {
        it("should return the default stroke style", () => {
            const expectedStrokeStyle = new Stroke({
                color: [51, 153, 204, 1],
                width: 3
            });

            expect(getSelectedStrokeStyle(undefined, undefined)).to.deep.equal(expectedStrokeStyle);
        });

        it("should return stroke style with the given color (3rd parameter) and width (4th parameter)", () => {
            const expectedStrokeStyle = new Stroke({
                color: [511, 15, 204, 1],
                width: 4
            });

            expect(getSelectedStrokeStyle(undefined, undefined, [511, 15, 204, 1], 4)).to.deep.equal(expectedStrokeStyle);
        });

        it("should return the stroke style of the given style", () => {
            const expectedStrokeStyle = new Style({
                stroke: new Stroke({
                    color: [51, 15, 204, 1],
                    width: 8
                })
            });

            expect(getSelectedStrokeStyle(expectedStrokeStyle, undefined, [511, 15, 204, 1], 4)).to.deep.equal(expectedStrokeStyle.getStroke());
        });

        it("should return the stroke style with the given color and width if 2nd parameter has no stroke attribute", () => {
            const expectedStrokeStyle = new Stroke({
                color: [511, 15, 204, 1],
                width: 4
            });

            expect(getSelectedStrokeStyle(undefined, {color: [11, 115, 24, 1], width: 2}, [511, 15, 204, 1], 4)).to.deep.equal(expectedStrokeStyle);
        });

        it("should return a stroke style with the given style values", () => {
            const expectedStrokeStyle = new Stroke({
                color: [11, 115, 24, 1],
                width: 2
            });

            expect(getSelectedStrokeStyle(undefined, {stroke: {color: [11, 115, 24, 1], width: 2}}, [511, 15, 204, 1], 4)).to.deep.equal(expectedStrokeStyle);
        });
    });

    describe("styleSelectedDistrictLevels", () => {
        beforeEach(function () {
            sinon.spy(console, "error");
        });

        afterEach(function () {
            console.error.restore();
            sinon.restore();
        });

        it("should call an error if the given parameter is an object", () => {
            styleSelectedDistrictLevels({});
            expect(console.error.calledOnce).to.be.true;
        });

        it("should call an error if the given parameter is a number", () => {
            styleSelectedDistrictLevels(666);
            expect(console.error.calledOnce).to.be.true;
        });

        it("should call an error if the given parameter is a string", () => {
            styleSelectedDistrictLevels("");
            expect(console.error.calledOnce).to.be.true;
        });

        it("should call an error if the given parameter is a boolean", () => {
            styleSelectedDistrictLevels(false);
            expect(console.error.calledOnce).to.be.true;
        });

        it("should call an error if the given parameter is null", () => {
            styleSelectedDistrictLevels(null);
            expect(console.error.calledOnce).to.be.true;
        });

        it("should return undefined if the given parameter is undefined", () => {
            styleSelectedDistrictLevels(undefined);
            expect(console.error.calledOnce).to.be.true;
        });

        it("should call getStyleFunction if the second parameter is equal to the level id", () => {
            sinon.stub(districtLevels[0].layer, "getStyleFunction");
            styleSelectedDistrictLevels(districtLevels, "selectedLevelId");
            expect(districtLevels[0].layer.getStyleFunction.calledOnce).to.be.true;
        });

        it("should call setStyle if the second parameter is equal to the level id", () => {
            sinon.stub(districtLevels[0].layer, "setStyle");
            styleSelectedDistrictLevels(districtLevels, "selectedLevelId");
            expect(districtLevels[0].layer.setStyle.calledOnce).to.be.true;
        });

        it("should set the layer style with the given opacity (4th parameter)", () => {
            const style = new Style({
                fill: new Fill({
                    color: [255, 255, 255, 0.8]
                }),
                stroke: new Stroke({
                    color: "#3399CC",
                    width: 1.25
                })
            });

            styleSelectedDistrictLevels(districtLevels, "selectedLevelIdTwo", undefined, 0.8);
            expect(districtLevels[1].layer.getStyle()()).to.deep.equal(style);
        });

        it("should set the default layer style", () => {
            const style = new Style({
                fill: new Fill({
                    color: [255, 255, 255, 0.6]
                }),
                stroke: new Stroke({
                    color: [51, 153, 204, 1],
                    width: 3
                })
            });

            sinon.stub(districtLevels[0].layer, "getStyleFunction").returns(undefined);
            styleSelectedDistrictLevels(districtLevels, "selectedLevelId");
            expect(districtLevels[0].layer.getStyle()()).to.deep.equal(style);
        });
    });
});
