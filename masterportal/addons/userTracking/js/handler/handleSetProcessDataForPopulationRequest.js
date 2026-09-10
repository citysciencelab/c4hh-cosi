import {trackMatomoEvent} from "../trackMatomo";
import {assembleSourceInfoForEvent} from "../util";

/**
 * Tracks a successful data processing in the PopulationRequest tool.
 * Triggered by: Successfully processing data in the PopulationRequest tool.
 * @param {*} payload The mutation payload; tracking only occurs when the payload is defined.
 * @returns {void}
 */
export function handleSetProcessDataForPopulationRequest (payload) {
    const funcName = "handleSetProcessDataForPopulationRequest";

    if (payload !== undefined) {
        trackMatomoEvent({
            category: "Tool",
            action: "Used tool successfully",
            name: "PopulationRequest",
            _source: assembleSourceInfoForEvent(funcName)
        });
    }
}
