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
 * @returns {Object|void} Processed data info (featureIds: [], status: { inserted: 0, updated: 0, deleted: 0 })
 * @throws {Error} error if occurs
 */
export default async function wfsSendTransaction (srsName, feature, url, layer, transactionMethod) {
    let exception,
        response,
        xmlDocument = null,
        transactionSummary = null,
        data = null;

    const baseUrl = new URL(url),
        {featureNS, featurePrefix, featureType, version} = layer;

    try {
        response = await fetch(baseUrl, {
            method: "POST",
            headers: {"Content-Type": "text/xml"},
            credentials: layer.isSecured ? "include" : "omit",
            body: wfs.writeTransactionBody(feature,
                {featureNS, featurePrefix, featureType, version, srsName},
                transactionMethod,
                version),
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
            exception = wfs.getExceptionFromTransactionResponse(xmlDocument);
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
