import {trackDrawToolEvent} from "../util";

/**
 * Tracks downloading the drawn features.
 * Triggered by: Clicking the download button in the Draw tool.
 * @param {String} [version] The draw tool version (e.g. "2026"); undefined for the legacy tool.
 * @returns {void}
 */
export function handleDrawClickDownload (version) {
    const funcName = "handleDrawClickDownload";

    trackDrawToolEvent("Pressed Download-Button", {funcName, version});
}
