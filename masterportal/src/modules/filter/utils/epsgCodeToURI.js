/**
 * Converts an EPSG code to a CRS URI.
 * @param {string} epsgCode The EPSG code as a string, e.g. "EPSG:25832".
 * @returns {string} The CRS URI, e.g. "http://www.opengis.net/def/crs/EPSG/0/25832".
 */
export default function epsgCodeToURI (epsgCode) {
    switch (epsgCode) {
        case "EPSG:4326":
            return "http://www.opengis.net/def/crs/EPSG/0/4326";
        case "EPSG:3857":
            return "http://www.opengis.net/def/crs/EPSG/0/3857";
        case "EPSG:25832":
            return "http://www.opengis.net/def/crs/EPSG/0/25832";
        case "EPSG:31467":
            return "http://www.opengis.net/def/crs/EPSG/0/31467";
        case "EPSG:31468":
            return "http://www.opengis.net/def/crs/EPSG/0/31468";
        default:
            console.warn(`Unknown EPSG code: ${epsgCode}`);
            return "";
    }
}
