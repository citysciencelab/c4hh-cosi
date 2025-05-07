import axios from "axios";

/**
 * Class representing an OGC API Process.
 * @class OgcApiProcess
*/
export default class OgcApiProcess {

    /**
     * Creates an instance of OgcApiProcess.
     * @constructor
     * @param {string} baseUrl - The base URL of the OGC API. Be sure to include the trailing slash.
     * @param {string} processId - The ID of the process.
    */
    constructor (baseUrl, processId) {
        this.baseUrl = baseUrl;
        this.processId = processId;
    }

    /**
    * Fetches the process description.
    * @throws {Error} If an error occurs while fetching the process description.
    * @returns {Promise<Object|undefined>} The process description or undefined if an error occurs.
    */
    async getDescription () {
        try {
            const url = new URL(`processes/${this.processId}`, this.baseUrl),
                response = await axios.get(url);

            return response.data;
        }
        catch (error) {
            console.warn("Error fetching process description:", error);
            throw error;
        }
    }

    /**
     * Static method to get the input defaults from the process description.
     * @param {Object} description - The process description.
     * @param {Object} description.inputs - The inputs of the process.
     * @returns {Object} An object containing the default values for the inputs.
    */
    static getInputDefaultsFromDescription (description) {
        const defaultsObject = {};

        if (!description?.inputs) {
            return defaultsObject;
        }

        for (const inputKey in description.inputs) {
            const input = description.inputs[inputKey];

            if (Object.hasOwn(input, "default")) {
                defaultsObject[inputKey] = input.default;
            }

            if (input.schema?.type === "object") {
                for (const propertyKey in input.schema.properties) {
                    const property = input.schema.properties[propertyKey];

                    if (Object.hasOwn(property, "default")) {
                        defaultsObject[inputKey] ??= {};
                        defaultsObject[inputKey][propertyKey] = property.default;
                    }
                }
            }
        }

        return defaultsObject;
    }

    /**
     * Executes the process with the given request body.
     * @param {Object} requestBody - The request body for the process execution.
     * @returns {Promise<Object>} The response data from the process execution. Normally a job status object with job ID.
     */
    async execute (requestBody) {
        const url = new URL(`processes/${this.processId}/execution`, this.baseUrl),
            response = await axios.post(url, requestBody);

        return response.data;
    }

    /**
     * Fetches the status of a job with the given job ID.
     * @param {string} jobId - The ID of the job.
     * @returns {Promise<Object>} The job status object.
     */
    async getJobStatus (jobId) {
        const url = new URL(`jobs/${jobId}`, this.baseUrl),
            response = await axios.get(url);

        return response.data;
    }

    /**
     * Fetches the result of a job with the given job ID.
     * @param {string} jobId - The ID of the job.
     * @returns {Promise<Object>} The job results object.
     */
    async getJobResults (jobId) {
        const url = new URL(`jobs/${jobId}/results`, this.baseUrl),
            response = await axios.get(url);

        return response.data;
    }

    /**
     * Executes the process, polls for the job status, and retrieves the results.
     * @param {Object} requestBody - The request body for the process execution.
     * @param {number} [pollingInterval=1000] - The interval in milliseconds to poll for job status.
     * @param {function} [onProgressUpdate=null] - Optional callback function to handle progress updates.
     * @returns {Promise<Object>} The job results object.
     * @throws {Error} If an error occurs during execution or if the job fails.
     */
    async executeAndGetResults (requestBody, pollingInterval = 1000, onProgressUpdate = null) {
        try {
            const executeResponse = await this.execute(requestBody),
                jobId = executeResponse?.jobID;

            if (!jobId) {
                console.warn("No job ID returned from the execute request.");
            }

            let jobStatus = await this.getJobStatus(jobId);

            while (jobStatus?.status === "running") {
                await new Promise(resolve => setTimeout(resolve, pollingInterval));
                jobStatus = await this.getJobStatus(jobId);
                onProgressUpdate?.({...jobStatus});
            }

            if (jobStatus?.status !== "successful") {
                console.warn(`Job failed with status: ${jobStatus?.status}`);
            }

            return await this.getJobResults(jobId);
        }
        catch (error) {
            console.warn("Error executing process and getting job result:", error);
            throw error;
        }
    }
}
