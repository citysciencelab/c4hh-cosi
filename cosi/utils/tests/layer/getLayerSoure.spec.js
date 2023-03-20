import {expect} from "chai";
import {getLayerSource} from "../../layer/getLayerSource";
import sinon from "sinon";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import ClusterSource from "ol/source/Cluster";

describe("utils/layer/getLayerSource", () => {

    beforeEach(function () {
        sinon.spy(console, "error");
    });

    afterEach(function () {
        console.error.restore();
        sinon.restore();
    });

    describe("getLayerSource", () => {
        it("should return null if the given param is an object", () => {
            expect(getLayerSource({})).to.be.null;
        });

        it("should return null if the given param is null", () => {
            expect(getLayerSource(null)).to.be.null;
        });

        it("should return null if the given param is undefined", () => {
            expect(getLayerSource(undefined)).to.be.null;
        });

        it("should return null if the given param is a number", () => {
            expect(getLayerSource(666)).to.be.null;
        });

        it("should return null if the given param is a string", () => {
            expect(getLayerSource("666")).to.be.null;
        });

        it("should return null if the given param is a boolean", () => {
            expect(getLayerSource(true)).to.be.null;
        });

        it("should return null if the given param is an array", () => {
            expect(getLayerSource([])).to.be.null;
        });

        it("should return null if the given param is a vector layer without a source", () => {
            expect(getLayerSource(new VectorLayer())).to.be.null;
        });

        it("should call an error if the given param is not a vector layer with a source", () => {
            getLayerSource(new VectorLayer());
            expect(console.error.calledOnce).to.be.true;
        });

        it("should return the source of a vector layer", () => {
            const source = getLayerSource(new VectorLayer({
                source: new VectorSource()
            }));

            expect(source.constructor).to.be.equal(VectorSource);
        });

        it("should return the source of a vector layer if the vector data is clustered", () => {
            const source = getLayerSource(new VectorLayer({
                source: new ClusterSource({
                    source: new VectorSource()
                })
            }));

            expect(source.constructor).to.be.equal(VectorSource);
        });
    });
});
