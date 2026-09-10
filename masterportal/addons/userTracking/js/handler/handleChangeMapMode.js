import {trackMatomoEvent} from "../trackMatomo.js";
import {assembleSourceInfoForEvent, isPayloadValid} from "../util.js";

/**
 * Tracks switching the map mode between 2D and 3D.
 * Triggered by: Click on the 2D/3D-button.
 * @param {String} payload The map mode the map was switched to (e.g. "2D" or "3D").
 * @returns {void}
 */
export function handleChangeMapMode (payload) {
    const funcName = "handleChangeMapMode";

    if (!isPayloadValid({funcName, isArrayOrObject: false, payload})) {
        return;
    }

    trackMatomoEvent({
        category: "MapControls",
        action: "Changed map-mode",
        name: payload,
        _source: assembleSourceInfoForEvent(funcName)
    });
}
