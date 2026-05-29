import {expect} from "chai";
import sinon from "sinon";
import {
    concatStringByDatakey,
    concatSingleDatakey,
    findPossibleError,
    getDefaultOnEmptyResult,
    getFlippedKnowledgeBase,
    calcMaxArrayLength,
    getKeysFromDataKey,
    getSplittedDatakey,
    mergeKnowledgeIntoDatakey,
    formatValue,
    formatValueNumber
} from "../../translator.concatStringByDatakey.js";

describe("addons/valuationPrint/js/translator.concatStringByDatakey.js", () => {

    describe("formatValueNumber", () => {
        it("should return string 0 if anything but an interpretable number is given", () => {
            expect(formatValueNumber(undefined)).to.equal("0");
            expect(formatValueNumber(null)).to.equal("0");
            expect(formatValueNumber("string")).to.equal("0");
            expect(formatValueNumber([])).to.equal("0");
            expect(formatValueNumber({})).to.equal("0");
        });
        it("should return the given number as string if a Number is given", () => {
            expect(formatValueNumber(1234)).to.equal("1234");
            expect(formatValueNumber(1234.6789)).to.equal("1234.6789");
        });
        it("should return the given thousands separated string correctly", () => {
            expect(formatValueNumber("1234.5678")).to.equal("1234.5678");
            expect(formatValueNumber("1234,5678")).to.equal("1234.5678");
            expect(formatValueNumber("1,234.5678")).to.equal("1234.5678");
            expect(formatValueNumber("1.234,5678")).to.equal("1234.5678");
            expect(formatValueNumber("1,231,234.5678")).to.equal("1231234.5678");
            expect(formatValueNumber("1.231.234,5678")).to.equal("1231234.5678");
        });
        it("should interpret boolean", () => {
            expect(formatValueNumber(true)).to.equal("1");
            expect(formatValueNumber(false)).to.equal("0");
        });
        it("should cap decimal points if fixed by options", () => {
            expect(formatValueNumber("1234.5678", {decimals: 2})).to.equal("1234.57");
        });
        it("should use thousands separation if configured by options", () => {
            const options = {
                thousandsSeparator: {
                    delimAbs: "|",
                    delimDec: "_"
                }
            };

            expect(formatValueNumber("1234.5678", options)).to.equal("1|234_5678");
        });
        it("should combine fixed decimals and thousands separation", () => {
            const options = {
                decimals: 2,
                thousandsSeparator: {
                    delimAbs: "|",
                    delimDec: "_"
                }
            };

            expect(formatValueNumber("1234.5678", options)).to.equal("1|234_57");
        });
        it("should combine number and postfix", () => {
            const options = {
                postfix: " m²"
            };

            expect(formatValueNumber("1234.5678", options)).to.equal("1234.5678 m²");
        });
    });
    describe("formatValue", () => {
        it("should return the given value as it is if anything but an object is given as options", () => {
            expect(formatValue("value", undefined)).to.equal("value");
            expect(formatValue("value", null)).to.equal("value");
            expect(formatValue("value", 1234)).to.equal("value");
            expect(formatValue("value", "string")).to.equal("value");
            expect(formatValue("value", true)).to.equal("value");
            expect(formatValue("value", false)).to.equal("value");
            expect(formatValue("value", [])).to.equal("value");
        });
        it("should return the given value as it is if anything but options type Number is requested", () => {
            expect(formatValue("value", {})).to.equal("value");
            expect(formatValue("value", {type: "anything"})).to.equal("value");
        });
    });
    describe("mergeKnowledgeIntoDatakey", () => {
        it("should return an empty string if anything but an object is given as first parameter", () => {
            expect(mergeKnowledgeIntoDatakey(undefined)).to.be.a("string").that.is.empty;
            expect(mergeKnowledgeIntoDatakey(null)).to.be.a("string").that.is.empty;
            expect(mergeKnowledgeIntoDatakey(1234)).to.be.a("string").that.is.empty;
            expect(mergeKnowledgeIntoDatakey("string")).to.be.a("string").that.is.empty;
            expect(mergeKnowledgeIntoDatakey(true)).to.be.a("string").that.is.empty;
            expect(mergeKnowledgeIntoDatakey(false)).to.be.a("string").that.is.empty;
            expect(mergeKnowledgeIntoDatakey([])).to.be.a("string").that.is.empty;
        });
        it("should return an empty string if anything but a string is given as second parameter", () => {
            expect(mergeKnowledgeIntoDatakey({}, undefined)).to.be.a("string").that.is.empty;
            expect(mergeKnowledgeIntoDatakey({}, null)).to.be.a("string").that.is.empty;
            expect(mergeKnowledgeIntoDatakey({}, 1234)).to.be.a("string").that.is.empty;
            expect(mergeKnowledgeIntoDatakey({}, true)).to.be.a("string").that.is.empty;
            expect(mergeKnowledgeIntoDatakey({}, false)).to.be.a("string").that.is.empty;
            expect(mergeKnowledgeIntoDatakey({}, [])).to.be.a("string").that.is.empty;
            expect(mergeKnowledgeIntoDatakey({}, {})).to.be.a("string").that.is.empty;
        });
        it("should return datakey as it is if knowledgeBits are empty", () => {
            expect(mergeKnowledgeIntoDatakey({}, "datakey")).to.equal("datakey");
        });
        it("should return value for datakey if datakey has no prefix and no postfix", () => {
            expect(mergeKnowledgeIntoDatakey({datakey: "result"}, "datakey")).to.equal("result");
        });
        it("should return value for datakey if datakey has prefix and postfix", () => {
            expect(mergeKnowledgeIntoDatakey({datakey: "result"}, "{{datakey}}")).to.equal("result");
        });
        it("should return value for datakey if datakey has prefix and postfix and additional beginning and ending", () => {
            expect(mergeKnowledgeIntoDatakey({datakey: "result"}, "foo-{{datakey}}-bar")).to.equal("foo-result-bar");
        });
        it("should return value for datakey if datakey is a complex string", () => {
            expect(mergeKnowledgeIntoDatakey({datakeyA: "resultA", datakeyB: "resultB"}, "foo-{{datakeyA}}-bar-{{datakeyB}}-baz")).to.equal("foo-resultA-bar-resultB-baz");
        });
    });
    describe("getSplittedDatakey", () => {
        it("should return an empty array if anything but a string is given", () => {
            expect(getSplittedDatakey(undefined)).to.be.an("array").that.is.empty;
            expect(getSplittedDatakey(null)).to.be.an("array").that.is.empty;
            expect(getSplittedDatakey(1234)).to.be.an("array").that.is.empty;
            expect(getSplittedDatakey(true)).to.be.an("array").that.is.empty;
            expect(getSplittedDatakey(false)).to.be.an("array").that.is.empty;
            expect(getSplittedDatakey([])).to.be.an("array").that.is.empty;
            expect(getSplittedDatakey({})).to.be.an("array").that.is.empty;
        });
        it("should return an array with one entry if no prefix or postfix is found", () => {
            expect(getSplittedDatakey("datakey")).to.deep.equal(["datakey"]);
        });
        it("should split along prefix or postfix without checking logical behaviour", () => {
            expect(getSplittedDatakey("{{datakey{{")).to.deep.equal(["", "datakey", ""]);
            expect(getSplittedDatakey("}}datakey}}")).to.deep.equal(["", "datakey", ""]);
        });
        it("should split a complex string along prefix and postfix", () => {
            expect(getSplittedDatakey("foo-{{bar}}-baz-{{foobar}}-qrz")).to.deep.equal(["foo-", "bar", "-baz-", "foobar", "-qrz"]);
        });
    });
    describe("getKeysFromDataKey", () => {
        it("should return the datakey as value of a single entry array if datakey can't be split", () => {
            expect(getKeysFromDataKey("datakey")).to.deep.equal(["datakey"]);
        });
        it("should return an empty array and console an error if an unlogic amount of postfix and prefix is detected", () => {
            sinon.stub(console, "error");
            expect(getKeysFromDataKey("{{foo}} bar baz}}")).to.be.an("array").that.is.empty;
            expect(console.error.calledOnce).to.be.true;
        });
        it("should return the parts as array found within prefix and postfix", () => {
            expect(getKeysFromDataKey("foo-{{bar}}-baz-{{foobar}}-qrz")).to.deep.equal(["bar", "foobar"]);
        });
    });
    describe("calcMaxArrayLength", () => {
        it("should return 0 if the first parameter is not an object", () => {
            expect(calcMaxArrayLength(undefined)).to.equal(0);
            expect(calcMaxArrayLength(null)).to.equal(0);
            expect(calcMaxArrayLength(1234)).to.equal(0);
            expect(calcMaxArrayLength("string")).to.equal(0);
            expect(calcMaxArrayLength(true)).to.equal(0);
            expect(calcMaxArrayLength(false)).to.equal(0);
            expect(calcMaxArrayLength([])).to.equal(0);
        });
        it("should return 0 if the second parameter is not an array", () => {
            expect(calcMaxArrayLength({}, undefined)).to.equal(0);
            expect(calcMaxArrayLength({}, null)).to.equal(0);
            expect(calcMaxArrayLength({}, 1234)).to.equal(0);
            expect(calcMaxArrayLength({}, "string")).to.equal(0);
            expect(calcMaxArrayLength({}, true)).to.equal(0);
            expect(calcMaxArrayLength({}, false)).to.equal(0);
            expect(calcMaxArrayLength({}, {})).to.equal(0);
        });
        it("should return 0 if no array exists at any position in knowledgeBase defined by keys", () => {
            const knowledgeBase = {
                    a: undefined,
                    b: null,
                    c: 1234,
                    d: "string",
                    e: true,
                    f: false,
                    g: {}
                },
                keys = ["a", "b", "c", "d", "e", "f", "g"];

            expect(calcMaxArrayLength(knowledgeBase, keys)).to.equal(0);
        });
        it("should return the maximal length of any array found in knowledgeBase defined by keys", () => {
            const knowledgeBase = {
                    a: [1],
                    b: [2, 3],
                    c: [4, 5, 6, 7],
                    d: [8, 9]
                },
                keys = ["a", "b", "c", "d"];

            expect(calcMaxArrayLength(knowledgeBase, keys)).to.equal(4);
        });
    });
    describe("getFlippedKnowledgeBase", () => {
        it("should return an empty array if anything but an object is given as first parameter", () => {
            expect(getFlippedKnowledgeBase(undefined)).to.be.an("array").that.is.empty;
            expect(getFlippedKnowledgeBase(null)).to.be.an("array").that.is.empty;
            expect(getFlippedKnowledgeBase(1234)).to.be.an("array").that.is.empty;
            expect(getFlippedKnowledgeBase("string")).to.be.an("array").that.is.empty;
            expect(getFlippedKnowledgeBase(true)).to.be.an("array").that.is.empty;
            expect(getFlippedKnowledgeBase(false)).to.be.an("array").that.is.empty;
            expect(getFlippedKnowledgeBase([])).to.be.an("array").that.is.empty;
        });
        it("should return an empty array if anything but an array is given as second parameter", () => {
            expect(getFlippedKnowledgeBase({}, undefined)).to.be.an("array").that.is.empty;
            expect(getFlippedKnowledgeBase({}, null)).to.be.an("array").that.is.empty;
            expect(getFlippedKnowledgeBase({}, 1234)).to.be.an("array").that.is.empty;
            expect(getFlippedKnowledgeBase({}, "string")).to.be.an("array").that.is.empty;
            expect(getFlippedKnowledgeBase({}, true)).to.be.an("array").that.is.empty;
            expect(getFlippedKnowledgeBase({}, false)).to.be.an("array").that.is.empty;
            expect(getFlippedKnowledgeBase({}, [])).to.be.an("array").that.is.empty;
        });
        it("should flip the knowledgeBase as expected", () => {
            const knowledgeBase = {
                    a: [1],
                    b: [2, 3],
                    c: [4, 5, 6, 7],
                    d: [8, 9]
                },
                keys = ["a", "b", "c", "d"],
                expected = [
                    {a: 1, b: 2, c: 4, d: 8},
                    {a: undefined, b: 3, c: 5, d: 9},
                    {a: undefined, b: undefined, c: 6, d: undefined},
                    {a: undefined, b: undefined, c: 7, d: undefined}
                ];

            expect(getFlippedKnowledgeBase(knowledgeBase, keys)).to.deep.equal(expected);
        });
        it("should fill in defaultValue", () => {
            const knowledgeBase = {
                    a: [1],
                    b: [2, 3],
                    c: [4, 5, 6, 7],
                    d: [8, 9]
                },
                keys = ["a", "b", "c", "d"],
                expected = [
                    {a: 1, b: 2, c: 4, d: 8},
                    {a: "defaultValue", b: 3, c: 5, d: 9},
                    {a: "defaultValue", b: "defaultValue", c: 6, d: "defaultValue"},
                    {a: "defaultValue", b: "defaultValue", c: 7, d: "defaultValue"}
                ];

            expect(getFlippedKnowledgeBase(knowledgeBase, keys, undefined, "defaultValue")).to.deep.equal(expected);
        });
        it("should fill in defaults where possible", () => {
            const knowledgeBase = {
                    a: [1],
                    b: [2, 3],
                    c: [4, 5, 6, 7],
                    d: [8, 9]
                },
                keys = ["a", "b", "c", "d"],
                defaults = {
                    "a": "defaultA",
                    "d": "defaultD"
                },
                expected = [
                    {a: 1, b: 2, c: 4, d: 8},
                    {a: "defaultA", b: 3, c: 5, d: 9},
                    {a: "defaultA", b: "defaultValue", c: 6, d: "defaultD"},
                    {a: "defaultA", b: "defaultValue", c: 7, d: "defaultD"}
                ];

            expect(getFlippedKnowledgeBase(knowledgeBase, keys, defaults, "defaultValue")).to.deep.equal(expected);
        });
    });
    describe("getDefaultOnEmptyResult", () => {
        it("should return the given defaultValue if anything but a string is given as datakey", () => {
            expect(getDefaultOnEmptyResult(undefined, "defaults", "defaultValue")).to.equal("defaultValue");
            expect(getDefaultOnEmptyResult(null, "defaults", "defaultValue")).to.equal("defaultValue");
            expect(getDefaultOnEmptyResult(1234, "defaults", "defaultValue")).to.equal("defaultValue");
            expect(getDefaultOnEmptyResult(true, "defaults", "defaultValue")).to.equal("defaultValue");
            expect(getDefaultOnEmptyResult(false, "defaults", "defaultValue")).to.equal("defaultValue");
            expect(getDefaultOnEmptyResult([], "defaults", "defaultValue")).to.equal("defaultValue");
            expect(getDefaultOnEmptyResult({}, "defaults", "defaultValue")).to.equal("defaultValue");
        });
        it("should return the given defaults if defaults are a string", () => {
            expect(getDefaultOnEmptyResult("datakey", "defaults", "defaultValue")).to.equal("defaults");
        });
        it("should return the default value defined in defaults if datakey with a single key is given", () => {
            expect(getDefaultOnEmptyResult("datakey", {datakey: "defaultDatakey"}, "defaultValue")).to.equal("defaultDatakey");
            expect(getDefaultOnEmptyResult("foo-{{datakey}}-bar", {datakey: "defaultDatakey"}, "defaultValue")).to.equal("defaultDatakey");
        });
    });
    describe("findPossibleError", () => {
        it("should return the error found in knowledgeBase at any structure point of datakeys", () => {
            const knowledgeBase = {
                    keyA: 0,
                    keyB: 1,
                    keyC: new Error("error"),
                    keyD: 3
                },
                datakeys = ["keyA", "keyB", "keyC"];

            expect(findPossibleError(knowledgeBase, datakeys)).to.be.an.instanceOf(Error);
        });
        it("should return no error if none is found in knowledgeBase at any structure point of datakeys", () => {
            const knowledgeBase = {
                    keyA: 0,
                    keyB: 1,
                    keyC: new Error("error"),
                    keyD: 3
                },
                datakeys = ["keyA", "keyB", "keyD"];

            expect(findPossibleError(knowledgeBase, datakeys)).to.not.be.an.instanceOf(Error);
        });
        it("should be able to handle string inputs", () => {
            const knowledgeBase = {
                    keyA: 0,
                    keyB: 1,
                    keyC: new Error("error"),
                    keyD: 3
                },
                datakeys = "keyC";

            expect(findPossibleError(knowledgeBase, datakeys)).to.be.an.instanceOf(Error);
        });
    });

    describe("concatSingleDatakey", () => {
        it("should create a string for a single datakey", () => {
            const knowledgeBase = {
                    a: [1],
                    b: [2, 3],
                    c: [4, 5, 6, 7],
                    d: [8, 9]
                },
                datakey = "foo {{a}} bar {{b}} baz {{c}} foobar {{d}} qrz",
                defaults = {
                    "a": "defaultA",
                    "d": "defaultD"
                },
                expected = "foo 1 bar 2 baz 4 foobar 8 qrzDELIMITORfoo defaultA bar 3 baz 5 foobar 9 qrzDELIMITORfoo defaultA bar defaultValue baz 6 foobar defaultD qrzDELIMITORfoo defaultA bar defaultValue baz 7 foobar defaultD qrz";

            expect(concatSingleDatakey(knowledgeBase, datakey, defaults, "defaultValue", "DELIMITOR")).to.deep.equal(expected);
        });
        it("should create a string with unique entries", () => {
            const knowledgeBase = {
                    a: [1, 1, 1],
                    b: [2, 2, 2, 3],
                    c: [4, 4, 4, 5, 6, 7],
                    d: [8, 8, 8, 9]
                },
                datakey = "foo {{a}} bar {{b}} baz {{c}} foobar {{d}} qrz",
                defaults = {
                    "a": "defaultA",
                    "d": "defaultD"
                },
                expected = "foo 1 bar 2 baz 4 foobar 8 qrzDELIMITORfoo defaultA bar 3 baz 5 foobar 9 qrzDELIMITORfoo defaultA bar defaultValue baz 6 foobar defaultD qrzDELIMITORfoo defaultA bar defaultValue baz 7 foobar defaultD qrz";

            expect(concatSingleDatakey(knowledgeBase, datakey, defaults, "defaultValue", "DELIMITOR")).to.deep.equal(expected);
        });
    });
    describe("concatStringByDatakey", () => {
        it("should create a complex string from a single datakey", () => {
            const knowledgeBase = {
                    a: [1],
                    b: [2, 3],
                    c: [4, 5, 6, 7],
                    d: [8, 9]
                },
                defaults = {
                    "a": "defaultA",
                    "d": "defaultD"
                },
                datakey = "a",
                expected = "1";

            expect(concatStringByDatakey(knowledgeBase, datakey, defaults, "defaultValue", "DELIMITOR")).to.deep.equal(expected);
        });
        it("should create a complex string from a datakey with multiple keys", () => {
            const knowledgeBase = {
                    a: [1],
                    b: [2, 3],
                    c: [4, 5, 6, 7],
                    d: [8, 9]
                },
                defaults = {
                    "a": "defaultA",
                    "d": "defaultD"
                },
                datakey = "foo {{a}} bar {{b}}",
                expected = "foo 1 bar 2DELIMITORfoo defaultA bar 3";

            expect(concatStringByDatakey(knowledgeBase, datakey, defaults, "defaultValue", "DELIMITOR")).to.deep.equal(expected);
        });
        it("should create a complex string", () => {
            const knowledgeBase = {
                    a: [1],
                    b: [2, 3],
                    c: [4, 5, 6, 7],
                    d: [8, 9]
                },
                defaults = {
                    "a": "defaultA",
                    "d": "defaultD"
                },
                datakey = [
                    "foo {{a}} bar {{b}}",
                    "{{c}} foobar {{d}} qrz"
                ],
                expected = "foo 1 bar 2DELIMITORfoo defaultA bar 3DELIMITOR4 foobar 8 qrzDELIMITOR5 foobar 9 qrzDELIMITOR6 foobar defaultD qrzDELIMITOR7 foobar defaultD qrz";

            expect(concatStringByDatakey(knowledgeBase, datakey, defaults, "defaultValue", "DELIMITOR")).to.deep.equal(expected);
        });
        it("should return an error if an error is found at any point in knowledge base", () => {
            const knowledgeBase = {
                    a: [1],
                    b: [2, 3],
                    c: new Error("error"),
                    d: [8, 9]
                },
                defaults = {
                    "a": "defaultA",
                    "d": "defaultD"
                },
                datakey = [
                    "foo {{a}} bar {{b}}",
                    "{{c}} foobar {{d}} qrz"
                ];

            expect(concatStringByDatakey(knowledgeBase, datakey, defaults, "defaultValue", "DELIMITOR")).to.be.an.instanceof(Error);
        });
    });
});
