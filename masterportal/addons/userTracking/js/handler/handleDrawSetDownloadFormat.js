import {trackDrawToolEvent} from "../util";

/**
 * Tracks changing the selected download format.
 * Triggered by: Changing the download-format dropdown in the Draw tool.
 * @param {String} payload The download format that was selected.
 * @param {String} [version] The draw tool version (e.g. "2026"); undefined for the legacy tool.
 * @returns {void}
 */
export function handleDrawSetDownloadFormat (payload, version) {
    const funcName = "handleDrawSetDownloadFormat";

    trackDrawToolEvent(`Changed download format to: ${payload}`, {funcName, version});
}
