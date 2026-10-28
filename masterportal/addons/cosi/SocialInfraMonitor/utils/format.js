/**
 * Number formatting and symbol scales for the prototype.
 */

/**
 * Radius whose circle AREA is proportional to the value — the only honest way
 * to size map symbols by amount (a linear radius makes 2x money look 4x big).
 * @param {Number} value - The value.
 * @param {Number} maxValue - The value that gets maxRadius.
 * @param {Number} maxRadius - Radius in px for maxValue.
 * @param {Number} [minRadius=0] - Lower bound so small values stay clickable.
 * @returns {Number} The radius in px.
 */
export function areaRadius (value, maxValue, maxRadius, minRadius = 0) {
    if (!(value > 0) || !(maxValue > 0)) {
        return minRadius;
    }
    return Math.max(minRadius, maxRadius * Math.sqrt(Math.min(value, maxValue) / maxValue));
}

/**
 * Rounds down to a "nice" number: 1, 2, 2.5 or 5 times a power of ten.
 * @param {Number} value - A positive value.
 * @returns {Number} The nice number, 0 for non-positive input.
 */
export function niceFloor (value) {
    if (!(value > 0)) {
        return 0;
    }
    const power = 10 ** Math.floor(Math.log10(value)),
        steps = [1, 2, 2.5, 5, 10];
    let nice = power;

    steps.forEach(step => {
        if (step * power <= value) {
            nice = step * power;
        }
    });
    return nice;
}

/**
 * Three reference values for a nested-circle size legend: the largest nice
 * value below the maximum, and roughly a half and a tenth of it.
 * @param {Number} maxValue - The largest value on the map.
 * @returns {Number[]} Ascending legend values, without duplicates or zeros.
 */
export function legendValues (maxValue) {
    const top = niceFloor(maxValue);

    return [...new Set([niceFloor(top / 10), niceFloor(top / 2), top])].filter(value => value > 0);
}

/**
 * Euro amounts the way German planning documents write them.
 * @param {Number} value - Amount in euro.
 * @param {Boolean} [compact=true] - Abbreviate thousands and millions.
 * @returns {String} e.g. "1,22 Mio. €", "646 Tsd. €", "12,40 €".
 */
export function formatEuro (value, compact = true) {
    if (typeof value !== "number" || Number.isNaN(value)) {
        return "–";
    }
    const abs = Math.abs(value);

    if (compact && abs >= 1e6) {
        return `${(value / 1e6).toLocaleString("de-DE", {maximumFractionDigits: 2})} Mio. €`;
    }
    if (compact && abs >= 1e4) {
        return `${Math.round(value / 1e3).toLocaleString("de-DE")} Tsd. €`;
    }
    if (abs < 100) {
        return `${value.toLocaleString("de-DE", {minimumFractionDigits: 2, maximumFractionDigits: 2})} €`;
    }
    return `${Math.round(value).toLocaleString("de-DE")} €`;
}

/**
 * Integer with German thousands separators.
 * @param {Number} value - The number.
 * @returns {String} e.g. "2.620".
 */
export function formatNumber (value) {
    return typeof value === "number" && !Number.isNaN(value) ? Math.round(value).toLocaleString("de-DE") : "–";
}

/**
 * Funding per single visit, assuming the weekly visits hold all year.
 * @param {Number} euroPerYear - Annual funding.
 * @param {Number} visitsPerWeek - Average weekly visits.
 * @returns {Number|null} Euro per visit, null without visits.
 */
export function euroPerVisit (euroPerYear, visitsPerWeek) {
    return visitsPerWeek > 0 ? euroPerYear / (visitsPerWeek * 52) : null;
}
