import {WFS} from "ol/format.js";
import getProxyUrl from "../../../src/utils/getProxyUrl";
import axios from "axios";
import hash from "object-hash";

/**
 * CommuterApi is the api for the Tool "CommuterFlows"
 * <pre>
 * The CommuterApi provides access to the commuter wfs
 *
 * To import CommuterApi: import {CommuterApi} from "./commuterApi";
 * create a new object:        const obj = new CommuterApi(...);
 * </pre>
 * @class
 * @memberof Addons.CommuterFlows
 */
export class CommuterApi {

    /**
     * constructor of CommuterApi
     * @param {Object} optionsOpt the config for this object
     * @param {Boolean} optionsOpt.useProxy whether or not to use getProxyUrl
     * @param {String[]} optionsOpt.blacklistedDistricts a list of districts or cities to be excluded from any response
     * @param {String} optionsOpt.serviceUrl the url to the wfs service
     * @constructor
     * @returns {CommuterApi} the instance of CommuterApi
     */
    constructor (optionsOpt = {}) {
        this.cache = {};
        this.options = Object.assign({
            useProxy: false,
            blacklistedDistricts: [],
            serviceUrl: ""
        }, optionsOpt);
    }


    // public

    /**
     * returns a sorted list of available districts
     * @param {Function} onsuccess a function(list) with list as String[], called on success
     * @param {Function} onerror a function(error) with error as Error, called on error
     * @returns {void} -
     */
    getListDistricts (onsuccess, onerror) {
        const url = this.options.useProxy ? getProxyUrl(this.options.serviceUrl) : this.options.serviceUrl;

        if (!url) {
            return;
        }
        this.getFeatureCall(url, {
            typename: "app:mrh_kreise",
            maxFeatures: "10000"
        }, xmlResponse => {
            const list = this.parseResponseGetFeature(xmlResponse, "app:mrh_kreise", "app:kreisname", this.options.blacklistedDistricts);

            list.sort((a, b) => {
                if (a < b) {
                    return -1;
                }
                else if (a > b) {
                    return 1;
                }
                return 0;
            });
            onsuccess(list);
        }, onerror);
    }

    /**
     * returns a sorted list of available cities
     * @param {String} district the district to receive available cities from
     * @param {Function} onsuccess a function(list) with list as String[], called on success
     * @param {Function} onerror a function(error) with error as Error, called on error
     * @returns {void} -
     */
    getListCities (district, onsuccess, onerror) {
        const url = this.options.useProxy ? getProxyUrl(this.options.serviceUrl) : this.options.serviceUrl;

        if (!url) {
            return;
        }
        this.getFeatureCall(url, {
            "StoredQuery_ID": "SamtgemeindeZuKreis",
            kreis: district
        }, xmlResponse => {
            const list = this.parseResponseGetFeature(xmlResponse, "app:mrh_samtgemeinden", "app:gemeinde", this.options.blacklistedDistricts);

            list.sort((a, b) => {
                if (a < b) {
                    return -1;
                }
                else if (a > b) {
                    return 1;
                }
                return 0;
            });
            onsuccess(list);
        }, onerror);
    }

