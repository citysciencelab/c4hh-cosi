import {trackMatomoEvent} from "../trackMatomo";
import {assembleSourceInfoForEvent} from "../util";

/**
 * Tracks clicking the map rotation button.
 * Triggered by: Clicking the clockwise or counter-clockwise rotation button in the map controls.
 * @param {Boolean} isClockwise Whether the rotation is clockwise (true) or counter-clockwise (false).
 * @returns {void}
 */
export function handleRotate (isClockwise) {
    const funcName = "handleRotate";

    trackMatomoEvent({
        category: "MapControls",
        action: "Clicked control",
        name: `Rotate ${isClockwise ? "" : "counter-"}clockwise`,
        _source: assembleSourceInfoForEvent(funcName)
    });
}
