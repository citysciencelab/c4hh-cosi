/**
 * User type definition
 * @typedef {Object} state
 * @property {AbortController|null} abortController - The AbortController instance for managing OAF request cancellation.
 * @property {Array} statisticValues - The array of statistic values retrieved from the OAF collection.
 * @property {Object|null} oafSchema - The schema of the OAF collection, if loaded.
 */
const state = {
    abortController: null,
    statisticValues: [],
    oafSchema: null
};

export default state;
