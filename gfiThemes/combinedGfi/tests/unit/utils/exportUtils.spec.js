import {expect} from "chai";
import sinon from "sinon";
import {
    exportToCSV,
    exportToDOC,
    exportToPDF,
    exportToJSON
} from "../../../utils/exportUtils.js";

describe("addons/gfiThemes/combinedGfi/utils/exportUtils.js", () => {
    let setIsLoadingSpy, createElementStub, appendChildStub, clickStub, removeChildStub, fakeLinkElement,
        originalDocument, originalURL, originalBlob, originalWindow;

    beforeEach(() => {
        originalDocument = global.document;
        originalURL = global.URL;
        originalBlob = global.Blob;
        originalWindow = global.window;
        setIsLoadingSpy = sinon.spy();
        clickStub = sinon.spy();
        appendChildStub = sinon.spy();
        removeChildStub = sinon.spy();
        fakeLinkElement = {
            setAttribute: sinon.spy(),
            href: "",
            download: "",
            click: clickStub
        };

        global.document = {
            createElement: createElementStub = sinon.stub().returns(fakeLinkElement),
            body: {
                appendChild: appendChildStub,
                removeChild: removeChildStub
            }
        };

        global.URL = {
            createObjectURL: sinon.stub().returns("blob:url"),
            revokeObjectURL: sinon.spy()
        };

        global.Blob = function () {
            return {};
        };
    });

    afterEach(() => {
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
        let windowOpenStub, writeStub, closeStub, focusStub, printStub, fakeWindow;

        beforeEach(() => {
            writeStub = sinon.spy();
            closeStub = sinon.spy();
            focusStub = sinon.spy();
            printStub = sinon.spy();
            fakeWindow = {
                document: {
                    write: writeStub,
                    close: closeStub
                },
                focus: focusStub,
                print: printStub,
                close: closeStub
            };
            global.window = {
                open: windowOpenStub = sinon.stub().returns(fakeWindow)
            };
        });

        afterEach(() => {
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
