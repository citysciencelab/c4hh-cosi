import {trackDrawToolEvent} from "../util";

/**
 * Tracks a completed drawing action in the Draw tool.
 * Triggered by: Completing a drawing action in the Draw tool.
 * @param {String} [version] The draw tool version (e.g. "2026")
 * @returns {void}
 */
export function handleDrawInteraction (version) {
    const funcName = "handleDrawInteraction";

    trackDrawToolEvent("Used tool successfully", {funcName, version});
}
