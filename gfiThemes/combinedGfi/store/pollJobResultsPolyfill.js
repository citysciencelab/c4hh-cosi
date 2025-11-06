/**
 * This file is a temporary polyfill until either
 * A) this method is accepted as part of the masterportalAPI
 * B) this method is not accepted as part of the masterportalAPI and the implementation becomes a local method
 */

import OGCAPIProcesses from "@masterportal/masterportalapi/src/api/ogcApiProcesses";

if (OGCAPIProcesses.pollJobResults) {
    console.error("Polyfill for 'OGCAPIProcesses.pollJobResults' no longer needed and can be removed in Addon 'gfiThemes.combinedGfi'.");
}

/**
 *
 * @param {string} processUrl – URL of the OGC API process
 * @param {string} jobId – ID of the job to poll results to
 * @param {object} pollParameters – how to poll
 * @param {number?} [pollParameters.timeout=5000] – how long to try polling in ms
 * @param {number?} [pollParameters.stallFor=100] – how long to wait between retries
 * @returns {object} job results as json
 * @throws
 */
OGCAPIProcesses.pollJobResults = OGCAPIProcesses.pollJobResults ?? async function (processUrl, jobId, {timeout = 5000, stallFor = 100} = {}) {
    const start = Date.now();

    while (true) {
        const jobStatus = await OGCAPIProcesses.jobStatus(processUrl, jobId);

        if (jobStatus?.status === "successful") {
            return OGCAPIProcesses.jobResults(processUrl, jobId);
        }

        if (["failed", "dismissed"].includes(jobStatus?.status)) {
            throw new Error(
                `Polling job ${jobId} at ${processUrl} resulted in status "${jobStatus?.status}".`
            );
        }

        if (Date.now() - start >= timeout) {
            throw new Error(
                `Polling job ${jobId} at ${processUrl} timed out after ${timeout} ms with last status "${jobStatus?.status}".`
            );
        }

        await new Promise(res => setTimeout(res, stallFor));
    }
};
