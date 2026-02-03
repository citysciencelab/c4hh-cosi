/**
 * Print service utilities for the CombinedGfi component
 * Contains functions for loading print utils, sending print requests, and processing responses
 */

import {loadModule} from "./loadModule.js";

/**
 * Sends the print request to the server
 * @param {Function} preparePrintRequest - The function to prepare the print request
 * @param {Object} olFeature - The OpenLayers feature
 * @param {string} printConfigPath - The path to the print configuration
 * @param {Array} layerResults - The layer results
 * @param {Object} alternativePolygonFeature - Alternative polygon feature
 * @param {string} printServerUrl - The print server URL
 * @param {Array} additionalRequestResults - Additional request results
 * @returns {Promise<Response>} The print response
 */
export async function sendPrintRequestToServer (preparePrintRequest, olFeature, printConfigPath, layerResults, alternativePolygonFeature, printServerUrl, additionalRequestResults) {
    const printRequest = await preparePrintRequest(
            olFeature,
            layerResults,
            alternativePolygonFeature,
            printConfigPath,
            additionalRequestResults
        ),
        response = await fetch(printServerUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(printRequest)
        });

    if (!response.ok) {
        const errorText = await response.text();

        console.error("Print server error response:", {
            status: response.status,
            statusText: response.statusText,
            error: errorText
        });
        throw new Error(`Print server responded with status: ${response.status} - ${errorText}`);
    }

    return response;
}

/**
 * Processes the print response and downloads the PDF
 *
 * @param {Response} printResponse - The response from the print server
 */
export async function processPrintResponse (printResponse) {
    try {
        const pdfBlob = await printResponse.blob(),
            url = URL.createObjectURL(pdfBlob),
            link = document.createElement("a"),
            contentDisposition = printResponse.headers.get("Content-Disposition"),
            filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/),
            filename = filenameMatch ? filenameMatch[1] : "flaechenbericht.pdf";

        link.href = url;
        link.target = "_blank";
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    catch (error) {
        console.error("Error processing print response:", error);
        throw new Error("Failed to process print response");
    }
}

/**
 * Main function to send a print request using the print service
 * @param {Object} options - Configuration options
 * @param {Object} options.feature - The feature to print
 * @param {string} options.printConfigPath - Path to print config
 * @param {string} options.printUtilsPath - Path to print utils
 * @param {Array} options.layerResults - Layer results
 * @param {Object} options.alternativePolygonFeature - Alternative polygon feature
 * @param {string} options.printServerUrl - Print server URL
 * @param {Array} options.additionalRequestResults - Additional request results
 * @param {Function} options.onLoadingChange - Callback for loading state changes
 * @param {Function} options.onError - Error callback
 * @returns {Promise<void>}
 */
export async function sendPrintRequest ({
    feature,
    printConfigPath,
    printUtilsPath,
    layerResults,
    alternativePolygonFeature,
    printServerUrl,
    additionalRequestResults,
    onLoadingChange,
    onError
}) {
    if (onLoadingChange) {
        onLoadingChange(true);
    }

    try {
        const olFeature = feature.getOlFeature();
        let printUtils;

        try {
            printUtils = await loadModule(printUtilsPath);
        }
        catch (err) {
            console.error(`Failed to load from ${printUtilsPath}`);
            throw new Error("Failed to load print utils");
        }

        if (!printUtils) {
            throw new Error("Failed to load print utils");
        }

        if (printConfigPath) {
            const printResponse = await sendPrintRequestToServer(
                printUtils.preparePrintRequest,
                olFeature,
                printConfigPath,
                layerResults,
                alternativePolygonFeature,
                printServerUrl,
                additionalRequestResults
            );

            await processPrintResponse(printResponse);
        }
    }
    catch (error) {
        console.error("Error sending print request:", error);
        if (onError) {
            onError(error);
        }
    }
    finally {
        if (onLoadingChange) {
            onLoadingChange(false);
        }
    }
}
