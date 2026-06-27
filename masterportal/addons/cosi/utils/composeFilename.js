/**
 * Composes a filename from a given name and the current date
 * @param {String} filename - the raw filename
 * @returns {String} the filename
 */
export default function composeFilename (filename) {
    const date = new Date().toLocaleDateString("de-DE", {year: "numeric", month: "numeric", day: "numeric"});

    return `${filename}_${date}`;
}
