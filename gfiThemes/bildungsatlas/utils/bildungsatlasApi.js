import {WFS} from "ol/format.js";
import Feature from "ol/Feature.js";
import axios from "axios";
import hash from "object-hash";
import {isComplexType} from "../../../utils/complexType.js";

/**
 * a complex type is an object to represent a wfs array
 * @typedef {Object} ComplexType
 * @property {Object} metadata the metadata to describe the content of the array
 * @property {String} metadata.type the type e.g. "timeseries"
 * @property {String} metadata.format the format of the keys e.g. "DD.MM.YYYY"
 * @property {String} metadata.description the description of the values
 * @property {ComplexTypeValue[]} values an array of values
 */

/**
 * a set of data in a complex type is an object with key and value params
 * @typedef {Object} ComplexTypeValue
 * @property {String|Number} key the key of the array entry
 * @property {*} value the value for the key
 */

/**
 * BildungsatlasApi is the api for special gfi windows of the "Bildungsatlas"
 * @class
 * @memberof Addons.GfiThemes.BildungsatlasApi
 */
export class BildungsatlasApi {
    /**
     * constructor of BildungsatlasApi
     * @param {String|boolean} configUrl the url to the config of the api
     * @param {Object|boolean} [wfsUrls=false] the assignment of wfs feature types (key) and their urls (value) - configUrl is ignored
     * @param {Object|boolean} [featureTypes=false] the assignment attribute to feature type for bezirk, stadtteil, sozialraum and statistischeGebiete - configUrl is ignored
     * @param {Function|boolean} [mockWfsCall=false] a mockup (for testing) to avoid network traffic - a function(url, params, onsuccess, onerror)
     * @param {Boolean} [noSingletonOpt=false] for testing only - set true to turn off singleton behavior for testing
     * @constructor
     * @returns {BildungsatlasApi} the instance of BildungsatlasApi
     */
    constructor (configUrl, wfsUrls = false, featureTypes = false, mockWfsCall = false, noSingletonOpt = false) {
        if (!noSingletonOpt) {
            // make this instance a singleton
            if (BildungsatlasApi.instance instanceof BildungsatlasApi) {
                return BildungsatlasApi.instance;
            }
            BildungsatlasApi.instance = this;
        }

        // an array to collect callbacks while config is loading - this is a static var in case two apis are quickly constructed
        BildungsatlasApi.startupCallbacks = [];

        this.wfsUrls = wfsUrls;
        this.featureTypes = featureTypes;
        this.mockWfsCall = mockWfsCall;

        this.cache = {};

        // configUrl
        this.initConfig(configUrl);
    }

    /**
     * returns the complex type of the given property name for the town
     * @param {String} propertyName the property name to receive the data for
     * @param {Function} onsuccess a function(ComplexType) on success
     * @param {Function} onerror a function(error) with error of type Error
     * @returns {void}
     */
    getComplexTypeStadt (propertyName, onsuccess, onerror) {
        this.getComplexType(propertyName, BildungsatlasApi.KEY_BEZIRK, "bezirk_id", "0", onsuccess, onerror);
    }

    /**
     * returns the complex type of the given property name for the "Bezirk"
     * @param {String} propertyName the property name to receive the data for
     * @param {Number} bezirk_id the id of the "Bezirk"
     * @param {Function} onsuccess a function(ComplexType) on success
     * @param {Function} onerror a function(error) with error of type Error
     * @returns {void}
     */
    getComplexTypeBezirk (propertyName, bezirk_id, onsuccess, onerror) {
        this.getComplexType(propertyName, BildungsatlasApi.KEY_BEZIRK, "bezirk_id", String(bezirk_id), onsuccess, onerror);
    }

    /**
     * returns the complex type of the given property name for the "Stadtteil"
     * @param {String} propertyName the property name to receive the data for
     * @param {Number} stadtteil_id the id of the "Stadtteil"
     * @param {Function} onsuccess a function(ComplexType) on success
     * @param {Function} onerror a function(error) with error of type Error
     * @returns {void}
     */
    getComplexTypeStadtteil (propertyName, stadtteil_id, onsuccess, onerror) {
        this.getComplexType(propertyName, BildungsatlasApi.KEY_STADTTEIL, "stadtteil_id", String(stadtteil_id), onsuccess, onerror);
    }

