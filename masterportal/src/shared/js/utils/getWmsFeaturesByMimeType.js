import {requestGfi} from "@shared/js/api/wmsGetFeatureInfo.js";
import {interpretLinebreaks} from "./interpretLinebreaks.js";
import {GeoJSON} from "ol/format.js";

/**
 * returns a list of wms features for the given url and mimeType
 * @param {Object} layer to show the properties of
 * @param {Object} [layer.mimeType] the infoFormat of the wms (either text/xml or text/html)
 * @param {String} [layer.layerName] the name of the requesting layer
 * @param {String} [layer.layerId] the id of the requesting layer
 * @param {String} [layer.gfiTheme] the title of the theme - it does not check if the theme exists
 * @param {(Object|String)} [layer.attributesToShow] an object of attributes to show or a string "showAll" or "ignore"
 * @param {Object} [layer.gfiAsNewWindow] null or an object of how to open the gfi in a new window
 * @param {String} [layer.gfiAsNewWindow.name="_blank"] the browsing context or the target attribute to open the window (see https://developer.mozilla.org/en-US/docs/Web/API/Window/open)
 * @param {String} [layer.gfiAsNewWindow.specs=""] a comma-separated list of items - the setup to open the window with (see https://developer.mozilla.org/en-US/docs/Web/API/Window/open)
 * @param {String} url the url to call the wms features from
 * @param {Object} [windowState] Shared state to control popup opening per click.
 * @param {Boolean} [windowState.opened] Flag whether a popup was already opened for the current click.
 * @param {Object} [forcedGfiAsNewWindow] If given, used instead of layer.get("gfiAsNewWindow") - lets several layers of one click share the same popup config without mutating any layer.
 * @param {Function} [openWindow=window.open] Function used to open a popup window - injectable for testing.
 * @returns {Object[]}  a list of object{getTheme, getTitle, getAttributesToShow, getProperties, getGfiUrl} or an emtpy array
 */
export function getWmsFeaturesByMimeType (layer, url, windowState = null, forcedGfiAsNewWindow = undefined, openWindow = window.open) {
    const infoFormat = layer.get("infoFormat"),
        gfiAsNewWindow = forcedGfiAsNewWindow !== undefined ? forcedGfiAsNewWindow : layer.get("gfiAsNewWindow");

    if (gfiAsNewWindow !== null && typeof gfiAsNewWindow === "object" && windowState && typeof windowState === "object") {
        return getFeaturesForCombinedPopup(layer, url, windowState, gfiAsNewWindow, openWindow);
    }

    if (openFeaturesInNewWindow(url, gfiAsNewWindow, openWindow) === true) {
        return [];
    }

    if (infoFormat === "text/xml" || infoFormat === "application/vnd.ogc.gml") {
        return getXmlFeatures(layer, url);
    }

    if (infoFormat === "application/json") {
        return getJSONFeatures(layer, url);
    }

    // mimeType === "text/html"
    return getHtmlFeature(layer, url);
}

/**
 * Fetches a layer's GFI features and, if any were found, renders them into the shared combined popup window.
 * The popup window is reserved synchronously (before the async GFI request) so the browser does not block it.
 * @param {Object} layer to show the properties of
 * @param {String} url the url to call the wms features from
 * @param {Object} windowState Shared state object across queried layers of this click.
 * @param {Object} gfiAsNewWindow The window properties to open the popup with (possibly shared across several layers).
 * @param {Function} openWindow Function used to open a popup window.
 * @returns {Promise<Array>} always resolves to an empty array, features are rendered into the popup instead of the gfi menu
 */
function getFeaturesForCombinedPopup (layer, url, windowState, gfiAsNewWindow, openWindow) {
    const infoFormat = layer.get("infoFormat"),
        popupWindow = ensureCombinedPopupWindow(gfiAsNewWindow, openWindow, windowState);
    let featuresPromise;

    if (infoFormat === "text/xml" || infoFormat === "application/vnd.ogc.gml") {
        featuresPromise = getXmlFeatures(layer, url);
    }
    else if (infoFormat === "application/json") {
        featuresPromise = getJSONFeatures(layer, url);
    }
    else {
        featuresPromise = getHtmlFeature(layer, url);
    }

    return Promise.resolve(featuresPromise).then(features => {
        if (popupWindow && Array.isArray(features) && features.length > 0) {
            addFeaturesToPopup(popupWindow, layer, features, windowState);
            return [];
        }

        if (popupWindow && (!Array.isArray(features) || features.length === 0)) {
            showPopupFeedback(popupWindow, "No feature information available.");
        }
        return [];
    }).catch(error => {
        console.error("GetFeatureInfo: Combined popup could not be loaded.", error);

        if (popupWindow) {
            showPopupFeedback(popupWindow, "Error loading feature information.");
        }
        return [];
    });
}

