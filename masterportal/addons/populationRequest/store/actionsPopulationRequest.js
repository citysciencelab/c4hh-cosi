import {ogcApiProcesses} from "@masterportal/masterportalapi/src/index.js";

const actions = {

    /**
     * Fetch data from an OGC API - Processes service
     * @param {Object} param0 The vuex context
     * @param {Object} param1 The parameters
     * @param {Object} param1.feature The geojson feature to send as input
     * @param {Object} param1.service The service object from rest-services.json
     * @returns {Promise<void>} Promise
     */
    async fetchOAP ({state, commit}, {feature, service}) {
        const description = await ogcApiProcesses.processDescription(service.url, state.processName),
            // we expect a process with a single input expecting a geojson feature
            inputKey = Object.keys(description.inputs).at(0),
            body = {[inputKey]: feature},
            data = await ogcApiProcesses.executeProcess(service.url, state.processName, body);

        // we expect the data to be a stringified JSON
        commit("setProcessData", JSON.parse(data));
    }
};

export default actions;
