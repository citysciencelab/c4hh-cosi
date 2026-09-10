import {trackDrawToolEvent} from "../util";

/**
 * Tracks pressing the undo or redo button in the Draw tool.
 * Triggered by: Clicking the undo or redo button in the Draw tool.
 * @param {Boolean} isUndo Whether the undo button (true) or the redo button (false) was pressed.
 * @param {String} [version] The draw tool version (e.g. "2026"); undefined for the legacy tool.
 * @returns {void}
 */
export function handleDrawRedoAndUndo (isUndo, version) {
    const funcName = "handleDrawRedoAndUndo";

    trackDrawToolEvent(`Pressed ${isUndo ? "Undo" : "Redo"}-Button`, {funcName, version});
}