/**
 * Ensures that the shared combined popup window exists and is initialized.
 * @param {Object} newWindowProps Window properties used for opening the popup.
 * @param {Function} openWindow Function used to open a popup window.
 * @param {Object} windowState Shared state object across queried layers.
 * @returns {?Window} The popup window, or null if it could not be opened.
 */
function ensureCombinedPopupWindow (newWindowProps, openWindow, windowState) {
    if (windowState.popupWindow && !windowState.popupWindow.closed) {
        return windowState.popupWindow;
    }

    const name = newWindowProps?.name ? newWindowProps.name : "",
        specs = newWindowProps?.specs ? newWindowProps.specs : "",
        popupWindow = openWindow("", name, specs);

    if (!popupWindow) {
        return null;
    }

    windowState.popupWindow = popupWindow;
    windowState.popupCount = 0;
    initializeCombinedWindow(popupWindow);

    return popupWindow;
}

/**
 * opens a new window with the given url if gfiAsNewWindow is set
 * will open any http that is no SSL in a new window
 * @param {String} url the url to call the wms features from
 * @param {Object} gfiAsNewWindow null or an object of how to open the gfi in a new window
 * @param {String} [gfiAsNewWindow.name="_blank"] the browsing context or the target attribute to open the window (see https://developer.mozilla.org/en-US/docs/Web/API/Window/open)
 * @param {String} [gfiAsNewWindow.specs=""] a comma-separated list of items - the setup to open the window with (see https://developer.mozilla.org/en-US/docs/Web/API/Window/open)
 * @param {Function} openWindow a function (url, name, specs) to open a new browser window with
 * @param {Object} [windowState] Shared state to control popup opening per click.
 * @param {Boolean} [windowState.opened] Flag whether a popup was already opened for the current click.
 * @returns {Boolean}  true if a window is opened, false if no window was opened
 */
export function openFeaturesInNewWindow (url, gfiAsNewWindow, openWindow) {
    if (typeof url !== "string") {
        return false;
    }
    else if (typeof openWindow !== "function") {
        return false;
    }

    let newWindowProps = gfiAsNewWindow;

    if ((newWindowProps === null || typeof newWindowProps !== "object") && url.startsWith("http:", 0) && location.protocol === "https:") {
        // make sure not to open http (no mixed content)
        newWindowProps = {
            name: "",
            specs: ""
        };
    }

    if (newWindowProps !== null && typeof newWindowProps === "object") {
        // do not add to gfiFeatures, open a new window with given specs instead
        const name = newWindowProps?.name ? newWindowProps.name : "",
            specs = newWindowProps?.specs ? newWindowProps.specs : "";

        openWindow(url, name, specs);
        return true;
    }

    return false;
}

/**
 * Initializes the combined popup window document with a pager header (previous/next arrows and a title)
 * and an empty result container, mirroring the app's own GFI menu navigation.
 * @param {Window} popupWindow The popup window.
 * @returns {void}
 */
function initializeCombinedWindow (popupWindow) {
    const doc = popupWindow.document,
        styleElement = doc.createElement("style"),
        {header, titleElement, leftButton, rightButton} = createPagerHeader(doc, popupWindow),
        container = doc.createElement("div");

    doc.title = "GetFeatureInfo";
    doc.body.innerHTML = "";

    styleElement.textContent = getCombinedWindowStyles();
    container.id = "gfi-result-list";

    doc.head.appendChild(styleElement);
    doc.body.appendChild(header);
    doc.body.appendChild(container);

    popupWindow.gfiPager = {
        entries: [],
        activeIndex: 0,
        titleElement,
        leftButton,
        rightButton
    };
}

