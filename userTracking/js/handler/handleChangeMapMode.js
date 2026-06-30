import {trackMatomoEvent} from "../trackMatomo.js";
import {isPayloadValid} from "../util.js";

/**
 * Tracks switching the map mode between 2D and 3D.
 * Triggered by: Click on the 2D/3D-button.
 * @param {String} payload The map mode the map was switched to (e.g. "2D" or "3D").
 * @returns {void}
 */
export function handleChangeMapMode (payload) {
    if (!isPayloadValid({funcName: handleChangeMapMode.name, payload})) {
        return;
    }

    trackMatomoEvent({
        category: "MapMode",
        action: "Mapmode switched",
        name: `Mapmode switched to ${payload}`
    });
}
