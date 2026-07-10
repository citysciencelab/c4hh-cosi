import {buildEndpointUrl} from "./buildEndpointUrl";

const ALREADY_COMPRESSED = [
    "zip", "gz", "png", "jpg", "jpeg", "jp2", "pdf", "doc", "docx", "ppt", "pptx",
    "xls", "xlsx", "heic", "heif", "7z", "bz2", "rar", "gif", "webp", "webm",
    "mp4", "mov", "mp3", "aifc"
];

/**
 * Trigger a browser download for the provided Blob by creating a temporary object URL
 * and clicking an invisible anchor element. The object URL is revoked shortly after
 * the click to free resources.
 *
 * @param {Blob} blob - The binary data to save. set to null, if you plan to download directly from an url
 * @param {string} url - Create downloadlink to directly download from this url. Ignored if 'blob' is set.
 * @param {string} filename - Suggested filename for the download dialog.
 * @returns {void}
 */
function saveAs (blob, url, filename) {
    const downloadUrl = blob ? window.URL.createObjectURL(blob) : url;
    const a = document.createElement("a");

    a.style.display = "none";
    a.href = downloadUrl;
    a.download = filename || "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (blob) {
        setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
    }
}

/**
 * Fetch a resource as binary while reporting incremental download progress.
 *
 * Reads the response stream and calls onProgress(loadedBytes) for each chunk.
 * The returned Promise resolves to a Uint8Array containing the whole response body.
 * Throws if the HTTP response status is not OK.
 *
 * @param {string} url - The resource URL to fetch.
 * @param {(loaded: number) => void} onProgress - Callback receiving the number of bytes loaded so far.
 * @param {AbortSignal} signal - AbortSignal to cancel the request if needed. * @returns {Promise<Uint8Array>} Promise that resolves with the downloaded bytes.
 * @throws {Error} If the fetch response is not ok.
 */
