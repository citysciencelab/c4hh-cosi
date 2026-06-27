/**
 * Loads a JavaScript file and returns a Promise when it is loaded
 * @param {String} src the URL to Load
 * @returns {Promise} the promise
 */
export default function loadPackage (src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");

        script.type = "text/javascript";
        script.onload = resolve;
        script.onerror = reject;
        script.src = src;
        document.head.append(script);
    });
}

