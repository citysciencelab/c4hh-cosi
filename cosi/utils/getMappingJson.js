import axios from "axios";

/**
 * Returns the mapping array.
 * @returns {Promise<object[]>} Context object
 */
export default async function getMappingJson () {
    const response = await axios.get("assets/mapping.json", {
        headers: {
            "Content-Type": "application/json"
        }
    })
        .then(res => res.data)
        .catch(error => {
            console.error(error);
        });

    return Array.isArray(response) ? response : [];
}

/**
 * Returns an object containing the only function in this file. This is necessary for testing the components (otherwise the function could not be stubbed).
 * @returns {Object} Export as object
 */
export const getMappingJsonJS = {
    getMappingJson
};
