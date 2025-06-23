import {expect} from "chai";
import sinon from "sinon";
import {
    exportToCSV,
    exportToDOC,
    exportToPDF,
    exportToJSON
} from "../../../utils/exportUtils.js";

describe("addons/gfiThemes/combinedGfi/utils/exportUtils.js", () => {
    // Define variables for use across tests
    let setIsLoadingSpy, createElementStub, appendChildStub, clickStub, removeChildStub, fakeLinkElement,
        originalDocument, originalURL, originalBlob, originalWindow;

    beforeEach(() => {
        // Store original global objects
        originalDocument = global.document;
        originalURL = global.URL;
        originalBlob = global.Blob;
        originalWindow = global.window;

        setIsLoadingSpy = sinon.spy();
        clickStub = sinon.spy();
        appendChildStub = sinon.spy();
        removeChildStub = sinon.spy();

        // Create a fake link element
        fakeLinkElement = {
            setAttribute: sinon.spy(),
            href: "",
            download: "",
            click: clickStub
        };

        // Set up the global document object with required methods
        global.document = {
            createElement: createElementStub = sinon.stub().returns(fakeLinkElement),
            body: {
                appendChild: appendChildStub,
                removeChild: removeChildStub
            }
        };

        // Mock URL.createObjectURL and revokeObjectURL
        global.URL = {
            createObjectURL: sinon.stub().returns("blob:url"),
            revokeObjectURL: sinon.spy()
        };

        // Mock Blob
        global.Blob = function () {
            return {};
        };
    });

    afterEach(() => {
        // Restore original global objects
        global.document = originalDocument;
        global.URL = originalURL;
        global.Blob = originalBlob;
        global.window = originalWindow;

        sinon.restore();
    });

    describe("exportToCSV", () => {
        it("exports data to CSV format", () => {
            const layerResults = [
                {
                    layerName: "Layer 1",
                    headers: [
                        {name: "attr1"},
                        {name: {name: "attr2", alias: "Attribute 2"}}
                    ],
                    rows: [
                        {attr1: "value1", attr2: "value2"}
                    ]
                }
            ];

            exportToCSV({
                layerResults,
                fileName: "test-export",
                setIsLoading: setIsLoadingSpy
            });

            expect(setIsLoadingSpy.calledWith(true)).to.be.true;
            expect(createElementStub.calledWith("a")).to.be.true;
            expect(appendChildStub.called).to.be.true;
            expect(clickStub.called).to.be.true;
            expect(removeChildStub.called).to.be.true;
            expect(setIsLoadingSpy.calledWith(false)).to.be.true;
        });
    });

    describe("exportToDOC", () => {
        it("exports data to DOC format", () => {
            const layerResults = [
                {
                    layerName: "Layer 1",
                    headers: [
                        {name: "attr1"},
                        {name: {name: "attr2", alias: "Attribute 2"}}
                    ],
                    rows: [
                        {attr1: "value1", attr2: "value2"}
                    ]
                }
            ];

            exportToDOC({
                layerResults,
                fileName: "test-export",
                setIsLoading: setIsLoadingSpy
            });

            expect(setIsLoadingSpy.calledWith(true)).to.be.true;
            expect(createElementStub.calledWith("a")).to.be.true;
            expect(appendChildStub.called).to.be.true;
            expect(clickStub.called).to.be.true;
            expect(removeChildStub.called).to.be.true;
            expect(setIsLoadingSpy.calledWith(false)).to.be.true;
        });
    });

    describe("exportToJSON", () => {
        it("exports data to JSON format", () => {
            const layerResults = [
                {
                    layerName: "Layer 1",
                    headers: [
                        {name: "attr1"},
                        {name: {name: "attr2", alias: "Attribute 2"}}
                    ],
                    rows: [
                        {attr1: "value1", attr2: "value2"}
                    ]
                }
            ];

            exportToJSON({
                layerResults,
                fileName: "test-export",
                setIsLoading: setIsLoadingSpy
            });

            expect(setIsLoadingSpy.calledWith(true)).to.be.true;
            expect(createElementStub.calledWith("a")).to.be.true;
            expect(appendChildStub.called).to.be.true;
            expect(clickStub.called).to.be.true;
            expect(removeChildStub.called).to.be.true;
            expect(setIsLoadingSpy.calledWith(false)).to.be.true;
        });
    });

    describe("exportToPDF", () => {
        // Define variables for PDF-specific tests
        let windowOpenStub, writeStub, closeStub, focusStub, printStub, fakeWindow;

        beforeEach(() => {
            writeStub = sinon.spy();
            closeStub = sinon.spy();
            focusStub = sinon.spy();
            printStub = sinon.spy();

            // Create a fake window with the required methods
            fakeWindow = {
                document: {
                    write: writeStub,
                    close: closeStub
                },
                focus: focusStub,
                print: printStub,
                close: closeStub
            };

            // Mock the window.open method
            global.window = {
                open: windowOpenStub = sinon.stub().returns(fakeWindow)
            };
        });

        afterEach(() => {
            // Clean up the window mock
            delete global.window;
        });

        it("exports data to PDF format", () => {
            const layerResults = [
                {
                    layerName: "Layer 1",
                    headers: [
                        {name: "attr1"},
                        {name: {name: "attr2", alias: "Attribute 2"}}
                    ],
                    rows: [
                        {attr1: "value1", attr2: "value2"}
                    ]
                }
            ];

            exportToPDF({
                layerResults,
                fileName: "test-export",
                setIsLoading: setIsLoadingSpy
            });

            expect(setIsLoadingSpy.calledWith(true)).to.be.true;
            expect(windowOpenStub.called).to.be.true;
            expect(writeStub.called).to.be.true;
            expect(closeStub.called).to.be.true;
            expect(focusStub.called).to.be.true;
            expect(printStub.called).to.be.true;
            expect(setIsLoadingSpy.calledWith(false)).to.be.true;
        });
    });
});
