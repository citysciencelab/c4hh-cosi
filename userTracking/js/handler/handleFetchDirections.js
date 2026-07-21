import {trackMatomoEvent} from "../trackMatomo";

/**
 * Tracks a successful route calculation in the Routing tool (Planning tab).
 * Triggered by: Fetching directions in the Routing tool.
 * @returns {void}
 */
export function handleFetchDirections () {
    trackMatomoEvent({
        category: "Tool",
        action: "Used tool successfully",
        name: "Routing (Planning-Tab)",
        _source: handleFetchDirections.name
    });
}
