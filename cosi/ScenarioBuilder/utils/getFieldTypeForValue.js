import {MultiPolygon, Polygon, Point, MultiPoint} from "ol/geom";

/**
 * retrieves a field type from an example value
 * @param {*} value - the value to analyze
 * @returns {String} the field data type
 */
export default function getFieldTypeForValue (value) {
    if (Number.isInteger(parseFloat(value))) {
        return "integer";
    }
    if (!isNaN(parseFloat(value))) {
        return "float";
    }
    // if (value && [MultiPolygon, Polygon, MultiPoint, Point].includes(value.constructor)) {
    //     return value;
    // }
    if (value?.constructor === Point) {
        return "gml:PointPropertyType";
    }
    if (value?.constructor === MultiPoint) {
        return "gml:MultiPointPropertyType";
    }
    if (value?.constructor === Polygon) {
        return "gml:PolygontPropertyType";
    }
    if (value?.constructor === MultiPolygon) {
        return "gml:MultiPolygonPropertyType";
    }
    if ((/^(0?[1-9]|[12][0-9]|3[01])[/-](0?[1-9]|1[012])[/-]\d{4}$/).test(value)) {
        return "date";
    }
    if (value === null || value === undefined) {
        return "string";
    }
    return typeof value;
}
