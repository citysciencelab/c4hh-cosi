import {trackMatomoEvent} from "../trackMatomo";
import {assembleSourceInfoForEvent, isPayloadValid} from "../util";

/**
 * Tracks a change of the current language.
 * Triggered by: Changing the language/locale of the portal.
 * @param {Object} payload The action payload.
 * @param {String} payload.language The language/locale that was switched to.
 * @param {Boolean} [payload.doNotTrack] If true, the language change is not tracked.
 * @param {String} payload._source The source component that triggered the action.
 * @returns {void}
 */
export function handleChangeLocale (payload) {
    const funcName = "handleChangeLocale";

    if (
        !isPayloadValid({funcName, payload})
        || payload.doNotTrack
        || !payload.language) {
        return;
    }

    trackMatomoEvent({
        category: "Menu",
        action: "Changed language",
        name: payload.language,
        _source: assembleSourceInfoForEvent(funcName, payload._source)
    });
}
