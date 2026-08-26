import {trackMatomoEvent, trackMatomoPageView} from "../trackMatomo.js";
import {assembleSourceInfoForEvent, convertToUriCompatible, getBaseUrl, getLayerInformation, isPayloadValid} from "../util.js";

/**
 * Tracks a page view (and menu event) whenever the content of the main or secondary menu changes.
 * Triggered by: Click on something that changes the content of the main or secondary menu.
 * @param {Object} payload The action payload.
 * @param {Object} [payload.props] The properties of the component being displayed.
 * @param {String} payload.side The menu side the component is shown on (main or secondary menu).
 * @param {String} payload.type The type of the component being displayed.
 * @param {Object} store The vuex store.
 * @returns {void}
 */
export function handleChangeCurrentComponent (payload, store) {
    const funcName = "handleChangeCurrentComponent";

    if (!isPayloadValid({funcName, payload})) {
        return;
    }

    handleActions(payload, store, funcName);
    handlePageView(payload, store, funcName);
}

/**
 * Dispatches Matomo events for relevant component-change actions in the menu.
 * Handles search bar focus, layer selection navigation, general menu item clicks,
 * and specific tool openings (streetSmart, vcOblique).
 * @param {Object} payload The action payload.
 * @param {Object} [payload.props] The properties of the component being displayed.
 * @param {String} [payload._source] The source component that triggered the action; included in the tracking event.
 * @param {String} payload.side The menu side (mainMenu or secondaryMenu).
 * @param {String} payload.type The type of the component being displayed.
 * @param {Object} store The Vuex store.
 * @param {String} funcName The name of the parent function (handleChangeCurrentComponent).
 * @returns {void}
 */
function handleActions (payload, store, funcName) {
    const {props, side, type} = payload;
    const _source = assembleSourceInfoForEvent(funcName, payload._source);

    if (type === "searchBar") {
        trackMatomoEvent({
            category: "Layer",
            action: "Started typing into search bar",
            _source
        });
    }
    else if (props !== undefined && type === "layerSelection") {
        if (props.layerId) {
            trackMatomoEvent({
                category: "Layer",
                action: "Clicked on \"go-to-layertree\"-button",
                name: getLayerInformation(props.layerId, store),
                _source
            });
        }
        else if (props.name.endsWith("addSubject")) {
            trackMatomoEvent({
                category: "Layer",
                action: "Clicked on \"Add layer\"-button",
                _source
            });
        }
    }
    else if (props !== undefined && type !== "getFeatureInfo" && type !== "layerInformation") {
        trackMatomoEvent({
            category: "Menu",
            action: `Clicked on item in ${payload._source ?? side}`,
            name: type,
            _source
        });
    }

    if (type === "streetSmart") {
        trackMatomoEvent({
            category: "Tool",
            action: "Opened tool",
            name: "360DegreePanorama",
            _source
        });
    }
    else if (type === "vcOblique") {
        trackMatomoEvent({
            category: "Tool",
            action: "Opened tool",
            name: "ObliqueAerialView",
            _source
        });
    }
}

/**
 * Reports a Matomo page view for the newly displayed menu component.
 * Constructs a URL and title from the menu side, component type, and navigation history,
 * stores the result in the UserTracking history, and calls trackMatomoPageView.
 * @param {Object} payload The action payload.
 * @param {Object} [payload.props] The properties of the component being displayed.
 * @param {String} payload.side The menu side (mainMenu or secondaryMenu).
 * @param {String} payload.type The type of the component being displayed.
 * @param {Object} store The Vuex store.
 * @param {String} funcName The name of the parent function (handleChangeCurrentComponent).
 * @returns {void}
 */
function handlePageView (payload, store, funcName) {
    const {props, side, type} = payload;

    // PageView
    let sectionTitle = "";

    if (props.name && props.name !== "none") {
        sectionTitle += typeof i18next !== "undefined" ? i18next.t(props.name) : props.name;
    }
    else if (type === "getFeatureInfo") {
        sectionTitle += document.querySelector(".gfi-title")?.textContent ?? "";
    }

    let section = "";

    if (type === "folder") {
        const navHistory = store.getters["Menu/navigationHistory"](side)
            .filter(history => history.type !== "root")
            .map(history => history.props.name);

        section += navHistory.length > 0 ? `/${navHistory.join("/")}` : "";
    }

    if (sectionTitle && (type === "layerInformation" || type === "getFeatureInfo" || type === "folder")) {
        section += `/${convertToUriCompatible(sectionTitle)}`;
    }

    const title = `${document.title} - ${sectionTitle}`,
        url = `${getBaseUrl()}${side}${type !== "folder" ? `/${type}` : ""}${section}`;

    store.commit("UserTracking/addPageToHistory", {side, title, url});
    trackMatomoPageView({url, title, _source: assembleSourceInfoForEvent(funcName)});
}
