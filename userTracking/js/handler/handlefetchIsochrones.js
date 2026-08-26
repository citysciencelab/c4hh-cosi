import {trackMatomoEvent} from "../trackMatomo";
import {assembleSourceInfoForEvent} from "../util";

/**
 * Tracks a successful isochrone calculation in the Routing tool (Reachability tab).
 * Triggered by: Fetching isochrones in the Routing tool.
 * @returns {void}
 */
export function handlefetchIsochrones () {
    const funcName = "handlefetchIsochrones";

    trackMatomoEvent({
        category: "Tool",
        action: "Used tool successfully",
        name: "Routing (Reachability-Tab)",
        _source: assembleSourceInfoForEvent(funcName)
    });
}
