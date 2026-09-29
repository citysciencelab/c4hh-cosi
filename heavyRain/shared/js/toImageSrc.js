/**
 * Gets the source of an image saved as base64 in the service, so that it can be shown in an img tag.
 * An image uploaded in the portal is saved as data url, e.g. "data:image/png;base64,iVBOR...".
 * An image saved as plain base64 by other systems gets a generic data url prefix.
 * @param {String} value - The saved image.
 * @returns {String} The source of the image or an empty string, if there is no image.
 */
function toImageSrc (value) {
    if (typeof value !== "string" || value.trim() === "") {
        return "";
    }

    const image = value.trim();

    return image.startsWith("data:") ? image : `data:image/*;base64,${image}`;
}

export {toImageSrc};
