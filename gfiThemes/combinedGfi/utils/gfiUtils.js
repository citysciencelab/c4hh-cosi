import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList.js";
import {getCenter} from "ol/extent.js";
import GeoJSONReader from "jsts/org/locationtech/jts/io/GeoJSONReader.js";
import {BufferOp} from "jsts/org/locationtech/jts/operation/buffer";
import GeoJSONWriter from "jsts/org/locationtech/jts/io/GeoJSONWriter.js";
import {translateKeyIfPossible} from "./translationUtils.js";
import {featureIntersectsGeometry} from "./featureIntersectsGeometry.js";

/**
 * Normalizes attributes configuration to a consistent format for extraction functions.
 *
 * @param {string|Object} attributes - The attributes configuration from layer config.
 * @returns {string|Array} - Normalized attributes format.
 */
export function normalizeAttributes (attributes) {
    if (!attributes) {
        return "showAll";
    }

    if (typeof attributes === "string") {
        return attributes;
    }

    if (Array.isArray(attributes)) {
        return attributes;
    }

    if (typeof attributes === "object") {
        return Object.keys(attributes);
    }

    return "showAll";
}

/**
 * Merges layersToRequest with layers that are not requested for UI, but
 * merely for buffer requests, whilst avoiding duplicate entries.
 * @param {Object[]} layersToRequest layers directly configured for request
 * @param {Object<string, string[]>} bufferAttributes layerId to bufferAttributes array
 * @returns {Object[]} extended request layers array
 */
export function getAllRequestLayers (layersToRequest = [], bufferAttributes = {}) {
    return [
        ...layersToRequest,
        ...Object.entries(bufferAttributes)
            .filter(([id]) => layersToRequest.every((entry) => entry.id !== id))
            .map(([id, attributes]) => ({
                ...rawLayerList.getLayerWhere({id}),
                gfiAttributes: attributes
            }))
    ];
}

/**
 * Checks if a key should be ignored, using case-insensitive comparison.
 *
 * @param {string} key - The key to check.
 * @param {Array<string>} ignoredKeys - Array of keys to ignore.
 * @returns {boolean} True if the key should be ignored.
 */
function isKeyIgnored (key, ignoredKeys) {
    if (!Array.isArray(ignoredKeys) || ignoredKeys.length === 0) {
        return false;
    }
    const lowerKey = key.toLowerCase();

    return ignoredKeys.some(ignoredKey => ignoredKey.toLowerCase() === lowerKey);
}

/**
 * Retrieves a coordinate from a given geometry object based on its type.
 *
 * @param {Object} geometry - The geometry object from which to extract the coordinate.
 * @returns {Array|undefined} The coordinate as an array [x, y] or undefined if the geometry type is not supported.
 */
export function getCoordinateFromGeometry (geometry) {
    if (!geometry || typeof geometry.getType !== "function") {
        console.error("Invalid geometry object provided");
        return undefined;
    }
    const geometryType = geometry.getType();

    try {

        switch (geometryType) {
            case "Point":
                return geometry.getCoordinates();
            case "LineString":
                return geometry.getCoordinateAt(0.5);
            case "Polygon":
            case "MultiPolygon": {
                if (typeof geometry.getInteriorPoint === "function") {
                    try {
                        return geometry.getInteriorPoint().getCoordinates();
                    }
                    catch (error) {
                        console.error("getInteriorPoint failed, using extent center:", error);
                    }
                }
                const extent = geometry.getExtent();

                if (extent && extent.length === 4) {
                    return getCenter(extent);
                }
                break;
            }
            default: {
                const fallbackExtent = geometry.getExtent();

                if (fallbackExtent && fallbackExtent.length === 4) {
                    return getCenter(fallbackExtent);
                }
            }
        }
    }
    catch (error) {
        console.error(`Error extracting coordinate from ${geometryType} geometry:`, error);
    }

    console.error("Failed to determine coordinates for geometry");
    return undefined;
}

/**
 * Extracts all unique keys from an array of result objects, excluding ignored keys based on gfiAttributes configuration.
 *
 * @param {Array<Object>} results - An array of result objects.
 * @param {string|Object} gfiAttributes - The gfiAttributes configuration like in layer configuration.
 * @param {Array<string>} ignoredKeys - Keys to be ignored (excluded from output) - only used when gfiAttributes is "showAll".
 * @returns {Array<Object>} An array of column objects with name and index.
 */
