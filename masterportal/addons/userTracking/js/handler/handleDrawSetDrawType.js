import {trackDrawToolEvent} from "../util";

/**
 * Tracks changing the selected draw type (e.g. point, line, polygon).
 * Triggered by: Changing the draw-type button/dropdown in the Draw tool.
 * @param {String} drawType The draw type that was selected.
 * @param {Boolean} [isMain] If true the event is tracked as "draw type main" (draw 2026 only).
 * @param {String} [version] The draw tool version (e.g. "2026"); undefined for the legacy tool.
 * @returns {void}
 */
export function handleDrawSetDrawType (drawType, isMain, version) {
    const funcName = "handleDrawSetDrawType";

    trackDrawToolEvent(`Changed draw type${isMain ? " main " : " "}to: ${drawType}`, {funcName, version});
}
