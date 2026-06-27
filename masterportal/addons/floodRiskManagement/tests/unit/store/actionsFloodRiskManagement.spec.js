import {expect} from "chai";
import actions from "../../../store/actionsFloodRiskManagement.js";
import sinon from "sinon";

const {activatePrintStarted, createPrintJob, waitForPrintJob, waitForPrintJobSuccess} = actions;


describe("addons/floodRiskManagement/store/actionsFloodRiskManagement", function () {
    describe("activatePrintStarted", function () {
        it("should set activatePrintStarted to true", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy();

            activatePrintStarted({commit, dispatch}, undefined);

            expect(commit.calledWith("setPrintStarted", true)).to.be.true;
        });
    });

    describe("createPrintJob", function () {
        it("should create a printJob", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                defaults = {
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

            await createPrintJob({commit, dispatch, state}, payload);

            expect(dispatch.calledWith("waitForPrintJob", data)).to.be.true;
        });
    });

    describe("waitForPrintJob", function () {
        it("should start another print request", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                state = {
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

            waitForPrintJob({commit, dispatch, state}, response);

            expect(dispatch.calledWith("sendRequest", serviceRequest)).to.be.true;
        });
        it("should start another print request with service url without /print/", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                state = {
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

            waitForPrintJob({commit, dispatch, state}, response);

            expect(dispatch.calledWith("sendRequest", serviceRequest)).to.be.true;
        });
    });

    describe("waitForPrintJobSuccess", function () {
        let clock;

        beforeAll(function () {
            clock = sinon.useFakeTimers();
        });
        afterAll(function () {
            clock.restore();
        });
        it("is not done yet so it should start another print request", () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                state = {
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

            waitForPrintJobSuccess({commit, dispatch, state}, response);
            clock.tick(2001);

            expect(dispatch.calledWith("sendRequest", serviceRequest)).to.be.true;
        });
    });
});