async function fetchWithProgress (url, onProgress, signal) {
    const fetchOptions = {credentials: "same-origin"};

    if (signal !== undefined) {
        fetchOptions.signal = signal;
    }
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const chunks = [];
    let loaded = 0;

    while (true) {
        const {done, value} = await reader.read();

        if (done) {
            break;
        }
        chunks.push(value);
        loaded += value.length;
        onProgress(loaded);
    }
    const total = chunks.reduce((s, c) => s + c.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;

    for (const c of chunks) {
        out.set(c, offset);
        offset += c.length;
    }

    return out;
}

/**
 * Recursively set a value on a nested object using an array of path segments.
 *
 * Creates intermediate plain objects as needed and assigns the provided value
 * at the location described by parts. The final leaf is stored as an array
 * [value, { level }] where level is determined from the file extension
 * (non-compressed -> 6, already compressed -> 0).
 *
 * Keys that may lead to prototype pollution ("__proto__", "constructor", "prototype")
 * or falsy/empty keys are ignored.
 *
 * Example:
 *   setNested(obj, ['archiveName', 'jahrgang', 'file.txt'], Uint8Array)
 * results in:
 *   { archiveName: { jahrgang: { 'file.txt': [Uint8Array, { level: 6 }] } } }
 *
 * @param {Object} obj - Root object to modify (mutated in place).
 * @param {string[]} parts - Array of path segments (folders and final filename).
 * @param {*} value - Value to assign at the nested location (e.g. Uint8Array).
 * @returns {void}
 */
function setNested (obj, parts, value) {
    const [head, ...rest] = parts;

    if (!head || head === "__proto__" || head === "constructor" || head === "prototype") {
        return;
    }

    if (!rest.length) {
        const ext = head.slice(head.lastIndexOf(".") + 1).toLowerCase();

        obj[head] = [value, {
            level: ALREADY_COMPRESSED.indexOf(ext) === -1 ? 6 : 0
        }];
        return;
    }

    obj[head] = obj[head] || Object.create(null);
    setNested(obj[head], rest, value);
}

/**
 * Calculate a progress value between start and end based on the ratio of value to total.
 *
 * @param {Object} props - Properties for progress calculation.
 * @param {number} props.value - Current progress value (e.g. bytes downloaded).
 * @param {number} props.total - Total value corresponding to 100% progress (e.g. total bytes).
 * @param {number} props.start - Starting progress value (e.g. 0 or previous phase end).
 * @param {number} props.end - Ending progress value (e.g. phase end or 100%).
 * @returns {number} Calculated progress value between start and end.
 */
function calcProgress (props) {
    const {value, total, start, end} = props;

    if (!total) {
        return start;
    }
    const ratio = Math.max(0, Math.min(1, value / total));

    return start + Math.floor(ratio * (end - start));
}

/**
 * Build a file information object used for archive creation and downloads.
 *
 * Creates a sanitized filename (replaces back/forward slashes), builds a download URL
 * using buildEndpointUrl(filePath, { Token: token }), coerces fileSize to a Number,
 * and returns an object containing pathParts, url, size and archiveId.
 *
 * @param {string} fileName - Original file name; falls back to "file" if falsy.
 * @param {string} filePath - Server path or endpoint used to build the download URL.
 * @param {string|number} fileSize - File size in bytes (string or number); will be coerced to Number.
 * @param {string|number} archiveId - Identifier for the containing archive.
 * @param {string} archiveName - Archive folder name to include as the first path part.
 * @param {string|number} year - Year (or folder) to include as the second path part.
 * @param {string} token - Access token appended to the built URL as the Token query parameter.
 * @returns {{pathParts: string[], url: string, size: number, archiveId: (string|number)}} File info object.
 */
function buildFileInformationObject (fileName, filePath, fileSize, archiveId, archiveName, year, token) {
    const safeFilename = (fileName || "file").replace(/[\\/]/g, "_"),
        url = buildEndpointUrl(filePath, {Token: token}),
        size = Number(fileSize) || 0;

    return {
        pathParts: [archiveName, year, safeFilename],
        url: url,
        size: size,
        archiveId: archiveId
    };
}

/**
 * Convert a file size given in bytes to a compact human-readable string using
 * kB, MB or GB.
 *
 * Selection rules:
 * - Chooses the largest unit among kB, MB, GB that yields a value >= 1.
 * - Outputs no decimals for integer values, otherwise exactly two decimals.
 * - Uses a comma as decimal separator (e.g. "213,35 MB").
 *
 * @param {number|string} fileSizeByte - File size in bytes (number or numeric string).
 * @returns {string} Formatted size with unit, e.g. "500 MB" or "213,35 MB".
 */
function getHumanReadableFileSize (fileSizeByte) {
    const bytes = Number(fileSizeByte) || 0;

    if (bytes <= 0) {
        return "0 kB";
    }

    const kB = 1e3;
    const MB = 1e6;
    const GB = 1e9;

    let value, unit;

    if (bytes >= GB) {
        value = bytes / GB;
        unit = "GB";
    }
    else if (bytes >= MB) {
        value = bytes / MB;
        unit = "MB";
    }
    else {
        value = bytes / kB;
        unit = "kB";
    }

    return roundFileSizeToFixed(value) + " " + unit;
}

/**
 * Format a numeric file-size value to a localized string with up to two decimals.
 *
 * - Coerces fileSize (number or numeric string) to Number; NaN -> 0.
 * - Rounds the input to two decimal places.
 * - If fixed2 is true, always returns two decimals (e.g. 2 -> "2.00" / "2,00").
 * - If fixed2 is false, omits the decimal part for integer results (e.g. 2 -> "2").
 * - Uses a comma as decimal separator for German locale (i18next.language === "de"),
 *   otherwise uses a dot.
 *
 * @param {number|string} fileSize - File size (number or numeric string).
 * @param {boolean} [fixed2=false] - When true, always format with two decimal places.
 * @returns {string} Localized formatted number as a string (unit not included).
 */
function roundFileSizeToFixed (fileSize, fixed2 = false) {
    const numericFileSize = typeof fileSize === "boolean" ? 0 : Number(fileSize) || 0,
        rounded = Math.round(numericFileSize * 100) / 100,
        str = fixed2 || rounded % 1 !== 0 ? rounded.toFixed(2) : String(rounded),
        result = i18next.language === "de" ? str.replace(".", ",") : str;

    return result;
}

export {
    saveAs,
    fetchWithProgress,
    setNested,
    calcProgress,
    buildFileInformationObject,
    getHumanReadableFileSize,
    roundFileSizeToFixed
};
