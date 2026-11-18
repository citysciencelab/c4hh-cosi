import {trackDrawToolEvent} from "../util.js";

/**
 * Tracks deleting a single drawn feature.
 * Triggered by: Clicking a drawn feature while the delete interaction is active in the Draw tool.
 * @param {String} [version] The draw tool version (e.g. "2026"); undefined for the legacy tool.
 * @returns {void}
 */
export function handleDrawDeleteFeature (version) {
    const funcName = "handleDrawDeleteFeature";

    trackDrawToolEvent("Deleted drawn feature", {funcName, version});
}
