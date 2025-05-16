import {GeoJSON} from "ol/format.js";

/**
* Gets the bounding box of the passed scenario.
* @param {Object} scenario - The current scenario.
* @returns {ol/Geometry/Polygon} The BBOX geometry.
*/
export default function getBBOXGeometry (scenario) {
    const simulationAreaFeature = scenario.scenarioFeature?.features.find(feature => {
        return feature.properties?.id === "simulation-area";
    });

    if (!simulationAreaFeature) {
        return undefined;
    }

    return new GeoJSON().readFeature(simulationAreaFeature).getGeometry();
}
