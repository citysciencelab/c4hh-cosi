import Cookie from "@modules/login/js/utilsCookies.js";
import utilsUrl from "@modules/login/js/utilsUrl.js";
import utilsOIDC from "@modules/login/js/utilsOIDC.js";

const tokenUpdatedEventName = "masterportal:login-token-updated";

/**
 * Resolves a URL used for websocket auth checks from MQTT options.
 * Prefer rhPath because it usually points to the SensorThings HTTP root and
 * follows the same interceptor matching as HTTP requests.
 *
 * @param {object} mqttOptions - MQTT options object.
 * @returns {string} URL string used for auth matching or empty string.
 */
function resolveWebsocketAuthUrl (mqttOptions) {
    if (typeof mqttOptions?.rhPath === "string" && mqttOptions.rhPath.length > 0) {
        return mqttOptions.rhPath;
    }

    const host = mqttOptions?.host || mqttOptions?.hostname,
        protocol = typeof mqttOptions?.protocol === "string" ? mqttOptions.protocol : "wss",
        path = typeof mqttOptions?.path === "string" ? mqttOptions.path : "/",
        port = mqttOptions?.port;

    if (typeof host !== "string" || !host) {
        return "";
    }

    try {
        if (host.startsWith("ws://") || host.startsWith("wss://") || host.startsWith("http://") || host.startsWith("https://")) {
            const url = new URL(path, host);

            if (port && !url.port) {
                url.port = String(port);
            }
            return url.toString();
        }

        const portSuffix = port ? `:${port}` : "";

        return `${protocol}://${host}${portSuffix}${path.startsWith("/") ? path : `/${path}`}`;
    }
    catch {
        return "";
    }
}

/**
 * Checks whether websocket auth should be added for the given MQTT options.
 *
 * @param {object} mqttOptions - MQTT options object.
 * @param {string|RegExp} interceptorUrlRegex - URL matcher configuration.
 * @returns {boolean} True if token should be attached.
 */
function shouldAddWebsocketToken (mqttOptions, interceptorUrlRegex) {
    const authUrl = resolveWebsocketAuthUrl(mqttOptions);

    if (!authUrl || !interceptorUrlRegex) {
        return false;
    }

    return utilsUrl.shouldAddToken(authUrl, interceptorUrlRegex);
}

/**
 * Returns MQTT auth options derived from current login token.
 *
 * @param {object} mqttOptions - MQTT options object.
 * @param {string|RegExp} interceptorUrlRegex - URL matcher configuration.
 * @returns {object} Object containing username/password or empty object.
 */
function getMqttAuthOptions (mqttOptions, interceptorUrlRegex) {
    if (!shouldAddWebsocketToken(mqttOptions, interceptorUrlRegex)) {
        return {};
    }

    const token = Cookie.get("token");

    if (typeof token !== "string" || token.length === 0) {
        return {};
    }

    return {
        username: utilsOIDC.getUserUuidFromToken(token) || "Bearer",
        password: token
    };
}

/**
 * Applies MQTT auth options in-place based on global login interceptor config.
 *
 * @param {object} mqttOptions - MQTT options object to mutate.
 * @param {string|RegExp} [interceptorUrlRegex] - Optional matcher override.
 * @returns {object} The mutated MQTT options object.
 */
function applyMqttAuthOptions (mqttOptions, interceptorUrlRegex) {
    const resolvedRegex = interceptorUrlRegex ?? Config?.login?.interceptorUrlRegex,
        authOptions = getMqttAuthOptions(mqttOptions, resolvedRegex);

    if (typeof mqttOptions !== "object" || mqttOptions === null || !Object.keys(authOptions).length) {
        return mqttOptions;
    }

    return Object.assign(mqttOptions, authOptions);
}

/**
 * Returns the global token updated event name.
 *
 * @returns {string} The event name.
 */
function getTokenUpdatedEventName () {
    return tokenUpdatedEventName;
}

export default {
    resolveWebsocketAuthUrl,
    shouldAddWebsocketToken,
    getMqttAuthOptions,
    applyMqttAuthOptions,
    getTokenUpdatedEventName
};
