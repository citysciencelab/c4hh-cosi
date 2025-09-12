import dayjs from "dayjs";

/**
 * Converts an ISO date string to "DD.MM.YYYY HH:MM" format.
 * @param {string} dateStr The ISO date string to convert
 * @return {string} The formatted date string
 */
function formatDateTime (dateString, dateFormat = "DD.MM.YYYY HH:mm") {
    if (!dateString) {
        return "";
    }

    return dayjs(dateString).format(dateFormat);
}

export {formatDateTime};
