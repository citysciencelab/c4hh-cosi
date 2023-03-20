import Feature from "ol/Feature.js";
import {Circle as CircleStyle, Fill, Stroke, Style} from "ol/style.js";
import {Point} from "ol/geom.js";

/**
 * Add features with an id to the route layer.
 * @param {ol/Source} source Vector source of the route layer.
 * @returns {void}
 */
export function addRouteFeatures (source) {
    ["startPoint", "endPoint", "route"].forEach(id => {
        const feature = new Feature();

        feature.setId(id);
        feature.set("styleId", id);
        source.addFeature(feature);
    });
}

/**
 * Sets the style for the route features
 * @param {ol/Feature} feature The feature.
 * @returns {ol/Style} The feature style.
 */
export function routeStyle (feature) {
    if (feature.getGeometry() instanceof Point) {
        return [
            new Style({
                image: new CircleStyle({
                    radius: 18,
                    stroke: new Stroke({
                        color: feature.getId() === "startPoint" ? [0, 92, 169, 1] : [225, 0, 25, 1],
                        width: 3
                    }),
                    fill: new Fill({
                        color: [255, 255, 255, 0]
                    })
                })
            }),
            new Style({
                image: new CircleStyle({
                    radius: 4,
                    fill: new Fill({
                        color: feature.getId() === "startPoint" ? [0, 92, 169, 1] : [225, 0, 25, 1]
                    })
                })
            })
        ];
    }
    return new Style({
        stroke: new Stroke({
            color: [225, 0, 25, 0.6],
            width: 6
        })
    });
}
