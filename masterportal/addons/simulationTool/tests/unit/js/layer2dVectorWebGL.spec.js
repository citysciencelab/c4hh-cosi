import {expect} from "chai";
import WebGLVectorLayer from "ol/layer/WebGLVector.js";
import VectorSource from "ol/source/Vector.js";
import Layer2dWebGLVector from "../../../js/layer2dVectorWebGL.js";
import mapCollection from "@core/maps/js/mapCollection.js";
import sinon from "sinon";
import {afterEach, beforeEach} from "vitest";

describe("addons/simulationTool/js/layer2dVectorWebGL.js", () => {
    let view;

    beforeEach(() => {
        view = {
            on: sinon.stub(),
            un: sinon.stub()
        };
        sinon.stub(mapCollection, "getMap").returns({getView: () => view});
    });

    afterEach(() => {
        sinon.restore();
    });

    it("creates a WebGL vector layer with the configured properties", () => {
        const attributes = {
                id: "simulation-result",
                transparency: 40,
                variables: {
                    value: 10
                },
                style: {
                    "circle-radius": 5
                }
            },
            layerWrapper = new Layer2dWebGLVector(attributes),
            layer = layerWrapper.getLayer();

        expect(layerWrapper.attributes).to.include(attributes);
        expect(layer).to.be.instanceof(WebGLVectorLayer);
        expect(layer.getSource()).to.be.instanceof(VectorSource);
        expect(layerWrapper.getLayerSource()).to.equal(layer.getSource());
        expect(layer.getOpacity()).to.equal(0.6);
        expect(layer.get("id")).to.equal(attributes.id);
        expect(layer.get("variables")).to.deep.equal(attributes.variables);
        expect(layer.get("style")).to.deep.equal(attributes.style);
    });

    it("loads paginated OAF features with the configured CRS and bbox", async () => {
        const extent = [1, 2, 3, 4],
            nextPageUrl = "https://example.org/items?page=2",
            fetchStub = sinon.stub(globalThis, "fetch").onFirstCall().resolves({
                ok: true,
                json: async () => ({
                    type: "FeatureCollection",
                    features: [],
                    links: [{rel: "next", href: nextPageUrl}]
                })
            }).onSecondCall().resolves({
                ok: true,
                json: async () => ({
                    type: "FeatureCollection",
                    features: [{
                        type: "Feature",
                        geometry: {type: "Point", coordinates: [10, 53]},
                        properties: {id: "feature-1"}
                    }]
                })
            }),
            layer = new Layer2dWebGLVector({
                typ: "OAF",
                url: "https://example.org/items",
                bboxCrs: "bbox-crs",
                crs: "data-crs",
                loadingStrategy: "bbox"
            }).getLayer(),
            source = layer.getSource(),
            loadEnd = new Promise(resolve => source.once("featuresloadend", resolve));

        source.loadFeatures(extent, 1, "EPSG:3857");
        await loadEnd;

        expect(fetchStub.calledTwice).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal("https://example.org/items?bbox=1,2,3,4&bbox-crs=bbox-crs&crs=data-crs&limit=10000");
        expect(fetchStub.secondCall.args[0]).to.equal(nextPageUrl);
        expect(source.getFeatures()).to.have.length(1);
    });

    it("aborts the previous OAF request when loading a new extent", async () => {
        let resolveFirstRequest;
        const firstExtent = [0, 0, 1, 1],
            secondExtent = [2, 2, 3, 3],
            fetchStub = sinon.stub(globalThis, "fetch").onFirstCall().returns(new Promise(resolve => {
                resolveFirstRequest = resolve;
            })).onSecondCall().resolves({
                ok: true,
                json: async () => ({type: "FeatureCollection", features: []})
            }),
            layer = new Layer2dWebGLVector({
                typ: "OAF",
                url: "https://example.org/items",
                loadingStrategy: "bbox"
            }).getLayer(),
            source = layer.getSource(),
            loadEnd = new Promise(resolve => {
                let completedLoads = 0;

                source.on("featuresloadend", () => {
                    completedLoads++;
                    if (completedLoads === 2) {
                        resolve();
                    }
                });
            });

        source.loadFeatures(firstExtent, 1, "EPSG:3857");
        source.loadFeatures(secondExtent, 1, "EPSG:3857");
        expect(fetchStub.firstCall.args[1].signal.aborted).to.be.true;

        resolveFirstRequest({
            ok: true,
            json: async () => ({type: "FeatureCollection", features: []})
        });
        await loadEnd;
    });

    it("invalidates the current extent on view changes and toggles listeners with visibility", async () => {
        let resolveRequest;
        const extent = [1, 2, 3, 4],
            fetchStub = sinon.stub(globalThis, "fetch").returns(new Promise(resolve => {
                resolveRequest = resolve;
            })),
            layer = new Layer2dWebGLVector({
                typ: "OAF",
                url: "https://example.org/items",
                loadingStrategy: "bbox"
            }).getLayer(),
            isVisible = sinon.stub(layer, "isVisible"),
            source = layer.getSource(),
            removeLoadedExtent = sinon.spy(source, "removeLoadedExtent"),
            changed = sinon.spy(source, "changed"),
            loadEnd = new Promise(resolve => source.once("featuresloadend", resolve));

        source.loadFeatures(extent, 1, "EPSG:3857");
        view.on.firstCall.args[1]();

        expect(removeLoadedExtent.calledWith(extent)).to.be.true;
        expect(changed.calledOnce).to.be.true;

        isVisible.returns(false);
        layer.dispatchEvent("change:visible");
        expect(view.un.calledWith(["change:resolution", "change:center"], view.on.firstCall.args[1])).to.be.true;
        isVisible.returns(true);
        layer.dispatchEvent("change:visible");
        expect(view.on.calledTwice).to.be.true;

        resolveRequest({
            ok: true,
            json: async () => ({type: "FeatureCollection", features: []})
        });
        await loadEnd;
        expect(fetchStub.calledOnce).to.be.true;
    });
});
