import * as Proj from "ol/proj.js";
import * as Extent from "ol/extent";
import store from "../../../src/app-store";

/**
 * Returns the center of the extent of a polygonal feature
 * @param {module:ol/Feature} feature - the OL feature (from the marker polygon)
 * @returns {number[]} the center of the polygon or null if not exists
 */
function getCenterOfPolygonFeature (feature) {
    const pts = feature.getGeometry().getInteriorPoints();

    if (pts.getPoints().length === 1) {
        return pts.getPoints()[0].getCoordinates().slice(0, 2);
    }
    else if (pts.getPoints().length > 1) {
        const geo = feature.getGeometry();

        return Extent.getCenter(geo.getExtent());
    }

    return null;
}

/**
 * Gets the coordinates of a search result
 * Needs to be triggered on Backbone Radio channel "Searchbar", event "hit"
 * @param {String} [targetCrs] - the optional CRS the result should be returned in, defaults to the portal's CRS
 * @returns {number[]} the coords of the search result
 */
export function getSearchResultsCoordinates (targetCrs) {
    const portalCrs = store.getters["Maps/projectionCode"],
        markerPoint = store.getters["MapMarker/markerPoint"],
        markerPolygon = store.getters["MapMarker/markerPolygon"];
    let features = markerPoint.getSource().getFeatures(),
        coord;

    // single point
    if (features.length === 1) {
        coord = features[0].getGeometry().getCoordinates();
    }

    // single polygon
    features = markerPolygon.getSource().getFeatures();
    if (features.length === 1) {
        coord = getCenterOfPolygonFeature(features[0]);
    }

    // transform if needed
    if (coord && targetCrs) {
        coord = Proj.transform(coord, portalCrs, targetCrs);
    }

    return coord;
}

/**
 * Gets the geometry of a search result
 * Needs to be triggered on Backbone Radio channel "Searchbar", event "hit"
 * @returns {module:ol/Geometry} the geometry of the search result
 */
export function getSearchResultsGeometry () {
    const markerPointFeatures = store.getters["MapMarker/markerPoint"].getSource().getFeatures(),
        markerPolygonFeatures = store.getters["MapMarker/markerPolygon"].getSource().getFeatures();

    // single point
    if (markerPointFeatures.length === 1) {
        return markerPointFeatures[0].getGeometry();
    }

    // single polygon
    if (markerPolygonFeatures.length === 1) {
        return markerPolygonFeatures[0].getGeometry();
    }

    return null;
}
