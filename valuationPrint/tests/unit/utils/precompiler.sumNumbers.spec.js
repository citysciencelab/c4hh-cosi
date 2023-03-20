import {expect} from "chai";
import Feature from "ol/Feature";
import sumNumbers from "../../../utils/precompiler.sumNumbers.js";

describe("addons/valuationPrint/utils/precompiler.sumNumbers.js", () => {
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
