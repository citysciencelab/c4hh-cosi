import {trackMatomoEvent} from "../trackMatomo";
import {assembleSourceInfoForEvent} from "../util";

/**
 * Tracks a successful coordinate input format conversion in the CoordToolkit (Query tab).
 * Triggered by: Formatting a coordinate input in the CoordToolkit.
 * @returns {void}
 */
export function handleFormatInputForCoordToolkit () {
    const funcName = "handleFormatInputForCoordToolkit";

    trackMatomoEvent({
        category: "Tool",
        action: "Used tool successfully",
        name: "CoordToolkit (Query-Tab)",
        _source: assembleSourceInfoForEvent(funcName)
    });
}
