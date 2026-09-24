import {convertColor} from "@shared/js/utils/convertColor";
import {Fill, Stroke, Style} from "ol/style.js";

/**
 * Creates a style function which colors each polygon of a layer with the color returned for its feature.
 * The styles are cached per color, as a layer only has a few different colors.
 * @param {Function} getColor - Returns the color of the given feature as hex code.
 * @returns {Function} The style function for the layer.
 */
function createPolygonStyle (getColor) {
    const styles = {};

    return feature => {
        const color = getColor(feature);

        if (!styles[color]) {
            const rgb = convertColor(color, "rgb");

            styles[color] = new Style({
                fill: new Fill({color: [...rgb, 0.3]}),
                stroke: new Stroke({color: [...rgb, 1], width: 2})
            });
        }

        return styles[color];
    };
}

export {createPolygonStyle};
