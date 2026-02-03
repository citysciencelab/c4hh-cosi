import {expect} from "chai";
import OgcApiProcess from "../../../js/ogcApiProcess.js";
import sinon from "sinon";
import axios from "axios";

describe("addons/simulationTool/js/ogcApiProcess.js", () => {

    describe("constructor", () => {
        it("should initialize with baseUrl and processId", () => {
            const baseUrl = "http://example.com/ogcapi/",
                processId = "process123",
                ogcApiProcess = new OgcApiProcess(baseUrl, processId);

            expect(ogcApiProcess.baseUrl).to.equal(baseUrl);
            expect(ogcApiProcess.processId).to.equal(processId);
        });
    });

    describe("getDescription", () => {
        it("should fetch the process description", async () => {
            const baseUrl = "http://example.com/ogcapi/",
                processId = "process123",
                ogcApiProcess = new OgcApiProcess(baseUrl, processId),
                mockResponse = {data: {description: "mock description"}},
                axiosGetStub = sinon.stub(axios, "get").resolves(mockResponse),
                description = await ogcApiProcess.getDescription();

            expect(description).to.deep.equal(mockResponse.data);
            expect(axiosGetStub.calledOnce).to.be.true;

            axiosGetStub.restore();
        });
    });

    describe("getInputDefaultsFromDescription", () => {
        it("should return an empty object if no inputs are provided", () => {
            const description = {},
                defaults = OgcApiProcess.getInputDefaultsFromDescription(description);

            expect(defaults).to.deep.equal({});
        });

        it("should return default values for inputs", () => {
            const description = {
                    inputs: {
                        input1: {default: "value1"},
                        input2: {schema: {type: "object", properties: {property1: {default: "value2"}}}}
                    }
                },
                defaults = OgcApiProcess.getInputDefaultsFromDescription(description);

            expect(defaults).to.deep.equal({
                input1: "value1",
                input2: {property1: "value2"}
            });
        });
    });

    describe("execute", () => {
        it("should execute the process with the provided inputs", async () => {
            const baseUrl = "http://example.com/ogcapi/",
                processId = "process123",
                ogcApiProcess = new OgcApiProcess(baseUrl, processId),
                inputs = {input1: "value1"},
                mockResponse = {data: {result: "mock result"}},
                axiosPostStub = sinon.stub(axios, "post").resolves(mockResponse),
                result = await ogcApiProcess.execute(inputs);

            expect(result).to.deep.equal(mockResponse.data);
            expect(axiosPostStub.calledOnce).to.be.true;

            axiosPostStub.restore();
        });
    });

    describe("getJobStatus", () => {
        it("should fetch the job status", async () => {
            const baseUrl = "http://example.com/ogcapi/",
                processId = "process123",
                ogcApiProcess = new OgcApiProcess(baseUrl, processId),
                jobId = "job123",
                mockResponse = {data: {status: "mock status"}},
                axiosGetStub = sinon.stub(axios, "get").resolves(mockResponse),
                status = await ogcApiProcess.getJobStatus(jobId);

            expect(status).to.deep.equal(mockResponse.data);
            expect(axiosGetStub.calledOnce).to.be.true;

            axiosGetStub.restore();
        });
    });

    describe("getJobResult", () => {
        it("should fetch the job result", async () => {
            const baseUrl = "http://example.com/ogcapi/",
                processId = "process123",
                ogcApiProcess = new OgcApiProcess(baseUrl, processId),
                jobId = "job123",
                mockResponse = {data: {result: "mock result"}},
                axiosGetStub = sinon.stub(axios, "get").resolves(mockResponse),
                result = await ogcApiProcess.getJobResults(jobId);

            expect(result).to.deep.equal(mockResponse.data);
            expect(axiosGetStub.calledOnce).to.be.true;

            axiosGetStub.restore();
        });
    });

    describe("pollJobStatusAndGetResults", () => {
        it("should poll the job status and fetch results when successful", async () => {
            const ogcApiProcess = new OgcApiProcess("http://example.com/ogcapi/", "process123"),
                mockJobResultsResponse = {result: "mock result"},
                jobStatusStub = sinon.stub(ogcApiProcess, "getJobStatus").resolves({status: "successful"}),
                jobResultsStub = sinon.stub(ogcApiProcess, "getJobResults").resolves(mockJobResultsResponse),
                results = await ogcApiProcess.pollJobStatusAndGetResults("job123");

            expect(jobStatusStub.calledOnce).to.be.true;
            expect(jobResultsStub.calledOnce).to.be.true;
            expect(results).to.deep.equal(mockJobResultsResponse);

            jobStatusStub.restore();
            jobResultsStub.restore();
        });
    });

    describe("executeAndGetResults", () => {
        it("should execute the process and fetch the job result", async () => {
            const baseUrl = "http://example.com/ogcapi/",
                processId = "process123",
                ogcApiProcess = new OgcApiProcess(baseUrl, processId),
                executeStub = sinon.stub(ogcApiProcess, "execute").resolves({jobID: "job123"}),
                jobStatusStub = sinon.stub(ogcApiProcess, "getJobStatus").resolves({status: "successful"}),
                mockJobResults = {result: "mock result"},
                jobResultsStub = sinon.stub(ogcApiProcess, "getJobResults").resolves(mockJobResults),
                results = await ogcApiProcess.executeAndGetResults();

            expect(executeStub.calledOnce).to.be.true;
            expect(jobStatusStub.calledOnce).to.be.true;
            expect(jobResultsStub.calledOnce).to.be.true;
            expect(results).to.deep.equal(mockJobResults);

            executeStub.restore();
            jobStatusStub.restore();
            jobResultsStub.restore();
        });
    }
    );
});
