import {trackMatomoEvent} from "../trackMatomo";

/**
 * Tracks a successful coordinate input format conversion in the CoordToolkit (Query tab).
 * Triggered by: Formatting a coordinate input in the CoordToolkit.
 * @returns {void}
 */
export function handleFormatInputForCoordToolkit () {
    trackMatomoEvent({
        category: "Tool",
        action: "Used tool successfully",
        name: "CoordToolkit (Query-Tab)",
        _source: handleFormatInputForCoordToolkit.name
    });
}