/**
 * Shows a user-facing message in the combined popup if no feature data could be loaded.
 * @param {Window} popupWindow The popup window.
 * @param {String} message The message to show.
 * @returns {void}
 */
function showPopupFeedback (popupWindow, message) {
    const doc = popupWindow.document,
        container = doc.getElementById("gfi-result-list"),
        hasEntries = popupWindow.gfiPager && popupWindow.gfiPager.entries.length > 0;

    if (!container || hasEntries) {
        return;
    }

    container.innerHTML = "";

    const emptyState = doc.createElement("p");

    emptyState.className = "gfi-empty-state";
    emptyState.textContent = message;
    container.appendChild(emptyState);

    if (popupWindow.gfiPager) {
        popupWindow.gfiPager.titleElement.textContent = "No results";
        updatePagerControls(popupWindow);
    }
}

/**
 * Builds the pager header (previous/next arrows and a title) for the combined popup window.
 * @param {Document} doc The popup window's document, used to create elements.
 * @param {Window} popupWindow The popup window, needed so the pager buttons can navigate its entries.
 * @returns {{header: HTMLElement, titleElement: HTMLElement, leftButton: HTMLElement, rightButton: HTMLElement}} The header and its parts.
 */
function createPagerHeader (doc, popupWindow) {
    const header = doc.createElement("div"),
        leftButton = doc.createElement("button"),
        titleElement = doc.createElement("h1"),
        rightButton = doc.createElement("button");

    header.className = "gfi-popup-header";

    leftButton.type = "button";
    leftButton.className = "gfi-pager-btn gfi-pager-left";
    leftButton.textContent = "\u2039";
    leftButton.setAttribute("aria-label", "previous result");
    leftButton.addEventListener("click", () => showPopupEntry(popupWindow, popupWindow.gfiPager.activeIndex - 1));

    titleElement.className = "gfi-popup-title";

    rightButton.type = "button";
    rightButton.className = "gfi-pager-btn gfi-pager-right";
    rightButton.textContent = "\u203a";
    rightButton.setAttribute("aria-label", "next result");
    rightButton.addEventListener("click", () => showPopupEntry(popupWindow, popupWindow.gfiPager.activeIndex + 1));

    header.appendChild(leftButton);
    header.appendChild(titleElement);
    header.appendChild(rightButton);

    return {header, titleElement, leftButton, rightButton};
}

/**
 * Returns the CSS rules for the combined popup window (pager header, result list, entries).
 * @returns {String} The CSS rules as plain text.
 */
function getCombinedWindowStyles () {
    return `
        body { font-family: Arial, sans-serif; margin: 0; }
        .gfi-popup-header { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.75rem 1rem; border-bottom: 1px solid #d6d6d6; background: #f5f5f5; }
        .gfi-popup-title { margin: 0; font-size: 1.1rem; flex: 1; text-align: center; }
        .gfi-pager-btn { background: none; border: none; font-size: 1.5rem; line-height: 1; padding: 0 0.5rem; cursor: pointer; }
        .gfi-pager-btn:disabled { opacity: 0.3; cursor: default; }
        #gfi-result-list { padding: 1rem; }
        .gfi-entry { display: none; }
        .gfi-entry.active { display: block; }
        .gfi-entry-link { display: block; margin-bottom: 0.5rem; font-size: 0.875rem; }
        .gfi-empty-state { padding: 1rem; color: #444; font-size: 0.95rem; }
        .gfi-entry-frame { width: 100%; height: 520px; border: 0; }
        .gfi-entry-table { width: 100%; border-collapse: collapse; }
        .gfi-entry-table th, .gfi-entry-table td { text-align: left; padding: 0.375rem 0.75rem; border-bottom: 1px solid #eee; font-size: 0.875rem; }
    `;
}

/**
 * Shows the entry at the given index in the combined popup window and updates the title and pager buttons.
 * @param {Window} popupWindow The popup window.
 * @param {Number} index The index of the entry to show.
 * @returns {void}
 */
function showPopupEntry (popupWindow, index) {
    const pager = popupWindow.gfiPager;

    if (!pager || pager.entries.length === 0) {
        return;
    }

    pager.activeIndex = Math.min(Math.max(index, 0), pager.entries.length - 1);

    pager.entries.forEach((entry, entryIndex) => {
        entry.element.classList.toggle("active", entryIndex === pager.activeIndex);
    });

    pager.titleElement.textContent = pager.entries[pager.activeIndex].title;
    updatePagerControls(popupWindow);
}

