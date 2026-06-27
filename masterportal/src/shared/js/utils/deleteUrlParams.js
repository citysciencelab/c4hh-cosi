/**
 * Removes a list of parameters from an url case-insensitive.
 * @param {URL} url - the url to change
 * @param {String[]} params - the url parameter to remove
 * @returns {void}
 */
function deleteParams (url, params) {
    params.forEach(param => {
        const key = Array.from(url.searchParams.keys()).find(k => k.toLowerCase() === param);

        if (key) {
            url.searchParams.delete(key);
        }
    });
}

export {
    deleteParams
};
