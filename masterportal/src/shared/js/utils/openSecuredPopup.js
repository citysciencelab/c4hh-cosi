/**
 * Opens a new popup window with the specified URL, target, and specifications.
 * The popup's opener is set to null for security reasons.
 * @param {String} url The URL to open in the popup window.
 * @param {String} target The target attribute specifying where to open the popup window.
 * @param {String} specs Additional specifications for the popup window (e.g., size, position).
 * @returns {Window|null} The opened popup window, or null if it could not be opened.
 */
export function openSecuredPopup (url, target, specs) {
    const popup = window.open(url, target, specs);

    if (popup) {
        popup.opener = null;
    }
    return popup;
}
