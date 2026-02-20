import axios from "axios";
import Cookie from "@modules/login/js/utilsCookies.js";

/**
 * Adds interceptors to the different HTTP Get methods of javascript
 *
 * @param {string|RegExp} interceptorUrlRegex regex to match the urls that shall be equipped with the bearer token
 * @return {void}
 */
function addInterceptor (interceptorUrlRegex) {
    if (!interceptorUrlRegex) {
        return;
    }

    axios.interceptors.request.use(
        config => {
            let configUrl = config.url;

            if (typeof configUrl === "object" && configUrl !== null && typeof configUrl.toString === "function") {
                configUrl = configUrl.toString();
            }

            if (typeof configUrl !== "string" || !configUrl.match(interceptorUrlRegex)) {
                return config;
            }

            const token = Cookie.get("token");

            if (!token) {
                console.warn("No authentication token found in cookies");
                return config;
            }

            if (!config.headers) {
                config.headers = {};
            }

            config.headers.Authorization = `Bearer ${token}`;
            config.withCredentials = true;

            return config;
        },
        error => {
            return Promise.reject(error);
        }
    );

    (function (open, setRequestHeader) {
        XMLHttpRequest.prototype._hasAuth = false;

        XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
            if (header.toLowerCase() === "authorization" && this._hasAuth) {
                return;
            }

            this._hasAuth = true;
            setRequestHeader.call(this, header, value);
        };

        XMLHttpRequest.prototype.open = function (method, url, ...rest) {
            const opened = open.call(this, method, url, ...rest);
            let href;

            if (typeof url === "string") {
                href = url;
            }
            else if (url && typeof url.toString === "function") {
                href = url.toString();
            }

            if (interceptorUrlRegex && typeof href === "string" && href.match(interceptorUrlRegex)) {
                const token = Cookie.get("token");

                if (!token) {
                    console.warn("No authentication token found in cookies");
                    return opened;
                }

                this.setRequestHeader("Authorization", `Bearer ${token}`);
                this.withCredentials = true;
            }

            return opened;
        };
    })(XMLHttpRequest.prototype.open, XMLHttpRequest.prototype.setRequestHeader);

    const {fetch: originalFetch} = window;

    window.fetch = async (resource, originalConfig) => {
        const href = typeof resource !== "string" ? resource.toString() : resource;

        let config = originalConfig;

        if (interceptorUrlRegex && href?.match(interceptorUrlRegex)) {
            const token = Cookie.get("token");

            if (!token) {
                console.warn("No authentication token found in cookies");
                return originalFetch(resource, config);
            }

            config = {
                ...originalConfig,
                credentials: "include",
                headers: {
                    ...originalConfig?.headers,
                    "Authorization": `Bearer ${token}`
                }
            };
        }

        return originalFetch(resource, config);
    };

}

export default {
    addInterceptor
};
