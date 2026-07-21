import {trackMatomoEvent} from "../trackMatomo";

/**
 * Tracks a successful data processing in the PopulationRequest tool.
 * Triggered by: Successfully processing data in the PopulationRequest tool.
 * @param {*} payload The mutation payload; tracking only occurs when the payload is defined.
 * @returns {void}
 */
export function handleSetProcessDataForPopulationRequest (payload) {
    if (payload !== undefined) {
        trackMatomoEvent({
            category: "Tool",
            action: "Used tool successfully",
            name: "PopulationRequest",
            _source: handleSetProcessDataForPopulationRequest.name
        });
    }
}
