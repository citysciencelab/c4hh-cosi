/**
* Returns the geometry from row or feature. Automatically detects common geometry field names.
* @param {Array} results An array of OpenLayers features to be inspected.
* @param {Object} row Plain object with fields used to identify and match the feature.
* @returns {ol/geom/Geometry|null} The OpenLayers geometry or null if not found.
*/
export default function getGeometry (results, row) {
    if (!row || !results || !Array.isArray(results)) {
        return null;
    }

    const geometryFromRow = findGeometryInObject(row);

    if (geometryFromRow) {
        return geometryFromRow;
    }

    if (results.length > 0) {
        const matchingFeature = findMatchingFeature(results, row);

        if (matchingFeature) {
            if (typeof matchingFeature.getGeometry === "function") {
                return matchingFeature.getGeometry();
            }
        }
    }

    return null;
}

/**
 * Finds the OpenLayers feature that matches the row object by comparing field values.
 * @param {Array<ol/Feature>} features Array of OpenLayers features.
 * @param {Object} row Plain object with field values from the table.
 * @returns {ol/Feature|null} The matching feature or null.
 */
function findMatchingFeature (features, row) {
    const rowKeys = Object.keys(row).filter(key => key !== "geometry" &&
        key !== "geom" &&
        key !== "the_geom" &&
        key !== "wkb_geometry"
    );

    if (rowKeys.length === 0) {
        return null;
    }

    for (const feature of features) {
        if (!feature) {
            continue;
        }

        let matchCount = 0;

        for (const key of rowKeys) {
            const rowValue = row[key];
            let featureValue;

            if (typeof feature.get === "function") {
                featureValue = feature.get(key);
            }
            else if (feature.values_ && key in feature.values_) {
                featureValue = feature.values_[key];
            }
            else {
                featureValue = feature[key];
            }

            if (featureValue === rowValue) {
                matchCount++;
            }
        }

        if (matchCount === rowKeys.length) {
            return feature;
        }
    }

    return null;
}

/**
 * Finds geometry in a plain object by checking common geometry field names.
 * @param {Object} obj The object to search for geometry.
 * @returns {ol/geom/Geometry|null} The geometry object or null if not found.
 */
function findGeometryInObject (obj) {
    if (!obj || typeof obj !== "object") {
        return null;
    }

    const geometryFieldNames = [
        "geometry", "geom", "position", "shape",
        "the_geom", "wkb_geometry", "geometrie",
        "msGeometry", "gml_geometry", "location"
    ];

    for (const fieldName of geometryFieldNames) {
        const geom = obj[fieldName];

        if (geom && typeof geom === "object" && typeof geom.getExtent === "function") {
            return geom;
        }
    }

    return null;
}
