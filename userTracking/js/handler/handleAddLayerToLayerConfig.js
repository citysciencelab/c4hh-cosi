import {trackMatomoEvent} from "../trackMatomo";
import {assembleSourceInfoForEvent, isPayloadValid} from "../util";

/**
 * Tracks adding a WMS layer via the AddWMS tool.
 * Triggered by: Successfully adding a WMS layer via the AddWMS tool.
 * @param {Object} payload The action payload.
 * @param {String} payload._source The source of the addLayerToLayerConfig action; tracking only happens when the value is "AddWMS".
 * @returns {void}
 */
export function handleAddLayerToLayerConfig (payload) {
    const funcName = "handleAddLayerToLayerConfig";

    if (!isPayloadValid({funcName, payload})) {
        return;
    }

    if (payload._source === "AddWMS") {
        trackMatomoEvent({
            category: "Tool",
            action: "Used tool successfully",
            name: payload._source,
            _source: assembleSourceInfoForEvent(funcName, payload._source)
        });
    }
}
