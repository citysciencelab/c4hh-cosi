import {trackMatomoEvent} from "../trackMatomo";

/**
 * Tracks a successful download request in the SdpDownload tool.
 * Triggered by: Triggering a download request in the SdpDownload tool.
 * @returns {void}
 */
export function handleDoRequestForSdpDownload () {
    trackMatomoEvent({
        category: "Tool",
        action: "Used tool successfully",
        name: "SdpDownload",
        _source: handleDoRequestForSdpDownload.name
    });
}
