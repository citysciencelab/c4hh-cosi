import {trackMatomoEvent} from "../trackMatomo";
import {assembleSourceInfoForEvent} from "../util";

/**
 * Tracks a successful position click on the map via the CoordToolkit (Query tab).
 * Triggered by: Clicking a position on the map in the CoordToolkit.
 * @returns {void}
 */
export function handlePositionClickedForCoordToolkit () {
    const funcName = "handlePositionClickedForCoordToolkit";

    trackMatomoEvent({
        category: "Tool",
        action: "Used tool successfully",
        name: "CoordToolkit (Query-Tab)",
        _source: assembleSourceInfoForEvent(funcName)
    });
}
