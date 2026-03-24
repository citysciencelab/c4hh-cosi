import {getArea, getLength} from "ol/sphere.js";
import i18next from "i18next";

/**
 * Formats a number using the current i18next locale with fixed decimal places.
 * @param {Number} value - The number to format
 * @param {Number} decimals - Number of decimal places
 * @returns {String} Formatted number string with locale-appropriate separators
 */
export function formatMeasurementNumber (value, decimals) {
    const locale = i18next.language || "de";

    return value.toLocaleString(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * Calculates lengths and deviations of a line array.
 * @param {String} projection EPSG projection code
 * @param {module:ol/geom/LineString[]} lines lines to calculate length of
 * @param {Number} radius earth radius to assume for calculation
 * @param {String} accuracy accuracy of the measurement result
 * @param {String} selectedLineStringUnit index of unit as string
 * @param {String} selectedGeometry th selected geometry
 * @param {String[]} lineStringUnits list of supported units
 * @return {MeasureCalculation[]} calculated value for display, if value is 0, return without unit
 */
export function calculateLineLengths (projection, lines, radius, accuracy, selectedLineStringUnit, selectedGeometry, lineStringUnits) {
    if (selectedGeometry === "LineString") {
        return Object.keys(lines).reduce((accumulator, lineKey) => {
            const line = lines[lineKey],
                length = getLength(line.getGeometry(), {projection, radius}),
                measurementAccuracy = accuracy,
                selectedUnitName = lineStringUnits[selectedLineStringUnit];

            if (length.toFixed(0) === "0") {
                accumulator[lineKey] = "0";
            }
            else if (selectedUnitName === "m") {
                accumulator[lineKey] = measurementAccuracy === "decimeter" || (measurementAccuracy === "dynamic" && length < 10)
                    ? `${formatMeasurementNumber(length, 1)} m`
                    : `${formatMeasurementNumber(length, 0)} m`;
            }
            else if (selectedUnitName === "km") {
                accumulator[lineKey] = `${formatMeasurementNumber(length / 1000, 1)} km`;
            }
            else if (selectedUnitName === "nm") {
                // see https://en.wikipedia.org/wiki/Nautical_mile
                const metresPerNm = 1852,
                    unitLength = length / metresPerNm;

                accumulator[lineKey] = measurementAccuracy === "decimeter" || (measurementAccuracy === "dynamic" && unitLength < 10)
                    ? `${formatMeasurementNumber(unitLength, 1)} nm`
                    : `${formatMeasurementNumber(unitLength, 0)} nm`;
            }

            return accumulator;
        }, {});
    }
    return {};

}

/**
 * Calculates lengths and deviations of a line array.
 * @param {String} projection EPSG projection code
 * @param {module:ol/geom/Polygon[]} polygons polygons to area of
 * @param {Number} radius earth radius to assume for calculation
 * @param {String} accuracy accuracy of the measurement result
 * @param {String} selectedPolygonUnit  index of unit as number
 * @param {String} selectedGeometry the selected geometry
 * @param {String[]} polygonUnits list of supported units
 * @return {MeasureCalculation[]} calculated value for display, if value is 0, return without unit
 */
export function calculatePolygonAreas (projection, polygons, radius, accuracy, selectedPolygonUnit, selectedGeometry, polygonUnits) {
    if (selectedGeometry === "Polygon") {
        return Object.keys(polygons).reduce((accumulator, polygonKey) => {
            const polygon = polygons[polygonKey],
                area = getArea(polygon.getGeometry(), {projection, radius}),
                measurementAccuracy = accuracy,
                selectedUnitName = polygonUnits[selectedPolygonUnit];

            if (area.toFixed(0) === "0") {
                accumulator[polygonKey] = "0";
            }
            else if (selectedUnitName === "m²") {
                accumulator[polygonKey] = measurementAccuracy === "decimeter" || (measurementAccuracy === "dynamic" && area < 10)
                    ? `${formatMeasurementNumber(area, 1)} m²`
                    : `${formatMeasurementNumber(area, 0)} m²`;
            }
            else if (selectedUnitName === "ha") {
                const unitArea = area / 10000;

                accumulator[polygonKey] = measurementAccuracy === "decimeter" || (measurementAccuracy === "dynamic" && unitArea < 10)
                    ? `${formatMeasurementNumber(unitArea, 1)} ha`
                    : `${formatMeasurementNumber(unitArea, 0)} ha`;
            }
            else if (selectedUnitName === "km²") {
                accumulator[polygonKey] = `${formatMeasurementNumber(area / 1000000, 1)} km²`;
            }

            return accumulator;
        }, {});
    }
    return {};
}
