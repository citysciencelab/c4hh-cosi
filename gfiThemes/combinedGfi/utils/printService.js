/**
 * Print service utilities for the CombinedGfi component
 * Contains functions for loading print utils, sending print requests, and processing responses
 */

/**
 * Loads and executes the print utils module
 *
 * @param {string} utilsPath - The path to the print utils module
 * @param {Response} existingResponse - An existing response if already fetched
 * @returns {Promise<Object>} The prepared module and the preparePrintRequest function
 * @throws {Error} If the module could not be loaded or the function not found
 */
export async function loadPrintUtilsModule (utilsPath, existingResponse) {
    const response = existingResponse,
        printUtilsPath = utilsPath,
        contentType = response.headers.get("content-type"),
        text = await response.text();

    if (!response || !response.ok) {
        console.error("Failed to load printUtils.js");
        return null;
    }

    if (contentType?.includes("text/html") ||
        text.trim().startsWith("<!DOCTYPE") ||
        text.trim().startsWith("<html")) {
        throw new Error(`Received HTML instead of JavaScript from ${printUtilsPath}`);
    }

    if (!text.trim()) {
        throw new Error(`Empty content received from ${printUtilsPath}`);
    }

    try {
        let preparePrintRequest;

        try {
            const printModule = await import(/* webpackIgnore: true */ printUtilsPath);

            preparePrintRequest = printModule.preparePrintRequest || null;
        }
        catch (importError) {
            console.error("Dynamic import failed, trying CommonJS style:", importError);

            const module = {exports: {}},
                exports = module.exports;

            // eslint-disable-next-line no-new-func
            new Function("module", "exports", text)(module, exports);

            if (typeof module.exports.preparePrintRequest === "function") {
                preparePrintRequest = module.exports.preparePrintRequest;
            }
            else if (typeof exports.preparePrintRequest === "function") {
                preparePrintRequest = exports.preparePrintRequest;
            }
            else if (typeof module.exports === "function") {
                preparePrintRequest = module.exports;
            }
        }

        if (!preparePrintRequest || typeof preparePrintRequest !== "function") {
            throw new Error(`preparePrintRequest function not found in ${printUtilsPath}`);
        }

        return {
            preparePrintRequest,
            printUtilsPath
        };
    }
    catch (error) {
        console.error("Error loading printUtils module:", error);
        throw new Error(`Failed to load printUtils module: ${error.message}`);
    }
}

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
 * Tries to fetch print utils from multiple paths
 * @param {Array<string>} paths - Array of paths to try
 * @returns {Promise<Object>} Object with path and response
 */
export async function tryFetchPrintUtils (paths) {
    for (const path of paths) {
        try {
            const resp = await fetch(path);

            if (resp.ok) {
                return {path, response: resp};
            }
        }
        catch (err) {
            console.error(`Failed to load from ${path}`);
        }
    }
    return {path: null, response: null};
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
            const {path, response: utilsResponse} = await tryFetchPrintUtils([printUtilsPath, "./resources/printUtils.js"]);

            if (path && utilsResponse) {
                printUtils = await loadPrintUtilsModule(path, utilsResponse);
            }
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
