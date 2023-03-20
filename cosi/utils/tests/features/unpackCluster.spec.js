import {expect} from "chai";
import {unpackCluster} from "../../features/unpackCluster";
import sinon from "sinon";
import Feature from "ol/Feature";

describe("utils/features/unpackCluster", () => {

    beforeEach(function () {
        sinon.spy(console, "error");
    });

    afterEach(function () {
        console.error.restore();
        sinon.restore();
    });

    describe("getLayerSource", () => {
        it("should return false if the given param is an object", () => {
            expect(unpackCluster({})).to.be.false;
        });

        it("should return false if the given param is null", () => {
            expect(unpackCluster(null)).to.be.false;
        });

        it("should return false if the given param is undefined", () => {
            expect(unpackCluster(undefined)).to.be.false;
        });

        it("should return false if the given param is a number", () => {
            expect(unpackCluster(666)).to.be.false;
        });

        it("should return false if the given param is a string", () => {
            expect(unpackCluster("666")).to.be.false;
        });

        it("should return false if the given param is a boolean", () => {
            expect(unpackCluster(true)).to.be.false;
        });

        it("should return false if the given param is an array", () => {
            expect(unpackCluster([])).to.be.false;
        });

        it("should call an error if the given param is not a feature", () => {
            unpackCluster(true);
            expect(console.error.calledOnce).to.be.true;
        });

        it("should return the feature in an array if no clustered features exists", () => {
            const feature = new Feature();

            expect(unpackCluster(feature)).to.deep.equal([feature]);
        });

        it("should return clustered features if exists", () => {
            const feature = new Feature(),
                clusterFeatures = [new Feature(), new Feature()];

            feature.set("features", clusterFeatures);

            expect(unpackCluster(feature)).to.deep.equal(clusterFeatures);
        });
    });
});
