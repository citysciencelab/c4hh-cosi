import {wfs} from "@masterportal/masterportalapi";

/**
 * Replacement for the MasterportalAPI's sendTransaction method.
 * This is needed because the original does not return the actual server response.
 * Original method: @masterportal/masterportalapi/src/layer/wfs.js
 *
 * @param {string} srsName of the coordinate reference system
 * @param {ol/Feature} feature Feature to by inserted / updated / deleted.
 * @param {string} url of the wfs-t service
 * @param {Object} layer the configured representation of the layer in the Masterportal
 * @param {string} transactionMethod which transaction to perform. Possible values are: "insert"|"delete"|"selectedUpdate"
 * @param {string|null} lockId which lockId shall be released on this transaction
 * @returns {Object|void} Processed data info (featureIds: [], status: { inserted: 0, updated: 0, deleted: 0 })
 * @throws {Error} error if occurs
 */
export default async function wfsSendTransaction (srsName, feature, url, layer, transactionMethod, lockId) {
    const baseUrl = new URL(url),
        {featureNS, featurePrefix, featureType, version} = layer;

    let exception,
        response,
        xmlDocument = null,
        transactionSummary = null,
        data = null,
        transactionBody = wfs.writeTransactionBody(feature,
            {featureNS, featurePrefix, featureType, version, srsName},
            transactionMethod,
            version);

    if (transactionMethod === "selectedUpdate" && lockId) {
        transactionBody = addReleaseLockAttributes(transactionBody, lockId);
    }

    try {
        response = await fetch(baseUrl, {
            method: "POST",
            headers: {"Content-Type": "text/xml"},
            credentials: layer.isSecured ? "include" : "omit",
            body: transactionBody,
            responseType: "text"
        });

        data = await response.text();

        xmlDocument = new DOMParser().parseFromString(data, "text/xml");
        transactionSummary = xmlDocument.getElementsByTagName("wfs:TransactionSummary");

        if (transactionSummary.length === 0) {
            transactionSummary = xmlDocument.getElementsByTagName("TransactionSummary");
        }

        // NOTE: WFS-T services respond errors with the transaction as an XML response, even though it's the http code indicates different...
        if (transactionSummary.length === 0) {
            exception = getExceptionFromTransactionResponse(xmlDocument);
            throw new Error(exception.code ? exception.code + ": " + exception.message : exception.message);
        }

        const transactionResponseSummary = {
            inserted: parseInt(xmlDocument.getElementsByTagName("wfs:totalInserted")[0].textContent || 0, 10),
            updated: parseInt(xmlDocument.getElementsByTagName("wfs:totalUpdated")[0].textContent || 0, 10),
            deleted: parseInt(xmlDocument.getElementsByTagName("wfs:totalDeleted")[0].textContent || 0, 10)
        };

        let transactionResponseFeatureIds = [];

        if (version.startsWith("2.0.")) {
            transactionResponseFeatureIds = Array.from(xmlDocument.getElementsByTagName("fes:ResourceId")).map(item => item.getAttribute("rid")).filter(Boolean);
            transactionResponseSummary.replaced = parseInt(xmlDocument.getElementsByTagName("wfs:totalReplaced")[0].textContent || 0, 10);
        }
        else if (version.startsWith("1.1.")) {
            transactionResponseFeatureIds = Array.from(xmlDocument.getElementsByTagName("ogc:FeatureId")).map(item => item.getAttribute("fid")).filter(Boolean);
        }
        else {
            throw new Error(`WFS-T version ${version} not supported.`);
        }

        return {
            featureIds: transactionResponseFeatureIds,
            summary: transactionResponseSummary
        };
    }
    catch (e) {
        console.error(e);
        throw e;
    }
}

/**
 * Copy of MasterportalAPI's getExceptionFromTransactionResponse method.
 * Required because original is not exported.
 *
 * Checks if it is an unknown or special error and returns the code and the error message
 *
 * @param {Object} xmlDocument with the error
 * @returns {Object} the code and the specific or unknown error looking like this {code, message}
 */
function getExceptionFromTransactionResponse (xmlDocument) {
    const response = {code: null, message: "genericFailedTransaction"},
        exception = xmlDocument.getElementsByTagName(`${xmlDocument.getElementsByTagName("Exception").length === 0 ? "ows:" : ""}Exception`)[0],
        exceptionText = exception.getElementsByTagName(`${xmlDocument.getElementsByTagName("ExceptionText").length === 0 ? "ows:" : ""}ExceptionText`)[0];

    if (exceptionText !== undefined) {
        response.message = exceptionText.textContent;
        console.error("WfsTransaction: An error occurred when sending the transaction to the service.", exceptionText.textContent);
    }
    else {
        response.message = "WfsTransaction: An unkown error occurred when sending the transaction to the service.";
        console.error(response.message);
    }
    if (exception?.attributes.getNamedItem("code") || exception?.attributes.getNamedItem("exceptionCode")) {
        response.code = exception.attributes.getNamedItem(`${exception?.attributes.getNamedItem("code") ? "c" : "exceptionC"}ode`).textContent;
    }

    return response;
}

/**
 * add the attributes 'releaseAction' and 'lockId' to the transaction request
 *
 * @param {String} xmlString the stringyfied transaction body
 * @param {String} lockId the lockId to be released with this transaction
 * @returns {String} stringyfied transaction body enriched by the new attributes
 */
function addReleaseLockAttributes (xmlString, lockId) {
    const xmlDoc = new DOMParser().parseFromString(xmlString, "application/xml"),
        transactionElement = xmlDoc.getElementsByTagNameNS("http://www.opengis.net/wfs/2.0", "Transaction")[0];

    transactionElement.setAttribute("releaseAction", "ALL");
    transactionElement.setAttribute("lockId", lockId);

    // Serialisieren zurück zu String
    return new XMLSerializer().serializeToString(xmlDoc);
}
