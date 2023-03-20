import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList";
import axios from "axios";

/**
 * Help function to define the namespace
 * @param {String} str String to search within
 * @param {String} start Start tag for search
 * @param {String} end End tag for search
 * @returns {void}
 */
function getStringBetween (str, start, end) {
    const result = str.match(new RegExp(start + "(.*)" + end));

    if (result === null) {
        return "app";
    }
    return result[1];
}

const actions = {
    /**
     * Iterates over layerIds defined in the state, creates the url and executes the wfs request.
     * @param {Object} getters vuex element
     * @param {Object} dispatch vuex element
     * @returns {void}
     */
    requestRawLayerList ({getters, dispatch}) {
        getters.layerIds.forEach(async (layerId) => {
            const rawLayer = await rawLayerList.getLayerWhere({id: layerId}),
                getFeatureUrl = await dispatch("buildAndGetRequestUrl", rawLayer);

            await dispatch("sendRequest", getFeatureUrl);
        });
    },

    /**
     * Checks for highlighting layer from zoomTo and removes it.
     * @param {Object} dispatch vuex element
     * @param {String} url url for the wfs request
     * @returns {void}
     */
    sendRequest ({dispatch}, url) {
        axios({
            url: url,
            type: "GET",
            timeout: 6000
        }).then(response => {
            dispatch("parseFeatures", response.data);
        }).catch(() => {
            dispatch("Alerting/addSingleAlert", url + " " + i18next.t("additional:modules.tools.refugeehomes.requestAlert"), {root: true});
        });
    },

    /**
     * Builds the wfs request from layer information.
     * @param {Object} state vuex element
     * @param {Object} rawLayer wfs layer
     * @returns {String} wfs query string
     */
    buildAndGetRequestUrl (state, rawLayer) {
        const params = "?service=WFS&request=GetFeature&version=2.0.0&typeNames=",
            url = rawLayer.url,
            featureType = rawLayer.featureType;

        return url + params + featureType;
    },

    /**
    * Processes the url parameter.
    * @param {Object} dispatch vuex element
    * @param {Object} getters vuex element
    * @returns {void}
    */
    initURLParameter ({dispatch, getters}) {
        const result = {},
            params = new URLSearchParams(window.location.search);

        params.forEach(function (value, key) {
            result[key.toUpperCase()] = decodeURIComponent(value.toUpperCase());
        });

        if (result?.BEZIRK) {
            const districtFromUrl = getters.getParameterValue({result: result, property: "BEZIRK"});
            let districtNameToZoom = "";

            districtNameToZoom = getters.hasDistrict(districtFromUrl);

            if (districtNameToZoom === "") {
                dispatch("Alerting/addSingleAlert",
                    "<strong>" + i18next.t("additional:modules.tools.refugeehomes.wrongDistrictName") + "</strong>"
                    + "<br>"
                    + "<small>" + i18next.t("additional:modules.tools.refugeehomes.wrongDistrictNameMessage") + districtFromUrl + ".</small>",
                    {root: true}
                );
            }
            else {
                Radio.trigger("RefugeesTable", "showFeaturesByBezirk", districtNameToZoom, true);
            }
        }
    },

    /**
     * Parses the xml data
     * @param {Object} commit vuex element
     * @param {XML} data xml data
     * @returns {void}
     */
    parseFeatures ({getters, dispatch, commit, rootGetters}, data) {
        const xmlData = new DOMParser().parseFromString(data, "text/xml"),
            hits = xmlData.getElementsByTagName("wfs:member"),
            nameSpace = getStringBetween(data, "</", ":bezeichnung");

        let feature,
            element,
            coordEle,
            coord;

        [...hits].forEach(hit => {
            feature = {
                id: hit.childNodes[1].getAttribute("gml:id")
            };

            getters.featureAttributes.forEach((attr) => {
                element = hit.getElementsByTagName(nameSpace + ":" + attr)[0];

                if (typeof element !== "undefined") {
                    if (attr === "pfad") {
                        const pfadArray = element.innerHTML.split("|");

                        feature[attr] = pfadArray;
                    }
                    else if (attr === "geom") {
                        coordEle = hit.getElementsByTagName("gml:pos")[0];
                        coord = coordEle.innerHTML.split(" ");

                        feature[attr] = [parseFloat(coord[0]), parseFloat(coord[1])];
                    }
                    else {
                        feature[attr] = element.innerHTML;
                    }

                    feature.featureType = hit.childNodes[1].localName;
                    feature.imgSrc = rootGetters.imagePath + feature.featureType + ".svg";
                }
            });
            dispatch("scaleImages", feature);
            commit("addFeature", feature);
        });
    },
    /**
     * Sets the image height depending on the number of seats of a location for image manipulation
     * @param {Object} context vuex element
     * @param {Object} feature wfs feature
     * @returns {void}
     */
    scaleImages (context, feature) {
        const seatNumbers = feature.platzzahl;

        if (seatNumbers === 0) {
            feature.imgHeight = 30;
        }
        else if (seatNumbers < 100) {
            feature.imgHeight = 20;
        }
        else if (seatNumbers >= 250) {
            feature.imgHeight = 30;
        }
        else {
            feature.imgHeight = 25;
        }
        return feature;
    }
};

export default actions;
