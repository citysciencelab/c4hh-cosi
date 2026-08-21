/**
 * User type definition
 * @typedef {Object} state
 * @property {AbortController|null} abortController - The AbortController instance for managing OAF request cancellation.
 * @property {Array} statisticValues - The array of statistic values retrieved from the OAF collection.
 * @property {Object|null} oafSchema - The schema of the OAF collection, if loaded.
 * @property {Array} csvData - The array of statistic values to be exported as CSV.
 * @property {Array} percentiles - The array of percentiles to class the measurement for each dataset.
 * @property {boolean} dataLoading - Indicates whether data is currently being loaded.
 */
const state = {
    abortController: null,
    statisticValues: [],
    oafSchema: null,
    csvData: [],
    percentiles: null,
    dataLoading: false
};

export default state;
