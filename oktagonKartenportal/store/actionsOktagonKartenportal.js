import {search} from "@masterportal/masterportalapi/src/searchAddress";
import thousandsSeparator from "../../../src/utils/thousandsSeparator";
import axios from "axios";

export default {
    /**
    * Adds the coordinate parameters to the submit object
    * @param  {Array} coordinate contains clicked coordinates
    * @returns {void}
    */
    addCoordinatesToSubmitObject ({getters, commit}, coordinate) {
        const submitObject = getters.submitObject;

        submitObject.KoordinateX = thousandsSeparator(coordinate[0]).replace(/\./g, "");
        submitObject.KoordinateY = thousandsSeparator(coordinate[1]).replace(/\./g, "");

        commit("setSubmitObject", submitObject);
    },
    /**
    * Trigger an alert for wrong input Parameters.
    * @returns {void}
    */
    alertWrongInputParameters ({dispatch}) {
        dispatch("Alerting/addSingleAlert",
            "<strong>" + i18next.t("additional:modules.tools.oktagon.wrongAddressParameter") + "</strong>"
            + "<br>"
            + "<small>" + i18next.t("additional:modules.tools.oktagon.wrongAddressParameterMessage") + "</small>",
            {root: true}
        );
    },
    /**
    * Assembles the address from the URL parameters.
    * @param {Object} result - The url parameters.
    * @returns {void}
    */
    createAddress ({dispatch, commit, getters}, result) {
        const searchParams = {
            searchStreets: true
        };
        let address = getters.getParameterValue({result: result, property: "STRASSE"});

        if (result?.HAUSNUMMER && result.HAUSNUMMER.length > 0) {
            address += " " + getters.getParameterValue({result: result, property: "HAUSNUMMER"});
            searchParams.searchAddress = true;
        }
        if (result?.ZUSATZ) {
            address += getters.getParameterValue({result: result, property: "ZUSATZ"});
            searchParams.searchAddress = true;
        }

        commit("setAddress", address.toUpperCase());
        dispatch("startSearch", {searchInput: address, searchParams: searchParams});
    },
    /**
    * Handles the wms response.
    * @param {Object} response The wms response.
    * @returns {void}
    */
    handleResponse ({dispatch, getters}, response) {
        const result = response.find(element => element.name.toUpperCase() === getters.address);

        dispatch("zoomToAddress", result?.geometry?.coordinates);
    },

    /**
    * Processes the url parameter.
    * @returns {void}
    */
    initURLParameter ({dispatch, commit, getters}) {
        const result = {},
            params = new URLSearchParams(window.location.search);

        params.forEach(function (value, key) {
            if (key === "rueckurl") {
                commit("setReturnURL", value);
            }
            result[key.toUpperCase()] = decodeURIComponent(value.toUpperCase());
        });

        if (result?.BEZIRK) {
            const districtFromUrl = getters.getParameterValue({result: result, property: "BEZIRK"});
            let districtNameToZoom = "";

            districtNameToZoom = getters.hasDistrict(districtFromUrl);
            if (districtNameToZoom === "") {
                dispatch("Alerting/addSingleAlert",
                    "<strong>" + i18next.t("additional:modules.tools.oktagon.wrongDistrictName") + "</strong>"
                    + "<br>"
                    + "<small>" + i18next.t("additional:modules.tools.oktagon.wrongDistrictNameMessage") + districtFromUrl + ".</small>",
                    {root: true}
                );
            }
            else {
                commit("ZoomTo/setZoomToGeometry", districtNameToZoom, {root: true});
                dispatch("ZoomTo/zoomToFeatures", {}, {root: true});
            }
        }
        else if (result?.STRASSE) {
            dispatch("createAddress", result);
        }


    },
    /**
    * Parses the xml response
    * @param  {Object} xml contains the response xml
    * @returns {void}
    */
    parseXML ({getters, commit}, xml) {
        const xmlElements = Array.from(xml.getElementsByTagName("FIELDS")).length > 0 ? Array.from(xml.getElementsByTagName("FIELDS")) : Array.from(xml.getElementsByTagName("app:baubloecke")),
            submitObject = getters.submitObject;

        xmlElements.forEach(xmlElement => {
            if (xmlElement.getElementsByTagName("app:baublockbezeichnung").length > 0) {
                submitObject.Baublock = xmlElement.getElementsByTagName("app:baublockbezeichnung")[0].textContent;
            }
            if (xmlElement.getAttribute("Gemarkungsname")) {
                submitObject.Gemarkungsname = xmlElement.getAttribute("Gemarkungsname");
            }
            if (xmlElement.getAttribute("Gemarkungsnummer")) {
                submitObject.Gemarkungsnummer = xmlElement.getAttribute("Gemarkungsnummer");
            }
            if (xmlElement.getAttribute("Flurstuecksnummer")) {
                submitObject.Flurstuecksnummer = xmlElement.getAttribute("Flurstuecksnummer");
            }
        });

        commit("setSubmitURL", getters.createSubmitURL(submitObject));
        commit("setSubmitObject", {});
        commit("setSubmitObject", submitObject);
    },
    /**
    * Requests the ALKIS WMS and starts to parse the xml response
    * @param  {String} url contains the url
    * @returns {void}
    */
    requestALKISWMS ({dispatch}, url) {
        axios({
            method: "get",
            url: url,
            responseType: "document"
        }).then(response => {
            dispatch("parseXML", response.data);
        }).catch(error => {
            console.warn("The fetch of the data failed with the following error message: " + error);
            dispatch("Alerting/addSingleAlert",
                "<strong>" + i18next.t("additional:modules.tools.oktagon.fetchFailed") + "</strong> <br>"
                + "<small>" + i18next.t("additional:modules.tools.oktagon.fetchFailedMessage") + "</small>"
            );
        });
    },
    /**
     * Starts the search via the MasterportalAPI
     * @param {Object} searchObject contains the search input and search parameter.
     * @returns {void}
     */
    startSearch ({dispatch}, searchObject) {
        search(searchObject.searchInput, searchObject.searchParams, true)
            .then((searchResults) => {
                dispatch("handleResponse", searchResults);
            })
            .catch(error => {
                if (String(error) !== "AbortError: The user aborted a request.") {
                    console.error(error);
                }
            });
    },
    /**
    * Zooms the map to the address.
    * @param {Array} coordinates contains the coordinates.
    * @returns {void}
    */
    zoomToAddress ({dispatch}, coordinates) {
        const coordinatesArray = [];

        if (coordinates && coordinates !== null && Array.isArray(coordinates)) {
            coordinates.forEach(coordinate => {
                coordinatesArray.push(parseFloat(coordinate));
            });

            dispatch("Maps/setCenter", coordinatesArray, {root: true});
            dispatch("Maps/setZoomLevel", 9, {root: true});
            dispatch("MapMarker/placingPointMarker", coordinatesArray, {root: true});
        }
        else {
            dispatch("alertWrongInputParameters");
        }
    }
};