    /**
     * returns the complex type of the given property name for the "Sozialraum"
     * @param {String} propertyName the property name to receive the data for
     * @param {Number} sozialraum_id the id of the "Sozialraum"
     * @param {Function} onsuccess a function(ComplexType) on success
     * @param {Function} onerror a function(error) with error of type Error
     * @returns {void}
     */
    getComplexTypeSozialraum (propertyName, sozialraum_id, onsuccess, onerror) {
        this.getComplexType(propertyName, BildungsatlasApi.KEY_SOZIALRAUM, "sozialraum_id", String(sozialraum_id), onsuccess, onerror);
    }

    /**
     * returns the complex type of the given property name for the "StatistischeGebiete"
     * @param {String} propertyName the property name to receive the data for
     * @param {Number} statgeb_id the id of the "StatistischeGebiete"
     * @param {Function} onsuccess a function(ComplexType) on success
     * @param {Function} onerror a function(error) with error of type Error
     * @returns {void}
     */
    getComplexTypeStatistischeGebiete (propertyName, statgeb_id, onsuccess, onerror) {
        this.getComplexType(propertyName, BildungsatlasApi.KEY_STATGEB, "statgeb_id", String(statgeb_id), onsuccess, onerror);
    }

    /**
     * returns the first value of the complex type of the given property name for the town
     * @param {String} propertyName the property name to receive the data for
     * @param {Function} onsuccess a function(String) on success
     * @param {Function} onerror a function(error) with error of type Error
     * @returns {void}
     */
    getValueStadt (propertyName, onsuccess, onerror) {
        this.getComplexTypeStadt(propertyName, complexType => {
            onsuccess(complexType.values[0].value);
        }, onerror);
    }

    /**
     * returns the first value of the complex type of the given property name for the "Bezirk"
     * @param {String} propertyName the property name to receive the data for
     * @param {Number} bezirk_id the id of the "Bezirk"
     * @param {Function} onsuccess a function(String) on success
     * @param {Function} onerror a function(error) with error of type Error
     * @returns {void}
     */
    getValueBezirk (propertyName, bezirk_id, onsuccess, onerror) {
        this.getComplexTypeBezirk(propertyName, bezirk_id, complexType => {
            onsuccess(complexType.values[0].value);
        }, onerror);
    }

    /**
     * returns the first value of the complex type of the given property name for the "Stadtteil"
     * @param {String} propertyName the property name to receive the data for
     * @param {Number} stadtteil_id the id of the "Stadtteil"
     * @param {Function} onsuccess a function(String) on success
     * @param {Function} onerror a function(error) with error of type Error
     * @returns {void}
     */
    getValueStadtteil (propertyName, stadtteil_id, onsuccess, onerror) {
        this.getComplexTypeStadtteil(propertyName, stadtteil_id, complexType => {
            onsuccess(complexType.values[0].value);
        }, onerror);
    }

    /**
     * returns the first value of the complex type of the given property name for the "Sozialraum"
     * @param {String} propertyName the property name to receive the data for
     * @param {Number} sozialraum_id the id of the "Sozialraum"
     * @param {Function} onsuccess a function(String) on success
     * @param {Function} onerror a function(error) with error of type Error
     * @returns {void}
     */
    getValueSozialraum (propertyName, sozialraum_id, onsuccess, onerror) {
        this.getComplexTypeSozialraum(propertyName, sozialraum_id, complexType => {
            onsuccess(complexType.values[0].value);
        }, onerror);
    }

    /**
     * returns the first value of the complex type of the given property name for the "StatistischeGebiete"
     * @param {String} propertyName the property name to receive the data for
     * @param {Number} statgeb_id the id of the "StatistischeGebiete"
     * @param {Function} onsuccess a function(String) on success
     * @param {Function} onerror a function(error) with error of type Error
     * @returns {void}
     */
    getValueStatistischeGebiete (propertyName, statgeb_id, onsuccess, onerror) {
        this.getComplexTypeStatistischeGebiete(propertyName, statgeb_id, complexType => {
            onsuccess(complexType.values[0].value);
        }, onerror);
    }

