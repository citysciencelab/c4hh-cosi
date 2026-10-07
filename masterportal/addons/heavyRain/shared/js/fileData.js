/**
 * File extensions by the mime types of the files which can be uploaded.
 * It is used to name a downloaded file, as the name of the file is not saved in the service.
 */
const extensionsByMimeType = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "application/vnd.oasis.opendocument.text": "odt",
    "application/vnd.oasis.opendocument.spreadsheet": "ods",
    "application/vnd.oasis.opendocument.presentation": "odp",
    "text/plain": "txt",
    "text/csv": "csv",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp"
};

/**
 * Gets the link of a file saved as base64 in the service, so that it can be downloaded.
 * A file uploaded in the portal is saved as data url, e.g. "data:application/pdf;base64,JVBERi0...".
 * A file saved as plain base64 by other systems gets a generic data url prefix.
 * @param {String} value - The saved file.
 * @returns {String|undefined} The link of the file or undefined, if there is no file.
 */
function toFileHref (value) {
    if (typeof value !== "string" || value.trim() === "") {
        return undefined;
    }

    const file = value.trim();

    return file.startsWith("data:") ? file : `data:application/octet-stream;base64,${file}`;
}

/**
 * Gets the name of a downloaded file.
 * The name of the uploaded file is used, if it is known. Otherwise the name is created from the given name
 * and the extension of the mime type of the file, as the name of the file is not saved in the service.
 * @param {String} value - The saved file as data url.
 * @param {String} [fileName] - The name of the uploaded file.
 * @param {String} [fallbackName="Datei"] - The name used, if the name of the file is not known, e.g. the name of the project.
 * @returns {String} The name of the file.
 */
function getDownloadFileName (value, fileName, fallbackName) {
    if (typeof fileName === "string" && fileName.trim() !== "") {
        return fileName.trim();
    }

    const mimeType = toFileHref(value)?.match(/^data:([^;,]+)/)?.[1],
        extension = extensionsByMimeType[mimeType],
        name = typeof fallbackName === "string" && fallbackName.trim() !== "" ? fallbackName.trim() : "Datei";

    return extension ? `${name}.${extension}` : name;
}

/**
 * Checks if the given file has one of the allowed extensions.
 * The extension is checked, as the file dialog only suggests the allowed files and a dropped file is not filtered at all.
 * @param {File} file - The uploaded file.
 * @param {String[]} allowedExtensions - The allowed extensions without a dot, e.g. ["pdf", "docx"].
 * @returns {Boolean} True, if the file has an allowed extension.
 */
function hasAllowedExtension (file, allowedExtensions) {
    const extension = typeof file?.name === "string" && file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "";

    return Array.isArray(allowedExtensions) && allowedExtensions.includes(extension);
}

export {getDownloadFileName, hasAllowedExtension, toFileHref};
