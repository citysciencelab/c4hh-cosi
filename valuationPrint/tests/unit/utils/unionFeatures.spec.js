import {expect} from "chai";
import Feature from "ol/Feature";
import Polygon from "ol/geom/Polygon";
import sinon from "sinon";
import {unionFeatures} from "../../../utils/unionFeatures.js";

describe("addons/valuationPrint/utils/unionFeatures.js", () => {
    const features = [
        new Feature({
            geometry: new Polygon([[
                [574626.667, 5927656.188],
                [574624.441, 5927658.443],
                [574593.381, 5927689.913],
                [574603.175, 5927698.901],
                [574642.559, 5927658.998],
                [574646.74, 5927654.762],
                [574653.787, 5927647.622],
                [574644.331, 5927638.291],
                [574638.809, 5927643.886],
                [574626.667, 5927656.188]]])
        }),
        new Feature({
            geometry: new Polygon([[
                [574729.649, 5927590.856],
                [574676.641, 5927642.08],
                [574690.16, 5927655.429],
                [574705.504, 5927640.191],
                [574711.97, 5927633.768],
                [574742.688, 5927603.26],
                [574729.649, 5927590.856]]])
        }),
        new Feature({
            geometry: new Polygon([[
                [574729.649, 5927590.856],
                [574676.641, 5927642.08],
                [574690.16, 5927655.429],
                [574705.504, 5927640.191],
                [574711.97, 5927633.768],
                [574742.688, 5927603.26],
                [574729.649, 5927590.856]]])
        })
    ];

    beforeEach(function () {
        sinon.spy(console, "error");
    });

    afterEach(function () {
        console.error.restore();
        sinon.restore();
    });

    it("should only return one feature if more than one is passed", () => {
        const feature = unionFeatures([features[0], features[1], features[2]]);

        expect(feature instanceof Feature).to.be.true;
    });

    it("should return one feature if one is passed", () => {
        const feature = unionFeatures([features[2]]);

        expect(feature instanceof Feature).to.be.true;
    });

    it("should throw an error if an empty array is passed", () => {
        unionFeatures([]);

        expect(console.error.calledOnce).to.be.true;
    });

    it("should throw an error if a wrong data type is passed", () => {
        unionFeatures({});
        unionFeatures(null);
        unionFeatures(undefined);
        unionFeatures(123);
        unionFeatures("123");
        unionFeatures(true);

        expect(console.error.callCount).to.be.equal(6);
    });
});
