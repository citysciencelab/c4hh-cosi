import {trackDrawToolEventDebounced} from "../util";

/**
 * Tracks changing the text of a text drawing, debounced (500 ms) to avoid tracking every keystroke.
 * Triggered by: Typing into the text input in the Draw tool.
 * @param {String} [version] The draw tool version (e.g. "2026"); undefined for the legacy tool.
 * @returns {void}
 */
export function handleDrawSetText (version) {
    const funcName = "handleDrawSetText";

    trackDrawToolEventDebounced("Changed text", {funcName, version});
}
