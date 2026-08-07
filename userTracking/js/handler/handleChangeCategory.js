import {trackMatomoEvent} from "../trackMatomo.js";
import {assembleSourceInfoForEvent, isPayloadValid} from "../util.js";

/**
 * Tracks switching a layertree category.
 * Triggered by: Click on "Themen auswählen" -> expand "Fachdaten" -> click on a category (e.g. Inspire).
 * @param {Object} payload The action payload.
 * @param {String} payload.name The translation key of the selected category.
 * @returns {void}
 */
export function handleChangeCategory (payload) {
    if (!isPayloadValid({funcName: handleChangeCategory.name, payload})) {
        return;
    }

    trackMatomoEvent({
        category: "Layer",
        action: "Changed layertree category",
        name: payload.key,
        _source: assembleSourceInfoForEvent(handleChangeCategory.name)
    });
}
