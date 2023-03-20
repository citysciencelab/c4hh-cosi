import {intersect} from "../../utils/geomUtils";
import store from "../../../../src/app-store";

/**
 * Gets the percentage of feature1 within feature2
 * @param {module:ol/Feature} feature1 - a polygonal feature
 * @param {module:ol/Feature} feature2 - a polygonal feature
 * @return {number} - the percentage as float
 */
export default function getIntersectionCoverage (feature1, feature2) {
    const crs = store.getters["Maps/projectionCode"],
        intersection = intersect(
            [feature1, feature2],
            true,
            true,
            crs
        ),
        originalArea = feature1.getGeometry().getArea(),
        intersectionArea = intersection?.getGeometry().getArea() || 0,

        // coverage as the ratio between the intersection and the original area
        // round to 3 decimal places
        coverage = Math.round(((intersectionArea / originalArea) + Number.EPSILON) * 1000) / 1000;

    return coverage;
}
