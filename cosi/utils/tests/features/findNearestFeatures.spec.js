// import {getAllFeaturesByLayerId} from "../../features/getAllFeaturesByLayerId";
import {formatBbox, findNearestFeatures} from "../../features/findNearestFeatures";
import getAllFeatures from "../../features/getAllFeaturesByLayerId";
import {expect} from "chai";
import sinon from "sinon";
import Feature from "ol/Feature";
import {Point} from "ol/geom";

describe("findNearestFeature", () => {
    const feature = new Feature({
            geometry: new Point([5, 5])
        }),
        foundFeature = new Feature({
            geometry: new Point([40, 40])
        });

    beforeEach(function () {
        sinon.spy(console, "error");
    });

    afterEach(function () {
        console.error.restore();
        sinon.restore();
    });

    describe("formatBbox", () => {
        it("should return an empty string if the given parameter is an object", () => {
            expect(formatBbox({})).to.be.equal("");
        });

        it("should return an empty string if the first parameter is undefined", () => {
            expect(formatBbox(undefined)).to.be.equal("");
        });

        it("should return an empty string if the first parameter is a boolean", () => {
            expect(formatBbox(true)).to.be.equal("");
        });

        it("should return an empty string if the first parameter is a number", () => {
            expect(formatBbox(666)).to.be.equal("");
        });

        it("should return an empty string if the first parameter is a string", () => {
            expect(formatBbox("string")).to.be.equal("");
        });

        it("should return an empty string if the first parameter is an array with a length of != 4", () => {
            expect(formatBbox([6, 6, 6])).to.be.equal("");
        });

        it("should return an empty string if the first parameter is null", () => {
            expect(formatBbox(null)).to.be.equal("");
        });

        it("should call an error if the first parameter is not an array", () => {
            formatBbox(666);
            expect(console.error.calledOnce).to.be.true;
        });

        it("should return an empty string if the second parameter is an object", () => {
            expect(formatBbox([1, 2, 3, 4], {})).to.be.equal("");
        });

        it("should return an empty string if the second parameter is null", () => {
            expect(formatBbox([1, 2, 3, 4], null)).to.be.equal("");
        });

        it("should return an empty string if the second parameter is a boolean", () => {
            expect(formatBbox([1, 2, 3, 4], true)).to.be.equal("");
        });

        it("should return an empty string if the second parameter is a number", () => {
            expect(formatBbox([1, 2, 3, 4], 666)).to.be.equal("");
        });

        it("should return an empty string if the second parameter is an array", () => {
            expect(formatBbox([1, 2, 3, 4], [])).to.be.equal("");
        });

        it("should call an error if the second parameter is not a string", () => {
            formatBbox(666);
            expect(console.error.calledOnce).to.be.true;
        });

        it("should return a string with the default 'EPSG:25832' if the second parameter is undefined", () => {
            expect(formatBbox([1, 2, 3, 4], undefined)).to.be.equal("1,2,3,4,EPSG:25832");
        });

        it("should return a correct converted string", () => {
            expect(formatBbox([1, 2, 3, 4], "string")).to.be.equal("1,2,3,4,string");
        });

    });

    describe("findNearestFeatures", () => {
        it("should return false if the first parameter is an object", async () => {
            expect(await findNearestFeatures({})).to.be.false;
        });

        it("should return false if the first parameter is undefined", async () => {
            expect(await findNearestFeatures(undefined)).to.be.false;
        });

        it("should return false if the first parameter is a boolean", async () => {
            expect(await findNearestFeatures(true)).to.be.false;
        });

        it("should return false if the first parameter is a number", async () => {
            expect(await findNearestFeatures(666)).to.be.false;
        });

        it("should return false if the first parameter is an array", async () => {
            expect(await findNearestFeatures([])).to.be.false;
        });

        it("should return false if the first parameter is null", async () => {
            expect(await findNearestFeatures(null)).to.be.false;
        });

        it("should call an error if the first parameter is not a string", async () => {
            await findNearestFeatures(666);
            expect(console.error.calledOnce).to.be.true;
        });

        it("should return false if the second parameter is an object", async () => {
            expect(await findNearestFeatures("", {})).to.be.false;
        });

        it("should return false if the second parameter is undefined", async () => {
            expect(await findNearestFeatures("", undefined)).to.be.false;
        });

        it("should return false if the second parameter is a boolean", async () => {
            expect(await findNearestFeatures("", true)).to.be.false;
        });

        it("should return false if the second parameter is a number", async () => {
            expect(await findNearestFeatures("", 666)).to.be.false;
        });

        it("should return false if the second parameter is an array", async () => {
            expect(await findNearestFeatures("", [])).to.be.false;
        });

        it("should return false if the second parameter is null", async () => {
            expect(await findNearestFeatures("", null)).to.be.false;
        });

        it("should call an error if the second parameter is not an ol feature", async () => {
            await findNearestFeatures("", 666);
            expect(console.error.calledOnce).to.be.true;
        });

        it("should return false if the third parameter is an object", async () => {
            expect(await findNearestFeatures("", feature, {})).to.be.false;
        });

        it("should return false if the third parameter is undefined", async () => {
            expect(await findNearestFeatures("", feature, undefined)).to.be.false;
        });

        it("should return false if the third parameter is a boolean", async () => {
            expect(await findNearestFeatures("", feature, true)).to.be.false;
        });

        it("should return false if the third parameter is a string", async () => {
            expect(await findNearestFeatures("", feature, "")).to.be.false;
        });

        it("should return false if the third parameter is an array", async () => {
            expect(await findNearestFeatures("", feature, [])).to.be.false;
        });

        it("should return false if the third parameter is null", async () => {
            expect(await findNearestFeatures("", feature, null)).to.be.false;
        });

        it("should call an error if the third parameter is not a number", async () => {
            await findNearestFeatures("", feature, "");
            expect(console.error.calledOnce).to.be.true;
        });

        it("should return false if the fourth parameter is an object", async () => {
            expect(await findNearestFeatures("", feature, 666, {})).to.be.false;
        });

        it("should return false if the fourth parameter is undefined", async () => {
            expect(await findNearestFeatures("", feature, 666, undefined)).to.be.false;
        });

        it("should return false if the fourth parameter is a boolean", async () => {
            expect(await findNearestFeatures("", feature, 666, true)).to.be.false;
        });

        it("should return false if the fourth parameter is a string", async () => {
            expect(await findNearestFeatures("", feature, 666, "")).to.be.false;
        });

        it("should return false if the fourth parameter is an array", async () => {
            expect(await findNearestFeatures("", feature, 666, [])).to.be.false;
        });

        it("should return false if the fourth parameter is null", async () => {
            expect(await findNearestFeatures("", feature, 666, null)).to.be.false;
        });

        it("should call an error if the fourth parameter is not a number", async () => {
            await findNearestFeatures("", feature, 666, "");
            expect(console.error.calledOnce).to.be.true;
        });

        it("should return false if the fifth parameter is an object", async () => {
            expect(await findNearestFeatures("", feature, 666, 666, {})).to.be.false;
        });

        it("should return false if the fifth parameter is a boolean", async () => {
            expect(await findNearestFeatures("", feature, 666, 666, true)).to.be.false;
        });

        it("should return false if the fifth parameter is a string", async () => {
            expect(await findNearestFeatures("", feature, 666, 666, "")).to.be.false;
        });

        it("should return false if the fifth parameter is an array", async () => {
            expect(await findNearestFeatures("", feature, 666, 666, [])).to.be.false;
        });

        it("should return false if the fifth parameter is null", async () => {
            expect(await findNearestFeatures("", feature, 666, 666, null)).to.be.false;
        });

        it("should call an error if the fifth parameter is not a number", async () => {
            await findNearestFeatures("", feature, 666, 666, "");
            expect(console.error.calledOnce).to.be.true;
        });

        it("should return false if the sixth parameter is an object", async () => {
            expect(await findNearestFeatures("", feature, 666, 666, undefined, {})).to.be.false;
        });

        it("should return false if the sixth parameter is a boolean", async () => {
            expect(await findNearestFeatures("", feature, 666, 666, undefined, true)).to.be.false;
        });

        it("should return false if the sixth parameter is a number", async () => {
            expect(await findNearestFeatures("", feature, 666, 666, undefined, 666)).to.be.false;
        });

        it("should return false if the sixth parameter is an array", async () => {
            expect(await findNearestFeatures("", feature, 666, 666, undefined, [])).to.be.false;
        });

        it("should return false if the sixth parameter is null", async () => {
            expect(await findNearestFeatures("", feature, 666, 666, undefined, null)).to.be.false;
        });

        it("should call an error if the sixth parameter is not a string", async () => {
            await findNearestFeatures("", feature, 666, 666, undefined, 666);
            expect(console.error.calledOnce).to.be.true;
        });

        it("should return a found feature", async () => {
            sinon.stub(getAllFeatures, "getAllFeaturesByLayerId").returns([foundFeature]);
            const foundFeatures = await findNearestFeatures("", feature, 10, 5);

            expect(foundFeatures[0]).to.be.deep.equal(foundFeature);
        });

        it("should return an empty array if no features are found", async () => {
            sinon.stub(getAllFeatures, "getAllFeaturesByLayerId").returns([]);
            const foundFeatures = await findNearestFeatures("", feature, 10, 5);

            expect(foundFeatures).to.be.an("array").and.to.be.empty;
        });

        it("should call 'getAllFeaturesByLayerId' three times if the fifth parameter is 4", async () => {
            sinon.stub(getAllFeatures, "getAllFeaturesByLayerId").returns([]);
            await findNearestFeatures("", feature, 10, 5, 4);

            expect(getAllFeatures.getAllFeaturesByLayerId.callCount).to.be.equal(3);
        });

        it("should call 'getAllFeaturesByLayerId' max 9 times if the fifth parameter is undefined and no features are found", async () => {
            sinon.stub(getAllFeatures, "getAllFeaturesByLayerId").returns([]);
            await findNearestFeatures("", feature, 10, 5, undefined);

            expect(getAllFeatures.getAllFeaturesByLayerId.callCount).to.be.equal(9);
        });

        it("should call 'getAllFeaturesByLayerId' until a feature is found", async () => {
            sinon.stub(getAllFeatures, "getAllFeaturesByLayerId").onCall(0).returns([]).onCall(1).returns([]).onCall(2).returns([foundFeature]);
            await findNearestFeatures("", feature, 10, 5);

            expect(getAllFeatures.getAllFeaturesByLayerId.callCount).to.be.equal(3);
        });
    });
});