    /**
     * returns the necassary data to show the commuter lines and animations
     * the received featureList is a ol/Feature[] with values caption, value, coordinate and geom_line
     * @param {String} district the district to receive data for
     * @param {Boolean} homeToWork receive data for commuter from home to work (true) or work to home (false)
     * @param {Number} start the start of the pagination
     * @param {Number} len the length of the pagination, leave 0 to receive all from the point of start
     * @param {Function} onsuccess a function(data) with data as Object(caption, featureList, coordinate, totalMin, totalMax, totalLength, start, len)
     * @param {Function} onerror a function(error) with error as Error
     * @returns {void} -
     */
    getFeaturesDistrict (district, homeToWork, start, len, onsuccess, onerror) {
        const url = this.options.useProxy ? getProxyUrl(this.options.serviceUrl) : this.options.serviceUrl;

        if (!url) {
            return;
        }
        this.getFilterCall(url, {
            featureType: "app:mrh_pendler_kreise",
            propertyName: homeToWork ? "app:wohnort" : "app:arbeitsort",
            literal: district
        }, xmlText => {
            const rawFeatureList = this.convertXmlToFeatureList(xmlText, "mrh_pendler_kreise"),
                translatedFeatureList = this.translateFeatureList(
                    rawFeatureList,
                    homeToWork ? "arbeitsort" : "wohnort",
                    "anzahl_einpendler",
                    ["wohnort", "arbeitsort", "anzahl_einpendler", "richtung"],
                    homeToWork
                ),
                featureList = this.removeBlacklistedFeatures(translatedFeatureList, this.options.blacklistedDistricts),
                totalMin = this.getMinValue(featureList),
                totalMax = this.getMaxValue(featureList);

            featureList.sort((a, b) => {
                return b.get("value") - a.get("value");
            });
            onsuccess({
                caption: district,
                featureList: this.paginateFeatureList(featureList, start, len),
                coordinate: this.getCenterCoordinate(featureList, homeToWork),
                totalMin,
                totalMax,
                totalLength: featureList.length,
                start,
                len: len && len <= featureList.length ? len : featureList.length,
                source: "getFeaturesDistrict"
            });
        }, onerror);
    }

    /**
     * returns the necassary data to show the commuter lines and animations
     * the received featureList is a ol/Feature[] with values caption, value, coordinate and geom_line
     * @param {String} city the city to receive data for
     * @param {Boolean} homeToWork receive data for commuter from home to work (true) or work to home (false)
     * @param {Number} start the start of the pagination
     * @param {Number} len the length of the pagination, leave 0 to receive all from the point of start
     * @param {Function} onsuccess a function(data) with data as Object(caption, featureList, coordinate, totalMin, totalMax, totalLength, start, len)
     * @param {Function} onerror a function(error) with error as Error
     * @returns {void} -
     */
    getFeaturesCity (city, homeToWork, start, len, onsuccess, onerror) {
        const url = this.options.useProxy ? getProxyUrl(this.options.serviceUrl) : this.options.serviceUrl;

        if (!url) {
            return;
        }
        this.getFilterCall(url, {
            featureType: "app:mrh_einpendler_gemeinde",
            propertyName: homeToWork ? "app:wohnort" : "app:arbeitsort",
            literal: city
        }, xmlText => {
            const rawFeatureList = this.convertXmlToFeatureList(xmlText, "mrh_einpendler_gemeinde"),
                translatedFeatureList = this.translateFeatureList(
                    rawFeatureList,
                    homeToWork ? "arbeitsort" : "wohnort",
                    "anzahl_einpendler",
                    [
                        "wohnort",
                        "wohnort_kreis",
                        "arbeitsort",
                        "arbeitsort_kreis",
                        "anzahl_einpendler",
                        "anzahl_einpendler_maenner",
                        "anzahl_einpendler_frauen",
                        "anzahl_einpendler_deutsche",
                        "anzahl_einpendler_andere",
                        "anzahl_einpendler_auszubildende",
                        "richtung"
                    ],
                    homeToWork
                ),
                featureList = this.removeBlacklistedFeatures(translatedFeatureList, this.options.blacklistedDistricts),
                totalMin = this.getMinValue(featureList),
                totalMax = this.getMaxValue(featureList);

            featureList.sort((a, b) => {
                return b.get("value") - a.get("value");
            });
            onsuccess({
                caption: city,
                featureList: this.paginateFeatureList(featureList, start, len),
                coordinate: this.getCenterCoordinate(featureList, homeToWork),
                totalMin,
                totalMax,
                totalLength: featureList.length,
                start,
                len: len && len <= featureList.length ? len : featureList.length,
                source: "getFeaturesCity"
            });
        }, onerror);
    }


    // private

    /**
     * removes all features from featureList given by blacklist
     * @param {ol/Feature[]} featureList the list of ol/Feature to be filtered
     * @param {String[]} blacklist a simple array of districts or cities to be excluded from featureList
     * @returns {ol/Feature[]} the now whitelisted list of features
     */
    removeBlacklistedFeatures (featureList, blacklist) {
        const blacklistAssoc = {},
            result = [];

        blacklist.forEach(entry => {
            blacklistAssoc[entry] = true;
        });
        featureList.forEach(feature => {
            if (Object.prototype.hasOwnProperty.call(blacklistAssoc, feature.get("caption"))) {
                return;
            }
            result.push(feature);
        });

        return result;
    }

