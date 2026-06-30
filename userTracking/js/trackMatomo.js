
/**
 * Pushes a trackEvent call to the global Matomo queue (_paq).
 * @param {Object} eventParams Object containing the Matomo event parameters.
 * @param {String} eventParams.category Category of the matomo event.
 * @param {String} eventParams.action Description of action of the matomo event.
 * @param {String} [eventParams.name] Name of the matomo event.
 * @param {Number} [eventParams.value] Value of the matomo event.
 * @returns {void}
 */
export function trackMatomoEvent ({category, action, name, value}) {
    if (typeof Config === "undefined" || !Config.userTracking?.matomo) {
        return;
    }

    if (window._paq) {
        window._paq.push(["trackEvent", category, action, name, value]);
    }
    else {
        console.warn(`window._paq is not defined -> event {category: "${category}", action: "${action}", name: "${name}", value: "${value}"} is omitted.`);
    }
}

/**
 * Pushes a setCustomUrl and trackPageView call to the global Matomo queue (_paq).
 * @param {String} url The custom URL representing the current view.
 * @param {String} title The title of the page view.
 * @returns {void}
 */
export function trackMatomoPageView (url, title) {
    if (window._paq) {
        window._paq.push(["setCustomUrl", url]);
        window._paq.push(["trackPageView", title]);
    }
}
