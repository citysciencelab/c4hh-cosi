import {trackMatomoEvent} from "../trackMatomo";

/**
 * Tracks a successful WFS search execution in the WfsSearch tool.
 * Triggered by: Executing a search in the WfsSearch tool.
 * @param {*} payload The mutation payload; tracking only occurs when a payload exists.
 * @returns {void}
 */
export function handleSetSearchedWfsSearch (payload) {
    if (payload) {
        trackMatomoEvent({
            category: "Tool",
            action: "Used tool successfully",
            name: "WfsSearch",
            _source: handleSetSearchedWfsSearch.name
        });
    }
}
