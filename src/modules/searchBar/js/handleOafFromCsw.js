import axios from "axios";

/**
 * Normalizes an OAF base URL by removing a trailing slash from the pathname while preserving query and hash parts.
 * @param {String} baseUrl The OAF service base URL.
 * @returns {String} The normalized base URL.
 */
function normalizeBaseUrl (baseUrl) {
    const parsedUrl = new URL(baseUrl);

    if (parsedUrl.pathname !== "/" && parsedUrl.pathname.endsWith("/")) {
        parsedUrl.pathname = parsedUrl.pathname.slice(0, -1);
    }

    return parsedUrl.toString();
}

/**
 * Extracts collections endpoint URL from OAF landing page links.
 * Looks for rel="data" or rel="collections" link, falls back to /collections.
 * @param {Object} landingPage Landing page JSON response
 * @param {String} baseUrl OAF service base URL for fallback
 * @returns {String} Collections endpoint URL
 */
function resolveCollectionsUrl (landingPage, baseUrl) {
    const normalizedUrl = new URL(normalizeBaseUrl(baseUrl));

    if (!landingPage.links || !Array.isArray(landingPage.links)) {
        return new URL("collections", `${normalizedUrl.toString()}/`).toString();
    }

    const collectionsLink = landingPage.links.find(link => link.rel === "data" || link.rel === "collections"
    );

    if (collectionsLink?.href) {
        try {
            return new URL(collectionsLink.href, `${normalizedUrl.toString()}/`).toString();
        }
        catch (error) {
            return collectionsLink.href;
        }
    }

    return new URL("collections", `${normalizedUrl.toString()}/`).toString();
}

/**
 * Handles OAF (OGC API Features) layer discovery for CSW records.
 * Fetches the landing page, resolves collections endpoint link, then extracts collection titles and IDs.
 * @param {String} baseUrl OAF service base URL
 * @returns {Promise<Object>} Result state with discovered collection names and service title
 */
export default async function handleOafFromCsw (baseUrl) {
    try {
        const normalizedUrl = normalizeBaseUrl(baseUrl);
        let landingPage = {};
        let serviceTitle = "";

        try {
            const landingResponse = await axios.get(normalizedUrl, {
                timeout: 7000,
                headers: {Accept: "application/json"}
            });

            landingPage = landingResponse.data || {};
            serviceTitle = landingPage.title || "";
        }
        catch (landingError) {
            // Ignore landing page errors; fallback /collections handling continues below.
        }

        const collectionsUrl = resolveCollectionsUrl(landingPage, baseUrl);

        const collResponse = await axios.get(collectionsUrl, {
            timeout: 7000,
            headers: {Accept: "application/json"}
        });

        const collectionsData = collResponse.data;

        if (!serviceTitle && collectionsData.title) {
            serviceTitle = collectionsData.title;
        }

        let collections = [];

        if (Array.isArray(collectionsData.collections)) {
            collections = collectionsData.collections;
        }
        else if (Array.isArray(collectionsData)) {
            collections = collectionsData;
        }

        const layerTitleEntries = collections
            .filter(collection => collection.id || collection.name)
            .map(collection => ({
                name: collection.id || collection.name,
                title: collection.title || collection.id || collection.name
            }));

        return {
            layersAdded: layerTitleEntries.length > 0,
            serviceUnavailable: false,
            serviceTitle,
            layerNames: layerTitleEntries.map(entry => entry.name),
            layerTitleEntries
        };
    }
    catch (capError) {
        console.warn("handleOafFromCsw: OAF collections endpoint failed, collections will be empty.", capError);
        return {layersAdded: false, serviceUnavailable: true, serviceTitle: "", layerNames: [], layerTitleEntries: []};
    }
}
