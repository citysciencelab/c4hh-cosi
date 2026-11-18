const crsAliases = {
    "EPSG:4326": [
        "urn:ogc:def:crs:EPSG:6.6:4326",
        "urn:ogc:def:crs:OGC:1.3:CRS84",
        "urn:ogc:def:crs:OGC:1.3:CRS:84",
        "urn:ogc:def:crs:OGC:2:84",
        "urn:x-ogc:def:crs:EPSG:4326"
    ],
    "EPSG:3857": [
        "EPSG:102100",
        "EPSG:102113",
        "EPSG:900913",
        "urn:ogc:def:crs:EPSG:6.18:3:3857"
    ]
};

/**
 * Maps alternative CRS notations (OGC URNs, legacy ESRI/Google codes) to the EPSG code known by proj4/OpenLayers.
 * @param {string} crsName The CRS name as found in the data, e.g. "urn:ogc:def:crs:OGC:1.3:CRS84".
 * @returns {string} The normalized EPSG code, or the unchanged input if no alias matches.
 */
export default function convertCrsToEpsg (crsName) {
    if (typeof crsName !== "string") {
        return crsName;
    }
    const upperCrs = crsName.toUpperCase();

    return Object.keys(crsAliases).find(epsg => crsAliases[epsg].some(alias => alias.toUpperCase() === upperCrs)
    ) ?? crsName;
}
