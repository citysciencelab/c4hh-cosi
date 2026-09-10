import {trackDrawToolEvent} from "../util";

/**
 * Tracks changing the selected draw type (e.g. point, line, polygon).
 * Triggered by: Changing the draw-type dropdown in the Draw tool.
 * @param {String} drawType The draw type that was selected.
 * @param {String} [version] The draw tool version (e.g. "2026"); undefined for the legacy tool.
 * @returns {void}
 */
export function handleDrawSetDrawType (drawType, version) {
    const funcName = "handleDrawSetDrawType";

    trackDrawToolEvent(`Changed draw type to: ${drawType}`, {funcName, version});
}