    /**
     * slices the given featureList using start and len
     * @param {ol/Feature[]} featureList the list of ol/Feature
     * @param {Number} start the start point of the pagination
     * @param {Number} len the length of the pagination, leave 0 to receive all from the point of start
     * @returns {ol/Feature[]} the paginated feature list
     */
    paginateFeatureList (featureList, start, len) {
        if (start === 0 && len === 0) {
            return featureList;
        }
        else if (start > 0 && len === 0) {
            return featureList.slice(start);
        }

        return featureList.slice(start, start + len);
    }

    /**
     * searches for the lowest value in the given featureList
     * @param {ol/Feature[]} featureList the list of ol/Feature
     * @returns {Number} the lowest number in the given feature list
     */
    getMinValue (featureList) {
        let min = 0;

        featureList.forEach(feature => {
            if (min === 0 || feature.get("value") < min) {
                min = feature.get("value");
            }
        });
        return min;
    }
    /**
     * searches for the hightest value in the given featureList
     * @param {ol/Feature[]} featureList the list of ol/Feature
     * @returns {Number} the hightest number in the given feature list
     */
    getMaxValue (featureList) {
        let max = 0;

        featureList.forEach(feature => {
            if (feature.get("value") > max) {
                max = feature.get("value");
            }
        });
        return max;
    }

    /**
     * returns the coordinate used as center point, using the first feature in the given list
     * @param {ol/Feature[]} featureList the list of ol/Feature
     * @param {Boolean} homeToWork interpret the geometry as commuter from home to work (true) or work to home (false)
     * @returns {Number[]} the coordinate to use as center point
     */
    getCenterCoordinate (featureList, homeToWork) {
        if (!Array.isArray(featureList) || !featureList.length) {
            return false;
        }
        return homeToWork ? featureList[0].getGeometry().getFirstCoordinate() : featureList[0].getGeometry().getLastCoordinate();
    }

    /**
     * tranlates specific wording of feature values into general wording
     * @param {ol/Feature[]} featureList the original list of ol/Feature - this list will also be changed
     * @param {String} keyCaption the key of the feature value to set as "caption"
     * @param {String} keyValue the key of the feature value to set as "value"
     * @param {String[]} keysToRemove a list of keys to unset from the feature (clear up)
     * @param {Boolean} homeToWork interpret the features geometry as commuter from home to work (true) or work to home (false)
     * @returns {ol/Feature[]} the given featureList with generalized values
     */
    translateFeatureList (featureList, keyCaption, keyValue, keysToRemove, homeToWork) {
        featureList.forEach(feature => {
            feature.set("caption", feature.get(keyCaption), true);
            feature.set("value", parseInt(feature.get(keyValue), 10), true);
            if (homeToWork) {
                feature.set("coordinate", feature.getGeometry().getLastCoordinate(), true);
            }
            else {
                feature.set("coordinate", feature.getGeometry().getFirstCoordinate(), true);
            }

            keysToRemove.forEach(key => {
                feature.unset(key, true);
            });
        });

        return featureList;
    }

    /**
     * converts the given xml string into a list of ol/Feature
     * @param {String} xmlText the string to use as source
     * @param {String} featureType the feature type used by the wfsReader
     * @returns {ol/Feature[]} a list of ol/Feature
     */
    convertXmlToFeatureList (xmlText, featureType) {
        const wfsReader = new WFS({
            featureNS: "http://www.deegree.org/app",
            featureType
        });

        return wfsReader.readFeatures(xmlText);
    }