/**
 * Enables/disables and shows/hides the pager buttons depending on the current amount and position of entries.
 * @param {Window} popupWindow The popup window.
 * @returns {void}
 */
function updatePagerControls (popupWindow) {
    const pager = popupWindow.gfiPager,
        hasMultipleEntries = pager.entries.length > 1;

    pager.leftButton.disabled = pager.activeIndex === 0;
    pager.rightButton.disabled = pager.activeIndex === pager.entries.length - 1;
    pager.leftButton.style.visibility = hasMultipleEntries ? "visible" : "hidden";
    pager.rightButton.style.visibility = hasMultipleEntries ? "visible" : "hidden";
}

/**
 * Registers a new entry with the popup's pager: shows it immediately if it is the first entry,
 * otherwise just updates the pager controls so the (now reachable) entry can be paged to.
 * @param {Window} popupWindow The popup window.
 * @param {String} title The title to show in the pager header when this entry is active.
 * @param {HTMLElement} element The entry element that was appended to the result container.
 * @returns {void}
 */
function registerPopupEntry (popupWindow, title, element) {
    const pager = popupWindow.gfiPager;

    if (!pager) {
        return;
    }

    pager.entries.push({title, element});

    if (pager.entries.length === 1) {
        showPopupEntry(popupWindow, 0);
    }
    else {
        updatePagerControls(popupWindow);
    }
}

/**
 * Adds one layer's GFI features as a section to the combined popup window.
 * @param {Window} popupWindow The popup window.
 * @param {Object} layer to show the properties of
 * @param {Object[]} features The parsed, non-empty GFI features for this layer.
 * @param {Object} windowState Shared state object across queried layers.
 * @returns {void}
 */
function addFeaturesToPopup (popupWindow, layer, features, windowState) {
    const doc = popupWindow.document,
        container = doc.getElementById("gfi-result-list");

    if (!container) {
        return;
    }

    const emptyState = container.querySelector(".gfi-empty-state");

    if (emptyState) {
        emptyState.remove();
    }

    windowState.popupCount = (windowState.popupCount || 0) + 1;
    windowState.opened = true;

    const entry = doc.createElement("section"),
        title = layer.get("name") || `Result ${windowState.popupCount}`;

    entry.className = "gfi-entry";

    features.forEach(feature => {
        entry.appendChild(createFeatureContentElement(doc, feature));
    });

    container.appendChild(entry);
    registerPopupEntry(popupWindow, title, entry);
}

/**
 * Creates a DOM element rendering one feature's GFI content, either its raw html document or an attribute table.
 * @param {Document} doc The popup window's document, used to create elements.
 * @param {Object} feature The parsed GFI feature.
 * @returns {HTMLElement} The element to append into the popup entry.
 */
function createFeatureContentElement (doc, feature) {
    const featureDocument = typeof feature.getDocument === "function" ? feature.getDocument() : "";

    if (featureDocument) {
        const iframe = doc.createElement("iframe");

        iframe.className = "gfi-entry-frame";
        iframe.srcdoc = featureDocument;
        return iframe;
    }

    const table = doc.createElement("table"),
        properties = typeof feature.getProperties === "function" ? feature.getProperties() : {};

    table.className = "gfi-entry-table";
    Object.keys(properties).forEach(key => {
        const row = doc.createElement("tr"),
            keyCell = doc.createElement("th"),
            valueCell = doc.createElement("td");

        keyCell.textContent = key;
        valueCell.textContent = String(properties[key]);
        row.appendChild(keyCell);
        row.appendChild(valueCell);
        table.appendChild(row);
    });

    return table;
}

/**
 * returns a list of objects representing the features called by url
 * @param {Object} layer to show the properties of
 * @param {String} [layer.layerName] the name of the requesting layer
 * @param {String} [layer.gfiTheme] the title of the theme - it does not check if the theme exists
 * @param {(Object|String)} [layer.attributesToShow] an object of attributes to show or a string "showAll" or "ignore"
 * @param {String} [layer.layerId] the id of the requesting layer
 * @param {String} url the url to call the wms features from
 * @returns {Object[]}  a list of object{getTheme, getTitle, getAttributesToShow, getProperties, getGfiUrl} or an emtpy array
 */