    /**
     * returns the complex type for any use case
     * @param {String} propertyName the property name to receive the data for
     * @param {String} featureTypeKey the key to reference this.featureTypes with (see static vars BildungsatlasApi.KEY_...)
     * @param {String} valueReference the name of the attribute to filter
     * @param {String} literal the value of the attribute to filter for
     * @param {Function} onsuccess a function(ComplexType) on success
     * @param {Function} onerror a function(error) with error of type Error
     * @returns {void}
     */
    getComplexType (propertyName, featureTypeKey, valueReference, literal, onsuccess, onerror) {
        if (this.wfsUrls === false || this.featureTypes === false) {
            // config not loaded yet, put on hold until initConfig has finished
            BildungsatlasApi.startupCallbacks.push(() => {
                this.getComplexType(propertyName, featureTypeKey, valueReference, literal, onsuccess, onerror);
            });
            return;
        }

        if (!this.hasFeatureType(featureTypeKey, propertyName)) {
            if (typeof onerror === "function") {
                onerror(new Error("bildungsatlasApi.getComplexType: unknown propertyName " + propertyName));
            }
            return;
        }

        const featureType = this.featureTypes[featureTypeKey][propertyName],
            payload = this.getWfsPayload({
                featureType,
                propertyName,
                valueReference,
                literal
            });

        if (!this.hasWfsUrl(featureType)) {
            if (typeof onerror === "function") {
                onerror(new Error("bildungsatlasApi.getComplexType: featuerType not known by wfs urls " + featureType + " (see: " + propertyName + ")"));
            }
            return;
        }

        this.callWfs(this.wfsUrls[featureType], payload, xmlData => {
            const jsonData = this.convertXmlToFeatureCollection(xmlData, featureType),
                complexType = this.filterComplexTypeFromJsonResponse(jsonData, propertyName);

            if (!isComplexType(complexType)) {
                onerror(new Error("bildungsatlasApi.getComplexType: the received structure isn't a ComplexType: " + featureType + " (see: " + propertyName + ") " + JSON.stringify(complexType)));
            }
            onsuccess(complexType);
        }, onerror);
    }

    /**
     * returns the value from Einzugsgebiet Dienst
     * @param {String} featureType the feature type as string from function
     * @param {String} propertyName the property name to receive the data for
     * @param {String} literal the value of the attribute to filter for
     * @param {Function} onsuccess a function(ComplexType) on success
     * @param {Function} onerror a function(error) with error of type Error
     * @returns {void}
     */
    getEinzugsgebieteValue (featureType, propertyName, literal, onsuccess, onerror) {
        if (this.wfsUrls === false || this.featureTypes === false) {
            // config not loaded yet, put on hold until initConfig has finished
            BildungsatlasApi.startupCallbacks.push(() => {
                this.getEinzugsgebieteValue(featureType, propertyName, literal, onsuccess, onerror);
            });
            return;
        }
        const url = this.wfsUrls[featureType],
            featureNS = "https://registry.gdi-de.org/id/de.hh.up",
            wfsReader = new WFS({
                featureNS,
                featureType: featureType.substr(featureType.indexOf(":") + 1)
            }),
            payload = `<?xml version='1.0' encoding='UTF-8' ?>
<wfs:GetFeature service='WFS' version='1.1.0' xmlns:app='http://www.deegree.org/app' xmlns:wfs='http://www.opengis.net/wfs' xmlns:ogc='http://www.opengis.net/ogc'>
    <wfs:Query typeName='${featureType}'>
        <ogc:Filter>
            <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>${propertyName}</ogc:PropertyName>
                <ogc:Literal>${literal}</ogc:Literal>
            </ogc:PropertyIsEqualTo>
        </ogc:Filter>
    </wfs:Query>
</wfs:GetFeature>`;

        if (!this.hasWfsUrl(featureType)) {
            if (typeof onerror === "function") {
                onerror(new Error("bildungsatlasApi.getEinzugsgebieteValue: featuerType not known by wfs urls " + featureType + " (see: " + propertyName + ")"));
            }
            return;
        }

        this.callWfs(url, payload, xmlData => {
            const jsonData = wfsReader.readFeatures(xmlData);

            onsuccess(jsonData);
        }, onerror);
    }


