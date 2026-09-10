import {trackDrawToolEvent} from "../util";

/**
 * Tracks toggling the visibility of the draw layer.
 * Triggered by: Toggling the draw-layer visibility in the Draw tool.
 * @param {Boolean} isVisible Whether the draw layer was made visible (true) or hidden (false).
 * @param {String} [version] The draw tool version (e.g. "2026"); undefined for the legacy tool.
 * @returns {void}
 */
export function handleDrawSetVisibility (isVisible, version) {
    const funcName = "handleDrawSetVisibility";

    trackDrawToolEvent(`Changed visibility to: ${isVisible ? "on" : "off"}`, {funcName, version});
}
