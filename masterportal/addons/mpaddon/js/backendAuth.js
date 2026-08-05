import axios from "axios";

/**
 * Backend auth glue for the c4hh-app connection.
 *
 * Two jobs:
 *  1. Attach the Bearer token to every request aimed at the backend origin — so
 *     Masterportal's NATIVE OAF layer (which loads features via window.fetch)
 *     authenticates without any custom data-fetching code in the addon.
 *  2. Keep that token fresh. The access token is short-lived (~15 min); we
 *     transparently refresh it (single-flight) just before it expires, using the
 *     refresh token the backend handed us in the login body (opt-in via
 *     `X-Auth-Mode: token`, since a cross-origin client can't read the httpOnly
 *     refresh cookie). If the refresh token itself is dead, we signal auth-lost
 *     so the UI returns to the login form.
 *
 * We patch fetch + axios (NOT XMLHttpRequest): axios already sets Authorization
 * on its own XHR, so a second setRequestHeader would be concatenated by the XHR
 * spec into "Bearer a, Bearer b" — a malformed header the backend reads as
 * anonymous. Bearer-only, no credentials:"include" (keeps wildcard CORS working).
 *
 * SECURITY NOTE: the refresh token lives in localStorage (a cross-origin
 * Masterportal addon can't use the httpOnly cookie). That's the standard
 * tradeoff for a token client; the eventual OIDC/Keycloak path removes it.
 */
const TOKEN_KEY = "mpaddon.token",
    REFRESH_KEY = "mpaddon.refreshToken",
    BACKEND_KEY = "mpaddon.backendUrl",
    // Refresh when fewer than this many seconds of access-token life remain.
    SKEW_SECONDS = 60;

let installed = false,
    refreshPromise = null,
    hooks = {onTokensRefreshed: () => undefined, onAuthLost: () => undefined};

/**
 * Coerces a fetch/XHR resource (string | URL | Request) to a URL string.
 * @param {(string|URL|Request)} resource the request target
 * @returns {string} the url as a string
 */
function toUrlString (resource) {
    if (typeof resource === "string") {
        return resource;
    }
    if (resource instanceof URL) {
        return resource.href;
    }
    if (typeof Request !== "undefined" && resource instanceof Request) {
        return resource.url;
    }
    return String(resource ?? "");
}

/**
 * @returns {(string|null)} the configured backend origin, or null
 */
function backendOrigin () {
    const url = localStorage.getItem(BACKEND_KEY);

    if (!url) {
        return null;
    }
    try {
        return new URL(url).origin;
    }
    catch (e) {
        return null;
    }
}

/**
 * @param {(string|URL|Request)} resource the request target
 * @returns {boolean} whether the request targets the backend origin
 */
function targetsBackend (resource) {
    const origin = backendOrigin();

    if (!origin) {
        return false;
    }
    try {
        return new URL(toUrlString(resource), window.location.href).origin === origin;
    }
    catch (e) {
        return false;
    }
}

/**
 * Decodes a JWT's `exp` claim without verifying the signature.
 * @param {string} token the JWT
 * @returns {number} the exp (unix seconds), or 0 if unreadable
 */
function tokenExp (token) {
    try {
        let b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");

        while (b64.length % 4) {
            b64 += "=";
        }
        const exp = JSON.parse(atob(b64)).exp;

        return typeof exp === "number" ? exp : 0;
    }
    catch (e) {
        return 0;
    }
}

/**
 * @param {string} token the access token
 * @returns {boolean} whether it is missing/expired/within the refresh skew
 */
function isExpiringSoon (token) {
    const exp = tokenExp(token);

    if (!exp) {
        return true;
    }
    return exp - Math.floor(Date.now() / 1000) < SKEW_SECONDS;
}

/**
 * Exchanges the stored refresh token for a fresh access (+ refresh) token.
 * @returns {Promise<(string|null)>} the new access token, or null on failure
 */
