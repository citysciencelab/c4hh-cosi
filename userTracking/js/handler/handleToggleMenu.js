import {trackMatomoEvent} from "../trackMatomo";
import {assembleSourceInfoForEvent, isPayloadValid} from "../util";

/**
 * Tracks clicking the menu toggle button.
 * Triggered by: Clicking the hamburger / menu toggle button.
 * @param {String} payload The menu side that is toggled (mainMenu or secondaryMenu).
 * @returns {void}
 */
export function handleToggleMenu (payload) {
    const funcName = "handleToggleMenu";

    if (!isPayloadValid({funcName, isArrayOrObject: false, payload})) {
        return;
    }

    trackMatomoEvent({
        category: "Menu",
        action: "Clicked menu-toggle-button",
        name: payload,
        _source: assembleSourceInfoForEvent(funcName)
    });
}
