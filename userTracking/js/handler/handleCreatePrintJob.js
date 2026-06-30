import {trackMatomoEvent} from "../trackMatomo.js";
import {isPayloadValid} from "../util.js";

/**
 * Tracks the creation of a print job.
 * Triggered by: Click on "Karte drucken" -> click on "Datei erstellen".
 * @param {Object} payload The action payload.
 * @param {Object} payload.payload The print job configuration.
 * @param {Object} payload.payload.attributes The print attributes.
 * @param {Boolean} payload.payload.attributes.is3dMode Whether the print job was created in 3D mode.
 * @param {String} payload.payload.layout The selected print layout.
 * @returns {void}
 */
export function handleCreatePrintJob (payload) {
    if (!isPayloadValid({funcName: handleCreatePrintJob.name, payload})) {
        return;
    }

    const {payload: printPayload} = payload;

    if (printPayload) {
        trackMatomoEvent({
            category: "Print",
            action: `${printPayload.attributes?.is3dMode ? "3D" : "2D"} printjob created`,
            name: `Layout: ${printPayload.layout}`
        });
    }
}