export function getXmlFeatures (layer, url) {
    if (typeof url !== "string") {
        return [];
    }
    return requestGfi("text/xml", url, layer).then(featureInfos => {
        return handleXmlResponse(featureInfos, layer, url);
    });
}
/**
 * returns a list of objects representing the features called by url
 * @param {Object} featureInfos response from requestGFI
 * @param {Object} layer to show the properties of
 * @param {String} [layer.gfiTheme] the title of the theme - it does not check if the theme exists
 * @param {String} url the url to call the wms features from
 * @returns {Object[]}  a list of object{getTheme, getTitle, getAttributesToShow, getProperties, getGfiUrl} or an emtpy array
 */
export function handleXmlResponse (featureInfos, layer, url) {
    let result = [],
        optionalBBox = "";

    if (!Array.isArray(featureInfos)) {
        return result;
    }
    if (Array.isArray(featureInfos[0]) && featureInfos[0].length) {
        optionalBBox = featureInfos.shift().map(pos => Number(pos));
    }
    featureInfos.forEach(function (feature) {
        if (typeof feature === "object" && feature !== null && typeof feature.getProperties === "function") {
            result.push(createGfiFeature(layer, url, feature));
        }
    });

    result = mergeFeatures(result, layer, url, optionalBBox);

    return result;
}

/**
 * returns a list of objects representing the features called by url
 * @param {Object} layer to show the properties of
 * @param {String} [layer.layerName] the name of the requesting layer
 * @param {String} [layer.gfiTheme] the title of the theme - it does not check if the theme exists
 * @param {(Object|String)} [layer.attributesToShow] an object of attributes to show or a string "showAll" or "ignore"
 * @param {String} [layer.layerId] the id of the requesting layer
 * @param {String} url the url to call the wms features from
 * @returns {Object[]}  a list of object{getTheme, getTitle, getAttributesToShow, getProperties, getGfiUrl} or an emtpy array
 */
export function getJSONFeatures (layer, url) {
    if (typeof url !== "string") {
        return [];
    }
    return requestGfi("application/json", url, layer).then(featureInfos => {
        return handleJSONResponse(featureInfos, layer, url);
    });
}
/**
 * returns a list of objects representing the features called by url
 * @param {Object} featureInfos response from requestGFI
 * @param {Object} layer to show the properties of
 * @param {String} [layer.gfiTheme] the title of the theme - it does not check if the theme exists
 * @param {String} url the url to call the wms features from
 * @returns {Object[]}  a list of object{getTheme, getTitle, getAttributesToShow, getProperties, getGfiUrl} or an emtpy array
 */
export function handleJSONResponse (featureInfos, layer, url) {
    const map = mapCollection.getMap("2D"),
        dataProjection = map?.getView()?.getProjection(),
        geojsonReader = new GeoJSON({dataProjection, featureProjection: featureInfos?.crs?.properties?.name});
    let result = [];

    if (typeof featureInfos === "object" && Array.isArray(featureInfos?.features)) {
        featureInfos.features.forEach(function (feature) {
            if (typeof feature === "object") {
                feature.getProperties = () => interpretLinebreaks(feature.properties || {});
                feature.getId = () => feature.id || "";
                try {
                    result.push(createGfiFeature(layer, url, geojsonReader.readFeature(feature)));
                }
                catch (err) {
                    result.push(createGfiFeature(layer, url, feature));
                    if (typeof onerror === "function") {
                        onerror(new Error("handleJSONResponse: JSON structure in WMS FeatureInfo can't be parsed."));
                    }
                }
            }
        });
    }

    result = mergeFeatures(result, layer, url);

    return result;
}

/**
 * returns a list of objects representing the features called by url
 * @param {Object} layer to show the properties of
 * @param {String} [layer.layerName] the name of the requesting layer
 * @param {String} [layer.gfiTheme] the title of the theme - it does not check if the theme exists
 * @param {(Object|String)} [layer.attributesToShow] an object of attributes to show or a string "showAll" or "ignore"
 * @param {String} url the url to call the wms features from
 * @returns {Object[]}  a list of object{getTheme, getTitle, getAttributesToShow, getProperties, getGfiUrl} or an emtpy array
 */
