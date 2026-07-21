import {trackMatomoEvent} from "../trackMatomo";

/**
 * Tracks a successful isochrone calculation in the Routing tool (Reachability tab).
 * Triggered by: Fetching isochrones in the Routing tool.
 * @returns {void}
 */
export function handlefetchIsochrones () {
    trackMatomoEvent({
        category: "Tool",
        action: "Used tool successfully",
        name: "Routing (Reachability-Tab)",
        _source: handlefetchIsochrones.name
    });
}
