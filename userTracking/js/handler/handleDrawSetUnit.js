import {trackDrawToolEvent} from "../util";

/**
 * Tracks changing the selected measurement unit.
 * Triggered by: Changing the unit dropdown in the Draw tool.
 * @param {String} unit The unit that was selected.
 * @param {String} [version] The draw tool version (e.g. "2026"); undefined for the legacy tool.
 * @returns {void}
 */
export function handleDrawSetUnit (unit, version) {
    const funcName = "handleDrawSetUnit";

    trackDrawToolEvent(`Changed unit to: ${unit}`, {funcName, version});
}
