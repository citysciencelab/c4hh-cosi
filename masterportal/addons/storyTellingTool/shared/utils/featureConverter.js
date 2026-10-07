import Circle from "ol/geom/Circle.js";
import {Fill, Stroke, Style, Text, RegularShape} from "ol/style.js";
import {fromCircle} from "ol/geom/Polygon";
import isObject from "../../../../src/shared/js/utils/isObject.js";
import {GeoJSON} from "ol/format.js";
import Point from "ol/geom/Point.js";

const geoJsonParser = new GeoJSON();

/**
 * Converts OpenLayers features to StoryCreator GeoJSON features.
 * @param {ol/Feature[]} features - OpenLayers features.
 * @returns {GeoJSON[]} GeoJSON features.
 */
function openlayersToGeoJson (features) {
    const geoJsonFeatures = [];

    features.forEach(feature => {
        if (feature?.getGeometry() instanceof Circle) {
            feature.setGeometry(fromCircle(feature.getGeometry(), 64));
        }

        const geojsonFeature = geoJsonParser.writeFeatureObject(feature);

        geojsonFeature.style = openlayersStyleToGeoJson(feature.getStyle());
        geoJsonFeatures.push(geojsonFeature);
    });

    return geoJsonFeatures;
}

/**
 * Converts StoryCreator GeoJSON features to OpenLayers features.
 * @param {GeoJSON[]} features - GeoJSON features.
 * @returns {ol/Feature[]} OpenLayers features.
 */
function geoJsonToOpenlayers (features) {
    const olFeatures = [];

    features.forEach(feature => {
        const olFeature = geoJsonParser.readFeature(feature);

        if (feature.style) {
            olFeature.setStyle(geoJsonStyleToOpenlayers(feature.style, olFeature));
        }
        else {
            olFeature.setStyle(null);
        }

        olFeatures.push(olFeature);
    });

    return olFeatures;
}

/**
 * Converts a StoryCreator OpenLayers style to GeoJSON.
 * @param {ol/Style|ol/Style[]} style - OpenLayers style.
 * @returns {Object} GeoJSON style.
 */
function openlayersStyleToGeoJson (style) {
    const isArrow = Array.isArray(style),
        currentStyle = isArrow ? style[0] : style,
        text = currentStyle?.getText();

    if (text) {
        return {
            text: text.getText(),
            font: text.getFont(),
            textColor: text.getFill()?.getColor(),
            backgroundColor: text.getBackgroundFill()?.getColor(),
            padding: text.getPadding()
        };
    }

    return {
        fillColor: currentStyle?.getFill()?.getColor(),
        strokeColor: currentStyle?.getStroke()?.getColor(),
        strokeLineDash: currentStyle?.getStroke()?.getLineDash(),
        strokeWidth: currentStyle?.getStroke()?.getWidth(),
        arrow: isArrow
    };
}

/**
 * Converts a StoryCreator GeoJSON style to an OpenLayers style.
 * @param {Object} style - GeoJSON style.
 * @param {ol/Feature} feature - OpenLayers feature.
 * @returns {ol/Style|ol/Style[]} OpenLayers style.
 */
function geoJsonStyleToOpenlayers (style, feature) {
    if (!isObject(style)) {
        return undefined;
    }

    const coordinates = feature?.getGeometry()?.getCoordinates(),
        lineStyle = new Style({
            fill: new Fill({
                color: style.fillColor
            }),
            stroke: new Stroke({
                color: style.strokeColor,
                width: style.strokeWidth,
                lineDash: style.strokeLineDash
            })
        });

    if (style.text) {
        return new Style({
            text: new Text({
                text: style.text,
                font: style.font,
                fill: new Fill({
                    color: style.textColor
                }),
                backgroundFill: new Fill({
                    color: style.backgroundColor
                }),
                padding: style.padding
            })
        });
    }

    if (style.fillTransparency) {
        const fillOpacity = 1 - (style.fillTransparency / 100),
            fillColorRgba = [...style.fillColor, fillOpacity];

        style.fillColor = fillColorRgba;
    }

    if (!style.arrow) {
        return lineStyle;
    }

    if (!coordinates || coordinates.length < 2) {
        return lineStyle;
    }

    return [
        lineStyle,
        getArrowStyle(coordinates, style.strokeColor, style.strokeWidth)
    ];
}

/**
 * Creates an OpenLayers style for an arrow based on the given coordinates.
 * @param {Array} coordinates - The coordinates of the arrow line.
 * @returns {ol/Style} The arrow style.
 */
function getArrowStyle (coordinates, color = "#000000", width = 1) {
    if (!coordinates || coordinates.length < 2) {
        return null;
    }

    const start = coordinates[coordinates.length - 2],
        end = coordinates[coordinates.length - 1],
        angle = Math.atan2(
            end[1] - start[1],
            end[0] - start[0]
        );

    return new Style({
        geometry: new Point(end),
        image: new RegularShape({
            points: 3,
            radius: Math.max(8, width * 2.5),
            fill: new Fill({
                color: color
            }),
            rotation: -angle + Math.PI / 2
        })
    });
}

export default {
    getArrowStyle,
    geoJsonToOpenlayers,
    openlayersToGeoJson
};
