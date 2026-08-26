import {trackMatomoEvent} from "../trackMatomo";
import {assembleSourceInfoForEvent} from "../util";

/**
 * Tracks a successful route calculation in the Routing tool (Planning tab).
 * Triggered by: Fetching directions in the Routing tool.
 * @returns {void}
 */
export function handleFetchDirections () {
    const funcName = "handleFetchDirections";

    trackMatomoEvent({
        category: "Tool",
        action: "Used tool successfully",
        name: "Routing (Planning-Tab)",
        _source: assembleSourceInfoForEvent(funcName)
    });
}
