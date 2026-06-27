import actionsPrintInitialization from "./actionsPrintInitialization.js";
import axios from "axios";
import BuildSpec from "../../../src/modules/print/js/buildSpec.js";
import omit from "../../../src/shared/js/utils/omit.js";
import layerProvider from "../js/getVisibleLayer.js";

export default {
    ...actionsPrintInitialization,

    /**
     * Performs an asynchronous HTTP request
     * @param {Object} param.dispatch the dispatch
     * @param {Object} serviceRequest the request content
     * @returns {void}
     */
    sendRequest: function ({dispatch}, serviceRequest) {
        const url = serviceRequest.serviceUrl;

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
     * sets the printStarted to activie for the Add Ons
     * @param {Object} param.commit the commit
     * @returns {void}
     */
    activatePrintStarted: function ({commit}) {
        commit("setPrintStarted", true);
    },

    /**
     * sets the visibleLayerList
     * @param {Object} param.commit the commit
     * @param {Array} visibleLayerList the list
     * @returns {void}
     */
    setVisibleLayerList: function ({commit}, visibleLayerList) {
        commit("setVisibleLayerList", visibleLayerList);
    },

    /**
     * starts the printing process
     * @param {Object} param.state the state
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.commit the commit
     * @param {Object} print the print parameters.
     * @param {Function} print.getResponse The function that calls the axios request.
     * @param {Number} print.index The print index.
     * @returns {void}
     */
    startPrint: async function ({state, dispatch, commit}, print) {
        layerProvider.getVisibleLayer(state.printMapMarker);

        const printLayerList = state.printLayerList,
            attr = {
                "layout": state.currentLayoutName,
                "outputFilename": state.filename,
                "outputFormat": state.currentFormat,
                "attributes": {
                    "cycleId": state.cycleId,
                    "printId": state.printHwsId,
                    "map": {
                        "dpi": state.dpiForPdf,
                        "projection": mapCollection.getMapView("2D").getProjection().getCode(),
                        "center": mapCollection.getMapView("2D").getCenter(),
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

        commit("setIsPrinting", true);
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

        if (state.serviceUrl === "") {
            let serviceUrl;

            if (state.printServiceId !== "") {
                serviceUrl = rootGetters.getRestServiceById(state.printServiceId).url;
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
            response = await printJob.getResponse(url, printJob.payload);
        }

        response.data.index = printJob.index;
        dispatch("waitForPrintJob", response.data);
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

    waitForPrintJobSuccess: async function ({state, dispatch, commit}, response) {
        let printFolderUrlPart = "";

        if (state.printService !== "plotservice" && !state.serviceUrl.includes("/print/")) {
            printFolderUrlPart = "print/";
        }

        // Error processing...
        if (response.status === "error") {
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: i18next.t("common:modules.print.waitForPrintErrorMessage")
            }, {root: true});
            console.error("Error: " + response.error);
        }
        else if (response.done) {
            commit("setIsPrinting", false);
            const index = response.downloadURL.lastIndexOf("/"),
                fileId = response.downloadURL.substr(index);

            commit("setPrintUrl", state.serviceUrl + printFolderUrlPart + state.printAppId + "/report" + fileId);
        }
        else {
            // The report is not ready yet. Check again in 2s.
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
