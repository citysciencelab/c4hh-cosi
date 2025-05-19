import axios from "axios";

export default {

    async loadWorkflows ({state, commit}) {
        if (state.workflowsJSONPath.length !== 0) {
            const response = await axios.get(state.workflowsJSONPath);

            if (response && response.data) {
                commit("setWorkflowsJSON", response.data);
            }
        }
    },
    async loadSingleWorkflow ({state, getters}, workflowId) {
        if (getters.getWorkflowDetailsForId(workflowId) === null) {

            const path = getters.getWorkflowForId(workflowId)?.config;

            if (path && path.length !== 0) {
                const response = await axios.get(path);

                if (response && response.data) {
                    state.workflowsDetails.push(response.data);
                }
            }
        }
    },
    /**
     * Filter requests based on the provided bounding box and endpoint.
     * Sends a request to the specified endpoint with bounding box parameters
     * and commits the filtered data to the store.
     *
     * @param {Object} context - The Vuex context object.
     * @param {Function} context.commit - The Vuex commit function.
     * @param {Object} payload - The payload containing filtering parameters.
     * @param {string} payload.endpoint - The endpoint URL to send the request to.
     * @param {Array<number>} payload.bboxLowerLeftCorner - The lower-left corner of the bounding box [x, y].
     * @param {Array<number>} payload.bboxUpperRightCorner - The upper-right corner of the bounding box [x, y].
     * @returns {void}
     */
    async filterRequests ({commit}, payload) {
        commit("setIsLoading", true);

        const params = new URLSearchParams({
                min_x: payload.bboxLowerLeftCorner[0],
                min_y: payload.bboxLowerLeftCorner[1],
                max_x: payload.bboxUpperRightCorner[0],
                max_y: payload.bboxUpperRightCorner[1]
            }),
            requestUrl = `${payload.endpoint}?${params.toString()}`;

        axios.get(requestUrl, {
            headers: {
                "Content-Type": "application/json"
            }
        }).then(response => {
            if (response && response.data) {
                commit("setFilteredData", response.data);
                commit("setIsLoading", false);
            }
        }).catch(error => {
            console.error(error);
            commit("setIsLoading", false);
        });
    },
    /**
     * Submits a request to create an IFC (Industry Foundation Classes) file and monitors the job status.
     * Once the job is successful, retrieves the generated IFC file URL and commits it to the store.
     *
     * @param {Object} context - The Vuex context object.
     * @param {Function} context.commit - The Vuex commit function.
     * @param {Object} payload - The payload containing request parameters.
     * @param {string} payload.endpoint - The endpoint URL to send the create IFC request to.
     * @param {Object} payload.requestData - The required request data to be sent in the POST request body.
     * @param {String} payload.currentWorkflowId - The Id of the current workflow.
     * @returns {Promise<void>} Resolves when the job is completed and the IFC file URL is committed.
     */
    async submitCreateIfcRequest ({commit, state}, payload) {
        const requestUrl = payload.endpoint;

        commit("setIsLoading", true);

        await axios.post(requestUrl,
            payload.requestData,
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        ).then(
            response => {
                const jobId = response.data.id,
                    url = new URL(requestUrl),
                    updatedUrl = `${url.origin}/jobs/${jobId}`,
                    interval = setInterval(async () => {
                        try {
                            const resultResponse = await axios.get(updatedUrl, {
                                headers: {
                                    "Content-Type": "application/json"
                                }
                            });

                            if (resultResponse && resultResponse.data && resultResponse.data.status === "successful") {
                                clearInterval(interval);
                                state.generatedIfcUrl[payload.currentWorkflowId] = resultResponse.data.results.model["url-https"];
                                commit("setIsLoading", false);
                            }
                        }
                        catch (error) {
                            console.error("Error fetching results:", error);
                        }
                    }, 3000);
            }
        ).catch(error => {
            commit("setIsLoading", false);
            console.error(error);
        });
    },
    /**
     * Forces the download of a file from a given URL.
     * Fetches the file as a blob, creates a temporary download link, and triggers the download.
     * Cleans up the temporary link and revokes the object URL after the download is initiated.
     *
     * @param {Object} context - The Vuex context object.
     * @param {Function} context.commit - The Vuex commit function.
     * @param {string} url - The URL of the file to be downloaded.
     * @returns {Promise<void>} Resolves when the file download process is completed.
     * @throws {Error} Throws an error if the file fetch fails.
     */
    async forceFileDownload ({commit}, url) {
        commit("setIsLoading", true);
        // using fetch instead of axios as the download did not work with axios
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
        }

        // eslint-disable-next-line one-var
        const urlParts = url.split("/"),
            fileName = urlParts[urlParts.length - 1],
            blob = await response.blob(),
            blobUrl = URL.createObjectURL(blob),
            link = document.createElement("a");

        link.href = blobUrl;

        link.setAttribute("download", fileName);

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(blobUrl);

        commit("setIsLoading", false);
    }
};
