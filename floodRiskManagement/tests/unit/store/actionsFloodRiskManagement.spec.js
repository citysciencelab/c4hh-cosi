import testAction from "../../../../../devtools/tests/VueTestUtils.js";
import actions from "../../../store/actionsFloodRiskManagement";
import sinon from "sinon";

const {activatePrintStarted, createPrintJob, waitForPrintJob, waitForPrintJobSuccess} = actions;

afterEach(() => {
    sinon.restore();
});

describe("addons/floodRiskManagement/store/actionsFloodRiskManagement", function () {
    describe("activatePrintStarted", function () {
        it("should set activatePrintStarted to true", done => {
            // action, payload, state, rootState, expectedMutationsAndActions, getters = {}, done, rootGetters
            testAction(activatePrintStarted, undefined, {}, {}, [
                {type: "setPrintStarted", payload: true, commit: true}
            ], {}, done);
        });
    });

    describe("createPrintJob", function () {
        it("should create a printJob", done => {
            const defaults = {
                    attributes: {title: "Mein Titel", map: {}, scale: "1:60000", showGfi: false, gfi: {}},
                    layout: "A4 Hochformat",
                    outputFilename: "Ausdruck",
                    outputFormat: "pdf",
                    uniqueIdList: [],
                    visibleLayerIds: ["453", "8712", "1711"]
                },
                data = {
                    ownloadURL: "/mapfish_print_internet/print/report/2ca7f8ab-24f0-48e1-9fd7-a6fe3349ccd0@89c12004-d327-4fb1-88a3-2a3332fa36a0",
                    ref: "2ca7f8ab-24f0-48e1-9fd7-a6fe3349ccd0@89c12004-d327-4fb1-88a3-2a3332fa36a0",
                    statusURL: "/mapfish_print_internet/print/status/2ca7f8ab-24f0-48e1-9fd7-a6fe3349ccd0@89c12004-d327-4fb1-88a3-2a3332fa36a0.json"
                },
                payload = {
                    payload: encodeURIComponent(JSON.stringify(defaults)),
                    getResponse: () => {
                        return {data};
                    }
                },
                state = {
                    serviceUrl: "https://geodienste.hamburg.de/mapfish_print_internet/print/",
                    printAppId: "master",
                    currentFormat: "A4 Hochformat"
                };

            // action, payload, state, rootState, expectedMutationsAndActions, getters = {}, done, rootGetters
            testAction(createPrintJob, payload, state, {}, [
                {type: "waitForPrintJob", payload: data, dispatch: true}
            ], {}, done);
        });
    });

    describe("waitForPrintJob", function () {
        it("should start another print request", done => {
            const state = {
                    serviceUrl: "https://geodienste.hamburg.de/mapfish_print_internet/print/",
                    printAppId: "master"
                },
                response = {
                    ref: "d023a604-99b0-4a4d-aa40-a1d3b5a0fd5d@5f00580a-5fd4-4579-8d21-1ad07051d09a",
                    index: 0
                },
                serviceRequest = {
                    "index": 0,
                    "serviceUrl": "https://geodienste.hamburg.de/mapfish_print_internet/print/master/status/d023a604-99b0-4a4d-aa40-a1d3b5a0fd5d@5f00580a-5fd4-4579-8d21-1ad07051d09a.json",
                    "requestType": "GET",
                    "onSuccess": "waitForPrintJobSuccess"
                };

            // action, payload, state, rootState, expectedMutationsAndActions, getters = {}, done, rootGetters
            testAction(waitForPrintJob, response, state, {}, [
                {type: "sendRequest", payload: serviceRequest, dispatch: true}
            ], {}, done);
        });
        it("should start another print request with service url without /print/", done => {
            const state = {
                    serviceUrl: "https://geodienste.hamburg.de/mapfish_print_internet/",
                    printAppId: "master",
                    printService: "mapfish"
                },
                response = {
                    ref: "d023a604-99b0-4a4d-aa40-a1d3b5a0fd5d@5f00580a-5fd4-4579-8d21-1ad07051d09a",
                    index: 0
                },
                serviceRequest = {
                    "index": 0,
                    "serviceUrl": "https://geodienste.hamburg.de/mapfish_print_internet/print/master/status/d023a604-99b0-4a4d-aa40-a1d3b5a0fd5d@5f00580a-5fd4-4579-8d21-1ad07051d09a.json",
                    "requestType": "GET",
                    "onSuccess": "waitForPrintJobSuccess"
                };

            // action, payload, state, rootState, expectedMutationsAndActions, getters = {}, done, rootGetters
            testAction(waitForPrintJob, response, state, {}, [
                {type: "sendRequest", payload: serviceRequest, dispatch: true}
            ], {}, done);
        });
    });

    describe("waitForPrintJobSuccess", function () {
        let clock;

        before(function () {
            clock = sinon.useFakeTimers();
        });
        after(function () {
            clock.restore();
        });
        it("is not done yet so it should start another print request", done => {
            const state = {
                    serviceUrl: "https://geodienste.hamburg.de/mapfish_print_internet/print/",
                    printAppId: "master"
                },
                response = {
                    index: 0,
                    done: false,
                    downloadURL: "/mapfish_print_internet/print/report/5dbc66f1-0ff5-4ba6-8257-640c600150d0@a8cb3d11-7c03-48d3-995e-b7734c564164",
                    elapsedTime: 4278,
                    status: "running",
                    waitingTime: 0
                },
                serviceRequest = {
                    index: 0,
                    serviceUrl: "https://geodienste.hamburg.de/mapfish_print_internet/print/master/status/5dbc66f1-0ff5-4ba6-8257-640c600150d0@a8cb3d11-7c03-48d3-995e-b7734c564164.json",
                    requestType: "GET",
                    onSuccess: "waitForPrintJobSuccess"
                };

            // action, payload, state, rootState, expectedMutationsAndActions, getters = {}, done, rootGetters
            testAction(waitForPrintJobSuccess, response, state, {}, [
                {type: "sendRequest", payload: serviceRequest, dispatch: true}
            ], {}, done);
            clock.tick(2001);
        });
    });
});
