import {getCenter} from "ol/extent";
import GeoJSONReader from "jsts/org/locationtech/jts/io/GeoJSONReader.js";
import {BufferOp} from "jsts/org/locationtech/jts/operation/buffer";
import GeoJSONWriter from "jsts/org/locationtech/jts/io/GeoJSONWriter.js";
import {translateKeyIfPossible} from "./translationUtils.js";

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
 * @param {string|Object|Array} gfiAttributes - The gfiAttributes configuration like in layer configuration.
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
    else if (Array.isArray(gfiAttributes)) {
        // For array configuration (including empty arrays), use only string attributes
        keysToInclude = gfiAttributes.filter(attr => typeof attr === "string");
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
            else if (Array.isArray(gfiAttributes)) {
                const filteredFeature = {};

                gfiAttributes.forEach(attr => {
                    // Only process string attributes, ignore objects with alias
                    if (typeof attr === "string") {
                        if (feature[attr] !== undefined) {
                            filteredFeature[attr] = feature[attr];
                        }
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
 * @param {Array} attributes - The list of attributes to extract from the features.
 *                            Each attribute should be a string.
 * @param {Array<string>} ignoredKeys - Keys to be ignored when no specific attributes are defined.
 * @returns {Array<Object>} An array of extracted features.
 */
export function extractFeaturesFromWmsGml (parsedResponse, attributes, ignoredKeys) {
    const featureMembers = parsedResponse.querySelectorAll("gml\\:featureMember, featureMember"),
        features = [],
        namespaceRegex = /(?:[a-zA-Z]+:)?(.+)/;

    featureMembers.forEach(member => {
        const featureNode = member.firstElementChild,
            feature = {};

        if (!featureNode) {
            return;
        }
        featureNode.querySelectorAll("*").forEach(attribute => {
            const localName = attribute.localName || attribute.tagName.match(namespaceRegex)?.[1];

            if (!attributes || attributes.length === 0) {
                // When no attributes specified, include all except ignoredKeys
                if (!isKeyIgnored(localName, ignoredKeys)) {
                    feature[localName] = attribute.textContent;
                }
            }
            else if (attributes.some(attrDef => typeof attrDef === "string" && attrDef === localName)) {
                feature[localName] = attribute.textContent;
            }
        });

        if (attributes && attributes.length > 0) {
            const filteredFeature = {};

            attributes.forEach(attrDef => {
                if (typeof attrDef === "string" && feature[attrDef] !== undefined) {
                    filteredFeature[attrDef] = feature[attrDef];
                }
            });

            if (Object.keys(filteredFeature).length > 0) {
                features.push(filteredFeature);
            }
        }
        else {
            features.push(feature);
        }
    });
    return features;
}

/**
 * Extracts features from an ESRI WMS response.
 *
 * @param {Document} parsedResponse - The parsed XML response from the ESRI WMS.
 * @param {Array} attributes - The list of attributes to extract from the response.
 *                            Each attribute should be a string.
 * @param {Array<string>} ignoredKeys - Keys to be ignored when no specific attributes are defined.
 * @returns {Array<Object>} An array of feature objects extracted from the response.
 */
export function extractFeaturesFromEsriWms (parsedResponse, attributes, ignoredKeys) {
    const features = [],
        fieldElements = parsedResponse.querySelectorAll("FIELDS");

    fieldElements.forEach(fieldElement => {
        const feature = {};

        Array.from(fieldElement.attributes).forEach(attr => {
            const attrName = attr.name,
                attrValue = attr.value;

            if (!attributes || attributes.length === 0) {
                // When no attributes specified, include all except ignoredKeys
                if (!isKeyIgnored(attrName, ignoredKeys)) {
                    feature[attrName] = attrValue;
                }
            }
            else if (attributes.some(attrDef => typeof attrDef === "string" && attrDef === attrName)) {
                feature[attrName] = attrValue;
            }
        });

        if (attributes && attributes.length > 0) {
            const filteredFeature = {};

            attributes.forEach(attrDef => {
                if (typeof attrDef === "string" && feature[attrDef] !== undefined) {
                    filteredFeature[attrDef] = feature[attrDef];
                }
            });

            if (Object.keys(filteredFeature).length > 0) {
                features.push(filteredFeature);
            }
        }
        else {
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
 * @returns {Array<Object>} An array of extracted features.
 */
export function extractFeaturesFromWfsGml (parsedResponse, attributes, ignoredKeys) {
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

        if (!featureNode) {
            return;
        }

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
                feature[localName] = attribute.textContent;
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
 * @param {Array} attributes - The attributes to extract (strings only).
 * @param {Array<string>} ignoredKeys - Keys to be ignored when no specific attributes are defined.
 * @returns {Array} An array of feature objects.
 */
export function extractFeaturesFromOafJson (data, attributes, ignoredKeys) {
    try {
        if (!data || !data.features || !Array.isArray(data.features)) {
            console.error("Invalid OAF response format:", data);
            return [];
        }

        return data.features.map(feature => {
            const properties = feature.properties || {},
                result = {};

            if (!attributes || attributes.length === 0) {
                // When no attributes specified, include all except ignoredKeys
                Object.keys(properties).forEach(key => {
                    if (!isKeyIgnored(key, ignoredKeys)) {
                        result[key] = properties[key];
                    }
                });
                return result;
            }

            attributes.forEach(attr => {
                // Only process string attributes
                if (typeof attr === "string") {
                    result[attr] = properties[attr] !== undefined ?
                        properties[attr] : "";
                }
            });

            return result;
        });
    }
    catch (error) {
        console.error("Error extracting features from OAF response:", error);
        return [];
    }
}
