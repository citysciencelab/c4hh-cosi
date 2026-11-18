/**
 * Spatial part of the LayerFilter: keep only the features that lie inside (or
 * outside) the polygons of other layers. Model ported from c4hh-app
 * (app/utils/spatialFilter.ts, SpatialFilterSpec in shared/types):
 *
 *   spatial = {combine: "and"|"or", refs: [{refLayerId, mode: "within"|"outside", refFilter?}]}
 *
 * `refFilter` is an ordinary filter spec on the REFERENCE layer ("only the
 * Stadtteile Hamm and Horn").
 *
 * Differences to c4hh-app, on purpose:
 * - Lines and areas are placed by ONE representative point (interior point of an
 *   area, middle of a line) instead of "intersects": a building on a district border
 *   belongs to exactly one district, and the test is a single point-in-polygon.
 * - All layers of a map share its projection, so there is no reprojection; the
 *   polygons go into an R-tree (OL's RBush) by extent.
 */
import RBush from "ol/structs/RBush.js";
import {buildPredicate} from "./filterSpec.js";

const POLYGONAL = new Set(["Polygon", "MultiPolygon", "Circle"]);

/**
 * Whether a geometry can serve as a reference area.
 * @param {module:ol/geom/Geometry} geom The geometry.
 * @returns {Boolean} True for polygons, multipolygons and circles.
 */
export function isPolygonal (geom) {
    return Boolean(geom) && POLYGONAL.has(geom.getType());
}

/**
 * The point that stands for a geometry when its position is tested: the point
 * itself, the middle of a line, the interior point of an area, the centre of a circle.
 * @param {module:ol/geom/Geometry} geom The geometry.
 * @returns {Number[]|null} The coordinate or null.
 */
export function representativeCoordinate (geom) {
    if (!geom) {
        return null;
    }
    switch (geom.getType()) {
        case "Point":
            return geom.getCoordinates();
        case "MultiPoint":
            return geom.getCoordinates()[0] ?? null;
        case "LineString":
            return geom.getCoordinateAt(0.5);
        case "MultiLineString":
            return geom.getLineString(0)?.getCoordinateAt(0.5) ?? null;
        case "Polygon":
            return geom.getInteriorPoint().getCoordinates().slice(0, 2);
        case "MultiPolygon":
            return largestPolygon(geom)?.getInteriorPoint().getCoordinates().slice(0, 2) ?? null;
        case "Circle":
            return geom.getCenter();
        case "GeometryCollection":
            return representativeCoordinate(geom.getGeometries()[0]);
        default:
            return null;
    }
}

/**
 * The largest part of a multipolygon (where its interior point is taken).
 * @param {module:ol/geom/MultiPolygon} geom The multipolygon.
 * @returns {module:ol/geom/Polygon|undefined} The largest polygon.
 */
function largestPolygon (geom) {
    const polys = geom.getPolygons();

    return polys.length < 2 ? polys[0] : polys.reduce((a, b) => b.getArea() > a.getArea() ? b : a);
}

/**
 * Prepares the reference areas of one clause: the polygonal features of the
 * reference layer that pass its `refFilter`, indexed by extent.
 * @param {module:ol/Feature[]} features Features of the reference layer.
 * @param {Object} [refFilter] Filter spec on the reference layer.
 * @returns {{tree: RBush, count: Number}} The prepared reference.
 */
export function prepareReference (features, refFilter) {
    const pred = buildPredicate(refFilter),
        tree = new RBush(),
        extents = [],
        geoms = [];

    features.forEach(f => {
        const geom = f.getGeometry();

        if (isPolygonal(geom) && (!pred || pred(attr => f.get(attr)))) {
            extents.push(geom.getExtent());
            geoms.push(geom);
        }
    });
    tree.load(extents, geoms);
    return {tree, count: geoms.length};
}

/**
 * Whether a coordinate lies in any area of a prepared reference.
 * @param {Object} ref Prepared reference.
 * @param {Number[]} coord The coordinate.
 * @returns {Boolean} True if inside.
 */
export function isInside (ref, coord) {
    if (!coord || !ref.count) {
        return false;
    }
    const extent = [coord[0], coord[1], coord[0], coord[1]];

    return ref.tree.getInExtent(extent).some(geom => geom.intersectsCoordinate(coord));
}

/**
 * The clauses that can be evaluated: a reference layer is chosen and still there.
 * @param {Object} spatial Spatial spec.
 * @param {Function} getRefFeatures (layerId) => features, or null if the layer is gone.
 * @returns {Object[]} {clause, features} per usable clause.
 */
function usableClauses (spatial, getRefFeatures) {
    return (spatial?.refs ?? [])
        .filter(r => r.refLayerId)
        .map(clause => ({clause, features: getRefFeatures(clause.refLayerId)}))
        .filter(c => Array.isArray(c.features));
}

/**
 * Whether a spatial spec restricts anything.
 * @param {Object} spatial Spatial spec.
 * @param {Function} getRefFeatures (layerId) => features or null.
 * @returns {Boolean} True if at least one clause is usable.
 */
export function spatialRestricts (spatial, getRefFeatures) {
    return usableClauses(spatial, getRefFeatures).length > 0;
}

/**
 * Builds the spatial test of a spec: (feature) => keep?, or null if the spec
 * restricts nothing. "within" keeps what is inside the union of the clause's areas,
 * "outside" what is not; clauses combine with AND or OR.
 * @param {Object} spatial Spatial spec.
 * @param {Function} getRefFeatures (layerId) => features or null.
 * @returns {{test: Function, counts: Object}|null} The test and the number of
 *     reference areas per layer id.
 */
export function buildSpatialTest (spatial, getRefFeatures) {
    const clauses = usableClauses(spatial, getRefFeatures);

    if (!clauses.length) {
        return null;
    }
    const prepared = clauses.map(({clause, features}) => ({
            mode: clause.mode === "outside" ? "outside" : "within",
            ref: prepareReference(features, clause.refFilter)
        })),
        and = spatial.combine === "and",
        counts = {};

    clauses.forEach(({clause}, i) => {
        counts[clause.refLayerId] = prepared[i].ref.count;
    });

    return {
        counts,
        test: feature => {
            const coord = representativeCoordinate(feature.getGeometry());

            return and
                ? prepared.every(p => isInside(p.ref, coord) === (p.mode === "within"))
                : prepared.some(p => isInside(p.ref, coord) === (p.mode === "within"));
        }
    };
}

/**
 * The spatial spec in words.
 * @param {Object} spatial Spatial spec.
 * @param {Function} layerName (layerId) => display name.
 * @param {Function} [restriction] (filterSpec, layerId) => sentence of a refFilter.
 * @returns {String} The sentence ("" if nothing is chosen).
 */
export function spatialSentence (spatial, layerName, restriction = () => "") {
    return (spatial?.refs ?? [])
        .filter(r => r.refLayerId)
        .map(r => {
            const restrict = r.refFilter ? restriction(r.refFilter, r.refLayerId) : "";

            return `${r.mode === "outside" ? "nur außerhalb" : "nur innerhalb"} ${layerName(r.refLayerId)}`
                + (restrict ? ` (${restrict})` : "");
        })
        .join(spatial?.combine === "and" ? " UND " : " ODER ");
}

/**
 * A new clause.
 * @returns {Object} The clause.
 */
export function newClause () {
    return {refLayerId: null, mode: "within", refFilter: null};
}
