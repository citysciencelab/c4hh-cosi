import {trackMatomoEvent} from "../trackMatomo";
import {assembleSourceInfoForEvent} from "../util";

/**
 * Tracks a completed drawing action in the legacy Draw tool.
 * Triggered by: Completing a drawing action in the old Draw tool.
 * @returns {void}
 */
export function handleDrawInteractionOnDrawEventOld () {
    trackMatomoEvent({
        category: "Tool",
        action: "Used tool successfully",
        name: "Draw (Old)",
        _source: assembleSourceInfoForEvent(handleDrawInteractionOnDrawEventOld.name)
    });
}
