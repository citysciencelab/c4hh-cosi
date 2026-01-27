import GeoJSON from "ol/format/GeoJSON.js";
import GML32 from "ol/format/GML32.js";
import buffer from "@turf/buffer";
import booleanContains from "@turf/boolean-contains";
import booleanIntersects from "@turf/boolean-intersects";

const geoJsonFormatter = new GeoJSON({dataProjection: "EPSG:4326"}),
    gmlFormatter = new GML32({dataProjection: "EPSG:4326"});

/**
 * Function to check whether a feature's geometry and a given geometry overlap.
 * The implementation gracefully fails if parameters are not given or not parsable to prevent
 * the GFI from getting stuck. When in doubt, features are assumed to be intersecting for this use case
 * since they're fetched by BBOX and thus at least plausibly touching.
 * @param {(Node|import("ol/format/GeoJSON.js").GeoJSONFeature)} feature the feature to check
 * @param {Geometry<(Polygon | MultiPolygon)>} geometry the geometry to check for feature intersection
 * @returns {boolean} intersection indication
 */
export function featureIntersectsGeometry (feature, geometry) {
    if (!geometry || !["Polygon", "MultiPolygon"].includes(geometry.getType())) {
        return true;
    }

    const geoJsonGeometry = geoJsonFormatter.writeGeometryObject(geometry, {
        featureProjection: mapCollection.getMap("2D").getView().getProjection().getCode()
    });

    let featureGeometry = null;

    try {
        if (feature?.type === "Feature" && feature.geometry) {
            featureGeometry = feature.geometry;
        }
        else if (feature instanceof Node) {
            featureGeometry = geoJsonFormatter.writeGeometryObject(gmlFormatter.readFeatures(feature).getGeometry(), {
                featureProjection: mapCollection.getMapView("2D").getProjection().getCode()
            });
        }
        else {
            console.error("Unexpected feature input.", feature);
            throw new Error("Unexpected feature input.");
        }
    }
    catch (e) {
        console.error(e);
        return true;
    }

    if (!featureGeometry) {
        return true;
    }

    if (["Polygon", "MultiPolygon"].includes(featureGeometry.type)) {
        return booleanIntersects(geoJsonGeometry, featureGeometry);
    }
    if (["Point", "MultiPoint"].includes(featureGeometry.type)) {
        return booleanContains(geoJsonGeometry, featureGeometry);
    }
    if (["LineString", "MultiLineString"].includes(featureGeometry.type)) {
        return booleanContains(geoJsonGeometry, buffer(featureGeometry, 0.01, {units: "meters"}));
    }

    console.warn("Unhandled `featureIntersectsGeometry` check with:", featureGeometry, geometry);

    return true;
}
