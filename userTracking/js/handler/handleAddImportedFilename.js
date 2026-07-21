import {trackMatomoEvent} from "../trackMatomo";

/**
 * Tracks a successful file import in the FileImport tool.
 * Triggered by: Successfully importing a file via the FileImport tool.
 * @returns {void}
 */
export function handleAddImportedFilename () {
    trackMatomoEvent({
        category: "Tool",
        action: "Used tool successfully",
        name: "FileImport",
        _source: handleAddImportedFilename.name
    });
}
