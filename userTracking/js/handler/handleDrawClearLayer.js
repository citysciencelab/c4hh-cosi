import {trackDrawToolEvent} from "../util";

/**
 * Tracks clearing the draw layer.
 * Triggered by: Clicking the "clear layer" button in the Draw tool.
 * @param {String} [version] The draw tool version (e.g. "2026"); undefined for the legacy tool.
 * @returns {void}
 */
export function handleDrawClearLayer (version) {
    trackDrawToolEvent("Cleared draw layer", {funcName: handleDrawClearLayer.name, version});
}
