import store from "../../../src/app-store/index.js";
import {useLayerInformationStore} from "@modules/layerInformation/store/layerInformationStore.js";
import {actionCallback} from "./actionCallback.js";
import {configCommands} from "./configCommands.js";
import {mutationCallback} from "./mutationCallback.js";
import {piniaActionCallback} from "./piniaActionCallback.js";
import {trackMatomoEvent} from "./trackMatomo.js";
import {assembleSourceInfoForEvent, getBaseUrl, stripBodyParameterFromHref} from "./util.js";

/**
 * The Pinia store composables whose actions are observed for tracking.
 * @type {Function[]}
 */
const piniaStoresToObserve = [useLayerInformationStore];

/**
 * Initializes user tracking based on the global "Config" object.
 * If a Matomo configuration is present, Matomo is initialized.
 * Subscribes to Vuex store actions and mutations as well as to Pinia store actions so that relevant interactions are tracked.
 * @returns {void}
 */
export function initializeUserTracking () {
    if (typeof Config === "undefined") {
        return;
    }

    if (Config.userTracking) {
        const {matomo, options} = Config.userTracking;
        let isAvailable = false;

        if (matomo) {
            isAvailable = isAvailable || initializeMatomo(matomo);
        }

        if (isAvailable) {
            store.subscribe(mutation => mutationCallback(mutation));
            store.subscribeAction({after: action => actionCallback(action, store)});
            piniaStoresToObserve.forEach(useStore => {
                useStore().$onAction(({name, args, store: piniaStore, after}) => {
                    after(() => piniaActionCallback({name, args, storeId: piniaStore.$id}, store));
                });
            });

            if (options?.enableLinkTracking) {
                initializeLinkTracking();
            }
        }
    }
}

/**
 * Initializes the Matomo tracker with the provided configuration.
 * Sets the tracker URL and site ID, applies privacy and custom dimension settings,
 * optionally tracks the initial page view, and injects the Matomo script into the DOM.
 * @param {Object} config Matomo configuration object.
 * @param {String} config.siteId ID of the Matomo site to track.
 * @param {String} config.trackerScriptUrl URL of the Matomo JavaScript library.
 * @param {String} config.trackerUrl URL of the Matomo tracking endpoint.
 * @param {Object[]} [config.customDimension] List of custom dimension settings to apply. Each entry must have a `name` (String) and an `id` (Number).
 * @param {String[]} [config.privacy] List of privacy setting keys to apply.
 * @param {Boolean} [config.trackInitialView] Whether to track a page view on initialization.
 * @returns {Boolean} true, if tracking script has been added and false if script url is missing.
 */
export function initializeMatomo (config) {
    if (!config.siteId) {
        console.error("The config 'siteId' is missing.");
        return false;
    }

    if (!config.trackerScriptUrl) {
        console.error("The config 'trackerScriptUrl' is missing.");
        return false;
    }

    if (!config.trackerUrl) {
        console.error("The config 'trackerUrl' is missing.");
        return false;
    }

    window._paq = window._paq || [];
    window._paq.push(["setTrackerUrl", config.trackerUrl]);
    window._paq.push(["setSiteId", config.siteId]);

    config.privacy?.forEach((setting) => {
        if (configCommands.privacy.has(setting)) {
            configCommands.privacy.get(setting)();
        }
        else {
            console.warn(`Unknown Matomo privacy-setting: ${setting}`);
        }
    });

    config.customDimension?.forEach((setting) => {
        if (configCommands.customDimension.has(setting.name)) {
            configCommands.customDimension.get(setting.name)(setting.id);
        }
        else {
            console.warn(`Unknown Matomo customDimension-setting: ${setting}`);
        }
    });

    if (config.trackInitialView) {
        window._paq.push(["trackPageView"]);
    }

    const scriptElement = document.createElement("script");

    scriptElement.async = true;
    scriptElement.defer = true;
    scriptElement.src = config.trackerScriptUrl;
    scriptElement.type = "text/javascript";
    document.body.appendChild(scriptElement);

    return true;
}

/**
 * Registers a click listener on document.body that intercepts anchor clicks.
 * Tracks external links, mailto links, and blob download links via Matomo.
 * Internal links (same origin and pathname) are ignored.
 * @returns {void}
 */
export function initializeLinkTracking () {
    const funcName = "initializeLinkTracking";

    document.body.addEventListener("click", ({target}) => {
        const anchor = target.closest("a");

        if (!anchor || !anchor.href || anchor.href === "#") {
            return;
        }

        const hrefAsLowerCase = anchor.href.toLowerCase();

        if (hrefAsLowerCase.startsWith(getBaseUrl().toLowerCase())) {
            return;
        }

        let className = anchor.getAttribute("class"),
            id = anchor.getAttribute("id");

        if (!className && !id) {
            className = target.getAttribute("class");
            id = target.getAttribute("id");
        }

        if (Config.userTracking.matomo) {
            if (hrefAsLowerCase.startsWith("blob")) {
                trackMatomoEvent({
                    category: "Link",
                    action: "Triggered download",
                    name: `href: "${anchor.href.slice(5)} | class: "${className}" | id: "${id}"`,
                    _source: assembleSourceInfoForEvent(funcName)
                });
            }
            else {
                const isMailToLink = hrefAsLowerCase.startsWith("mailto");

                trackMatomoEvent({
                    category: "Link",
                    action: `Clicked on ${isMailToLink ? "mailto" : "external"} link`,
                    name: `href: "${isMailToLink ? stripBodyParameterFromHref(anchor.href) : anchor.href}" | class: "${className}" | id: "${id}"`,
                    _source: assembleSourceInfoForEvent(funcName)
                });
            }
        }
    });
}
