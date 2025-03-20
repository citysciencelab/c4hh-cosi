import {bufferGeometry} from "./bufferGeometry";
import {collectFeaturesByCoordinates} from "../../shared/js/mapfishUtils/collectFeatures";

/**
 * Creates a feature with the given coordinate or requests features via a service.
 * @param {Object} parcel - The parcel.
 * @param {Number[]} parcel.center - The parcel (possible merged) center.
 * @param {ol/extent} parcel.extent - The extent of the parcel (possible merged) .
 * @param {ol/Feature} parcel.feature - The ol feature of the parcel (possible merged).
 * @param {ol/Feature[]} parcel.featureList - All features of the selected parcels.
 * @param {ol/geom/Polygon} parcel.geometry - The geometry of the parcel (possible merged).
 * @param {Object} config - Crawler config.
 * @param {Number[]} [config.coordinate] - A coordinate from which a feature is created.
 * @param {String} [config.filter] - Controls which filter is used (e.g. "intersects", "within"). Only used if no coordinate is specified.
 * @param {String} [config.geometryName] - The geometry name of the feature. Only used if no coordinate is specified.
 * @param {String[]} [config.propertyName] - Attributes that are requested. Only used if no coordinate is specified.
 * @param {Number} [config.radius] - A optional radius to set a buffer around the parcel geometry.
 * @param {Object} projection - An Object with the map projection and the OAF CRS URI aswell.
 * @param {String} projection.mapProjection - The EPSG-Code of the current map projection.
 * @param {String} projection.oafCRSURI - The OAF CRS URI - only needed for oaf services.
 * @param {Object} [service] - The service to use for the request. Only used if no coordinate is specified.
 * @param {Function} onsuccess - Is called on success.
 * @param {Function} onerror - Is called on error.
 * @returns {void}
 */
export async function collectFeatures (parcel, config, {mapProjection, oafCRSURI}, service, onsuccess, onerror) {
    const localParcel = parcel;

    if (localParcel.radius) {
        localParcel.geometry = bufferGeometry(localParcel.geometry, localParcel.radius, mapProjection);
    }
    collectFeaturesByCoordinates(localParcel, config, {mapProjection, oafCRSURI}, service, onsuccess, onerror)
}