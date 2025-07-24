import {Fill, Stroke, Style} from "ol/style.js";
import isObject from "../../../src/shared/js/utils/isObject.js";

/**
 * Converts GeoJSON style to OpenLayers style.
 * @param {Object} style - The GeoJSON style.
 * @returns {ol/Style} The OpenLayers style.
 */
function geoJsonToOpenlayers (style) {
    if (!isObject(style)) {
        return undefined;
    }

    if (style.fillTransparency) {
        const fillOpacity = 1 - (style.fillTransparency / 100),
            fillColorRgba = [...style.fillColor, fillOpacity];

        style.fillColor = fillColorRgba;
    }

    return new Style({
        fill: new Fill({
            color: style.fillColor
        }),
        stroke: new Stroke({
            color: style.strokeColor,
            width: style.strokeWidth,
            lineDash: style.strokeLineDash
        })
    });
}

/**
 * Converts OpenLayers style to GeoJSON style.
 * @param {ol/Style} style - The OpenLayers style.
 * @returns {Object} The GeoJSON style.
 */
function openlayersToGeoJson (style) {
    return {
        fillColor: style?.getFill()?.getColor(),
        strokeColor: style.getStroke().getColor(),
        strokeLineDash: style.getStroke().getLineDash(),
        strokeWidth: style.getStroke().getWidth()
    };
}

export default {
    geoJsonToOpenlayers,
    openlayersToGeoJson
};
