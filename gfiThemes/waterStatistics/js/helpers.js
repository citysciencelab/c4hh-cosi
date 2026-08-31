/**
 * Converts a date to a local date literal in format YYYY-MM-DD.
 * @param {Date} date - The date object to convert.
 * @returns {string} The date in YYYY-MM-DD format.
 */
function convertToLocalDateLiteral (date) {
    const y = date.getFullYear(),
        m = String(date.getMonth() + 1).padStart(2, "0"),
        day = String(date.getDate()).padStart(2, "0");

    return y + "-" + m + "-" + day;
}

/**
 * Guards a CSV field value against Excel's locale-based auto reformatting
 * (date auto-detection, and "." being misread as a thousands separator)
 * by wrapping any numeric-looking value in a text-forcing formula.
 *
 * @param {*} value The raw property value.
 * @returns {*} The original value, or an Excel text-literal formula if it looks numeric.
 */
function guardAgainstExcelDateAutoFormat (value) {
    const NUMERIC_LIKE_PATTERN = /^-?\d+(\.\d+)?$/;

    if (typeof value === "number" || (typeof value === "string" && NUMERIC_LIKE_PATTERN.test(value.trim()))) {
        return String(value).replace(".", ",");
    }
    return value;
}

/**
 * Pads a number with leading zeros to ensure it is at least two digits long.
 * @param {*} n - The number to pad.
 * @returns {string} The padded number as a string.
 */
function pad (n) {
    return String(n).padStart(2, "0");
}

/**
 * Generates a filename based on the current date and time.
 * @returns {string} A filename in the format YYYYMMDDHHmmss.
 */
function getFilenameByDate () {
    const now = new Date(),
        filename = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    return filename;
}

export {
    convertToLocalDateLiteral,
    guardAgainstExcelDateAutoFormat,
    pad,
    getFilenameByDate
};
