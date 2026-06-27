import styleList from "@masterportal/masterportalapi/src/vectorStyle/styleList.js";

import WebGlTileLayer from "ol/layer/WebGLTile.js";
import GeoTiffSource from "ol/source/GeoTIFF.js";
import Layer2dRaster from "./layer2dRaster.js";

import omit from "@shared/js/utils/omit.js";
import store from "@appstore/index.js";

/**
 * Creates a 2d raster GeoTIFF layer.
 * @name Layer2dRasterGeoTiff
 * @constructs
 * @extends Layer2dRaster
 * @param {Object} attributes The attributes of the layer configuration.
 * @returns {void}
 */
export default function Layer2dRasterGeoTiff (attributes) {
    const defaultAttributes = {
    };

    this.attributes = Object.assign(defaultAttributes, attributes);
    Layer2dRaster.call(this, this.attributes);
    this.initStyle(attributes);
}

Layer2dRasterGeoTiff.prototype = Object.create(Layer2dRaster.prototype);

/**
 * Creates a layer of type GeoTiff.
 * Sets all needed attributes at the layer and the layer source.
 * @param {Object} attributes The attributes of the layer configuration.
 * @returns {void}
 */
Layer2dRasterGeoTiff.prototype.createLayer = function (attributes) {
    const rawLayerAttributes = this.getRawLayerAttributes(attributes);

    this.setLayer(this.createGeoTiffLayer(rawLayerAttributes));
};

/**
 * Gets raw layer attributes from attributes.
 * @param {Object} attributes The attributes of the layer configuration.
 * @returns {Object} The raw layer attributes.
 */
Layer2dRasterGeoTiff.prototype.getRawLayerAttributes = function (attributes) {
    const rawLayerAttributes = {
        crs: attributes.crs,
        name: attributes.name,
        urls: attributes.urls,
        sources: attributes.sources,
        zIndex: attributes.zIndex,
        styleId: attributes.styleId,
        style: attributes.style,
        olSourceOptions: attributes.olSourceOptions
    };

    return rawLayerAttributes;
};

/**
 * Does nothing.
 * @returns {void}
*/
Layer2dRasterGeoTiff.prototype.createLegend = function () {
    // does nothing
};

/**
 * Creates a complete ol/Layer from rawLayer.
 * @param {Object} rawLayer layer specification as in services.json
 * @returns {ol/Layer} layer that can be added to map
 */
Layer2dRasterGeoTiff.prototype.createGeoTiffLayer = function (rawLayer = {}) {
    const geotiffSources = rawLayer.sources ?? rawLayer.urls.map((url) => ({url})),
        source = new GeoTiffSource({
            sources: geotiffSources,
            projection: rawLayer.crs,
            ...rawLayer.olSourceOptions
        }),
        layer = new WebGlTileLayer({
            name: rawLayer.name,
            source: source,
            typ: "GeoTiff",
            zIndex: rawLayer.zIndex
        });

    return layer;
};

/**
 * Setter for style of ol layer.
 * @param {Object} value The style to set for the ol layer.
 * @returns {void}
 */
Layer2dRasterGeoTiff.prototype.setStyle = function (value) {
    this.set("style", value);
    this.getLayer()?.setStyle(value);
};

/**
 * Initializes the style for this layer. If styleId is set, this is done after vector styles are loaded.
 * @param {Object} attrs params of the raw layer
 * @returns {void}
 */
Layer2dRasterGeoTiff.prototype.initStyle = async function (attrs) {
    if (typeof attrs.style !== "undefined") {
        this.setStyle(attrs.style);
    }

    if (typeof attrs.styleId === "undefined") {
        return;
    }

    if (store.getters.styleListLoaded) {
        this.createStyle(attrs);
    }
    else {
        store.watch((_state, getters) => getters.styleListLoaded, value => {
            if (value) {
                this.createStyle(attrs);
            }
        });
    }
};

/**
 * Creates the style.
 * @param {Object} attrs params of the raw layer
 * @returns {void}
 */
Layer2dRasterGeoTiff.prototype.createStyle = async function (attrs) {
    const styleId = attrs.styleId,
        styleObject = styleList.returnStyleObject(styleId) ?? await styleList.initStyleAndAddToList(Config, styleId);

    if (styleObject !== undefined) {
        const olStyle = Array.isArray(styleObject.rules) && styleObject.rules?.length > 0 ? styleObject.rules[0].style : null,
            cleanStyle = omit(olStyle, ["type"]);

        this.setStyle(cleanStyle);
    }
    else {
        console.warn(i18next.t("common:core.layers.errorHandling.wrongStyleId", {styleId}));
    }
};
