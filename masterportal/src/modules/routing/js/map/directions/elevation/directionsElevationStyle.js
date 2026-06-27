import {Circle, Fill, Stroke, Style} from "ol/style.js";
import stateRouting from "@modules/routing/store/stateRouting.js";

/**
 * Creates Direction Elevation Style
 * @returns {ol/Style} style
 */
export default function createDirectionsElevationStyle () {
    return new Style({
        image: new Circle({
            radius: 6,
            stroke: new Stroke({
                color: stateRouting.directionsSettings.styleElevationProfile.elevationPointLineColor,
                width: 3
            }),
            fill: new Fill({
                color: stateRouting.directionsSettings.styleElevationProfile.elevationPointFillColor
            })
        })
    });
}
