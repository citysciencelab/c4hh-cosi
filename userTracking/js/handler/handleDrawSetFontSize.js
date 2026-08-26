import {trackDrawToolEvent} from "../util";

/**
 * Tracks changing the font size.
 * Triggered by: Changing the font-size input in the Draw tool.
 * @param {Number} value The new font size.
 * @param {String} [version] The draw tool version (e.g. "2026"); undefined for the legacy tool.
 * @returns {void}
 */
export function handleDrawSetFontSize (value, version) {
    const funcName = "handleDrawSetFontSize";

    trackDrawToolEvent("Changed font-size", {funcName, value, version});
}
