/**
 * User type definition
 * @typedef {Object} state
 * @property {AbortController|null} abortController - The AbortController instance for managing OAF request cancellation.
 * @property {Array} statisticValues - The array of statistic values retrieved from the OAF collection.
 * @property {Array} allData - The array of all data retrieved from the OAF collection.
 * @property {Object|null} oafSchema - The schema of the OAF collection, if loaded.
 * @property {Array} csvData - The array of statistic values to be exported as CSV.
 * @property {Array} percentiles - The array of percentiles to class the measurement for each dataset.
 * @property {Object} disclaimerData - The object of json notated blocks for the text for the disclaimer, normalized to allowed content.
 * @property {boolean} dataLoading - Indicates whether data is currently being loaded.
 * @property {Object} dateRange - An object containing date range information for the statistics.
 */
const state = {
    abortController: null,
    statisticValues: [],
    allData: [],
    oafSchema: null,
    csvData: [],
    percentiles: null,
    disclaimerData: null,
    dataLoading: false,
    dateRange: {
        startDate: null,
        endDate: null,
        allYears: [],
        allMonths: [],
        allDataStartMonth: null,
        endMonth: null,
        allDataStartYear: null,
        endYear: null,
        twelveMonthsAgoMonth: null,
        twelveMonthsAgoYear: null
    }
};

export default state;
