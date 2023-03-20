import {expect} from "chai";
import Feature from "ol/Feature";
import Polygon from "ol/geom/Polygon";
import sinon from "sinon";
import {createAttributesByFeatures, addKnowledgeBaseError, createKnowledgeBase} from "../../../utils/createKnowledgeBase.js";

describe("addons/valuationPrint/utils/createKnowledgeBase.js", () => {
    const features = [
        new Feature({
            flstnrzae: "12345",
            gemarkung: "ueberall",
            flaeche: 12345,
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
            flstnrzae: "67890",
            gemarkung: "nirgends",
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


    describe("createAttributesByFeatures", () => {
        it("should return the attributes correctly", () => {
            const attributes = createAttributesByFeatures(features, ["gemarkung", "flstnrzae", "flaeche", "temp"]);

            expect(attributes).to.deep.equal({
                gemarkung: ["ueberall", "nirgends"],
                flstnrzae: ["12345", "67890"],
                flaeche: [12345, undefined],
                temp: [undefined, undefined]
            });
        });
    });

    describe("addKnowledgeBaseError", () => {
        it("should add the given error to each key in knowledge base", () => {
            const knowledgeBase = {},
                propertyName = ["attrA", "attrB"],
                expected = {"prefix.attrA": "error", "prefix.attrB": "error"};

            addKnowledgeBaseError(knowledgeBase, "error", "prefix", propertyName);
            expect(knowledgeBase).to.deep.equal(expected);
        });
    });

    describe("createKnowledgeBase", () => {
        it("should call onfinish if no more service is available", () => {
            const onfinish = sinon.spy();

            createKnowledgeBase(undefined, {}, undefined, undefined, onfinish, undefined, undefined);

            expect(onfinish.calledOnce).to.be.true;
        });
    });
});