async function doRefresh () {
    const backendUrl = localStorage.getItem(BACKEND_KEY),
        refreshToken = localStorage.getItem(REFRESH_KEY);

    if (!backendUrl || !refreshToken) {
        hooks.onAuthLost();
        return null;
    }
    try {
        const {data} = await axios.post(`${backendUrl.replace(/\/+$/, "")}/api/auth/refresh`, {}, {
            headers: {"X-Refresh-Token": refreshToken, "X-Auth-Mode": "token"},
            __mpaddonSkipAuth: true,
            timeout: 30000
        });

        if (!data?.accessToken) {
            hooks.onAuthLost();
            return null;
        }
        localStorage.setItem(TOKEN_KEY, data.accessToken);
        if (data.refreshToken) {
            localStorage.setItem(REFRESH_KEY, data.refreshToken);
        }
        hooks.onTokensRefreshed(data.accessToken);
        return data.accessToken;
    }
    catch (err) {
        // 401 ⇒ refresh token expired/revoked ⇒ session is over. Network blips
        // just fail this attempt without forcing a logout.
        if (err?.response?.status === 401) {
            hooks.onAuthLost();
        }
        return null;
    }
}

/**
 * Single-flight refresh: concurrent callers share one in-flight request.
 * @returns {Promise<(string|null)>} the new access token, or null
 */
function refreshOnce () {
    if (!refreshPromise) {
        refreshPromise = doRefresh().finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
}

/**
 * The current access token, refreshed first if it is missing/near expiry.
 * @returns {Promise<(string|null)>} a usable access token, or null
 */
async function freshToken () {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
        return null;
    }
    return isExpiringSoon(token) ? refreshOnce() : token;
}

/**
 * Installs the request interceptors once. Idempotent across HMR/reloads.
 * @param {object} [options] hooks
 * @param {function(string):void} [options.onTokensRefreshed] called with a new access token
 * @param {function():void} [options.onAuthLost] called when the refresh token is dead
 * @returns {void}
 */
export default function installBackendAuth (options = {}) {
    hooks = {
        onTokensRefreshed: options.onTokensRefreshed || (() => undefined),
        onAuthLost: options.onAuthLost || (() => undefined)
    };
    if (installed) {
        return;
    }
    installed = true;

    // axios — the addon's own API calls. `__mpaddonSkipAuth` lets the login and
    // refresh requests bypass token attachment (avoids a refresh recursion).
    axios.interceptors.request.use(async (config) => {
        if (config.__mpaddonSkipAuth || !targetsBackend(config.url)) {
            return config;
        }
        const token = await freshToken();

        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    // fetch — masterportalapi's OAF layer loads features through window.fetch.
    if (!window.fetch.__mpaddonWrapped) {
        const originalFetch = window.fetch.bind(window);

        /**
         * @param {(string|URL|Request)} resource the request target
         * @param {object} config the fetch init options
         * @param {string} token the bearer token to attach
         * @returns {object} a fetch init object with Authorization set
         */
        function withAuth (resource, config, token) {
            const headers = new Headers(
                (config && config.headers)
                || (typeof Request !== "undefined" && resource instanceof Request ? resource.headers : undefined)
            );

            headers.set("Authorization", `Bearer ${token}`);
            return {...config, headers};
        }

        /**
         * @param {(string|URL|Request)} resource the request target
         * @param {object} [config] the fetch init options
         * @returns {Promise} the fetch response
         */
        async function wrapped (resource, config) {
            if (!targetsBackend(resource)) {
                return originalFetch(resource, config);
            }
            const token = await freshToken();

            if (!token) {
                return originalFetch(resource, config);
            }
            let res = await originalFetch(resource, withAuth(resource, config, token));

            // Reactive fallback: a 401 despite a "fresh" token means it was
            // revoked server-side — try one forced refresh + retry.
            if (res.status === 401) {
                const retried = await refreshOnce();

                if (retried) {
                    res = await originalFetch(resource, withAuth(resource, config, retried));
                }
            }
            return res;
        }

        wrapped.__mpaddonWrapped = true;
        window.fetch = wrapped;
    }
}
