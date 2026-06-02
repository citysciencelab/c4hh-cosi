/**
 * Sanitizes a filename for safe ZIP entry paths.
 * @param {String} originalName - The original filename.
 * @returns {String} A sanitized filename.
 */
export function sanitizeFileName (originalName) {
    const fallback = "unnamed.bin";

    if (typeof originalName !== "string") {
        return fallback;
    }

    const sanitizedName = originalName
        .replace(/[\\/:*?"<>|\u0000-\u001F]/g, "_")
        .trim();

    return sanitizedName || fallback;
}

const actions = {
    /**
     * Creates a new image id, generates its preview ObjectURL and stores both directly in module state.
     * @param {Object} context - The Vuex action context.
     * @param {Object} context.state - The Vuex module state.
     * @param {Blob} blob - The image Blob.
     * @returns {String} The generated image id.
     */
    addImageAsset ({state}, blob) {
        const id = crypto.randomUUID(),
            objectURL = URL.createObjectURL(blob),
            originalName = typeof blob?.name === "string" && blob.name.trim() !== "" ? blob.name : `${id}.bin`,
            sanitizedOriginalName = sanitizeFileName(originalName),
            archivePath = `images/${id}__${sanitizedOriginalName}`;

        state.imageAssetsById[id] = {
            blob,
            objectURL,
            mimeType: blob.type || "application/octet-stream",
            originalName,
            archivePath
        };

        return id;
    }
};

export default actions;
