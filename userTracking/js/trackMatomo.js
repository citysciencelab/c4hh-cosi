
/**
 * Pushes a trackEvent call to the global Matomo queue (_paq).
 * @param {Object} eventParams Object containing the Matomo event parameters.
 * @param {String} eventParams.category Category of the matomo event.
 * @param {String} eventParams.action Description of action of the matomo event.
 * @param {String} [eventParams.name] Name of the matomo event.
 * @param {Number} [eventParams.value] Value of the matomo event.
 * @param {String} eventParams._source Name of the handler-function that triggers the request (used for debugging).
 * @returns {void}
 */
export function trackMatomoEvent (eventParams) {
    if (typeof Config === "undefined" || !Config.userTracking?.matomo) {
        return;
    }

    const {action, category, name, value} = eventParams;

    if (window._paq) {
        window._paq.push(["trackEvent", category, action, name, value]);
    }
    else {
        console.warn(`${trackMatomoEvent.name}: window._paq is not defined -> is omitted ${JSON.stringify(eventParams)}.`);
    }
}

/**
 * Pushes a setCustomUrl and trackPageView call to the global Matomo queue (_paq).
 * @param {Object} eventParams Object containing the Matomo event parameters.
 * @param {String} eventParams.url The custom URL representing the current view.
 * @param {String} eventParams.title The title of the page view.
 * @param {String} eventParams._source Name of the handler-function that triggers the request (used for debugging).
 * @returns {void}
 */
export function trackMatomoPageView (eventParams) {
    if (typeof Config === "undefined" || !Config.userTracking?.matomo) {
        return;
    }

    if (window._paq) {
        window._paq.push(["setCustomUrl", eventParams.url]);
        window._paq.push(["trackPageView", eventParams.title]);
    }
    else {
        console.warn(`${trackMatomoPageView.name}: window._paq is not defined -> is omitted ${JSON.stringify(eventParams)}.`);
    }
}
