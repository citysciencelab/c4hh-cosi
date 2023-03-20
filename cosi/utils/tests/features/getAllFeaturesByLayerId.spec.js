import {expect} from "chai";
import {getAllFeaturesByLayerId} from "../../features/getAllFeaturesByLayerId";
import sinon from "sinon";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList";
import wfsRequest from "../../../../../src/api/wfs/getFeature";

describe("utils/features/getAllFeaturesByLayerId", () => {

    beforeEach(function () {
        sinon.spy(console, "error");
    });

    afterEach(function () {
        console.error.restore();
        sinon.restore();
    });

    it("should return an empty array if the given parameter 'layerId' is an object", async () => {
        expect(await getAllFeaturesByLayerId({})).to.be.an("array").and.to.be.empty;
    });

    it("should return an empty array if the given parameter 'layerId' is undefined", async () => {
        expect(await getAllFeaturesByLayerId(undefined)).to.be.an("array").and.to.be.empty;
    });

    it("should return an empty array if the given parameter 'layerId' is a boolean", async () => {
        expect(await getAllFeaturesByLayerId(true)).to.be.an("array").and.to.be.empty;
    });

    it("should return an empty array if the given parameter 'layerId' is an array", async () => {
        expect(await getAllFeaturesByLayerId([])).and.to.be.empty;
    });

    it("should return an empty array if the given parameter 'layerId' is null", async () => {
        expect(await getAllFeaturesByLayerId(null)).to.be.an("array").and.to.be.empty;
    });

    it("should return an empty array if the given parameter 'layerId' is a number", async () => {
        expect(await getAllFeaturesByLayerId(666)).to.be.an("array").and.to.be.empty;
    });

    it("should call an error if the given parameter 'layerId' is not a string", async () => {
        await getAllFeaturesByLayerId(666);
        expect(console.error.calledOnce).to.be.true;
    });

    it("should call an error if the layer with the given id was not found", async () => {
        sinon.stub(rawLayerList, "getLayerWhere").returns(null);
        await getAllFeaturesByLayerId("666");
        expect(console.error.calledOnce).to.be.true;
    });

    it("should return an empty array if no layer with the given id was found", async () => {
        sinon.stub(rawLayerList, "getLayerWhere").returns(null);
        expect(await getAllFeaturesByLayerId("666")).to.be.an("array").and.to.be.empty;
    });

    it("should call getFeatureGET to get the features if a layer was found", async () => {
        sinon.stub(wfsRequest, "getFeatureGET").returns();
        sinon.stub(rawLayerList, "getLayerWhere").returns({id: "666"});
        await getAllFeaturesByLayerId("");
        expect(wfsRequest.getFeatureGET.calledOnce).to.be.true;
    });
});