export function extractColumnsFromResults (results, gfiAttributes, ignoredKeys) {
    if (gfiAttributes === "ignore") {
        return [];
    }

    const allKeys = results
        .filter(result => result)
        .reduce((acc, result) => {
            Object.keys(result || {}).forEach(key => {
                if (!acc.includes(key)) {
                    acc.push(key);
                }
            });
            return acc;
        }, []);

    let keysToInclude;

    if (gfiAttributes === "showAll") {
        // For "showAll", use all keys but filter out ignoredKeys if provided
        keysToInclude = Array.isArray(ignoredKeys) && ignoredKeys.length > 0
            ? allKeys.filter(key => !isKeyIgnored(key, ignoredKeys))
            : allKeys;
    }
    else if (typeof gfiAttributes === "object" && !Array.isArray(gfiAttributes)) {
        // For object configuration, use the configured keys
        keysToInclude = Object.keys(gfiAttributes);
    }
    else {
        // Fallback: use all keys (for null/undefined)
        keysToInclude = allKeys;
    }

    return keysToInclude.map((key, index) => ({name: key, index}));
}

/**
 * Extracts and filters rows from the given results based on gfiAttributes configuration.
 *
 * @param {Array<Object>} results - The array of result objects to be filtered.
 * @param {string|Object|Array} gfiAttributes - The gfiAttributes configuration like in layer configuration.
 * @param {Array<string>} ignoredKeys - Keys to be ignored (excluded from output) - only used when gfiAttributes is "showAll".
 * @returns {Array<Object>} - The filtered array of result objects.
 */
export function extractRowsFromResults (results, gfiAttributes, ignoredKeys) {
    if (gfiAttributes === "ignore") {
        return [];
    }

    return results
        .filter(result => result)
        .map(feature => {
            if (gfiAttributes === "showAll") {
                // For "showAll", use all properties but filter out ignoredKeys if provided
                if (Array.isArray(ignoredKeys) && ignoredKeys.length > 0) {
                    const filtered = {};

                    Object.keys(feature).forEach(key => {
                        if (!isKeyIgnored(key, ignoredKeys)) {
                            filtered[key] = feature[key];
                        }
                    });
                    return filtered;
                }
                return {...feature};
            }
            else if (typeof gfiAttributes === "object" && !Array.isArray(gfiAttributes)) {
                const filteredFeature = {};

                Object.keys(gfiAttributes).forEach(key => {
                    const displayName = gfiAttributes[key];

                    if (feature[key] !== undefined) {
                        filteredFeature[displayName] = feature[key];
                    }
                });
                return filteredFeature;
            }
            return {...feature};
        });
}

/**
 * Extracts features from a WMS GML response.
 *
 * @param {Document} parsedResponse - The parsed XML response from the WMS request.
 * @param {string|Array} attributes - The attributes configuration.
 *                                    Can be "ignore", "showAll", or Array of strings.
 * @param {Array<string>} ignoredKeys - Keys to be ignored when attributes is "showAll".
 * @returns {Array<Object>} An array of extracted features.
 */
export function extractFeaturesFromWmsGml (parsedResponse, attributes, ignoredKeys) {
    if (attributes === "ignore") {
        return [];
    }

    const featureMembers = parsedResponse.querySelectorAll("gml\\:featureMember, featureMember"),
        features = [],
        namespaceRegex = /(?:[a-zA-Z]+:)?(.+)/,
        shouldShowAll = attributes === "showAll" || !attributes,
        attributeList = Array.isArray(attributes) ? attributes.filter(attr => typeof attr === "string") : [];

    featureMembers.forEach(member => {
        const featureNode = member.firstElementChild,
            feature = {};

        if (!featureNode) {
            return;
        }

        featureNode.querySelectorAll("*").forEach(attribute => {
            const localName = attribute.localName || attribute.tagName.match(namespaceRegex)?.[1];

            if (shouldShowAll) {
                if (!isKeyIgnored(localName, ignoredKeys)) {
                    feature[localName] = attribute.textContent;
                }
            }
            else if (attributeList.length > 0 && attributeList.includes(localName)) {
                feature[localName] = attribute.textContent;
            }
        });

        if (!shouldShowAll && attributeList.length > 0) {
            const filteredFeature = {};

            attributeList.forEach(attrName => {
                if (feature[attrName] !== undefined) {
                    filteredFeature[attrName] = feature[attrName];
                }
            });

            if (Object.keys(filteredFeature).length > 0) {
                features.push(filteredFeature);
            }
        }
        else if (Object.keys(feature).length > 0) {
            features.push(feature);
        }
    });

    return features;
}

/**
 * Extracts features from an ESRI WMS response.
 *
 * @param {Document} parsedResponse - The parsed XML response from the ESRI WMS.
 * @param {string|Array} attributes - The attributes configuration.
 *                                    Can be "ignore", "showAll", or Array of strings.
 * @param {Array<string>} ignoredKeys - Keys to be ignored when attributes is "showAll".
 * @returns {Array<Object>} An array of feature objects extracted from the response.
 */
