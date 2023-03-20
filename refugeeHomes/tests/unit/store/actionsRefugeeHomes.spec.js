import {expect} from "chai";
import state from "../../../store/stateRefugeeHomes";
import sinon from "sinon";
import actions from "../../../store/actionsRefugeeHomes";

describe("ADDONS: addons/refugeeHomes/store/actionsRefugeeHomes", () => {
    let dispatch;

    beforeEach(() => {
        dispatch = sinon.spy();
    });

    it("RequestRawLayerList dispatch buildAndGetRequestUrl and sendRequest ", async function () {

        await actions.requestRawLayerList({getters: {layerIds: ["4553"]}, dispatch});
        expect(dispatch.args[0][0]).to.equal("buildAndGetRequestUrl");
        expect(dispatch.args[0][1]).to.deep.equal(null);
    });
    it("buildAndGetRequestUrl results in string url", function () {
        const rawLayer = {url: "https://testurl", featureType: "testFeatureTyp"},
            buildAndGetRequestUrl = actions.buildAndGetRequestUrl(state, rawLayer);

        expect(buildAndGetRequestUrl).to.be.a("string");
        expect(buildAndGetRequestUrl).to.equal("https://testurl?service=WFS&request=GetFeature&version=2.0.0&typeNames=testFeatureTyp");
    });
    it("Scaleimages provides the adapted image size value", function () {
        const updatedFeature = actions.scaleImages({}, {platzzahl: 50});

        expect(updatedFeature.imgHeight).to.equal(20);
    });
});
