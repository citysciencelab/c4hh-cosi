import axios from "axios";

export default {

    async loadWorkflows ({state, commit}) {
        if (state.workflowsJSONPath.length !== 0) {
            const timestamp = Date.now(),
                response = await axios.get(state.workflowsJSONPath + "?t=" + timestamp);

            if (response && response.data) {
                commit("setWorkflowsJSON", response.data);
            }
        }
    },
    async loadSingleWorkflow ({state, getters}, workflowId) {
        if (getters.getWorkflowDetailsForId(workflowId) === null) {

            const path = getters.getWorkflowForId(workflowId)?.config;

            if (path && path.length !== 0) {
                const timestamp = Date.now(),
                    response = await axios.get(path + "?t=" + timestamp);

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
     * @param {Object} payload - The payload containing request parameters.
     *          {endpoint: string} - The endpoint URL to send the create IFC request to.
     *          {requestData: Object} - The required request data to be sent in the POST request body.
     *          {currentWorkflowId: String} - The Id of the current workflow.
     * @returns {Promise<void>} Resolves when the job is completed and the IFC file URL is committed.
     */
    async submitCreateIfcRequest ({commit, getters, state, dispatch}, payload) {
        const requestUrl = payload.endpoint;

        commit("setIsLoading", true);
        commit("setIsRequestErrorGeneral", false);
        commit("clearComponentErrors");

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
                    timestamp = new Date().toISOString(),
                    interval = setInterval(async () => {
                        const tenMinutesLater = new Date(new Date(timestamp).getTime() + 10 * 60 * 1000).toISOString();

                        if (typeof getters.isRequestErrorGeneral === "string" && getters.isRequestErrorGeneral.length > 0) {
                            clearInterval(interval);
                        }
                        // abort the request if it takes longer than 10 minutes to process
                        else if (new Date().toISOString() > tenMinutesLater) {
                            clearInterval(interval);
                            commit("setIsLoading", false);
                            commit("setIsRequestErrorGeneral", i18next.t("additional:modules.bimfactory.workflow.components.submit.timeOutMessage"));
                        }

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
                            else if (resultResponse && resultResponse.data && resultResponse.data.status === "failed") {
                                commit("setIsLoading", false);
                                commit("setIsRequestErrorGeneral", resultResponse.data.message);
                                clearInterval(interval);
                            }
                        }
                        catch (error) {
                            console.error("Error fetching results:", error);
                            commit("setIsLoading", false);
                            clearInterval(interval);
                            commit("setIsRequestErrorGeneral", error);
                        }
                    }, 3000);
            }
        ).catch(error => {
            commit("setIsLoading", false);
            dispatch("parseErrorResponse", error);
        });
    },
    /**
     * Checks whether bbox or machineName exist in the error location "loc".
     *
     * @param {Object} _ - Unused Vuex context.
     * @param {Object} errorItem - The error item from the server response {msg: string, type:string, loc: array}.
     * @returns {Object} An object containing the detected machineName or type.
     */
    detectMachineName (_, errorItem) {
        const
            loc = errorItem.loc,
            compIdx = loc.indexOf("components");

        if (loc.includes("bbox")) {
            return {type: "BimFactoryWorkflowFilter"};
        }

        if (compIdx !== -1 && loc.length > compIdx + 1) {
            const
                machineName = loc[compIdx + 1];

            return {machineName};
        }

        return {};
    },
    /**
     * Parse the error response from server and put the error in its place in the data structure of components
     * @param {Object} ctx - The Vuex context object.
     * @param {Object} errorObject from server response
     */
    async parseErrorResponse ({state, commit, dispatch}, errorObject) {
        commit("setIsRequestErrorGeneral", errorObject.message);

        await Promise.all(errorObject.response.data.detail.map(async errorItem => {
            const {machineName, type} = await dispatch("detectMachineName", errorItem);

            // break after first match per machineName. backend delivers currently only one error per machineName.
            let targetFound = false;

            state.workflowsDetails.forEach((workflow, workflowIdx) => {
                if (targetFound || !workflow.steps) {
                    return;
                }
                workflow.steps.forEach((step, stepIdx) => {
                    if (targetFound || !step.sections) {
                        return;
                    }

                    step.sections.forEach((section, sectionIdx) => {
                        section.containers.forEach((container, containerIdx) => {
                            container.components.forEach((component, componentIdx) => {
                                if (!targetFound
                                    && (
                                        (type === "BimFactoryWorkflowFilter" && component.type === type)
                                        || (component.machineName === machineName)
                                    )
                                ) {
                                    // drop overhead
                                    delete errorItem.input;

                                    commit("addErrorToComponent", {
                                        workflowIdx,
                                        stepIdx,
                                        sectionIdx,
                                        containerIdx,
                                        componentIdx,
                                        errorItem
                                    });

                                    targetFound = true;
                                }
                            });
                        });
                    });
                });
            });
        })
        );
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