export function extractFeaturesFromEsriWms (parsedResponse, attributes, ignoredKeys) {
    if (attributes === "ignore") {
        return [];
    }

    const features = [],
        fieldElements = parsedResponse.querySelectorAll("FIELDS"),
        shouldShowAll = attributes === "showAll" || !attributes,
        attributeList = Array.isArray(attributes) ? attributes.filter(attr => typeof attr === "string") : [];

    fieldElements.forEach(fieldElement => {
        const feature = {};

        Array.from(fieldElement.attributes).forEach(attr => {
            const attrName = attr.name,
                attrValue = attr.value;

            if (shouldShowAll) {
                if (!isKeyIgnored(attrName, ignoredKeys)) {
                    feature[attrName] = attrValue;
                }
            }
            else if (attributeList.length > 0 && attributeList.includes(attrName)) {
                feature[attrName] = attrValue;
            }
        });

        if (!shouldShowAll && attributeList.length > 0) {
            const filteredFeature = {};

            attributeList.forEach(attrName => {
                if (feature[attrName] !== undefined) {
                    filteredFeature[attrName] = feature[attrName];
                }
            });

            if (Object.keys(filteredFeature).length > 0) {
                features.push(filteredFeature);
            }
        }
        else if (Object.keys(feature).length > 0) {
            features.push(feature);
        }
    });

    return features;
}

/**
 * Extracts features from a WFS GML response.
 *
 * @param {Document} parsedResponse - The parsed XML response from the WFS request.
 * @param {string|Array<string>|Object} attributes - The gfiAttributes configuration.
 *                                                   Can be "ignore", "showAll", Array of strings or Object.
 * @param {Array<string>} ignoredKeys - Keys to be ignored when using "showAll".
 * @param {Geometry} geometry - If given, features in GML are filtered by intersection with it.
 * @returns {Array<Object>} An array of extracted features.
 */
export function extractFeaturesFromWfsGml (parsedResponse, attributes, ignoredKeys, geometry) {
    if (attributes === "ignore") {
        return [];
    }

    let attributeList = [],
        shouldShowAll = false,
        isObjectConfig = false,
        featureMembers;

    if (attributes === "showAll" || !attributes) {
        shouldShowAll = true;
    }
    else if (Array.isArray(attributes)) {
        // Process arrays (including empty arrays) - only use string attributes
        attributeList = attributes.filter(attr => typeof attr === "string");
        // Empty arrays stay empty, don't treat as showAll
    }
    else if (typeof attributes === "object" && attributes !== null) {
        isObjectConfig = true;
        attributeList = Object.keys(attributes).map(key => ({
            name: key,
            alias: attributes[key]
        }));
    }

    featureMembers = parsedResponse.querySelectorAll("featureMember");

    const features = [],
        namespaceRegex = /(?:[a-zA-Z]+:)?(.+)/;

    if (featureMembers.length === 0) {
        featureMembers = parsedResponse.getElementsByTagName("featureMember");
    }
    if (featureMembers.length === 0) {
        featureMembers = parsedResponse.querySelectorAll("member");
    }
    if (featureMembers.length === 0) {
        featureMembers = parsedResponse.getElementsByTagName("member");
    }
    if (featureMembers.length === 0) {
        featureMembers = Array.from(parsedResponse.getElementsByTagName("*")).filter(el => el.localName === "featureMember" || el.tagName.endsWith(":featureMember") ||
            el.tagName === "gml:featureMember" || el.localName === "member" || el.tagName.endsWith(":member"));
    }

    if (featureMembers.length === 0) {
        return [];
    }

    featureMembers.forEach(member => {
        const featureNode = member.firstElementChild,
            feature = {};

        if (!featureNode || !featureIntersectsGeometry(member, geometry)) {
            return;
        }

        const multiElementCreatedAsArray = {};

        featureNode.querySelectorAll("*").forEach(attribute => {
            const localName = attribute.localName || attribute.tagName.match(namespaceRegex)?.[1];

            if (shouldShowAll) {
                // For showAll, include all attributes except ignoredKeys
                if (!isKeyIgnored(localName, ignoredKeys)) {
                    feature[localName] = attribute.textContent;
                }
            }
            else if ((isObjectConfig && attributeList.some(attr => attr.name === localName)) ||
                    (!isObjectConfig && attributeList.includes(localName))) {
                if (feature[localName]) {
                    if (multiElementCreatedAsArray[localName]) {
                        feature[localName].push(attribute.textContent);
                    }
                    else {
                        feature[localName] = [feature[localName], attribute.textContent];
                        multiElementCreatedAsArray[localName] = true;
                    }
                }
                else {
                    feature[localName] = attribute.textContent;
                }
            }
        });

        if (!shouldShowAll && attributeList.length > 0) {
            const featureResult = {};

            if (isObjectConfig) {
                // Object configuration with renaming
                attributeList.forEach(attr => {
                    if (feature[attr.name] !== undefined) {
                        featureResult[translateKeyIfPossible(attr.alias)] = feature[attr.name];
                    }
                });
            }
            else {
                // Array configuration without renaming
                attributeList.forEach(attrName => {
                    if (feature[attrName] !== undefined) {
                        featureResult[attrName] = feature[attrName];
                    }
                });
            }

            if (Object.keys(featureResult).length > 0) {
                features.push(featureResult);
            }
        }
        else if (!shouldShowAll && attributeList.length === 0) {
            // Empty array configuration - don't add any features
            // Do nothing - this effectively filters out all features
        }
        else if (shouldShowAll) {
            // For showAll, the feature already has ignoredKeys filtered out
            if (Object.keys(feature).length > 0) {
                features.push(feature);
            }
        }
        else {
            features.push(feature);
        }
    });

    return features;
}

