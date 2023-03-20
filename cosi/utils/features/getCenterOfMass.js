import centerOfMass from "@turf/center-of-mass";
import Feature from "ol/Feature";
import {GeoJSON} from "ol/format";
import isObject from "../../../../src/utils/isObject";

/**
 * Gets the coordinate of a center of mass of a feature.
 * @param {ol/Feature} feature - The feature to get the centroid of.
 * @param {String} [sourceCrs="EPSG:25832"] - The CRS of the input.
 * @param {String} [targetCrs="EPSG:4326"] - The CRS of the output.
 * @returns {[Number, Number]|Boolean} The centroid coordinate. False if something fails.
 */
export function getCenterOfMass (feature, sourceCrs = "EPSG:25832", targetCrs = "EPSG:4326") {
    if (!isObject(feature) || !(feature instanceof Feature)) {
        console.error("utils/features/getCenterOfMass: The first parameter must be an ol feature object, but got " + typeof feature);
        return false;
    }
    if (typeof sourceCrs !== "string" || typeof targetCrs !== "string") {
        console.error("utils/features/getCenterOfMass: The second and the third parameter must both be a string, but got " + typeof sourceCrs + " and " + typeof targetCrs);
        return false;
    }
    const
        parser = new GeoJSON({
            dataProjection: targetCrs,
            featureProjection: sourceCrs
        }),
        geojson = parser.writeFeatureObject(feature),
        centroidFeature = centerOfMass(geojson);

    return centroidFeature?.geometry.coordinates;
}
