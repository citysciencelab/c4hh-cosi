import {trackMatomoEvent} from "../trackMatomo";

/**
 * Tracks a completed measurement in the Measure tool.
 * Triggered by: Clearing the redo stack for a feature in the Measure tool, which indicates a measurement was finalized.
 * @returns {void}
 */
export function handleClearRedoForFeatureForMeasure () {
    trackMatomoEvent({
        category: "Tool",
        action: "Used tool successfully",
        name: "Measure",
        _source: handleClearRedoForFeatureForMeasure.name
    });
}
