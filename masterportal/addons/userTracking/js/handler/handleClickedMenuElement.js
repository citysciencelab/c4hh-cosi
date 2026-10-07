import {trackMatomoEvent} from "../trackMatomo.js";
import {assembleSourceInfoForEvent, isPayloadValid} from "../util.js";

/**
 * Tracks clicking a "customMenuElement" that opens an external URL.
 * Triggered by: Click on a menu entry of type "customMenuElement" with an "openURL" property configured.
 * @param {Object} payload The action payload.
 * @param {String} payload.name Name of the clicked menu element.
 * @param {Object} [payload.properties] Properties of the clicked menu element.
 * @param {String} [payload.properties.openURL] The external URL opened by the menu element.
 * @param {String} payload.type The type of the clicked menu element.
 * @returns {void}
 */
export function handleClickedMenuElement (payload) {
    const funcName = "handleClickedMenuElement";

    if (!isPayloadValid({funcName, payload})
        || payload.type !== "customMenuElement"
        || !payload.properties?.openURL
    ) {
        return;
    }

    trackMatomoEvent({
        category: "Menu",
        action: "Clicked customMenuElement opening external link",
        name: `"${payload.name}" -> "${payload.properties.openURL}"`,
        _source: assembleSourceInfoForEvent(funcName)
    });
}
