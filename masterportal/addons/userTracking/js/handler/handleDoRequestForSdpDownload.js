import {trackMatomoEvent} from "../trackMatomo";
import {assembleSourceInfoForEvent} from "../util";

/**
 * Tracks a successful download request in the SdpDownload tool.
 * Triggered by: Triggering a download request in the SdpDownload tool.
 * @returns {void}
 */
export function handleDoRequestForSdpDownload () {
    const funcName = "handleDoRequestForSdpDownload";

    trackMatomoEvent({
        category: "Tool",
        action: "Used tool successfully",
        name: "SdpDownload",
        _source: assembleSourceInfoForEvent(funcName)
    });
}