    /**
     * filters the given data and returns the found complex type
     * @param {Object} jsonData the data to parse
     * @param {String} propertyName the propertyName to return the complex type for
     * @returns {Object|boolean} the found object or false if something went wrong
     */
    filterComplexTypeFromJsonResponse (jsonData, propertyName) {
        if (!Array.isArray(jsonData) || !jsonData.length) {
            return false;
        }
        const feature = jsonData[0],
            complexType = feature instanceof Feature ? feature.get(propertyName) : false;

        if (
            typeof complexType === "object" && complexType !== null
            && typeof complexType.values === "object" && complexType.values !== null
            && !Array.isArray(complexType.values)
        ) {
            // a complexType with a single value in values is received as single object instead of an array with one item
            complexType.values = [complexType.values];
        }

        return complexType;
    }

    /**
     * checks if this.featureType contains a feature type for the given key (see BildungsatlasApi static vars) and propertyName
     * @param {String} key the key (see BildungsatlasApi.KEY_...)
     * @param {String} propertyName the property name to access the feature type from
     * @returns {Boolean} true if it is save to access this.featureType[key][propertyName]; false if not so
     */
    hasFeatureType (key, propertyName) {
        return typeof this.featureTypes === "object" && this.featureTypes !== null
            && Object.prototype.hasOwnProperty.call(this.featureTypes, key)
            && typeof this.featureTypes[key] === "object" && this.featureTypes[key] !== null
            && Object.prototype.hasOwnProperty.call(this.featureTypes[key], propertyName)
            && typeof this.featureTypes[key][propertyName] === "string";
    }

    /**
     * checks if this.wfsUrls contains an url for the given feature type
     * @param {String} featureType the feature type as string (might come from this.featureTypes)
     * @returns {Boolean} true if it is save to access this.wfsUrls[featureType]; false if not so
     */
    hasWfsUrl (featureType) {
        return Object.prototype.hasOwnProperty.call(this.wfsUrls, featureType)
            && typeof this.wfsUrls[featureType] === "string";
    }

