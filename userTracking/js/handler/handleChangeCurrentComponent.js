import {trackMatomoEvent, trackMatomoPageView} from "../trackMatomo.js";
import {getBaseUrl, convertToUriCompatible, isPayloadValid} from "../util.js";

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
    if (!isPayloadValid({funcName: handleChangeCurrentComponent.name, payload})) {
        return;
    }

    const {props, side, type} = payload;

    // Actions
    if (props !== undefined && type !== "getFeatureInfo" && type !== "searchBar" && type !== "layerSelection") {
        trackMatomoEvent({
            category: "Menu",
            action: "Menuitem clicked",
            name: typeof i18next !== "undefined" ? i18next.t(props.name) : props.name ?? ""
        });
    }

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
    trackMatomoPageView(url, title);
}
