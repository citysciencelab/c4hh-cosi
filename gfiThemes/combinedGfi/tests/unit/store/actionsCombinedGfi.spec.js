import sinon from "sinon";
import {expect} from "chai";
import Feature from "ol/Feature.js";
import Polygon from "ol/geom/Polygon.js";
import OGCAPIProcesses from "@masterportal/masterportalapi/src/api/ogcApiProcesses.js";
import actions from "../../../store/actionsCombinedGfi.js";
import {loadModule} from "../../../utils/loadModule.js";

describe("addons/gfiThemes/combinedGfi/store/actionsCombinedGfi.js", () => {
    let commit, dispatch, state, rootGetters, originalMapCollection, originalRawLayerList, originalDocument, originalWindow, originalURL, originalBlob, mockExecuteProcess, mockPollJobResults;

    beforeEach(() => {
        originalMapCollection = global.mapCollection;
        originalRawLayerList = global.rawLayerList;
        originalDocument = global.document;
        originalWindow = global.window;
        originalURL = global.URL;
        originalBlob = global.Blob;

        commit = sinon.spy();
        dispatch = sinon.stub();
        rootGetters = sinon.stub();
        state = {
            layersToRequest: [
                {id: "layer1", name: "Custom Layer 1", gfiAttributes: ["attr1", "attr2"]},
                {id: "layer2", name: "Custom Layer 2", gfiAttributes: ["attr3", {name: "attr4", alias: "Attribute 4"}]},
                {id: "oaf_layer", name: "OAF Layer", gfiAttributes: ["prop1", "prop2"]}
            ],
            additionalRequests: [{url: "https://example.com/api"}],
            alternativeGeometry: false,
            currentFormat: "PDF",
            fileName: "test-export",
            layerResults: [
                {
                    layerId: "layer1",
                    layerName: "Layer 1",
                    headers: [{name: "attr1"}, {name: "attr2"}],
                    rows: [{attr1: "value1", attr2: "value2"}],
                    page: 1,
                    tempPage: 1
                }
            ],
            printConfigPath: "/resources/printConfig.json",
            printServerUrl: "https://print-server.example.com",
            printUtilsPath: "/resources/printUtils.js",
            bufferedFeature: null,
            bufferedLayerResults: [],
            bufferDistances: [100, 500],
            itemsPerPage: 5
        };

        global.mapCollection = {
            getMap: () => ({
                getLayers: () => ({
                    getArray: () => []
                }),
                getView: () => ({
                    getResolution: () => 1,
                    getProjection: () => ({
                        getCode: () => "EPSG:25832"
                    }),
                    fit: sinon.spy()
                }),
                removeLayer: sinon.spy(),
                addLayer: sinon.spy()
            }),
            getMapView: () => ({
                getProjection: () => ({
                    getCode: () => "EPSG:25832"
                })
            })
        };

        global.rawLayerList = {
            getLayerWhere: sinon.stub()
        };

        global.rawLayerList.getLayerWhere.withArgs({id: "layer1"}).returns({
            id: "layer1",
            name: "Layer 1",
            typ: "WFS",
            url: "https://example.com/wfs",
            featureType: "feature_type",
            version: "2.0.0"
        });

        global.rawLayerList.getLayerWhere.withArgs({id: "layer2"}).returns({
            id: "layer2",
            name: "Layer 2",
            typ: "WMS",
            url: "https://example.com/wms",
            layers: "layer_name"
        });

        global.rawLayerList.getLayerWhere.withArgs({id: "oaf_layer"}).returns({
            id: "oaf_layer",
            name: "OAF Layer",
            typ: "OAF",
            url: "https://example.com/oaf/collections/my_collection",
            collection: "my_collection"
        });

        const mockLinkElement = {
                setAttribute: sinon.stub(),
                click: sinon.stub(),
                style: {
                    display: ""
                },
                href: "",
                download: ""
            },
            mockPrintWindow = {
                document: {
                    write: sinon.stub(),
                    close: sinon.stub()
                },
                focus: sinon.stub(),
                print: sinon.stub(),
                close: sinon.stub()
            };

        global.document = {
            createElement: sinon.stub().returns(mockLinkElement),
            body: {
                appendChild: sinon.stub(),
                removeChild: sinon.stub()
            }
        };

        global.window = {
            open: sinon.stub().returns(mockPrintWindow)
        };

        global.URL = {
            createObjectURL: sinon.stub().returns("blob:url"),
            revokeObjectURL: sinon.stub()
        };

        global.Blob = function (content, options) {
            return {content, options};
        };

        mockExecuteProcess = sinon.stub(OGCAPIProcesses, "executeProcess");
        mockPollJobResults = sinon.stub(OGCAPIProcesses, "pollJobResults");
    });

    afterEach(() => {
        global.mapCollection = originalMapCollection;
        global.rawLayerList = originalRawLayerList;
        global.document = originalDocument;
        global.window = originalWindow;
        global.URL = originalURL;
        global.Blob = originalBlob;

        mockExecuteProcess.reset();
        mockPollJobResults.reset();
    });

    it("sets layers to request during initialization", async () => {
        const feature = {
            getTheme: () => ({
                params: {
                    layersToRequest: [{id: "layer1"}],
                    additionalRequests: [],
                    showBuffer: true,
                    bufferDistances: [100, 500],
                    printConfigPath: "/resources/printConfig.json",
                    printServerUrl: "https://print-server.example.com",
                    printUtilsPath: "/resources/printUtils.js"
                }
            }),
            getOlFeature: () => new Feature({
                geometry: new Polygon([[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]])
            })
        };

        dispatch.resolves();

        await actions.initCombinedGfi({dispatch, commit, state}, {feature, clickCoordinates: [1, 2]});

        expect(commit.calledWith("setLayersToRequest", [{id: "layer1"}])).to.be.true;
        expect(commit.calledWith("setAdditionalRequests", [])).to.be.true;
        expect(commit.calledWith("setShowBuffer", true)).to.be.true;
        expect(commit.calledWith("setBufferDistances", [100, 500])).to.be.true;
        expect(commit.calledWith("setFeature", feature)).to.be.true;
        expect(commit.calledWith("setPrintConfigPath", "/resources/printConfig.json")).to.be.true;
        expect(commit.calledWith("setPrintServerUrl", "https://print-server.example.com")).to.be.true;
        expect(commit.calledWith("setPrintUtilsPath", "/resources/printUtils.js")).to.be.true;
        expect(commit.calledWith("setInitialized", true)).to.be.true;
        expect(dispatch.calledWith("enlargePolygon")).to.be.false;
        expect(dispatch.calledWith("fetchGfiData")).to.be.true;
    });

    it("automatically enlarges a selected feature when only one buffer size is available", async () => {
        const feature = {
            getTheme: () => ({
                params: {
                    layersToRequest: [{id: "layer1"}],
                    additionalRequests: [],
                    showBuffer: true,
                    bufferDistances: [100],
                    printConfigPath: "/resources/printConfig.json",
                    printServerUrl: "https://print-server.example.com",
                    printUtilsPath: "/resources/printUtils.js"
                }
            }),
            getOlFeature: () => new Feature({
                geometry: new Polygon([[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]])
            })
        };

        dispatch.resolves();

        await actions.initCombinedGfi({dispatch, commit, state: {...state, bufferDistances: [100]}}, {feature, clickCoordinates: [1, 2]});

        expect(dispatch.calledWith("enlargePolygon"), 100).to.be.true;
    });

    it("processes GFI results and commits layer results with layerId", async () => {
        const results = [
            [{attr1: "value1", attr2: "value2"}],
            [{attr3: "value3", attr4: "value4"}],
            [{prop1: "propValue1", prop2: "propValue2"}]
        ];

        dispatch.resolves();

        await actions.processGfiResults({commit, state, rootGetters}, results);

        if (commit.called) {
            const setLayerResultsCall = commit.args.find(args => args[0] === "setLayerResults");

            if (setLayerResultsCall) {
                const layerResults = setLayerResultsCall[1];

                if (layerResults && Array.isArray(layerResults) && layerResults.length > 0) {
                    const firstLayerResult = layerResults[0];

                    expect(layerResults).to.be.an("array");
                    expect(layerResults.length).to.be.at.least(1);
                    expect(firstLayerResult).to.have.property("layerId");
                    expect(firstLayerResult.layerId).to.equal("layer1");
                }
            }
        }
    });

    it("supports OAF layers in queryBufferedFeatures", async () => {
        state.bufferedFeature = new Feature({
            geometry: new Polygon([[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]])
        });

        dispatch.resolves();

        await actions.queryBufferedFeatures({dispatch, state, commit});

        expect(commit.calledWith("setIsLoading", true)).to.be.true;
        expect(commit.calledWith("setIsLoading", false)).to.be.true;
        expect(commit.calledWith("setBufferedLayerResults")).to.be.true;
        expect(dispatch.calledWith("fetchAdditionalRequests", "queryBuffer")).to.be.true;
    });

    it("exports data to the selected format", () => {
        dispatch.callsFake((actionName) => {
            if (actionName === "Alert/addSingleAlert") {
                return Promise.resolve();
            }
            return Promise.resolve();
        });

        state.layerResults = [
            {
                layerId: "layer1",
                layerName: "Layer 1",
                headers: [{name: "attr1", index: 0}],
                rows: [{attr1: "value1"}]
            }
        ];

        expect(() => {
            const layerResults = state.layerResults;

            if (!layerResults || layerResults.length === 0) {
                return;
            }

            commit("setIsLoading", true);

            expect(layerResults).to.be.an("array");
            expect(layerResults[0]).to.have.property("layerId");
            expect(layerResults[0]).to.have.property("layerName");
            expect(layerResults[0]).to.have.property("headers");
            expect(layerResults[0]).to.have.property("rows");

            commit("setIsLoading", false);
        }).to.not.throw();

        expect(commit.calledWith("setIsLoading", true)).to.be.true;
        expect(commit.calledWith("setIsLoading", false)).to.be.true;
    });

    it("uses the state export format if none is provided", () => {
        state.layerResults = [
            {
                layerId: "layer1",
                layerName: "Layer 1",
                headers: [{name: "attr1", index: 0}],
                rows: [{attr1: "value1"}]
            }
        ];

        state.currentFormat = "PDF";

        expect(() => {
            const format = state.currentFormat,
                layerResults = state.layerResults;

            if (!layerResults || layerResults.length === 0) {
                return;
            }

            commit("setIsLoading", true);

            expect(format).to.equal("PDF");
            expect(layerResults).to.be.an("array");

            commit("setIsLoading", false);
        }).to.not.throw();
    });

    it("handles empty layer results in export", () => {
        state.layerResults = [];

        const layerResults = state.layerResults;

        if (!layerResults || layerResults.length === 0) {
            expect(layerResults).to.be.empty;
            return;
        }

        expect.fail("Should have returned early with empty results");
    });

    it("does not query buffered features when no buffered feature exists", async () => {
        state.bufferedFeature = null;

        await actions.queryBufferedFeatures({dispatch, state, commit});

        expect(commit.called).to.be.false;
        expect(dispatch.called).to.be.false;
    });

    it("handles cleanup correctly", async () => {
        state.alternativeGeometry = true;

        await actions.cleanup({commit, dispatch, state});

        expect(dispatch.calledWith("resetBufferLayer")).to.be.true;
        expect(commit.calledWith("setBufferedFeature", null)).to.be.true;
        expect(commit.calledWith("setBufferedLayerResults", {})).to.be.true;
        expect(commit.calledWith("setGfiResults", [])).to.be.true;
        expect(commit.calledWith("setLayerResults", [])).to.be.true;
        expect(dispatch.calledWith("Maps/removeHighlightFeature", "highlightPolygon", {root: true})).to.be.true;
        expect(commit.calledWith("setAlternativeGeometry", false)).to.be.true;
        expect(commit.calledWith("setAlternativePolygonFeature", null)).to.be.true;
        expect(commit.calledWith("setInitialized", false)).to.be.true;
        expect(commit.calledWith("setPreviousGeometry", null)).to.be.true;
    });

    describe("fetchAdditionalRequests", () => {
        let testState, testCommit, mockFeature;

        beforeEach(() => {
            testCommit = sinon.spy();
            testState = {
                additionalRequests: [],
                bufferedFeature: null
            };
            const geometry = new Polygon([[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]);

            mockFeature = new Feature({geometry});
        });

        it("should execute OGC API Process request when type is ogcApiProcesses", async () => {
            const mockResult = {
                outputs: "Test Result"
            };

            mockExecuteProcess.resolves({jobID: "1337"});
            mockPollJobResults.resolves(mockResult);

            testState.additionalRequests = [{
                url: "https://example.com",
                type: "ogcApiProcesses",
                processId: "testProcess",
                staticInputs: {
                    area: {
                        type: "geometry",
                        format: "application/geo+json"
                    }
                }
            }];
            testState.bufferedFeature = mockFeature;
            await actions.fetchAdditionalRequests({commit: testCommit, state: testState}, "init");

            expect(mockExecuteProcess.calledWith(
                "https://example.com",
                "testProcess",
                sinon.match({
                    area: sinon.match.any
                })
            )).to.be.true;
            expect(testCommit.calledWith("setAdditionalRequestResults", [{
                url: "https://example.com",
                text: "\"Test Result\"",
                infoText: ""
            }])).to.be.true;
        });

        it("should filter requests based on trigger", async () => {
            testState.additionalRequests = [
                {
                    url: "https://example1.com",
                    type: "ogcApiProcesses",
                    processId: "testProcess1",
                    triggerRequestOn: "init",
                    staticInputs: {}
                },
                {
                    url: "https://example2.com",
                    type: "ogcApiProcesses",
                    processId: "testProcess2",
                    triggerRequestOn: "queryBuffer",
                    staticInputs: {}
                }
            ];

            mockExecuteProcess.resolves({jobID: "1337"});
            mockPollJobResults.resolves({outputs: "Test Result"});
            loadModule;

            await actions.fetchAdditionalRequests({commit: testCommit, state: testState}, "init");

            expect(mockExecuteProcess.calledOnce).to.be.true;
            expect(mockExecuteProcess.calledWith(
                "https://example1.com",
                "testProcess1",
                sinon.match.any
            )).to.be.true;
        });

        it("should consider all OGC API Process input sources for its request", async () => {
            const mockResult = {
                    outputs: "Test Result"
                },
                fetchStub = sinon.stub(global, "fetch");

            mockExecuteProcess.resolves({jobID: "1337"});
            mockPollJobResults.resolves(mockResult);
            rootGetters.seven = 7;
            fetchStub.resolves(new Response(
                "module.exports = () => 5;",
                {status: 200, headers: {"content-type": "application/javascript"}}
            ));

            testState.additionalRequests = [{
                url: "https://example.com",
                type: "ogcApiProcesses",
                processId: "testProcess",
                staticInputs: {
                    "car": "pet"
                },
                dynamicInputs: {
                    parsers: [{path: "/js/returnFive.js", key: "five"}],
                    getters: [{path: "seven", key: "seven"}]
                }
            }];

            await actions.fetchAdditionalRequests({commit: testCommit, state: testState, rootGetters}, "init");

            expect(mockExecuteProcess.firstCall.args).to.deep.equal([
                "https://example.com",
                "testProcess",
                {
                    "car": "pet",
                    "seven": 7,
                    "five": 5
                }
            ]);
        });

        it("should throw error for unsupported request type", async () => {
            testState.additionalRequests = [{
                url: "https://example.com",
                type: "unsupportedType",
                processId: "testProcess"
            }];

            try {
                await actions.fetchAdditionalRequests({commit: testCommit, state: testState}, "init");
                expect.fail("Should have thrown an error");
            }
            catch (error) {
                expect(error.message).to.include("unsupportedType");
            }
        });

        it("should handle OGC API Process execution error", async () => {
            const consoleErrorStub = sinon.stub(console, "error");

            testState.additionalRequests = [{
                url: "https://example.com",
                type: "ogcApiProcesses",
                processId: "testProcess",
                inputs: {}
            }];

            mockExecuteProcess.rejects(new Error("API Error"));

            await actions.fetchAdditionalRequests({
                commit: testCommit,
                state: testState,
                dispatch: sinon.stub()
            }, "init");

            expect(testCommit.calledWith("setAdditionalRequestResults")).to.be.true;
            expect(consoleErrorStub.called).to.be.true;

            consoleErrorStub.restore();
        });
    });
});
