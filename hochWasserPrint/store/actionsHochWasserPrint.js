import axios from "axios";
import getProxyUrl from "../../../src/utils/getProxyUrl";
import BuildSpec from "./../utils/buildSpec";
import omit from "../../../src/utils/omit";
import actionsPrintInitialization from "./actions/actionsPrintInitialization";

export default {

    ...actionsPrintInitialization,
    /**
     * Performs an asynchronous HTTP request
     * @param {Object} param.state the state
     * @param {Object} param.dispatch the dispatch
     * @param {Object} serviceRequest the request content
     * @returns {void}
     */
    sendRequest: function ({state, dispatch}, serviceRequest) {
        /**
         * @deprecated in the next major-release!
         * useProxy
         * getProxyUrl()
         */
        const url = state.useProxy ? getProxyUrl(serviceRequest.serviceUrl) : serviceRequest.serviceUrl;

        axios({
            url: url,
            type: serviceRequest.requestType
        }).then(response => {
            if (Object.prototype.hasOwnProperty.call(serviceRequest, "index")) {
                response.data.index = serviceRequest.index;
            }
            dispatch(String(serviceRequest.onSuccess), response.data);
        });
    },

    /**
     * Sets the printStarted to activie for the Add Ons
     * @param {Object} param.commit the commit
     * @returns {void}
     */
    activatePrintStarted: function ({commit}) {
        commit("setPrintStarted", true);
    },

    /**
     * Sets the visibleLayerList
     * @param {Object} param.commit the commit
     * @param {Array} visibleLayerList the list
     * @returns {void}
     */
    setVisibleLayerList: function ({commit}, visibleLayerList) {
        commit("setVisibleLayerList", visibleLayerList);
    },

    /**
     * Starts the printing process
     * @param {Object} param.state the state
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.commit the commit
     * @param {Object} print the print parameters.
     * @param {Function} print.getResponse The function that calls the axios request.
     * @param {Number} print.index The print index.
     * @returns {void}
     */
    startPrint: async function ({state, dispatch}, print) {
        const printLayerList = state.printLayerList,
            attr = {
                "layout": state.currentLayoutName,
                "outputFilename": state.filename,
                "outputFormat": state.currentFormat,
                "attributes": {
                    "printId": state.printHwsId,
                    "map": {
                        "dpi": state.dpiForPdf,
                        "projection": Radio.request("MapView", "getProjection").getCode(),
                        "center": Radio.request("MapView", "getCenter"),
                        "scale": state.currentScale
                    }
                }
            };

        let spec = BuildSpec,
            printJob = {};

        spec.setAttributes(attr);

        if (state.isScaleAvailable) {
            spec.buildScale(state.currentScale);
        }
        await spec.buildLayers(printLayerList);

        spec = omit(spec, ["uniqueIdList"]);
        printJob = {
            index: print.index,
            payload: encodeURIComponent(JSON.stringify(spec.defaults)),
            printAppId: state.printAppId,
            currentFormat: state.currentFormat,
            getResponse: print.getResponse
        };

        Radio.trigger("Util", "showLoader");
        dispatch("createPrintJob", printJob);
    },

    /**
     * Sends an async request to create a print job
     * @param {Object} param.state the state
     * @param {Object} param.commit the commit
     * @param {Object} param.dispatch the dispatch
     * @param {Object} printContent the content for the printRequest
     * @returns {void}
     */
    createPrintJob: async function ({state, dispatch, rootGetters, commit}, printContent) {
        const printJob = printContent,
            printId = printJob.printAppId || state.printAppId,
            printFormat = printJob.format || state.currentFormat;
        let url = "",
            response = "",
            serviceUrlDefinition = state.serviceUrl;

        if (!state.serviceUrl.includes("/print/")) {
            serviceUrlDefinition = state.serviceUrl + "print/";
        }

        commit("setPrintFileReady", false);
        if (state.serviceUrl === "") {
            let serviceUrl;

            if (state.mapfishServiceId !== "") {
                serviceUrl = rootGetters.getRestServiceById(state.mapfishServiceId).url;
            }
            else {
                serviceUrl = rootGetters.getRestServiceById("mapfish").url;
            }

            if (!serviceUrl.includes("/print/")) {
                serviceUrl = serviceUrl + "print/";
            }

            commit("setServiceUrl", serviceUrl);
            serviceUrlDefinition = state.serviceUrl;
        }

        url = state.printService === "plotservice" ? serviceUrlDefinition + "/create.json" : serviceUrlDefinition + printId + "/report." + printFormat;

        if (typeof printJob.getResponse === "function") {
            if (state.printService === "plotservice") {
                printJob.payload = await dispatch("migratePayload", printJob.payload);
            }
            response = await printJob.getResponse(url, printJob.payload);
        }

        response.data.index = printJob.index;
        dispatch("waitForPrintJob", response.data);
    },

    /**
     * Migrates the payload intended for mapfish to the format High Resolution Plot Service needs
     * @param {Object} param.state the state
     * @param {Object} payload object to migrate
     * @returns {Object} object for High Resolution Plot Service to start the printing
     */
    migratePayload: function ({state}, payload) {
        const plotservicePayload = {},
            decodePayload = JSON.parse(decodeURIComponent(payload.replace(/imageFormat/g, "format")));

        plotservicePayload.layout = decodePayload.layout;
        plotservicePayload.srs = decodePayload.attributes.map.projection;
        plotservicePayload.layers = decodePayload.attributes.map.layers;
        plotservicePayload.layers.forEach((key) => {
            key.styles = [""];
        });
        plotservicePayload.pages = [{
            center: decodePayload.attributes.map.center,
            scale: String(decodePayload.attributes.map.scale),
            scaleText: "Ca. 1 : " + decodePayload.attributes.map.scale,
            geodetic: true,
            dpi: String(decodePayload.attributes.map.dpi),
            mapTitle: decodePayload.attributes.title
        }];
        plotservicePayload.outputFilename = state.filename;
        plotservicePayload.outputFormat = state.outputFormat;

        return JSON.stringify(plotservicePayload);
    },

    /**
     * Sends a request to get the status for a print job until it is finished.
     * @param {Object} param.state the state
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.commit the commit
     * @param {Object} response Response of print job.
     * @param {Number} response.index The print index.
     * @returns {void}
     */
    waitForPrintJob: async function ({state, dispatch}, response) {
        let printFolderUrlPart = "";

        if (!state.serviceUrl.includes("/print/")) {
            printFolderUrlPart = "print/";
        }

        const printAppId = state.printAppId,
            url = state.serviceUrl + printFolderUrlPart + printAppId + "/status/" + response.ref + ".json",
            serviceRequest = {
                "index": response.index,
                "serviceUrl": url,
                "requestType": "GET",
                "onSuccess": "waitForPrintJobSuccess"
            };

        dispatch("sendRequest", serviceRequest);
    },

    waitForPrintJobSuccess: async function ({state, dispatch}, response) {
        let printFolderUrlPart = "";

        if (!state.serviceUrl.includes("/print/")) {
            printFolderUrlPart = "print/";
        }

        if (response.status === "error") {
            dispatch("Alerting/addSingleAlert", i18next.t("additional:modules.tools.hochWasserPrint.waitForPrintErrorMessage"), {root: true});
            console.error("Error: " + response.error);
        }
        else if (response.done) {
            const index = response.downloadURL.lastIndexOf("/"),
                fileId = response.downloadURL.substr(index);

            Radio.trigger("Util", "hideLoader");
            window.open(state.serviceUrl + printFolderUrlPart + state.printAppId + "/report" + fileId);
        }
        else {
            setTimeout(() => {
                const index = response.downloadURL.lastIndexOf("/"),
                    fileId = response.downloadURL.substr(index),
                    url = state.serviceUrl + printFolderUrlPart + state.printAppId + "/status" + fileId + ".json",
                    serviceRequest = {
                        "index": response.index,
                        "serviceUrl": url,
                        "requestType": "GET",
                        "onSuccess": "waitForPrintJobSuccess"
                    };

                dispatch("sendRequest", serviceRequest);
            }, 2000);
        }
    }
};