/**
 * Shrinks a GeoJSON Polygon by a negative buffer value using JSTS.
 * @param {Object} polygonGeoJson - The GeoJSON Polygon geometry object.
 * @param {number} shrinkValue - The negative buffer value (e.g. -2 for shrinking by 2 units).
 * @returns {Object|null} The shrunken GeoJSON Polygon, or null if shrinking fails.
 */
export function shrinkPolygonGeoJson (polygonGeoJson, shrinkValue) {
    try {
        const reader = new GeoJSONReader(),
            writer = new GeoJSONWriter(),
            jstsGeom = reader.read(polygonGeoJson),
            shrunken = BufferOp.bufferOp(jstsGeom, shrinkValue);

        return writer.write(shrunken);
    }
    catch (e) {
        return null;
    }
}

/**
 * Helper function to determine buffer value based on area
 * @param {number} areaValue - The area to calculate buffer for
 * @returns {number} The buffer value
 */
export function getBufferValue (areaValue) {
    if (areaValue < 1000) {
        return -6;
    }
    if (areaValue < 10000) {
        return -8;
    }
    if (areaValue < 20000) {
        return -10;
    }
    return -15;
}

/**
 * Converts an EPSG code to a full CRS URL format
 * @param {string} epsgCode - The EPSG code (e.g. "EPSG:4326")
 * @returns {string} The full CRS URL
 */
export function getCrsUrl (epsgCode) {
    if (!epsgCode || !epsgCode.startsWith("EPSG:")) {
        return "http://www.opengis.net/def/crs/OGC/1.3/CRS84";
    }
    const code = epsgCode.split(":")[1];

    return `http://www.opengis.net/def/crs/EPSG/0/${code}`;
}

/**
 * Extracts features from an OAF JSON response.
 *
 * @param {Object} data - The JSON data from the OAF response.
 * @param {string|Array} attributes - The attributes configuration.
 *                                    Can be "ignore", "showAll", or Array of strings.
 * @param {Array<string>} ignoredKeys - Keys to be ignored when attributes is "showAll".
 * @param {(Geometry | null)} geometry - If given, features in GML are filtered by intersection with it.
 * @returns {Array} An array of feature objects.
 */
export function extractFeaturesFromOafJson (data, attributes, ignoredKeys, geometry) {
    try {
        if (attributes === "ignore") {
            return [];
        }

        if (!data || !data.features || !Array.isArray(data.features)) {
            console.error("Invalid OAF response format:", data);
            return [];
        }

        const shouldShowAll = attributes === "showAll" || !attributes,
            attributeList = Array.isArray(attributes) ? attributes.filter(attr => typeof attr === "string") : [];

        return data.features.filter(feature => featureIntersectsGeometry(feature, geometry)).map(feature => {
            const properties = feature.properties || {},
                result = {};

            if (shouldShowAll) {
                Object.keys(properties).forEach(key => {
                    if (!isKeyIgnored(key, ignoredKeys)) {
                        result[key] = properties[key];
                    }
                });
            }
            else if (attributeList.length > 0) {
                attributeList.forEach(attrName => {
                    result[attrName] = properties[attrName] !== undefined
                        ? properties[attrName]
                        : "";
                });
            }
            else {
                return result;
            }

            return result;
        });
    }
    catch (error) {
        console.error("Error extracting features from OAF response:", error);
        return [];
    }
}
