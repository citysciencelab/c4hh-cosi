/**
 * Escapes special XML characters in a string.
 * @param {String} value The string to escape.
 * @returns {String} The escaped string.
 */
export default function escapeXml (value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;")
        .replace(/[^\x00-\x7F]/g, (char) => `&#x${char.codePointAt(0).toString(16)};`);
}
