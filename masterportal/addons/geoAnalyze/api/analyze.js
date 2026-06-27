import axios from "axios";

/**
 * @param {String} url - The server URL that will be used for the request.
 * @param {String} payload - The data to be sent as the request body.
 * @returns {Promise<module:ol/Feature[]>}  Promise object represents the request
 */
export function requestAnalyze (url, payload) {
    return axios.post(url, payload)
        .then(response => response.data)
        .catch(error => errorHandling(error));
}

/**
 * Handles an axios error.
 * @param {Object} error - The axios error.
 * @returns {Object} The error message.
 * @see {@link https://github.com/axios/axios#handling-errors}
 */
function errorHandling (error) {
    let errorMessage = "";

    if (error.response) {
        console.error(error.response.data);
        console.error(error.response.status);
        console.error(error.response.headers);
        errorMessage = "The request was made and the server responded with a status code that falls out of the range of 2xx.";
    }
    else if (error.request) {
        // `error.request` is an instance of XMLHttpRequest
        console.error(error.request);
        errorMessage = "The request was made but no response was received.";
    }
    else {
        console.error("Error", error.message);
        errorMessage = "Something happened in setting up the request that triggered an Error.";
    }
    console.error("requestAnalyze: " + errorMessage);
    console.warn(error.config);
    return {
        errorMessage
    };
}


export default {requestAnalyze};
