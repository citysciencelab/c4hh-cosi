// @ts-check
/**
 * Determines if a URL string is absolute.
 * @param {string} value - The URL value to test.
 * @returns {boolean} True if the input has a scheme.
 */
function isAbsoluteUrl (value) {
    return (/^[a-zA-Z][a-zA-Z\d+.-]*:/).test(value);
}

/**
 * Returns the effective base URL for relative URL resolution.
 * @param {string|null|undefined} baseUrl - Optional base URL override.
 * @returns {string|undefined} The effective base URL or undefined.
 */
function getEffectiveBaseUrl (baseUrl) {
    if (typeof baseUrl === "string" && baseUrl.trim().length > 0) {
        return baseUrl.trim();
    }
    if (typeof window !== "undefined" && typeof window.location?.origin === "string" && window.location.origin.length > 0 && window.location.origin !== "null") {
        return window.location.origin;
    }
    return undefined;
}

/**
 * Sanitizes a configured URL and returns a normalized value.
 * Supports both relative (e.g. /api/v1.0) and absolute URLs.
 *
 * @param {string} configuredUrl - The configured URL value.
 * @param {Object} [options] - Sanitization options.
 * @param {string[]} [options.allowedProtocols=["http:", "https:"]] - Allowed URL protocols.
 * @param {string} [options.baseUrl] - Optional base URL for resolving relative URLs.
 * @param {boolean} [options.enforceTrailingSlash=false] - Whether to enforce a trailing slash in the resulting pathname.
 * @param {boolean} [options.returnAbsolute=false] - Whether to always return an absolute URL.
 * @returns {string} Sanitized URL string.
 */
export default function sanitizeConfiguredUrl (configuredUrl, options = {}) {
    const {
        allowedProtocols = ["http:", "https:"],
        baseUrl,
        enforceTrailingSlash = false,
        returnAbsolute = false
    } = options;

    if (typeof configuredUrl !== "string") {
        throw new Error("Configured URL must be a string.");
    }

    const trimmedUrl = configuredUrl.trim();

    if (trimmedUrl.length === 0) {
        throw new Error("Configured URL must not be empty.");
    }

    const inputIsAbsolute = isAbsoluteUrl(trimmedUrl);
    let parsedUrl;

    if (inputIsAbsolute) {
        parsedUrl = new URL(trimmedUrl);
    }
    else {
        const effectiveBaseUrl = getEffectiveBaseUrl(baseUrl);

        if (!effectiveBaseUrl) {
            throw new Error("Relative URL requires a base URL or window.location.origin.");
        }
        parsedUrl = new URL(trimmedUrl, effectiveBaseUrl);
    }

    if (!allowedProtocols.includes(parsedUrl.protocol)) {
        throw new Error(`Protocol '${parsedUrl.protocol}' is not allowed.`);
    }

    parsedUrl.username = "";
    parsedUrl.password = "";
    parsedUrl.hash = "";

    let normalizedPathname = parsedUrl.pathname.replace(/\/{2,}/g, "/").replace(/\/+$/, "");

    if (normalizedPathname.length === 0) {
        normalizedPathname = "/";
    }
    if (enforceTrailingSlash && !normalizedPathname.endsWith("/")) {
        normalizedPathname = `${normalizedPathname}/`;
    }
    parsedUrl.pathname = normalizedPathname;

    const normalizedAbsolute = `${parsedUrl.origin}${parsedUrl.pathname}${parsedUrl.search}`,
        normalizedRelative = `${parsedUrl.pathname}${parsedUrl.search}`;

    return returnAbsolute || inputIsAbsolute ? normalizedAbsolute : normalizedRelative;
}
