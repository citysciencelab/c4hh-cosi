import GeoJSON from "ol/format/GeoJSON.js";
import Feature from "ol/Feature.js";
import LineString from "ol/geom/LineString.js";
import {parseOpeningHours} from "./openingHours.js";

/**
 * Fetches a GeoJSON file and reads it in the map projection.
 * The demo files are written in EPSG:25832 (see tools/build-sozialinfra-demo.py).
 * @param {String} url - The file, relative to the portal.
 * @param {module:ol/proj/Projection} projection - The map projection.
 * @returns {Promise<module:ol/Feature[]>} The features.
 */
export async function loadFeatures (url, projection) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText} (${url})`);
    }
    return new GeoJSON().readFeatures(await response.json(), {
        dataProjection: "EPSG:25832",
        featureProjection: projection
    });
}

/**
 * Marks facility features and attaches their parsed opening hours.
 * Underscore keys are internal to the prototype and never shown.
 * @param {module:ol/Feature[]} features - Facility features of all categories.
 * @returns {module:ol/Feature[]} The same features.
 */
export function prepareSites (features) {
    features.forEach(feature => {
        feature.set("_kind", "site", true);
        feature.set("_intervals", parseOpeningHours(feature.get("oeffnungszeiten")), true);
    });
    return features;
}

/**
 * One straight line per Träger network member, from the Hauptsitz (where the
 * money is paid) to the site where it is spent.
 * @param {module:ol/Feature[]} sites - Prepared facility features.
 * @returns {module:ol/Feature[]} Line features.
 */
export function buildLinks (sites) {
    const byId = new Map(sites.map(site => [site.get("id"), site]));

    return sites
        .filter(site => site.get("hauptsitz_id") && byId.has(site.get("hauptsitz_id")))
        .map(site => {
            const main = byId.get(site.get("hauptsitz_id")),
                link = new Feature({
                    geometry: new LineString([main.getGeometry().getCoordinates(), site.getGeometry().getCoordinates()])
                });

            link.setProperties({
                _kind: "link",
                traeger_id: site.get("traeger_id"),
                category_from: main.get("kategorie"),
                category_to: site.get("kategorie")
            }, true);
            return link;
        });
}

/**
 * Marks district features and stores a label point inside the largest part.
 * @param {module:ol/Feature[]} features - District polygons with statistics.
 * @returns {module:ol/Feature[]} The same features.
 */
export function prepareDistricts (features) {
    features.forEach(feature => {
        const geometry = feature.getGeometry(),
            polygons = geometry.getType() === "MultiPolygon" ? geometry.getPolygons() : [geometry],
            largest = polygons.reduce((best, polygon) => polygon.getArea() > best.getArea() ? polygon : best);

        feature.set("_kind", "district", true);
        feature.set("_labelPoint", largest.getInteriorPoint(), true);
    });
    return features;
}

/**
 * Plain, reactive-safe copy of a feature's attributes for the panel —
 * OpenLayers objects must not be made reactive by Vue.
 * @param {module:ol/Feature} feature - The feature.
 * @returns {Object} Attributes without geometry, plus the coordinate for points.
 */
export function toRow (feature) {
    const properties = {...feature.getProperties()},
        geometry = properties.geometry;

    delete properties.geometry;
    delete properties._labelPoint;
    return {...properties, coordinate: geometry?.getType() === "Point" ? geometry.getCoordinates() : null};
}
