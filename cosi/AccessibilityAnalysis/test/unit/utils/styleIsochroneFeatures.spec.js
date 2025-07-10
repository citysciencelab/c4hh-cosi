import {expect} from "chai";
import sinon from "sinon";
import Feature from "ol/Feature";
import {styleIsochroneFeatures} from "../../../utils/styleIsochroneFeatures.js";

describe("AccessibiltyAnalysis/utils/styleIsochroneFeatures", () => {
    const feature1 = new Feature(),
        feature2 = new Feature(),
        feature3 = new Feature(),
        feature4 = new Feature();

    beforeEach(function () {
        sinon.spy(console, "error");
    });

    afterEach(function () {
        console.error.restore();
        sinon.restore();
    });

    it("should call an error if the given parameter is an object", () => {
        styleIsochroneFeatures({});
        expect(console.error.calledOnce).to.be.true;
    });

    it("should call an error if the given parameter is undefined", () => {
        styleIsochroneFeatures(undefined);
        expect(console.error.calledOnce).to.be.true;
    });

    it("should call an error if the given parameter is a boolean", () => {
        styleIsochroneFeatures(true);
        expect(console.error.calledOnce).to.be.true;
    });

    it("should call an error if the given parameter is a string", () => {
        styleIsochroneFeatures("string");
        expect(console.error.calledOnce).to.be.true;
    });

    it("should call an error if the given parameter is null", () => {
        styleIsochroneFeatures(null);
        expect(console.error.calledOnce).to.be.true;
    });

    it("should call an error if the given parameter is a number", () => {
        styleIsochroneFeatures(666);
        expect(console.error.calledOnce).to.be.true;
    });

    it("should call an error if the given parameter is an empty array", () => {
        styleIsochroneFeatures([]);
        expect(console.error.calledOnce).to.be.true;
    });

    it("should call an error if the given parameter is an array with the length two", () => {
        styleIsochroneFeatures([feature1, feature2]);
        expect(console.error.calledOnce).to.be.true;
    });

    it("should not call an error if the given parameter is an array with the length three", () => {
        styleIsochroneFeatures([feature1, feature2, feature3]);
        expect(console.error.notCalled).to.be.true;
    });

    it("should not call an error if the given parameter is an array with the length four", () => {
        styleIsochroneFeatures([feature1, feature2, feature3, feature4]);
        expect(console.error.notCalled).to.be.true;
    });

    it("should call an error if the second parameter is an object", () => {
        styleIsochroneFeatures([feature1, feature2, feature3], {});
        expect(console.error.calledOnce).to.be.true;
    });

    it("should call an error if the second parameter is a boolean", () => {
        styleIsochroneFeatures([feature1, feature2, feature3], true);
        expect(console.error.calledOnce).to.be.true;
    });

    it("should call an error if the second parameter is a string", () => {
        styleIsochroneFeatures([feature1, feature2, feature3], "string");
        expect(console.error.calledOnce).to.be.true;
    });

    it("should call an error if the second parameter is null", () => {
        styleIsochroneFeatures([feature1, feature2, feature3], null);
        expect(console.error.calledOnce).to.be.true;
    });

    it("should call an error if the second parameter is a number", () => {
        styleIsochroneFeatures([feature1, feature2, feature3], 666);
        expect(console.error.calledOnce).to.be.true;
    });

    it("should style the features with the default colors if three features are given", () => {
        styleIsochroneFeatures([feature1, feature2, feature3], undefined);

        expect(feature1.getStyle().getFill().getColor()).to.be.equal("rgba(240, 0, 3, 0.2)");
        expect(feature2.getStyle().getFill().getColor()).to.be.equal("rgba(200, 200, 3, 0.2)");
        expect(feature3.getStyle().getFill().getColor()).to.be.equal("rgba(0, 240, 3, 0.2)");
    });

    it("should style the features with the default colors if four features are given", () => {
        styleIsochroneFeatures([feature1, feature2, feature3, feature4], undefined);

        expect(feature1.getStyle().getFill().getColor()).to.be.equal("rgba(255, 255, 255, 0)");
        expect(feature2.getStyle().getFill().getColor()).to.be.equal("rgba(240, 0, 3, 0.2)");
        expect(feature3.getStyle().getFill().getColor()).to.be.equal("rgba(200, 200, 3, 0.2)");
        expect(feature4.getStyle().getFill().getColor()).to.be.equal("rgba(0, 240, 3, 0.2)");
    });

    it("should style the features with the given colors", () => {
        styleIsochroneFeatures([feature1, feature2, feature3], ["rgba(122, 122, 122, 0.2)", "rgba(33, 33, 33, 0.2)", "rgba(3, 2, 3, 0.2)"]);

        expect(feature1.getStyle().getFill().getColor()).to.be.equal("rgba(122, 122, 122, 0.2)");
        expect(feature2.getStyle().getFill().getColor()).to.be.equal("rgba(33, 33, 33, 0.2)");
        expect(feature3.getStyle().getFill().getColor()).to.be.equal("rgba(3, 2, 3, 0.2)");
    });
});
