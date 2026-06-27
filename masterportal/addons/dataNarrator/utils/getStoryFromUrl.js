import axios from "axios";

/**
 * Returns the reference to a story step
 *
 * @param {String} url the path of the story JSON
 * @returns {String} the loaded story file
 */
export default function fetchDataFromUrl (url) {
    return axios
        .get(url)
        .then(response => {
            if (!response || !response.data) {
                throw new Error(`No data received from URL: ${url}`);
            }
            return response.data;
        })
        .catch(error => {
            if (axios.isAxiosError(error)) {
                throw new Error(`Failed to fetch data from URL: ${url}. Status: ${error.response?.status ?? "unknown"}`);
            }
            throw error;
        });
}