    /**
     * creates a list of districts or cities using the xmlResponse of axios
     * removes blacklisted entries
     * @param {XMLDocument} xmlResponse the data as XMLDocument
     * @param {String} gmlApp the root key to search for
     * @param {String} gmlItem the leaf key to find the district or city in
     * @param {String[]} [blacklist=[]] a blacklist as simple array
     * @returns {String[]} a list of districts or cities
     */
    parseResponseGetFeature (xmlResponse, gmlApp, gmlItem, blacklist = []) {
        if (!(xmlResponse instanceof Document) && xmlResponse.constructor.name !== "XMLDocument") {
            return {};
        }

        const mainTags = xmlResponse.getElementsByTagName(gmlApp),
            result = [],
            blacklistAssoc = {};

        if (!(mainTags instanceof HTMLCollection)) {
            return {};
        }

        blacklist.forEach(entry => {
            blacklistAssoc[entry] = true;
        });
        Object.keys(mainTags).forEach(tagKey => {
            const item = mainTags[tagKey];

            if (
                !(item instanceof Element)
                || !(item.attributes instanceof NamedNodeMap)
                || !(item.getElementsByTagName(gmlItem) instanceof HTMLCollection)
                || !item.getElementsByTagName(gmlItem).length
                || !(item.getElementsByTagName(gmlItem)[0] instanceof Element)
                || Object.prototype.hasOwnProperty.call(blacklistAssoc, item.getElementsByTagName(gmlItem)[0].textContent)
            ) {
                return;
            }

            result.push(item.getElementsByTagName(gmlItem)[0].textContent);
        });
        return result;
    }


    /**
     * uses axios to receive data from the given wfs source using the GetFeature request
     * @param {String} url the service url
     * @param {String[]} params the params to add to the get request
     * @param {Function} onsuccess a function(response) where response.request.responseXML should be a XMLDocument
     * @param {Function} onerror a function(error) with error as Error
     * @returns {void} -
     */
    getFeatureCall (url, params, onsuccess, onerror) {
        const axiosParams = Object.assign({
                service: "WFS",
                request: "GetFeature",
                version: "2.0.0"
            }, params),
            cacheKey = hash.sha1(url + "_" + JSON.stringify(axiosParams));

        if (Object.prototype.hasOwnProperty.call(this.cache, cacheKey)) {
            onsuccess(this.cache[cacheKey]);
            return;
        }

        axios.get(url, {params: axiosParams})
            .then(response => {
                this.cache[cacheKey] = response?.request?.responseXML;
                onsuccess(this.cache[cacheKey]);
            })
            .catch(error => onerror(error));
    }

    /**
     * uses axios to receive data from the given wfs source using a post payload to filter for commuter data
     * @param {String} url the service url
     * @param {String[]} params the params to use for the raw post data
     * @param {Function} onsuccess a function(response) where response.data should be an xml string
     * @param {Function} onerror a function(error) with error as Error
     * @returns {void} -
     */
    getFilterCall (url, params, onsuccess, onerror) {
        const reqParams = Object.assign({
                featureType: "",
                propertyName: "",
                literal: "",
                service: "WFS",
                version: "1.1.0"
            }, params),
            payload = `<?xml version='1.0' encoding='UTF-8' ?>
<wfs:GetFeature service='${reqParams.service}' version='${reqParams.version}' xmlns:app='http://www.deegree.org/app' xmlns:wfs='http://www.opengis.net/wfs' xmlns:ogc='http://www.opengis.net/ogc'>
    <wfs:Query typeName='${reqParams.featureType}'>
        <ogc:Filter>
            <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>${reqParams.propertyName}</ogc:PropertyName>
                <ogc:Literal>${reqParams.literal}</ogc:Literal>
            </ogc:PropertyIsEqualTo>
        </ogc:Filter>
    </wfs:Query>
</wfs:GetFeature>`,
            cacheKey = hash.sha1(url + "_" + JSON.stringify(reqParams));

        if (Object.prototype.hasOwnProperty.call(this.cache, cacheKey)) {
            onsuccess(this.cache[cacheKey]);
            return;
        }

        axios.post(url, payload, {
            headers: {
                "Content-Type": "text/xml"
            }
        })
            .then(response => {
                this.cache[cacheKey] = response?.data;
                onsuccess(response?.data);
            })
            .catch(error => onerror(error));
    }
}
