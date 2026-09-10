import {trackMatomoEvent} from "../trackMatomo";
import {assembleSourceInfoForEvent} from "../util";

/**
 * Tracks a successful file import in the FileImport tool.
 * Triggered by: Successfully importing a file via the FileImport tool.
 * @returns {void}
 */
export function handleAddImportedFilename () {
    const funcName = "handleAddImportedFilename";

    trackMatomoEvent({
        category: "Tool",
        action: "Used tool successfully",
        name: "FileImport",
        _source: assembleSourceInfoForEvent(funcName)
    });
}
