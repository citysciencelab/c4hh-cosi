import {expect} from "chai";
import {getChangedEntries, isSameValue} from "@modules/draw/js/getChangedEntries.js";

describe("src/modules/draw/js/getChangedEntries.js", () => {
    describe("isSameValue", () => {
        it("positive: returns true for equal primitives and equal arrays", () => {
            expect(isSameValue(1, 1)).to.be.true;
            expect(isSameValue("a", "a")).to.be.true;
            expect(isSameValue([1, 2, 3], [1, 2, 3])).to.be.true;
        });

        it("negative: returns false for different primitives and different arrays", () => {
            expect(isSameValue(1, 2)).to.be.false;
            expect(isSameValue([1, 2, 3], [1, 2])).to.be.false;
            expect(isSameValue([1, 2, 3], [1, 2, 4])).to.be.false;
            expect(isSameValue([1], 1)).to.be.false;
        });
    });

    describe("getChangedEntries", () => {
        it("positive: returns only the entries that differ", () => {
            const current = {strokeWidth: 1, strokeColor: [0, 0, 0], text: ""};

            expect(getChangedEntries(current, {strokeWidth: 2, strokeColor: [0, 0, 0], text: "a"})).to.deep.equal({strokeWidth: 2, text: "a"});
        });

        it("positive: detects changed array entries and new keys", () => {
            const current = {strokeColor: [0, 0, 0]};

            expect(getChangedEntries(current, {strokeColor: [1, 0, 0], fontSize: 20})).to.deep.equal({strokeColor: [1, 0, 0], fontSize: 20});
        });

        it("negative: returns null if nothing differs", () => {
            const current = {strokeWidth: 1, strokeColor: [0, 0, 0]};

            expect(getChangedEntries(current, {strokeWidth: 1, strokeColor: [0, 0, 0]})).to.be.null;
        });

        it("negative: returns null for empty or missing options", () => {
            expect(getChangedEntries({strokeWidth: 1}, {})).to.be.null;
            expect(getChangedEntries({strokeWidth: 1}, undefined)).to.be.null;
        });
    });
});