export function getHtmlFeature (layer, url) {
    if (typeof url !== "string") {
        return [];
    }

    return requestGfi("text/html", url, layer).then(document => {
        return handleHTMLResponse(document, layer, url);
    });
}

/**
 * returns a list of objects representing the features called by url
 * @param {Object} document response from requestGFI, mimeType is "text/html"
 * @param {Object} layer to show the properties of
 * @param {String} url the url to call the wms features from
 * @returns {Object[]}  a list of object{getTheme, getTitle, getAttributesToShow, getProperties, getGfiUrl} or an emtpy array
 */
export function handleHTMLResponse (document, layer, url) {
    if (document !== null) {
        return [createGfiFeature(layer, url, null, null, document)];
    }
    return [];
}

/**
 * create an object representing a feature
 * @param {Object} layer to show the properties of
 * @param {String} [layer.layerName] the name of the requesting layer
 * @param {String} [layer.layerId] the id of the requesting layer
 * @param {String} [layer.gfiTheme] the title of the theme - it does not check if the theme exists
 * @param {(Object|String)} [layer.attributesToShow] an object of attributes to show or a string "showAll" or "ignore"
 * @param {String} url the url to call the wms features from
 * @param {String|Object} [feature=null] the feature to get the id and the properties from
 * @param {?Object} [feature.properties] an object with the data of the feature as simple key/value pairs
 * @param {String} [feature.id=""] id the id of the feature
 * @param {Object[]} [features=null] a list of features
 * @param {String} [document=""] A html document as string with gfi content.
 * @param {Number[]} optionalBBox the bbox can be passed to give the feature a bbox
 * @returns {Object} an object{getTitle, getTheme, getAttributesToShow, getProperties, getId, getGfiUrl, getLayerId, getBBox}
 */
export function createGfiFeature (layer, url = "", feature = null, features = null, document = "", optionalBBox = null) {
    if (!layer) {
        return {};
    }
    return {
        getTitle: () => {
            const gfiTitleAttribute = layer.get("gfiTitleAttribute"),
                layerName = layer.get("name");

            if (gfiTitleAttribute && feature) {
                const properties = feature.getProperties(),
                    attributeValue = properties[gfiTitleAttribute];

                if (attributeValue !== undefined && attributeValue !== null && attributeValue !== "" && attributeValue !== 0) {
                    return attributeValue;
                }
                console.warn(`GetFeatureInfo: gfiTitleAttribute "${gfiTitleAttribute}" is configured for layer "${layerName}" but the attribute is missing, empty, or null in the feature. Falling back to layer name.`);
            }
            return layerName;
        },
        getTheme: () => layer.get("gfiTheme") || "defaultTheme",
        getAttributesToShow: () => layer.get("gfiAttributes"),
        getProperties: () => feature ? interpretLinebreaks(feature.getProperties()) : {},
        getFeatures: () => features,
        getOlFeature: () => feature,
        getId: () => feature && typeof feature.getId === "function" ? feature.getId() : "",
        getGfiUrl: () => url,
        getMimeType: () => layer.get("infoFormat"),
        getLayerId: () => layer.get("id") ? layer.get("id") : "",
        getDocument: () => document,
        getBBox: () => optionalBBox
    };
}

/**
 * Create a merged feature because some themes might display multiple features at once
 * @param {Object[]} result Array of objects representing features
 * @param {Object} layer to show the properties of
 * @param {String} url the url to call the wms features from
 * @param {Number[]} optionalBBox the bbox can be passed to give the merged feature an bbox
 * @returns {Object[]}  an array of only one feature object or an empty object
 */
export function mergeFeatures (result, layer, url, optionalBBox) {
    if (result.length > 0 && layer && (["DataTable"].indexOf(layer.get("gfiTheme")) !== -1 || ["DataTable"].indexOf(layer.get("gfiTheme")?.name) !== -1)) {
        return [createGfiFeature(layer, url, null, result, undefined, optionalBBox)];
    }
    return result;
}

export default {getWmsFeaturesByMimeType, openFeaturesInNewWindow, getXmlFeatures, createGfiFeature, handleXmlResponse, handleHTMLResponse};
