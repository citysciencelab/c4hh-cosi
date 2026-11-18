import {expect} from "chai";
import getTimestepsMerged from "@modules/statisticDashboard/js/getTimestepsMerged.js";

describe("src/modules/statisticDashboard/js/getTimestepsMerged", () => {
    describe("getTimestepsMerged", () => {
        it("should return an empty array if first param and second param are not objects", () => {
            expect(getTimestepsMerged(undefined, undefined)).to.be.an("array").that.is.empty;
            expect(getTimestepsMerged(null, null)).to.be.an("array").that.is.empty;
            expect(getTimestepsMerged([], [])).to.be.an("array").that.is.empty;
            expect(getTimestepsMerged(true, true)).to.be.an("array").that.is.empty;
            expect(getTimestepsMerged(false, false)).to.be.an("array").that.is.empty;
            expect(getTimestepsMerged(1234, 1234)).to.be.an("array").that.is.empty;
            expect(getTimestepsMerged("1234", "1234")).to.be.an("array").that.is.empty;
        });
        it("should return an empty array if second param is not an object but first is", () => {
            expect(getTimestepsMerged({foo: "bar"})).to.be.an("array").that.is.empty;
        });
        it("should return only the values of the second param as array with invalid dates", () => {
            const uniqueList = {foo: true, bar: true},
                expected = [{value: "bar", title: "Invalid Date"}, {value: "foo", title: "Invalid Date"}];

            expect(getTimestepsMerged(undefined, uniqueList)).to.deep.equal(expected);
        });
        it("should return a merged array based of the given two objects", () => {
            const uniqueList = {bar: true, buz: true, foo: true},
                configSteps = {2: "Last 2 Years"},
                expected = [
                    {value: ["buz", "foo"], title: "Last 2 Years"},
                    {value: "foo", title: "Invalid Date"},
                    {value: "buz", title: "Invalid Date"},
                    {value: "bar", title: "Invalid Date"}
                ];

            expect(getTimestepsMerged(configSteps, uniqueList)).to.deep.equal(expected);
        });
    });
});
