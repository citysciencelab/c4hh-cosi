import {expect} from "chai";
import Feature from "ol/Feature.js";
import layerCollection from "@core/layers/js/layerCollection.js";
import {setWfstFeatureVisibility} from "../../js/setWfstFeatureVisibility.js";
import sinon from "sinon";
import VectorSource from "ol/source/Vector.js";

describe("addons/heavyRain/shared/js/setWfstFeatureVisibility.js", () => {
    let feature,
        getLayerByIdStub;

    beforeEach(() => {
        const source = new VectorSource();

        feature = new Feature();
        feature.setId("meldungen.42");
        source.addFeature(feature);
        getLayerByIdStub = sinon.stub(layerCollection, "getLayerById").withArgs("36013").returns({getLayerSource: () => source});
    });

    afterEach(() => {
        sinon.restore();
    });

    it("should hide the feature with an empty style", () => {
        setWfstFeatureVisibility("36013", "meldungen.42", false);

        expect(getLayerByIdStub.calledOnceWith("36013")).to.be.true;
        expect(feature.getStyle().getFill()).to.be.null;
        expect(feature.getStyle().getStroke()).to.be.null;
    });

    it("should show the feature with the style of the layer again", () => {
        setWfstFeatureVisibility("36013", "meldungen.42", false);
        setWfstFeatureVisibility("36013", "meldungen.42", true);

        expect(feature.getStyle()).to.not.exist;
    });

    it("should do nothing without a feature id", () => {
        setWfstFeatureVisibility("36013", undefined, false);

        expect(getLayerByIdStub.notCalled).to.be.true;
        expect(feature.getStyle()).to.be.null;
    });

    it("should not fail for an unknown feature or layer", () => {
        expect(() => setWfstFeatureVisibility("36013", "meldungen.1", false)).to.not.throw();

        getLayerByIdStub.returns(undefined);

        expect(() => setWfstFeatureVisibility("36013", "meldungen.42", false)).to.not.throw();
    });
});
