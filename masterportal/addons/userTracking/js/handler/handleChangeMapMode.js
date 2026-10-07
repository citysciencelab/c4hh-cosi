import {trackMatomoEvent} from "../trackMatomo.js";
import {assembleSourceInfoForEvent, isPayloadValid} from "../util.js";

let isCalledFirstTime = true;

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

    if (isCalledFirstTime && window.Matomo) {
        isCalledFirstTime = false;

        try {
            const tracker = window.Matomo.getAsyncTracker(),
                queryString = tracker?.getCurrentUrl().split("?")[1];

            if (queryString) {
                const params = new URLSearchParams(queryString.toLowerCase()),
                    mapsParam = params.get("maps");

                if (mapsParam && JSON.parse(mapsParam).mode === payload.toLowerCase()) {
                    return;
                }
            }
        }
        catch (err) {
            console.error(`${funcName}: error comparing map mode parameter: ${err.stack}`);
        }
    }

    trackMatomoEvent({
        category: "MapControls",
        action: "Changed map-mode",
        name: payload,
        _source: assembleSourceInfoForEvent(funcName)
    });
}
