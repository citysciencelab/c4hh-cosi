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

export {
    convertToLocalDateLiteral
};
