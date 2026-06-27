import Layer3d from "./layer3d.js";

/**
 * Creates a 3d layer group.
 * @name Layer3dGroup
 * @abstract
 * @constructs
 * @extends Layer3d
 * @param {Object} attributes The attributes of the layer configuration.
 * @returns {void}
 */
export default function Layer3dGroup (attributes, factory) {
    const defaultAttributes = {
    };

    this.attributes = Object.assign(defaultAttributes, attributes);
    this.layerFactory = factory;
    if (!Array.isArray(attributes.children)) {
        console.warn("Wrong configuration for 3D Grouplayer: children are missing.", attributes);
    }
    else {
        Layer3d.call(this, this.attributes);
    }
}

Layer3dGroup.prototype = Object.create(Layer3d.prototype);

/**
 * Creates a layer of type GROUP3D.
 * Sets all needed attributes at the layer and the layer source.
 * Grouped layers are stored in layerSource.
 * Child layers will retrieve the visibility of the parent.
 * @param {Object} attributes The attributes of the layer configuration.
 * @returns {void}
 */
Layer3dGroup.prototype.createLayer = function (attributes) {
    const cesiumLayers = [],
        opacity = !isNaN(attributes.transparency) ? (100 - attributes.transparency) / 100 : 1;

    attributes.children.forEach(rawLayer => {
        const childProps = {
                ...rawLayer,
                visibility: attributes.visibility
            },
            layer = this.layerFactory.createLayer(childProps, "3D");

        cesiumLayers.push(layer);
    });
    const groupLayer = {
        layers: cesiumLayers,
        zIndex: attributes.zIndex,
        opacity: opacity
    };

    groupLayer.getSource = () => {
        return cesiumLayers;
    };
    this.setLayer(groupLayer);
    this.setLayerSource();
};

/**
 * Updates the layer values of the Layer3dGroup.
 * Passes the visibility and the transparency of the group to its children.
 * @param {Object} attributes The attributes of the layer configuration.
 * @returns {void}
 */
Layer3dGroup.prototype.updateLayerValues = function (attributes) {
    Layer3d.prototype.updateLayerValues.call(this, attributes);

    this.getLayerSource().forEach(layer => {
        const childProps = {
            ...layer.attributes,
            visibility: attributes.visibility,
            transparency: attributes.transparency
        };

        layer.updateLayerValues(childProps);
    });
};

/**
 * Sets each child layers visibility to given value.
 * @param {Boolean} visibility visibility of the layer
 * @param {Cesium} map The 3d map.
 * @param {Object} attributes The attributes of the layer configuration.
 * @returns {void}
 */
Layer3dGroup.prototype.setVisible = function (visibility, map) {
    this.getLayerSource().forEach(layer => {
        layer.setVisible(visibility, map, layer.attributes);
    });
};

/**
 * Setter for layer source. Sets this grouped layers as layerSource.
 * @returns {void}
 */
Layer3dGroup.prototype.setLayerSource = function () {
    this.layerSource = this.getLayer().getSource();
};
/**
 * Getter for layer source. Returns an array with the grouped layers.
 * @returns {Array} an array with the grouped layers.
 */
Layer3dGroup.prototype.getLayerSource = function () {
    return this.layerSource;
};

