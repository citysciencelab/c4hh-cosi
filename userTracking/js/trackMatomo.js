import {checkClientCredibility} from "./checkClientCredibility";

const unsentEventLimit = 5000;
let hasBeenCheckedForCredibility = false;

/**
 * Pushes a trackEvent call to the global Matomo queue (window._paq).
 * @param {Object} eventParams Object containing the Matomo event parameters.
 * @param {String} eventParams.category Category of the matomo event.
 * @param {String} eventParams.action Description of action of the matomo event.
 * @param {String} [eventParams.name] Name of the matomo event.
 * @param {Number} [eventParams.value] Value of the matomo event.
 * @param {String} eventParams._source Name of the handler-function that triggers the request (used for debugging).
 * @returns {void}
 */
export function trackMatomoEvent (eventParams) {
    const funcName = "trackMatomoEvent";

    if (typeof Config === "undefined" || !Config.userTracking?.matomo) {
        return;
    }

    if (Config.userTracking?.options?.enableCredibilityCheck && !hasBeenCheckedForCredibility) {
        checkClientCredibility().then(result => {
            window._paq.push([
                "trackEvent",
                "Client",
                `Credibility is ${result.isCredible ? "good" : "bad"}`,
                `Reasons: ${result.reasons.length > 0 ? result.reasons.join(", ") : "none"}`,
                result.score
            ]);
        }).catch(() => { /* */ });
        hasBeenCheckedForCredibility = true;
    }

    const {action, category, name, value} = eventParams;

    if (window._paq) {
        if (Array.isArray(window._paq) && window._paq.length > unsentEventLimit) {
            console.warn(`${funcName}: limit of ${unsentEventLimit} unsent events has been reached`);
            return;
        }

        window._paq.push(["trackEvent", category, action, name, value]);
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
