import {bufferGeometry} from "./bufferGeometry";
import Feature from "ol/Feature";
import {getFeaturePOST as wfsGetFeaturePOST} from "../../../src/shared/js/api/wfs/getFeature";
import {intersects, within} from "ol/format/filter";
import Point from "ol/geom/Point";
import {WFS} from "ol/format";
import isObject from "../../../src/shared/js/utils/isObject";
import getOAFFeature from "../../../src/shared/js/api/oaf/getOAFFeature";

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
    if (config.coordinate) {
        const feature = createFeatureByCoordinate(config.coordinate);

        onsuccess([feature]);
        return;
    }
    if (config.filter === "equalTo") {
        onsuccess(parcel.featureList);
        return;
    }
    if (service.typ === "OAF") {
        const filter = getOAFGeometryFilter(parcel.geometry, config.geometryName, config.filter, config.radius);

        getOAFFeature.getOAFFeatureGet(service.url, service.collection, 10000, filter, oafCRSURI)
            .then(plainOAFFeatures => {
                if (Array.isArray(plainOAFFeatures)) {
                    onsuccess(getOAFFeature.readAllOAFToGeoJSON(plainOAFFeatures, {
                        featureProjection: mapProjection
                    }));
                }
            }).catch(error => {
                onerror(error);
            });
        return;
    }
    const payload = {
        featureNS: service.featureNS,
        featureTypes: [service.featureType],
        filter: getFilter(parcel.geometry, config.geometryName, config.filter, config.radius),
        srsName: mapProjection,
        propertyNames: getPropertyNames(config.propertyName, config.geometryName, config.precompiler)
    };

    wfsGetFeaturePOST(service.url, payload, onerror).then(response => {
        if (response) {
            const parserWFS = new WFS(),
                features = parserWFS.readFeatures(response);

            onsuccess(features);
        }
    }).catch(error => {
        if (typeof onerror === "function") {
            onerror(error);
        }
    });
}

/**
 * Creates a feature with a point geometry.
 * @param {ol/coordinate} coordinate - An array of numbers representing the xy coordinate of the point geometry.
 * @returns {ol/Feature} The created Feature.
 */
export function createFeatureByCoordinate (coordinate) {
    return new Feature({
        geometry: new Point(coordinate)
    });
}

/**
 * Creates a filter operator to test whether a geometry-valued property intersects or is within a given geometry.
 * If radius is given, a buffered geometry is used.
 * @param {ol/geom/Geometry} geometry - The Geometry.
 * @param {String} geometryName - The geometry-valued property.
 * @param {String} filterType - Possible types are intersects | within.
 * @param {Number|undefined} radius - The radius for the buffer.
 * @returns {Object} Represents a filter operater.
 */
export function getFilter (geometry, geometryName, filterType, radius) {
    if (!filterType) {
        return undefined;
    }
    const usedGeometry = radius ? bufferGeometry(geometry, radius) : geometry;

    if (filterType === "intersects") {
        return intersects(geometryName, usedGeometry);
    }
    return within(geometryName, usedGeometry);
}

/**
 * Gets an oaf geometry filter.
 * @param {ol/geom/Geometry} geometry - The Geometry.
 * @param {String} geometryName - The geometry-valued property.
 * @param {String} filterType - Possible types are intersects | within.
 * @param {Number|undefined} radius - The radius for the buffer.
 * @returns {String|undefined} a string which represents the oaf geometry filter.
 */
export function getOAFGeometryFilter (geometry, geometryName, filterType, radius) {
    if (!filterType) {
        return undefined;
    }

    const usedGeometry = radius ? bufferGeometry(geometry, radius) : geometry,
        flattenCoordinates = Array.isArray(usedGeometry?.flatCoordinates) && usedGeometry?.flatCoordinates[2] === 0 ? usedGeometry.flatCoordinates.filter((coordinate, index) => (index + 1) % 3) : usedGeometry.flatCoordinates,
        result = [],
        operation = filterType === "intersects" ? "S_INTERSECTS" : "S_WITHIN";

    for (let i = 0; i < flattenCoordinates.length; i += 2) {
        const chunk = flattenCoordinates.slice(i, i + 2);

        result.push(chunk.join(" "));
    }

    return `${operation}(${geometryName}, POLYGON((${result.join(", ")})))`;
}

/**
 * If the precompiler needs the geometry, it adds the name of the geometry attribute to the propertie names.
 * @param {String[]} propertyName - A list of the property names.
 * @param {String} geometryName - The name of the geometry attribute.
 * @param {Object} precompiler - The precompiler object.
 * @returns {String[]|undefined} The property names with or without the geometry property or undefined if something failed.
 */
export function getPropertyNames (propertyName, geometryName, precompiler) {
    if (!Array.isArray(propertyName)) {
        console.error(`addons/valuationPrint/utils/collectFeatures: propertyName is ${propertyName}, but it has to be an array`);
        return undefined;
    }
    if (typeof geometryName !== "string") {
        console.error(`addons/valuationPrint/utils/collectFeatures: geometryName is ${geometryName}, but it has to be a string`);
        return propertyName;
    }

    if (isObject(precompiler) && precompiler.type !== "assignAttributes") {
        return propertyName.concat(geometryName);
    }
    return propertyName;
}
