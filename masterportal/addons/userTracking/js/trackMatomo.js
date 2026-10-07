import {checkClientCredibility} from "./checkClientCredibility";

const unsentEventLimit = 5000;
let hasBeenCheckedForCredibility = false;

/**
 * Pushes a trackEvent call to the global Matomo queue (window._paq).
 * @param {Object} eventParams Object containing the Matomo event parameters.
 * @param {String} eventParams.category Category of the matomo event.
 * @param {String} eventParams.action Description of action of the matomo event.
 * @param {String} eventParams.name Name of the matomo event.
 * @param {Number} [eventParams.value] Value of the matomo event (no meaningful use for Masterportal).
 * @param {String} eventParams._source Name of the handler-function that triggers the request (used for debugging).
 * @returns {void}
 */
export function trackMatomoEvent (eventParams) {
    const funcName = "trackMatomoEvent";

    if (typeof Config === "undefined" || !Config.userTracking?.matomo) {
        return;
    }

    if (Config.userTracking?.options?.enableCredibilityCheck && !hasBeenCheckedForCredibility && window._paq) {
        checkClientCredibility().then(result => {
            window._paq.push([
                "trackEvent",
                "Client",
                `Credibility is ${result.isCredible ? "good" : "bad"}`,
                `Reasons: ${result.reasons.length > 0 ? result.reasons.join(", ") : "none"} - Score: ${result.score}`
            ]);
        }).catch(() => {
            console.warn(`${funcName}: Browser-check failed.`);
        });
        hasBeenCheckedForCredibility = true;
    }

    let hasMissingParameters = false;

    ["action", "category", "name"].forEach(param => {
        if (!eventParams[param]) {
            console.error(`${funcName}: "${param}" is missing`);
            hasMissingParameters = true;
        }
    });

    if (hasMissingParameters) {
        return;
    }

    const {action, category, name, value} = eventParams;

    if (value !== undefined) {
        console.warn(`${funcName}: values are ignored as they are added up by Matomo (e.g. sold items, money)`);
    }

    if (window._paq) {
        if (Array.isArray(window._paq) && window._paq.length > unsentEventLimit) {
            console.warn(`${funcName}: limit of ${unsentEventLimit} unsent events has been reached`);
            return;
        }

        window._paq.push(["trackEvent", category, action, name]);
    }
    else {
        console.warn(`${funcName}: window._paq is not defined -> is omitted ${JSON.stringify(eventParams)}.`);
    }
}

/**
 * Pushes a setCustomUrl and trackPageView call to the global Matomo queue (window._paq).
 * @param {Object} eventParams Object containing the Matomo event parameters.
 * @param {String} eventParams.url The custom URL representing the current view.
 * @param {String} eventParams.title The title of the page view.
 * @param {String} eventParams._source Name of the handler-function that triggers the request (used for debugging).
 * @returns {void}
 */
export function trackMatomoPageView (eventParams) {
    const funcName = "trackMatomoPageView";

    if (typeof Config === "undefined" || !Config.userTracking?.matomo) {
        return;
    }

    if (!eventParams.title || !eventParams.url) {
        console.error(`${funcName}: "title" and/or "url" is missing`);
        return;
    }

    if (window._paq) {
        if (Array.isArray(window._paq) && window._paq.length > unsentEventLimit) {
            console.warn(`${funcName}: limit of ${unsentEventLimit} unsent events has been reached`);
            return;
        }

        window._paq.push(["setCustomUrl", eventParams.url]);
        window._paq.push(["trackPageView", eventParams.title]);
    }
    else {
        console.warn(`${funcName}: window._paq is not defined -> is omitted ${JSON.stringify(eventParams)}.`);
    }
}
