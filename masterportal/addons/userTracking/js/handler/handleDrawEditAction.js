import {handleDrawClearLayer} from "./handleDrawClearLayer.js";
import {handleDrawClickDownload} from "./handleDrawClickDownload.js";
import {handleDrawDeleteFeature} from "./handleDrawDeleteFeature.js";
import {handleDrawRedoAndUndo} from "./handleDrawRedoAndUndo.js";
import {handleDrawSetDownloadFormat} from "./handleDrawSetDownloadFormat.js";

/**
 * Tracks actions of the Draw tool's edit toolbar and its dialogs that do not change any state:
 * undo, redo, deleteAll, deleteFeature, setDownloadFormat and downloadFile.
 * Other toolbar buttons are tracked via the "setSelectedInteraction" mutation.
 * Triggered by: Clicking a button of the edit toolbar, a feature in delete mode or using the download dialog in the Draw tool.
 * @param {Object} payload The action payload.
 * @param {String} payload.action The performed action, e.g. "undo".
 * @param {String} [payload.format] The download format for "setDownloadFormat" and "downloadFile".
 * @param {String} [version] The draw tool version (e.g. "2026"); undefined for the legacy tool.
 * @returns {void}
 */
export function handleDrawEditAction (payload, version) {
    switch (payload?.action) {
        case "undo":
            handleDrawRedoAndUndo(true, version);
            break;
        case "redo":
            handleDrawRedoAndUndo(false, version);
            break;
        case "deleteAll":
            handleDrawClearLayer(version);
            break;
        case "deleteFeature":
            handleDrawDeleteFeature(version);
            break;
        case "downloadFile":
            handleDrawClickDownload(version);
            break;
        case "setDownloadFormat":
            if (payload.format !== "none") {
                handleDrawSetDownloadFormat(payload.format, version);
            }
            break;
        default:
            break;
    }
}
