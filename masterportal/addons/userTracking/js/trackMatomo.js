import {checkClientCredibility} from "./checkClientCredibility";

const deferredEvents = [],
    unsentEventLimit = 5000;

let hasBeenCheckedForCredibility = false,
    hasUserNavigated = false;

/**
 * Pushes a trackEvent call to the global Matomo queue (window._paq).
 * The function calls itself iteratively to handle deferred events.
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

    deferredEvents.splice(0).forEach(trackMatomoEvent);

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
 * Holds back a Matomo event until the next regular event is tracked, so that it does not count as user activity by itself.
 * @param {Object} eventParams The event parameters, see trackMatomoEvent.
 * @returns {void}
 */
export function trackMatomoEventDeferred (eventParams) {
    deferredEvents.push(eventParams);
}

/**
 * Pushes a setCustomUrl and trackPageView call to the global Matomo queue (window._paq).
 * @param {Object} eventParams Object containing the Matomo event parameters.
 * @param {String} eventParams.url The custom URL representing the current view.
 * @param {String} eventParams.title The title of the page view.
 * @param {String} eventParams._source Name of the handler-function that triggers the request (used for debugging).
 * @param {Boolean} isUserNavigation Is true if the event is triggered by a user interaction.
 * @returns {void}
 */
export function trackMatomoPageView (eventParams, isUserNavigation = true) {
    const funcName = "trackMatomoPageView";

    if (
        typeof Config === "undefined"
        || !Config.userTracking?.matomo
        || (Config.userTracking.matomo.trackFirstNavigationOnly && hasUserNavigated)
    ) {
        return;
    }

    if (!hasUserNavigated) {
        hasUserNavigated = isUserNavigation;
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
