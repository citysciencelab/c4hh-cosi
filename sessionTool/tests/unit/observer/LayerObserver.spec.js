import {expect} from "chai";
import sinon from "sinon";
import {
    getCurrentLayerList,
    setLayers,
    getModelByLayerId,
    getLayerIdBlacklistFromAccordions
} from "../../../observer/LayerObserver";


describe("addons/sessionTool/observer/LayerObserver.js", () => {
    beforeEach(() => {
        const request = sinon.spy(() => ({
            id: "0",
            isSelected: true,
            isVisibleInMap: true
        }));

        sinon.stub(Radio, "request").callsFake(request);
    });

    afterEach(sinon.restore);

    describe("getCurrentLayerList", () => {
        it("should return the current selected layers", () => {
            const expected = {
                layerIds: [
                    {
                        id: "0",
                        visibility: true
                    }
                ]
            };

            expect(getCurrentLayerList()).to.deep.equal(expected);
        });
    });
    describe("getModelByLayerId", () => {
        it("should return false if anything but a string or number is given", () => {
            expect(getModelByLayerId({})).to.be.false;
            expect(getModelByLayerId([])).to.be.false;
            expect(getModelByLayerId(undefined)).to.be.false;
            expect(getModelByLayerId(false)).to.be.false;
            expect(getModelByLayerId(true)).to.be.false;
            expect(getModelByLayerId(null)).to.be.false;
        });
        it("should get the model without adding it first", () => {
            sinon.restore();
            const request = sinon.spy(() => [{
                id: "0",
                isSelected: true,
                visibility: true
            }]);
            let model = null;

            sinon.stub(Radio, "request").callsFake(request);

            model = getModelByLayerId(0);
            expect(model).to.deep.equal({
                id: "0",
                isSelected: true,
                visibility: true
            });
            expect(request.calledOnce).to.be.true;
        });
        it("should return undefined if model can't be found even if it is added to the modellist", () => {
            sinon.restore();
            const request = sinon.spy(() => undefined);
            let model = null;

            sinon.stub(Radio, "request").callsFake(request);
            model = getModelByLayerId(0);
            expect(model).to.be.undefined;
        });
        it("should return the model if the model is added to the modellist", () => {
            sinon.restore();
            const stub = sinon.stub(Radio, "request"),
                expected = {
                    id: "0",
                    isSelected: true,
                    visibility: true
                };
            let model = null;

            stub.onCall(0).callsFake(sinon.spy(() => undefined));
            stub.onCall(1).callsFake(sinon.spy(() => expected));

            model = getModelByLayerId(0);
            expect(model).to.deep.equal(expected);
            expect(stub.calledTwice).to.be.true;
        });
    });
    describe("setLayers", () => {
        it("should return false if anything but an array is given for layerIds", () => {
            expect(setLayers({})).to.be.false;
            expect(setLayers({layerIds: undefined})).to.be.false;
            expect(setLayers({layerIds: false})).to.be.false;
            expect(setLayers({layerIds: true})).to.be.false;
            expect(setLayers({layerIds: ""})).to.be.false;
            expect(setLayers({layerIds: 1234})).to.be.false;
            expect(setLayers({layerIds: null})).to.be.false;
            expect(setLayers({layerIds: {}})).to.be.false;
            expect(setLayers(true)).to.be.false;
            expect(setLayers(false)).to.be.false;
            expect(setLayers(1234)).to.be.false;
            expect(setLayers("")).to.be.false;
            expect(setLayers(null)).to.be.false;
            expect(setLayers({})).to.be.false;
            expect(setLayers([])).to.be.false;
        });
        it("should return true if an array is given", () => {
            expect(setLayers({layerIds: []})).to.be.true;
        });
    });
    describe("getLayerIdBlacklistFromAccordions", () => {
        it("should return an empty object if anything but an object is given", () => {
            expect(getLayerIdBlacklistFromAccordions({})).to.be.an("object").that.is.empty;
            expect(getLayerIdBlacklistFromAccordions(null)).to.be.an("object").that.is.empty;
            expect(getLayerIdBlacklistFromAccordions(1234)).to.be.an("object").that.is.empty;
            expect(getLayerIdBlacklistFromAccordions("string")).to.be.an("object").that.is.empty;
            expect(getLayerIdBlacklistFromAccordions(true)).to.be.an("object").that.is.empty;
            expect(getLayerIdBlacklistFromAccordions(false)).to.be.an("object").that.is.empty;
            expect(getLayerIdBlacklistFromAccordions(undefined)).to.be.an("object").that.is.empty;
        });
        it("should return an object with layer id's as key", () => {
            const accordions = [
                    {
                        layerId: 0
                    }
                ],
                expected = {0: true};

            expect(getLayerIdBlacklistFromAccordions(accordions)).to.deep.equal(expected);
        });
    });
});
