import {expect} from "chai";
import Feature from "ol/Feature.js";
import Polygon from "ol/geom/Polygon.js";
import sinon from "sinon";
import {createAttributesByFeatures, addKnowledgeBaseError, createKnowledgeBase, sumNumbers} from "../../createKnowledgeBase.js";


describe("addons/shared/js/mapfishUtils/createKnowledgeBase.js", () => {
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

            createKnowledgeBase(undefined, {}, {mapProjection: undefined, oafCRSURI: undefined}, undefined, onfinish, undefined, undefined);

            expect(onfinish.calledOnce).to.be.true;
        });
    });

    describe("sumNumbers", () => {
        it("should return an empty object if the wrong feature is given", () => {
            let outputResult = false;

            sumNumbers([], "", "", [], result => {
                outputResult = result;
            });

            expect(outputResult).to.deep.equal({});
        });

        it("should throw an error if parameter knowledgeBaseKey is not in right format", () => {
            let outputResult = false,
                outputError = null;

            sumNumbers([], null, "knowledgeBaseSum", [], result => {
                outputResult = result;
            }, error => {
                outputError = error;
            });
            expect(outputResult).to.be.false;
            expect(outputError).to.be.instanceof(Error);

            sumNumbers([], undefined, "knowledgeBaseSum", [], result => {
                outputResult = result;
            }, error => {
                outputError = error;
            });
            expect(outputResult).to.be.false;
            expect(outputError).to.be.instanceof(Error);

            sumNumbers([], true, "knowledgeBaseSum", [], result => {
                outputResult = result;
            }, error => {
                outputError = error;
            });
            expect(outputResult).to.be.false;
            expect(outputError).to.be.instanceof(Error);

            sumNumbers([], [], "knowledgeBaseSum", [], result => {
                outputResult = result;
            }, error => {
                outputError = error;
            });
            expect(outputResult).to.be.false;
            expect(outputError).to.be.instanceof(Error);

            sumNumbers([], {}, "knowledgeBaseSum", [], result => {
                outputResult = result;
            }, error => {
                outputError = error;
            });
            expect(outputResult).to.be.false;
            expect(outputError).to.be.instanceof(Error);

            sumNumbers([], 0, "knowledgeBaseSum", [], result => {
                outputResult = result;
            }, error => {
                outputError = error;
            });
            expect(outputResult).to.be.false;
            expect(outputError).to.be.instanceof(Error);
        });
        it("should throw an error if parameter knowledgeBaseSum is not in right format", () => {
            let outputResult = false,
                outputError = null;

            sumNumbers([], "knowledgeBaseKey", null, [], result => {
                outputResult = result;
            }, error => {
                outputError = error;
            });
            expect(outputResult).to.be.false;
            expect(outputError).to.be.instanceof(Error);

            sumNumbers([], "knowledgeBaseKey", undefined, [], result => {
                outputResult = result;
            }, error => {
                outputError = error;
            });
            expect(outputResult).to.be.false;
            expect(outputError).to.be.instanceof(Error);

            sumNumbers([], "knowledgeBaseKey", true, [], result => {
                outputResult = result;
            }, error => {
                outputError = error;
            });
            expect(outputResult).to.be.false;
            expect(outputError).to.be.instanceof(Error);

            sumNumbers([], "knowledgeBaseKey", [], [], result => {
                outputResult = result;
            }, error => {
                outputError = error;
            });
            expect(outputResult).to.be.false;
            expect(outputError).to.be.instanceof(Error);

            sumNumbers([], "knowledgeBaseKey", {}, [], result => {
                outputResult = result;
            }, error => {
                outputError = error;
            });
            expect(outputResult).to.be.false;
            expect(outputError).to.be.instanceof(Error);

            sumNumbers([], "knowledgeBaseKey", 0, [], result => {
                outputResult = result;
            }, error => {
                outputError = error;
            });
            expect(outputResult).to.be.false;
            expect(outputError).to.be.instanceof(Error);
        });
        it("should throw an error if parameter propertyName is not in right format", () => {
            let outputResult = false,
                outputError = null;

            sumNumbers([], "knowledgeBaseKey", "knowledgeBaseSum", "", result => {
                outputResult = result;
            }, error => {
                outputError = error;
            });
            expect(outputResult).to.be.false;
            expect(outputError).to.be.instanceof(Error);

            sumNumbers([], "knowledgeBaseKey", "knowledgeBaseSum", true, result => {
                outputResult = result;
            }, error => {
                outputError = error;
            });
            expect(outputResult).to.be.false;
            expect(outputError).to.be.instanceof(Error);

            sumNumbers([], "knowledgeBaseKey", "knowledgeBaseSum", undefined, result => {
                outputResult = result;
            }, error => {
                outputError = error;
            });
            expect(outputResult).to.be.false;
            expect(outputError).to.be.instanceof(Error);

            sumNumbers([], "knowledgeBaseKey", "knowledgeBaseSum", null, result => {
                outputResult = result;
            }, error => {
                outputError = error;
            });
            expect(outputResult).to.be.false;
            expect(outputError).to.be.instanceof(Error);

            sumNumbers([], "knowledgeBaseKey", "knowledgeBaseSum", {}, result => {
                outputResult = result;
            }, error => {
                outputError = error;
            });
            expect(outputResult).to.be.false;
            expect(outputError).to.be.instanceof(Error);

            sumNumbers([], "knowledgeBaseKey", "knowledgeBaseSum", 0, result => {
                outputResult = result;
            }, error => {
                outputError = error;
            });
            expect(outputResult).to.be.false;
            expect(outputError).to.be.instanceof(Error);
        });
        it("should return an object without knowledgeBaseKey", () => {
            const testFeature = new Feature(),
                knowledgeBaseKey = "flaecheGesamt",
                knowledgeBaseSum = "test",
                propertyName = [
                    "gemarkung",
                    "flstnrzae",
                    "flaeche"
                ];
            let outputResult = "test",
                outputError = false;

            testFeature.set("gemarkung", "1");
            testFeature.set("flstnrzae", "10");
            testFeature.set("flaeche", "100");

            sumNumbers([testFeature], knowledgeBaseKey, knowledgeBaseSum, propertyName, result => {
                outputResult = result;
            }, error => {
                outputError = error;
            });
            expect(outputResult).to.deep.equal({
                "flaeche": ["100"],
                "flstnrzae": ["10"],
                "gemarkung": ["1"]
            });
            expect(outputError).to.be.false;

            sumNumbers([testFeature, testFeature], knowledgeBaseKey, knowledgeBaseSum, propertyName, result => {
                outputResult = result;
            }, error => {
                outputError = error;
            });
            expect(outputResult).to.deep.equal({
                "flaeche": ["100", "100"],
                "flstnrzae": ["10", "10"],
                "gemarkung": ["1", "1"]
            });
            expect(outputError).to.be.false;
        });
        it("should return an object with knowledgeBaseKey", () => {
            const testFeature = new Feature(),
                knowledgeBaseKey = "flaecheGesamt",
                knowledgeBaseSum = "flaeche",
                propertyName = [
                    "gemarkung",
                    "flstnrzae",
                    "flaeche"
                ];
            let outputResult = "test",
                outputError = false;

            testFeature.set("gemarkung", "1");
            testFeature.set("flstnrzae", "10");
            testFeature.set("flaeche", "100");

            sumNumbers([testFeature], knowledgeBaseKey, knowledgeBaseSum, propertyName, result => {
                outputResult = result;
            }, error => {
                outputError = error;
            });
            expect(outputResult).to.deep.equal({
                "flaeche": ["100"],
                "flaecheGesamt": ["100"],
                "flstnrzae": ["10"],
                "gemarkung": ["1"]
            });
            expect(outputError).to.be.false;

            sumNumbers([testFeature, testFeature], knowledgeBaseKey, knowledgeBaseSum, propertyName, result => {
                outputResult = result;
            }, error => {
                outputError = error;
            });
            expect(outputResult).to.deep.equal({
                "flaeche": ["100", "100"],
                "flaecheGesamt": ["200"],
                "flstnrzae": ["10", "10"],
                "gemarkung": ["1", "1"]
            });
            expect(outputError).to.be.false;
        });
    });
});
