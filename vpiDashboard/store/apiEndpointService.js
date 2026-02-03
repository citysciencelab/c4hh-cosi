import {Config} from "../config.js";
import axios from "axios";
import {buildEndpointUrl} from "../utils/buildEndpointUrl.js";
import dayjs from "dayjs";

const apiEndpointService = {
    /**
     * Receive "visitors" from the "tgl_besucher" endpoint.
     * @param {Array} locationIds Current location ID
     * @param {String} date Date in format YYYY-MM-DD
     * @param {String} dateTo Date in format YYYY-MM-DD
     * @return {Array[Promise<axios.AxiosResponse<any>>]} geoId, date and visitors data.
     */
    async receiveVisitors (locationIds, date = null, dateTo = null) {
        const promises = [];

        locationIds.forEach(locationId => {
            const
                url = `${Config.OGCAPI.host}${Config.OGCAPI.basepath}/tgl_besucher/items`,
                query = {
                    geoid: locationId,
                    f: "json",
                    limit: 10000,
                    skipGeometry: true};

            if (date !== null) {
                query.datetime = `${date}T00:00:00Z/${dateTo ? dateTo : date}T23:59:59Z`;
            }

            promises.push(this.fetchAllFeatures(url, query));
        });

        return Promise.all(promises);

    },
    /**
     * Receive "hourly visitors" from the "hourly visitors" endpoint.
     * @param {Array} locationIds Current location ID
     * @param {String} date Date in format YYYY-MM-DD
     * @param {String} dateTo Date in format YYYY-MM-DD
     * @return {Array[Promise<axios.AxiosResponse<any>>]} Visitor types data
     */
    async receiveVisitorsHourly (locationIds, date = null, dateTo = null) {
        const promises = [];

        locationIds.forEach(locationId => {
            const
                url = `${Config.OGCAPI.host}${Config.OGCAPI.basepath}/stndl_besucher/items`,
                query = {
                    geoid: locationId,
                    f: "json",
                    limit: 10000,
                    offset: 0,
                    skipGeometry: true
                };

            if (date !== null) {
                query.datetime = `${date}T00:00:00Z/${dateTo}T23:59:59Z`;
            }

            promises.push(this.fetchAllFeatures(url, query));
        });

        const responses = await Promise.all(promises);

        responses.forEach(response => {
            response.features.sort((a, b) => {
                const dateA = dayjs(a.properties.datum).utc(),
                    dateB = dayjs(b.properties.datum).utc(),
                    timeA = a.properties.startuhrzeit,
                    timeB = b.properties.startuhrzeit;

                if (dateA.isBefore(dateB)) {
                    return -1;
                }
                if (dateA.isAfter(dateB)) {
                    return 1;
                }
                return timeA - timeB;
            });
        });

        return responses;

    },
    /**
     * Receive "genders" from the "tgl_besucher_nach_geschl" endpoint.
     * @param {Array} locationIds Current location ID
     * @param {String} date Date in format YYYY-MM-DD
     * @param {String} dateTo Date in format YYYY-MM-DD
     * @return {Array[Promise<axios.AxiosResponse<any>>]} visitors by gender data
     */
    async receiveGenders (locationIds, date = null, dateTo = null) {
        const promises = [];

        locationIds.forEach(locationId => {
            const
                url = `${Config.OGCAPI.host}${Config.OGCAPI.basepath}/tgl_besucher_nach_geschl/items`,
                query = {geoid: locationId, f: "json", limit: 10000, offset: 0, skipGeometry: true};

            if (date !== null) {
                query.datetime = `${date}T00:00:00Z/${dateTo ? dateTo : date}T23:59:59Z`;
            }

            promises.push(this.fetchAllFeatures(url, query));
        });

        return Promise.all(promises);
    },
    /**
     * Receive "age groups" from the "tgl_besucher_nach_alter" endpoint.
     * @param {Array} locationIds Current location ID
     * @param {String} date Date in format YYYY-MM-DD
     * @param {String} dateTo Date in format YYYY-MM-DD
     * @return {Array[Promise<axios.AxiosResponse<any>>]} Age groups data
     */
    async receiveAgeGroups (locationIds, date = null, dateTo = null) {
        const promises = [];

        locationIds.forEach(locationId => {
            const
                url = `${Config.OGCAPI.host}${Config.OGCAPI.basepath}/tgl_besucher_nach_alter/items`,
                query = {geoid: locationId, f: "json", limit: 10000, offset: 0, skipGeometry: true};

            if (date !== null) {
                query.datetime = `${date}T00:00:00Z/${dateTo ? dateTo : date}T23:59:59Z`;
            }

            promises.push(this.fetchAllFeatures(url, query));
        });

        return Promise.all(promises);
    },
    /**
     * Receive "origins cities" from the "tgl_besucher_nach_landkr" endpoint.
     * @param {Array} locationIds Current location ID
     * @param {String} date Date in format YYYY-MM-DD
     * @param {String} dateTo Date in format YYYY-MM-DD
     * @return {Promise<Array<axios.AxiosResponse<any>>>} Origins Cities data
     */
    async receiveOriginsCities (locationIds, date = null, dateTo = null) {
        const promises = [];

        locationIds.forEach(locationId => {
            const
                url = `${Config.OGCAPI.host}${Config.OGCAPI.basepath}/tgl_besucher_nach_landkr/items`,
                query = {geoid: locationId, f: "json", limit: 10000, offset: 0, skipGeometry: true};

            if (date !== null) {
                query.datetime = `${date}T00:00:00Z/${dateTo ? dateTo : date}T23:59:59Z`;
            }

            promises.push(this.fetchAllFeatures(url, query));
        });

        return Promise.all(promises);
    },
    /**
     * Receive "origins postal code" from the "tgl_besucher_nach_plz" endpoint.
     * @param {String} locationId Current location ID
     * @param {String} date Date in format YYYY-MM-DD
     * @param {String} dateTo Date in format YYYY-MM-DD
     * @return {Promise<axios.AxiosResponse<any>>} Origins Postal Code data
     */
    async receiveOriginsPostalCode (locationId, date = null, dateTo = null) {
        const
            url = `${Config.OGCAPI.host}${Config.OGCAPI.basepath}/tgl_besucher_nach_plz/items`,
            query = {geoid: locationId, f: "json", limit: 10000, offset: 0, skipGeometry: true};

        if (date !== null) {
            query.datetime = `${date}T00:00:00Z/${dateTo ? dateTo : date}T23:59:59Z`;
        }

        return this.fetchAllFeatures(url, query);
    },
    /**
     * Receive "origins roamers" from the "tgl_besucher_international" endpoint.
     * @param {String} locationId Current location ID
     * @param {String} date Date in format YYYY-MM-DD
     * @param {String} dateTo Date in format YYYY-MM-DD
     * @return {Promise<axios.AxiosResponse<any>>} Origins Roamers data
     */
    async receiveOriginsInternational (locationId, date = null, dateTo = null) {
        const
            url = `${Config.OGCAPI.host}${Config.OGCAPI.basepath}/tgl_besucher_international/items`,
            query = {geoid: locationId, f: "json", limit: 10000, offset: 0, skipGeometry: true};

        if (date !== null) {
            query.datetime = `${date}T00:00:00Z/${dateTo ? dateTo : date}T23:59:59Z`;
        }

        return this.fetchAllFeatures(url, query);
    },
    /**
     * Recursively fetch all features until matched number is reached.
     * @return {Promise<axios.AxiosResponse<any>>} Visitor types data
     */
    async fetchAllFeatures (url, query, prevFeatures = []) {
        try {
            const response = await axios.get(buildEndpointUrl(url, query)),
                features = prevFeatures.concat(response.data.features);

            query.offset += response.data.numberReturned;

            if (response.data.numberMatched > query.offset) {
                return this.fetchAllFeatures(url, query, features);
            }

            response.data.features = features;

            return response.data;
        }
        catch (error) {
            console.error("Error fetching API data:", error);
            throw error;
        }
    }
};

export default apiEndpointService;
