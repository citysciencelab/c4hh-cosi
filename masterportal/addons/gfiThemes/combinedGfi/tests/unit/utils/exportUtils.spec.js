import {expect} from "chai";
import sinon from "sinon";
import {
    exportToDOC,
    exportToPDF,
    exportToJSON
} from "../../../utils/exportUtils.js";

describe("addons/gfiThemes/combinedGfi/utils/exportUtils.js", () => {
    let setIsLoadingSpy, createElementStub, appendChildStub, clickStub, removeChildStub, fakeLinkElement,
        originalDocument, originalURL, originalBlob, originalWindow, originalI18next;

    beforeEach(() => {
        originalI18next = global.i18next;
        global.i18next = {
            t: sinon.stub().returns("translated")
        };

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
            click: clickStub,
            style: {
                display: ""
            }
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

        global.Blob = function (content, options) {
            return {content, options};
        };
    });

    afterEach(() => {
        global.document = originalDocument;
        global.URL = originalURL;
        global.Blob = originalBlob;
        global.window = originalWindow;
        global.i18next = originalI18next;

    });

    describe("exportToDOC", () => {
        it("exports data to DOC format", async () => {
            const layerResults = [
                    {
                        layerName: "Layer 1",
                        headers: [
                            {name: "attr1", index: 0},
                            {name: {name: "attr2", alias: "Attribute 2"}, index: 1}
                        ],
                        rows: [
                            {attr1: "value1", attr2: "value2"}
                        ]
                    }
                ],

                translations = {
                    defaultFileName: "Export-File",
                    exportAsDoc: "Export as DOC",
                    noData: "Keine Daten verfügbar"
                };

            exportToDOC({
                layerResults,
                fileName: "test-export",
                setIsLoading: setIsLoadingSpy,
                translations
            });

            expect(setIsLoadingSpy.firstCall.args[0]).to.be.true;
            expect(createElementStub.calledWith("a")).to.be.true;
            expect(appendChildStub.called).to.be.true;
            expect(clickStub.called).to.be.true;
            expect(removeChildStub.called).to.be.true;
            expect(setIsLoadingSpy.lastCall.args[0]).to.be.false;
            expect(global.URL.revokeObjectURL.called).to.be.true;
        });

        it("handles empty rows gracefully", async () => {
            const layerResults = [
                    {
                        layerName: "Layer 1",
                        headers: [
                            {name: "attr1"}
                        ],
                        rows: []
                    }
                ],

                translations = {
                    defaultFileName: "Export-File",
                    exportAsDoc: "Export as DOC",
                    noData: "Keine Daten verfügbar"
                };

            exportToDOC({
                layerResults,
                fileName: "test-export",
                setIsLoading: setIsLoadingSpy,
                translations
            });

            expect(setIsLoadingSpy.calledWith(true)).to.be.true;
            expect(setIsLoadingSpy.calledWith(false)).to.be.true;
        });
    });

    describe("exportToJSON", () => {
        it("exports data to JSON format", async () => {
            const layerResults = [
                    {
                        layerName: "Layer 1",
                        headers: [
                            {name: "attr1", index: 0},
                            {name: {name: "attr2", alias: "Attribute 2"}, index: 1}
                        ],
                        rows: [
                            {attr1: "value1", attr2: "value2"}
                        ]
                    }
                ],

                translations = {
                    defaultFileName: "Export-File"
                };

            exportToJSON({
                layerResults,
                fileName: "test-export",
                setIsLoading: setIsLoadingSpy,
                translations
            });

            expect(setIsLoadingSpy.firstCall.args[0]).to.be.true;
            expect(createElementStub.calledWith("a")).to.be.true;
            expect(appendChildStub.called).to.be.true;
            expect(clickStub.called).to.be.true;
            expect(removeChildStub.called).to.be.true;
            expect(setIsLoadingSpy.lastCall.args[0]).to.be.false;
        });

        it("handles complex header structures", async () => {
            const layerResults = [
                    {
                        layerName: "Layer 1",
                        headers: [
                            {name: "simple", index: 0},
                            {name: {name: "complex", alias: "Complex Field"}, index: 1}
                        ],
                        rows: [
                            {simple: "test", complex: "value"}
                        ]
                    }
                ],

                translations = {
                    defaultFileName: "Export-File"
                };

            exportToJSON({
                layerResults,
                fileName: "test-export",
                setIsLoading: setIsLoadingSpy,
                translations
            });

            expect(setIsLoadingSpy.calledWith(true)).to.be.true;
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

        it("exports data to PDF format", async () => {
            const layerResults = [
                    {
                        layerName: "Layer 1",
                        headers: [
                            {name: "attr1", index: 0},
                            {name: {name: "attr2", alias: "Attribute 2"}, index: 1}
                        ],
                        rows: [
                            {attr1: "value1", attr2: "value2"}
                        ]
                    }
                ],

                translations = {
                    defaultFileName: "Export-File",
                    exportAsPdf: "Export as PDF"
                };

            exportToPDF({
                layerResults,
                fileName: "test-export",
                setIsLoading: setIsLoadingSpy,
                translations
            });

            expect(setIsLoadingSpy.firstCall.args[0]).to.be.true;
            expect(windowOpenStub.called).to.be.true;
            expect(writeStub.called).to.be.true;
            expect(closeStub.called).to.be.true;
            expect(focusStub.called).to.be.true;
            expect(printStub.called).to.be.true;
            expect(setIsLoadingSpy.lastCall.args[0]).to.be.false;
        });

        it("handles window.open failure gracefully", async () => {
            windowOpenStub.returns(null);

            const layerResults = [
                    {
                        layerName: "Layer 1",
                        headers: [{name: "attr1", index: 0}],
                        rows: [{attr1: "value1"}]
                    }
                ],

                translations = {
                    defaultFileName: "Export-File",
                    exportAsPdf: "Export as PDF"
                };

            exportToPDF({
                layerResults,
                fileName: "test-export",
                setIsLoading: setIsLoadingSpy,
                translations
            });

            expect(setIsLoadingSpy.firstCall.args[0]).to.be.true;
            expect(windowOpenStub.called).to.be.true;
            expect(setIsLoadingSpy.lastCall.args[0]).to.be.false;
            expect(writeStub.called).to.be.false;
            expect(focusStub.called).to.be.false;
            expect(printStub.called).to.be.false;
        });

        it("handles layers with many columns", async () => {
            const headers = [],
                row = {},
                layerResults = [
                    {
                        layerName: "Layer with many columns",
                        headers: headers,
                        rows: [row]
                    }
                ],

                translations = {
                    defaultFileName: "Export-File",
                    exportAsPdf: "Export as PDF"
                };

            for (let i = 0; i < 10; i++) {
                headers.push({name: `attr${i}`, index: i});
                row[`attr${i}`] = `value${i}`;
            }

            exportToPDF({
                layerResults,
                fileName: "test-export",
                setIsLoading: setIsLoadingSpy,
                translations
            });

            expect(setIsLoadingSpy.calledWith(true)).to.be.true;
            expect(windowOpenStub.called).to.be.true;
            expect(writeStub.called).to.be.true;
            const htmlContent = writeStub.firstCall.args[0];

            expect(htmlContent).to.include("many-columns");
            expect(setIsLoadingSpy.calledWith(false)).to.be.true;
        });
    });
});
