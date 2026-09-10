import {trackDrawToolEvent} from "../util";

/**
 * Tracks changing the selected font.
 * Triggered by: Changing the font dropdown in the Draw tool.
 * @param {String} fontName The font that was selected.
 * @param {String} [version] The draw tool version (e.g. "2026"); undefined for the legacy tool.
 * @returns {void}
 */
export function handleDrawSetFontName (fontName, version) {
    const funcName = "handleDrawSetFontName";

    trackDrawToolEvent(`Changed font to: ${fontName}`, {funcName, version});
}
