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
 * Extracts all unique keys from an array of result objects, excluding ignored keys.
 *
 * @param {Array<Object>} results - An array of result objects.
 * @param {Array<string>} attributes - The list of attributes to include. If empty, all keys except ignoredKeys are used.
 * @param {Array<string>} ignoredKeys - Keys to be ignored (excluded from output).
 * @returns {Array<Object>} An array of column objects with name and index.
 */
export function extractColumnsFromResults (results, attributes, ignoredKeys) {
    const allKeys = results
            .filter(result => result)
            .reduce((acc, result) => {
                Object.keys(result || {}).forEach(key => {
                    if (!acc.includes(key)) {
                        acc.push(key);
                    }
                });
                return acc;
            }, []),
        filteredKeys = Array.isArray(ignoredKeys) && ignoredKeys.length > 0
            ? allKeys.filter(key => !isKeyIgnored(key, ignoredKeys))
            : allKeys,
        keysToInclude = attributes && attributes.length ? attributes : filteredKeys;

    return keysToInclude.map((key, index) => ({name: key, index}));
}

/**
 * Extracts and filters rows from the given results based on specified attributes, excluding ignored keys.
 *
 * @param {Array<Object>} results - The array of result objects to be filtered.
 * @param {Array<string|Object>} attributes - The array of attribute specifications (either strings or {name, alias} objects). If empty, all keys except ignoredKeys are used.
 * @param {Array<string>} ignoredKeys - Keys to be ignored (excluded from output).
 * @returns {Array<Object>} - The filtered array of result objects.
 */
export function extractRowsFromResults (results, attributes, ignoredKeys) {
    return results
        .filter(result => result)
        .map(feature => {
            if (!attributes || attributes.length === 0) {
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
            const filteredFeature = {};

            attributes.forEach(attr => {
                const originalName = typeof attr === "object" ? attr.name : attr,
                    displayName = typeof attr === "object" && attr.alias ? translateKeyIfPossible(attr.alias) : originalName;

                let value = "";

                if (feature[originalName] !== undefined) {
                    value = feature[originalName];
                }
                else if (feature[displayName] !== undefined) {
                    value = feature[displayName];
                }

                if (!Array.isArray(ignoredKeys) || !isKeyIgnored(originalName, ignoredKeys)) {
                    filteredFeature[displayName] = value;
                }
            });

            return filteredFeature;
        });
}

/**
 * Extracts features from a WMS GML response.
 *
 * @param {Document} parsedResponse - The parsed XML response from the WMS request.
 * @param {Array} attributes - The list of attributes to extract from the features.
 *                            Each attribute can be a string or an object with name and alias properties.
 * @returns {Array<Object>} An array of extracted features with aliased attribute names.
 */
export function extractFeaturesFromWmsGml (parsedResponse, attributes) {
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

            if (!attributes || attributes.length === 0 || attributes.some(attrDef => typeof attrDef === "string" ? attrDef === localName : attrDef.name === localName)) {
                feature[localName] = attribute.textContent;
            }
        });

        if (attributes && attributes.length > 0) {
            const featureWithAliases = {};

            attributes.forEach(attrDef => {
                if (typeof attrDef === "object" && attrDef.name && attrDef.alias) {
                    if (feature[attrDef.name] !== undefined) {
                        featureWithAliases[translateKeyIfPossible(attrDef.alias)] = feature[attrDef.name];
                    }
                }
                else if (typeof attrDef === "string") {
                    if (feature[attrDef] !== undefined) {
                        featureWithAliases[attrDef] = feature[attrDef];
                    }
                }
            });

            if (Object.keys(featureWithAliases).length > 0) {
                features.push(featureWithAliases);
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
 *                            Each attribute can be a string or an object with name and alias properties.
 * @returns {Array<Object>} An array of feature objects extracted from the response with aliased attribute names.
 */
export function extractFeaturesFromEsriWms (parsedResponse, attributes) {
    const features = [],
        fieldElements = parsedResponse.querySelectorAll("FIELDS");

    fieldElements.forEach(fieldElement => {
        const feature = {};

        Array.from(fieldElement.attributes).forEach(attr => {
            const attrName = attr.name,
                attrValue = attr.value;

            if (!attributes || attributes.length === 0 || attributes.some(attrDef => typeof attrDef === "string" ? attrDef === attrName : attrDef.name === attrName)) {
                feature[attrName] = attrValue;
            }
        });

        if (attributes && attributes.length > 0) {
            const featureWithAliases = {};

            attributes.forEach(attrDef => {
                if (typeof attrDef === "object" && attrDef.name && attrDef.alias) {
                    if (feature[attrDef.name] !== undefined) {
                        featureWithAliases[translateKeyIfPossible(attrDef.alias)] = feature[attrDef.name];
                    }
                }
                else if (typeof attrDef === "string") {
                    if (feature[attrDef] !== undefined) {
                        featureWithAliases[attrDef] = feature[attrDef];
                    }
                }
            });

            if (Object.keys(featureWithAliases).length > 0) {
                features.push(featureWithAliases);
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
 * @param {Array<string>} attributes - The list of attributes to extract from the features.
 * @returns {Array<Object>} An array of extracted features.
 */
export function extractFeaturesFromWfsGml (parsedResponse, attributes) {
    const featureMembers = parsedResponse.querySelectorAll("[gml\\:featureMember], member, wfs\\:member"),
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

            if (!attributes || attributes.length === 0 || attributes.some(attr => typeof attr === "string" ? attr === localName : attr.name === localName
            )) {
                feature[localName] = attribute.textContent;
            }
        });

        if (attributes && attributes.length > 0) {
            const featureWithAliases = {};

            attributes.forEach(attr => {
                if (typeof attr === "object" && attr.name && attr.alias) {
                    if (feature[attr.name] !== undefined) {
                        featureWithAliases[translateKeyIfPossible(attr.alias)] = feature[attr.name];
                    }
                }
                else if (typeof attr === "string") {
                    if (feature[attr] !== undefined) {
                        featureWithAliases[attr] = feature[attr];
                    }
                }
            });

            if (Object.keys(featureWithAliases).length > 0) {
                features.push(featureWithAliases);
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
 * @param {Array} attributes - The attributes to extract.
 * @returns {Array} An array of feature objects.
 */
export function extractFeaturesFromOafJson (data, attributes) {
    try {
        if (!data || !data.features || !Array.isArray(data.features)) {
            console.error("Invalid OAF response format:", data);
            return [];
        }

        return data.features.map(feature => {
            const properties = feature.properties || {},
                result = {};

            if (!attributes || attributes.length === 0) {
                return {...properties};
            }

            attributes.forEach(attr => {
                const originalName = typeof attr === "object" ? attr.name : attr,
                    displayName = typeof attr === "object" && attr.alias ? translateKeyIfPossible(attr.alias) : originalName;

                result[displayName] = properties[originalName] !== undefined ?
                    properties[originalName] : "";
            });

            return result;
        });
    }
    catch (error) {
        console.error("Error extracting features from OAF response:", error);
        return [];
    }
}