    /**
     * uses axios (or the mockup) to receive data from the given wfs source using a post payload to filter data
     * @param {String} url the wfs service url
     * @param {String} payload the payload to send to the service
     * @param {Function} onsuccess a function(data) with the received data
     * @param {Function} onerror a function(error) with error of type Error
     * @returns {void}
     */
    callWfs (url, payload, onsuccess, onerror) {
        if (typeof this.mockWfsCall === "function") {
            this.mockWfsCall(url, payload, onsuccess, onerror);
            return;
        }
        const cacheKey = hash.sha1(url + "_" + payload);

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

    /**
     * converts the given xml string into a list of ol/Feature
     * @param {String} xmlText the string to use as source
     * @param {String} featureType the feature type used by the wfsReader
     * @param {String} [featureNS="https://registry.gdi-de.org/id/de.hh.up"] the namespace to use (as full url for wfsReader - see ol WFS)
     * @returns {ol/Feature[]} a list of ol/Feature
     */
    convertXmlToFeatureCollection (xmlText, featureType, featureNS = "https://registry.gdi-de.org/id/de.hh.up") {
        const wfsReader = new WFS({
                featureNS,
                featureType: featureType.substr(featureType.indexOf(":") + 1)
            }),
            // this is the dirty way to convert response for wfs 2.0.0 to wfs 1.1.0 compatible
            xmlPayload = xmlText.replaceAll("wfs:member", "gml:featureMember"),
            xmlPre = xmlPayload.substr(0, xmlPayload.indexOf("<de.hh.up:geom>")),
            xmlPost = xmlPayload.substr(xmlPayload.indexOf("</de.hh.up:geom>") + 16);

        return wfsReader.readFeatures(xmlPre + xmlPost);
    }

    /**
     * returns the payload to send to the wfs service
     * @param {Object} options the options to construct the payload
     * @param {String} options.featureType the featureType to lookup
     * @param {String} options.propertyName the name of the attribute to receive
     * @param {String} options.valueReference the name of the attribute to filter
     * @param {String} options.literal the value of the attribute to filter for
     * @param {String} [options.namespace="de.hh.up"] the namespace (without url)
     * @param {String} [options.namespaceUrl="https://registry.gdi-de.org/id/de.hh.up"] the namespace as url
     * @param {String} [options.service="WFS] the wfs service
     * @param {String} [options.version="2.0.0"] the wfs version
     * @returns {String} the raw xml to send to the server
     */
    getWfsPayload (options) {
        const props = Object.assign({
            featureType: "",
            propertyName: "",
            valueReference: "",
            literal: "",
            namespace: "de.hh.up",
            namespaceUrl: "https://registry.gdi-de.org/id/de.hh.up",
            service: "WFS",
            version: "2.0.0"
        }, options);

        return `<?xml version="1.0" ?>
        <GetFeature
            service="${props.service}"
            version="${props.version}"
            resolveDepth="*"
            outputFormat="application/gml+xml; version=3.1"
            xmlns="http://www.opengis.net/wfs/2.0"
            xmlns:fes="http://www.opengis.net/fes/2.0"
            xmlns:${props.namespace}="${props.namespaceUrl}"
        >
            <Query typeNames="${props.featureType}">
                <PropertyName resolve="local">${props.namespace}:${props.propertyName}</PropertyName>
                <fes:Filter>
                    <fes:PropertyIsEqualTo>
                        <fes:ValueReference>${props.namespace}:${props.valueReference}</fes:ValueReference>
                        <fes:Literal>${props.literal}</fes:Literal>
                    </fes:PropertyIsEqualTo>
                </fes:Filter>
            </Query>
        </GetFeature>`;
    }

    /**
     * helper for use of api functions with not fully loaded api
     * @info use this if you want to use any function of the api except for value and complexType getters
     * @param {Function} handler callback function() to be called when api is initialized
     * @returns {void}
     */
    callWhenInitialized (handler) {
        if (this.wfsUrls !== false && this.featureTypes !== false) {
            if (typeof handler === "function") {
                handler();
            }
        }
        else {
            BildungsatlasApi.startupCallbacks.push(handler);
        }
    }

    /**
     * loads the config of the api - will walk through BildungsatlasApi.startupCallbacks afterwards
     * @param {String} configUrl the url to the (local) file (e.g. config.api.json)
     * @pre this.wfsUrls and this.featureTypes are false
     * @post this.wfsUrls and this.featureTypes are objects and BildungsatlasApi.startupCallbacks is walked through
     * @returns {void}
     */
    initConfig (configUrl) {
        if (this.wfsUrls !== false && this.featureTypes !== false || typeof configUrl !== "string") {
            // no need to load config
            return;
        }
        axios.get(configUrl, {
            headers: {
                "Content-Type": "application/json"
            }
        })
            .then(configData => {
                if (typeof configData.data !== "object" || configData.data === null || !Object.prototype.hasOwnProperty.call(configData.data, "wfsUrls") || !Object.prototype.hasOwnProperty.call(configData.data, "featureTypes")) {
                    console.error("initConfig: the config data must include wfsUrls and featureTypes, api isn't able to process any data");
                    return;
                }
                this.wfsUrls = configData.data.wfsUrls;
                this.featureTypes = configData.data.featureTypes;

                // call all functions that were triggert during config load
                BildungsatlasApi.startupCallbacks.forEach(handler => {
                    if (typeof handler === "function") {
                        handler();
                    }
                });
                BildungsatlasApi.startupCallbacks = [];
            })
            .catch(err => {
                console.error(err);
            });
    }
}

BildungsatlasApi.KEY_BEZIRK = "bezirk";
BildungsatlasApi.KEY_STADTTEIL = "stadtteil";
BildungsatlasApi.KEY_SOZIALRAUM = "sozialraum";
BildungsatlasApi.KEY_STATGEB = "statistischeGebiete";
