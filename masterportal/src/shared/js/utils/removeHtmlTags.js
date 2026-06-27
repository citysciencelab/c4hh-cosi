/**
 * Removes HTML tags from a string.
 * @param {string} str - The string from which to remove HTML tags.
 * @returns {string} - The string without HTML tags.
 */
export default function removeHtmlTags (str) {
    const tempDiv = document.createElement("div");

    tempDiv.innerHTML = str;

    return tempDiv.textContent || tempDiv.innerText || "";
}
