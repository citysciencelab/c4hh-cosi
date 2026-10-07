import Layer2d from "@core/layers/js/layer2d";
import WebGLVectorLayer from "ol/layer/WebGLVector.js";
import VectorSource from "ol/source/Vector.js";

/**
 * Masterportal layer for an OpenLayers WebGL vector layer.
 * @extends Layer2d
 */
export default class Layer2dWebGLVector extends Layer2d {

    /**
     * Creates the OpenLayers WebGL vector layer.
     * @override
     * @returns {void}
     */
    createLayer () {
        const opacity = (100 - this.attributes.transparency) / 100;

        this.layer = new WebGLVectorLayer({
            source: new VectorSource(),
            opacity,
            variables: this.attributes.variables,
            style: this.attributes.style,
            properties: {id: this.attributes.id}
        });
    }
}
