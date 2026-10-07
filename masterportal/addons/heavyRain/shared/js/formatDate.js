import dayjs from "dayjs";

/**
 * Formats the given date of the service for the display, e.g. "2026-09-28" to "28.09.2026".
 * Only the date part is used, as the service may add a time zone like "2026-09-28Z".
 * @param {String} value - The date in the format YYYY-MM-DD.
 * @param {String} [format="DD.MM.YYYY"] - The format for the display.
 * @returns {String} The formatted date or the given value, if it is no valid date.
 */
function formatDate (value, format = "DD.MM.YYYY") {
    const datePart = typeof value === "string" ? value.match(/^\d{4}-\d{2}-\d{2}/)?.[0] : undefined;

    if (!datePart || !dayjs(datePart).isValid()) {
        return value ?? "";
    }

    return dayjs(datePart).format(format);
}

export {formatDate};
