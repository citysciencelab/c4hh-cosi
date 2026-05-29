import {expect} from "chai";
import sinon from "sinon";
import {mergeObjectsByDatakey} from "../../translator.mergeObjectsByDatakey.js";

describe("addons/shared/js/mapfishUtils/translator.mergeObjectsByDatakey.js", () => {
    beforeEach(function () {
        const error = sinon.spy();

        sinon.stub(console, "error").callsFake(error);
    });


    describe("mergeObjectsByDatakey", () => {
        it("should return an empty array if the given parameter is undefined", () => {
            expect(mergeObjectsByDatakey(undefined)).to.be.an("array").that.is.empty;
        });

        it("should return an empty array if the given parameter is null", () => {
            expect(mergeObjectsByDatakey(null)).to.be.an("array").that.is.empty;
        });

        it("should return an empty array if the given parameter is a boolean", () => {
            expect(mergeObjectsByDatakey(true)).to.be.an("array").that.is.empty;
        });

        it("should return an empty array if the given parameter is an object", () => {
            expect(mergeObjectsByDatakey({})).to.be.an("array").that.is.empty;
        });

        it("should return an empty array if the given parameter is a number", () => {
            expect(mergeObjectsByDatakey(666)).to.be.an("array").that.is.empty;
        });

        it("should return an empty array if the given parameter is a string", () => {
            expect(mergeObjectsByDatakey("666")).to.be.an("array").that.is.empty;
        });

        it("should call an error if the given parameter is not an array", () => {
            mergeObjectsByDatakey("666");
            expect(console.error.calledOnce).to.be.true;
        });

        it("should return an empty array if the second given parameter is undefined", () => {
            expect(mergeObjectsByDatakey([], undefined)).to.be.an("array").that.is.empty;
        });

        it("should return an empty array if the second given parameter is null", () => {
            expect(mergeObjectsByDatakey([], null)).to.be.an("array").that.is.empty;
        });

        it("should return an empty array if the second given parameter is a boolean", () => {
            expect(mergeObjectsByDatakey([], true)).to.be.an("array").that.is.empty;
        });

        it("should return an empty array if the second given parameter is a number", () => {
            expect(mergeObjectsByDatakey([], 666)).to.be.an("array").that.is.empty;
        });

        it("should return an empty array if the second given parameter is a string", () => {
            expect(mergeObjectsByDatakey([], "666")).to.be.an("array").that.is.empty;
        });

        it("should return an empty array if the second given parameter is an array", () => {
            expect(mergeObjectsByDatakey([], [])).to.be.an("array").that.is.empty;
        });

        it("should call an error if the second given parameter is not an object", () => {
            mergeObjectsByDatakey([], "666");
            expect(console.error.calledOnce).to.be.true;
        });

        it("should return an empty array if the third given parameter is undefined", () => {
            expect(mergeObjectsByDatakey([], {}, undefined)).to.be.an("array").that.is.empty;
        });

        it("should return an empty array if the third given parameter is null", () => {
            expect(mergeObjectsByDatakey([], {}, null)).to.be.an("array").that.is.empty;
        });

        it("should return an empty array if the third given parameter is a boolean", () => {
            expect(mergeObjectsByDatakey([], {}, true)).to.be.an("array").that.is.empty;
        });

        it("should return an empty array if the third given parameter is a number", () => {
            expect(mergeObjectsByDatakey([], {}, 666)).to.be.an("array").that.is.empty;
        });

        it("should return an empty array if the third given parameter is an empty array", () => {
            expect(mergeObjectsByDatakey([], {}, [])).to.be.an("array").that.is.empty;
        });

        it("should return an empty array if the third given parameter is an object", () => {
            expect(mergeObjectsByDatakey([], {}, {})).to.be.an("array").that.is.empty;
        });

        it("should call an error if the third given parameter is not a string", () => {
            mergeObjectsByDatakey([], {}, 666);
            expect(console.error.calledOnce).to.be.true;
        });

        it("should merge multiple arrays of objects into one and return it", () => {
            const datakey = ["first", "second"],
                knowledgeBase = {
                    first: [{
                        a: "hallo",
                        c: "moin"

                    },
                    {
                        a: "dito",
                        c: "moin"

                    }],
                    second: [{
                        a: "hallo",
                        c: "moin"
                    }]
                };

            expect(mergeObjectsByDatakey(datakey, knowledgeBase, "n.v.")).to.be.an("array").lengthOf(3);
        });

        it("should overwrite undefined values in the objects with the default value and return it", () => {
            const datakey = ["first", "second"],
                knowledgeBase = {
                    first: [{
                        a: "hallo",
                        b: undefined,
                        c: undefined

                    }]
                },
                expectArray = [
                    {
                        a: "hallo",
                        b: "n.v.",
                        c: "n.v."

                    }
                ];

            expect(mergeObjectsByDatakey(datakey, knowledgeBase, "n.v.")).to.deep.equal(expectArray);
        });

        it("should return an empty array if no arrays of objects are defined", () => {
            const datakey = ["first", "second"],
                knowledgeBase = {
                    first: undefined
                };

            expect(mergeObjectsByDatakey(datakey, knowledgeBase, "n.v.")).to.be.an("array").that.is.empty;
        });

        it("should convert the value with the options", () => {
            const datakey = ["first", "second"],
                knowledgeBase = {
                    first: [{
                        a: 10001,
                        b: undefined,
                        c: undefined

                    }]
                },
                expectArray = [
                    {
                        a: "10.001,00 m²",
                        b: "n.v.",
                        c: "n.v."

                    }
                ],
                options = {
                    "first.a": {
                        "type": "Number",
                        "postfix": " m²",
                        "decimals": 2,
                        "thousandsSeparator": {
                            "delimAbs": ".",
                            "delimDec": ","
                        }
                    }
                };

            expect(mergeObjectsByDatakey(datakey, knowledgeBase, "n.v.", options)).to.deep.equal(expectArray);
        });
    });
});
