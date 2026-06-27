import {Circle, Fill, Stroke, Style} from "ol/style.js";
import stateRouting from "../../../../store/stateRouting.js";

/**
 * Creates Direction Avoid Point Style
 * @returns {ol/Style} style
 */
export default function createDirectionsAvoidPointStyle () {
    const styleSetting = stateRouting.directionsSettings.styleAvoidAreas ? stateRouting.directionsSettings.styleAvoidAreas : stateRouting.Directions.settings.styleAvoidAreas;

    return new Style({
        fill: new Fill({
            color: [...styleSetting.fillColor, styleSetting.opacity]
        }),
        stroke: new Stroke({
            color: [...styleSetting.lineColor, 1.0],
            width: styleSetting.lineWidth
        }),
        image: new Circle({
            radius: 2,
            stroke: new Stroke({
                color: [...styleSetting.lineColor, 1.0],
                width: styleSetting.pointLineWidth
            }),
            fill: new Fill({
                color: [...styleSetting.fillColor, styleSetting.opacity]
            })
        })
    });
}
