import {expect} from "chai";
import WebGLVectorLayer from "ol/layer/WebGLVector.js";
import VectorSource from "ol/source/Vector.js";
import Layer2dWebGLVector from "../../../js/layer2dVectorWebGL.js";

describe("addons/simulationTool/js/layer2dVectorWebGL.js", () => {
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
});
