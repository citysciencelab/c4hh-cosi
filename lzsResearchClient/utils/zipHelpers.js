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
 * @returns {Promise<Uint8Array>} Promise that resolves with the downloaded bytes.
 * @throws {Error} If the fetch response is not ok.
 */
async function fetchWithProgress (url, onProgress) {
    const response = await fetch(url, {credentials: "same-origin"});

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
 * Example:
 *   setNested(obj, ['archiveName', 'jahrgang', 'file.txt'], Uint8Array)
 * results in:
 *   { archiveName: { jahrgang: { 'file.txt': Uint8Array } } }
 *
 * @param {Object} obj - Root object to modify.
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

export {
    saveAs,
    fetchWithProgress,
    setNested
};
