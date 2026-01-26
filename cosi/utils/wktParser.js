import Feature from "ol/Feature";
import Geometry from "ol/geom/Geometry";
import isObject from "@shared/js/utils/isObject";
import WKT from "ol/format/WKT";

const wktParser = new WKT();

/**
 * Decode a feature from a wkt string.
 * @param {String} wktString - The wkt string to decode.
 * @param {String} dataProjection - The projection of the wkt string.
 * @param {String} featureProjection - Projection of the feature geometries that will be serialized by the parser.
 * @returns {ol/Feature} The decode Feature.
 */
function decodeFeature (wktString, dataProjection = "EPSG:25832", featureProjection = "EPSG:25832") {
    if (typeof wktString !== "string") {
        console.error("utils/geometry/wktParser: The first parameter must be an string, but got " + typeof wktString);
        return false;
    }
    if (typeof dataProjection !== "string" || typeof featureProjection !== "string") {
        console.error("utils/geometry/wktParser: The second and the third parameter must both be a string, but got " + typeof dataProjection + " and " + typeof featureProjection);
        return false;
    }

    return wktParser.readFeature(wktString, {
        dataProjection,
        featureProjection
    });
}

/**
 * Decode features from wkt strings.
 * @param {String[]} wktString - The wkt string to decode.
 * @param {String} dataProjection - The projection of the wkt string.
 * @param {String} featureProjection - Projection of the feature geometries that will be serialized by the parser.
 * @returns {ol/Feature[]} The decode features.
 */
function decodeFeatures (wktStrings, dataProjection = "EPSG:25832", featureProjection = "EPSG:25832") {
    if (!Array.isArray(wktStrings)) {
        console.error("utils/geometry/wktParser: The first parameter must be an array of strings, but got " + typeof wktStrings);
        return false;
    }
    if (typeof dataProjection !== "string" || typeof featureProjection !== "string") {
        console.error("utils/geometry/wktParser: The second and the third parameter must both be a string, but got " + typeof dataProjection + " and " + typeof featureProjection);
        return false;
    }

    return wktStrings.map(wkt => decodeFeature(wkt, dataProjection, featureProjection));
}

/**
 * Decode a geometry from a wkt string.
 * @param {String} wktString - The wkt string to decode.
 * @param {String} dataProjection - The projection of the wkt string.
 * @param {String} featureProjection - Projection of the feature geometries that will be serialized by the parser.
 * @returns {ol/Geometry} The decoded Geometry.
 */
function decodeGeometry (wktString, dataProjection = "EPSG:25832", featureProjection = "EPSG:25832") {
    if (typeof wktString !== "string") {
        console.error("utils/geometry/wktParser: The first parameter must be an string, but got " + typeof wktString);
        return false;
    }
    if (typeof dataProjection !== "string" || typeof featureProjection !== "string") {
        console.error("utils/geometry/wktParser: The second and the third parameter must both be a string, but got " + typeof dataProjection + " and " + typeof featureProjection);
        return false;
    }

    return wktParser.readGeometry(wktString, {
        dataProjection,
        featureProjection
    });
}

/**
 * Encode a feature as a wkt string.
 * @param {ol/Feature} feature - The feature to encode.
 * @param {String} dataProjection - The projection to write.
 * @param {String} featureProjection - Projection of the feature geometries that will be serialized by the parser.
 * @returns {String} The encoded feature.
 */
function encodeFeature (feature, dataProjection = "EPSG:25832", featureProjection = "EPSG:25832") {
    if (!isObject(feature) || !(feature instanceof Feature)) {
        console.error("utils/geometry/wktParser: The first parameter must be an ol feature object, but got " + typeof feature);
        return false;
    }
    if (typeof dataProjection !== "string" || typeof featureProjection !== "string") {
        console.error("utils/geometry/wktParser: The second and the third parameter must both be a string, but got " + typeof dataProjection + " and " + typeof featureProjection);
        return false;
    }

    return wktParser.writeFeature(feature, {
        dataProjection,
        featureProjection
    });
}

/**
 * Encode an array of feature as a wkt string.
 * @param {ol/Feature[]} feature - The feature to encode.
 * @param {String} dataProjection - The projection to write.
 * @param {String} featureProjection - Projection of the feature geometries that will be serialized by the parser.
 * @returns {String[]} The encoded features
 */
function encodeFeatures (features, dataProjection = "EPSG:25832", featureProjection = "EPSG:25832") {
    if (!Array.isArray(features) || !features.every(feature => feature instanceof Feature)) {
        console.error("utils/geometry/wktParser: The first parameter must be an array of ol feature objects, but got " + typeof features);
        return false;
    }
    if (typeof dataProjection !== "string" || typeof featureProjection !== "string") {
        console.error("utils/geometry/wktParser: The second and the third parameter must both be a string, but got " + typeof dataProjection + " and " + typeof featureProjection);
        return false;
    }

    return features.map(feature => encodeFeature(feature, dataProjection, featureProjection));
}

/**
 * Encode a geometry as a wkt string.
 * @param {ol/Geometry} geometry - The geometry to encode.
 * @param {String} dataProjection - The projection to write.
 * @param {String} featureProjection - Projection of the geometry that will be serialized by the parser.
 * @returns {String} The encoded geometry.
 */
function encodeGeometry (geometry, dataProjection = "EPSG:25832", featureProjection = "EPSG:25832") {
    if (!isObject(geometry) || !(geometry instanceof Geometry)) {
        console.error("utils/geometry/wktParser: The first parameter must be an ol geometry object, but got " + typeof geometry);
        return false;
    }
    if (typeof dataProjection !== "string" || typeof featureProjection !== "string") {
        console.error("utils/geometry/wktParser: The second and the third parameter must both be a string, but got " + typeof dataProjection + " and " + typeof featureProjection);
        return false;
    }

    return wktParser.writeGeometry(geometry, {
        dataProjection,
        featureProjection
    });
}

export default {
    decodeFeature,
    decodeFeatures,
    decodeGeometry,
    encodeFeature,
    encodeFeatures,
    encodeGeometry
};
