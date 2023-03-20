import axios from "axios";

/**
 * Starts the print process. Creates a print job then asks for the status.
 * @param {String} url - MapFish Print url.
 * @param {String} format - The output format (e.g. pdf or png).
 * @param {String} appId - The identifier of the print configurations.
 * @param {Object} mapfishDialog - The POST body.
 * @param {Function} onstart - Function that creates the print job.
 * @param {Function} onwait - Is called when the status is "running" or "waiting".
 * @param {Function} onerror - Is called when the status is "cancelled" or "error".
 * @param {Function} onfinish - Is called when the status is "finished".
 * @returns {void}
 */
export function startPrintProcess (url, format, appId, mapfishDialog, onstart, onwait, onerror, onfinish) {
    onstart(url + appId + "/report." + format, mapfishDialog).then(response => {
        fetchStatus(url, response.data.ref, onwait, onerror, onfinish);
    }).catch(error => {
        onerror(error);
    });
}

/**
 * Queries the status for a print job and handles it.
 * @param {String} url - MapFish Print url.
 * @param {String} ref - A reference id that can be used to request the status for the print job or to download the finished report.
 * @param {Function} onwait - Is called when the status is "running" or "waiting".
 * @param {Function} onerror - Is called when the status is "cancelled" or "error".
 * @param {Funciton} onfinish - Is called when the status is "finished".
 * @returns {void}
 */
function fetchStatus (url, ref, onwait, onerror, onfinish) {
    const statusUrl = url + "status/" + ref + ".json";

    onwait();
    axios.get(statusUrl).then(response => {
        if (response.data.status === "running" || response.data.status === "waiting") {
            setTimeout(() => {
                fetchStatus(url, ref, onwait, onerror, onfinish);
            }, 1000);
        }
        else if (response.data.status === "finished") {
            const downloadUrl = url + "report/" + ref;

            onfinish(downloadUrl);
        }
        else if (response.data.status === "cancelled") {
            onerror("cancelled");
        }
        else {
            onerror(response.data.error);
        }
    }).catch(error => {
        onerror(error);
    });
}
