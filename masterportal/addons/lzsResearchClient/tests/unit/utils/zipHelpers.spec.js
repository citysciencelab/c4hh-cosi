import {expect} from "chai";
import sinon from "sinon";
import {setNested,
    buildFileInformationObject,
    saveAs, fetchWithProgress,
    getHumanReadableFileSize,
    roundFileSizeToFixed,
    calcProgress} from "../../../utils/zipHelpers";

/**
 * Run only utils tests via command:
 * npm run test:watch -- --grep="addons/lzsResearchClient/tests/unit/utils/"
 */
describe("addons/lzsResearchClient/utils/zipHelpers", () => {
    describe("setNested", () => {
        it("should return directly without modifying 'nestedInput' with corrupt head values", () => {
            const nestedInput = {};

            setNested(nestedInput, [null, 2026, "Filename.txt"], "FileDataObject");
            expect(nestedInput).to.deep.equal({});

            setNested(nestedInput, ["__proto__", 2026, "Filename.txt"], "FileDataObject");
            expect(nestedInput).to.deep.equal({});

            setNested(nestedInput, ["constructor", 2026, "Filename.txt"], "FileDataObject");
            expect(nestedInput).to.deep.equal({});

            setNested(nestedInput, ["prototype", 2026, "Filename.txt"], "FileDataObject");
            expect(nestedInput).to.deep.equal({});
        });

        it("should ignore dangerous keys at deeper levels", () => {
            const nested = {};

            setNested(nested, ["archive", "__proto__", "file.txt"], "data");
            // archive was created but recursion stopped at "__proto__" -> no file set
            expect(nested).to.deep.equal({archive: {}});

            setNested(nested, ["archive", "constructor", "file.txt"], "data");
            // archive was created but recursion stopped at "constructor" -> no file set
            expect(nested).to.deep.equal({archive: {}});

            setNested(nested, ["archive", "prototype", "file.txt"], "data");
            // archive was created but recursion stopped at "prototype" -> no file set
            expect(nested).to.deep.equal({archive: {}});

            setNested(nested, ["archive", null, "file.txt"], "data");
            // archive was created but recursion stopped at null -> no file set
            expect(nested).to.deep.equal({archive: {}});
        });

        it("should set correct compression level for compressed and not compressed files", () => {
            let nestedInput = {};

            setNested(nestedInput, ["archive", 2026, "Filename.txt"], "FileDataObject");
            expect(nestedInput).to.deep.equal({
                archive: {
                    2026: {
                        "Filename.txt": [
                            "FileDataObject",
                            {level: 6}
                        ]
                    }
                }
            });

            nestedInput = {};

            setNested(nestedInput, ["archive", 2026, "Filename.jp2"], "FileDataObject");
            expect(nestedInput).to.deep.equal({
                archive: {
                    2026: {
                        "Filename.jp2": [
                            "FileDataObject",
                            {level: 0}
                        ]
                    }
                }
            });
        });

        it("should determine compression level case-insensitively", () => {
            const nested = {};

            setNested(nested, ["archive", 2026, "IMAGE.JPG"], "img");
            setNested(nested, ["archive", 2026, "text.TXT"], "txt");

            expect(nested.archive[2026]["IMAGE.JPG"][1].level).to.equal(0); // jpg is in ALREADY_COMPRESSED
            expect(nested.archive[2026]["text.TXT"][1].level).to.equal(6); // txt not compressed
        });

        it("should create intermediate objects with null prototype", () => {
            const nested = {};

            setNested(nested, ["archive", 2026, "file.txt"], "data");
            expect(Object.getPrototypeOf(nested.archive)).to.equal(null);
            expect(Object.getPrototypeOf(nested.archive[2026])).to.equal(null);
        });

        it("should not overwrite sibling entries when adding multiple files", () => {
            const nested = {};

            setNested(nested, ["archive", 2026, "A.txt"], "Adata");
            setNested(nested, ["archive", 2026, "B.txt"], "Bdata");

            expect(nested.archive[2026]["A.txt"][0]).to.equal("Adata");
            expect(nested.archive[2026]["B.txt"][0]).to.equal("Bdata");
        });
    });

    describe("buildFileInformationObject", () => {
        it("should build a well formatted object", () => {
            const fileInfoObject = buildFileInformationObject(
                "metadata-filename",
                "basePath/rest/dossier/123/content",
                50000,
                "archiveId",
                "archiveName",
                2026,
                "requestToken"
            );

            expect(fileInfoObject).to.deep.equal({
                pathParts: ["archiveName", 2026, "metadata-filename"],
                url: "basePath/rest/dossier/123/content?Token=requestToken",
                size: 50000,
                archiveId: "archiveId"
            });
        });

        it("should use a fallback filename if none is given", () => {
            const fileInfoObject = buildFileInformationObject(
                null,
                "basePath/rest/dossier/123/content",
                50000,
                "archiveId",
                "archiveName",
                2026,
                "requestToken"
            );

            expect(fileInfoObject).to.deep.equal({
                pathParts: ["archiveName", 2026, "file"],
                url: "basePath/rest/dossier/123/content?Token=requestToken",
                size: 50000,
                archiveId: "archiveId"
            });
        });

        it("should create a save filename if / or \\ is contained in 'filename'", () => {
            const fileInfoObject = buildFileInformationObject(
                "metadata/file\\name",
                "basePath/rest/dossier/123/content",
                50000,
                "archiveId",
                "archiveName",
                2026,
                "requestToken"
            );

            expect(fileInfoObject).to.deep.equal({
                pathParts: ["archiveName", 2026, "metadata_file_name"],
                url: "basePath/rest/dossier/123/content?Token=requestToken",
                size: 50000,
                archiveId: "archiveId"
            });
        });

        it("should set fileSize to 0 if no number is given (true | false are converted to numbers), converts strings to numbers if possible", () => {
            let fileInfoObject = buildFileInformationObject(
                "metadata-filename",
                "basePath/rest/dossier/123/content",
                false,
                "archiveId",
                "archiveName",
                2026,
                "requestToken"
            );

            expect(fileInfoObject).to.deep.equal({
                pathParts: ["archiveName", 2026, "metadata-filename"],
                url: "basePath/rest/dossier/123/content?Token=requestToken",
                size: 0,
                archiveId: "archiveId"
            });

            fileInfoObject = buildFileInformationObject(
                "metadata-filename",
                "basePath/rest/dossier/123/content",
                true,
                "archiveId",
                "archiveName",
                2026,
                "requestToken"
            );

            expect(fileInfoObject).to.deep.equal({
                pathParts: ["archiveName", 2026, "metadata-filename"],
                url: "basePath/rest/dossier/123/content?Token=requestToken",
                size: 1,
                archiveId: "archiveId"
            });

            fileInfoObject = buildFileInformationObject(
                "metadata-filename",
                "basePath/rest/dossier/123/content",
                null,
                "archiveId",
                "archiveName",
                2026,
                "requestToken"
            );

            expect(fileInfoObject).to.deep.equal({
                pathParts: ["archiveName", 2026, "metadata-filename"],
                url: "basePath/rest/dossier/123/content?Token=requestToken",
                size: 0,
                archiveId: "archiveId"
            });

            fileInfoObject = buildFileInformationObject(
                "metadata-filename",
                "basePath/rest/dossier/123/content",
                "12345",
                "archiveId",
                "archiveName",
                2026,
                "requestToken"
            );

            expect(fileInfoObject).to.deep.equal({
                pathParts: ["archiveName", 2026, "metadata-filename"],
                url: "basePath/rest/dossier/123/content?Token=requestToken",
                size: 12345,
                archiveId: "archiveId"
            });

            fileInfoObject = buildFileInformationObject(
                "metadata-filename",
                "basePath/rest/dossier/123/content",
                "not-a-number",
                "archiveId",
                "archiveName",
                2026,
                "requestToken"
            );

            expect(fileInfoObject).to.deep.equal({
                pathParts: ["archiveName", 2026, "metadata-filename"],
                url: "basePath/rest/dossier/123/content?Token=requestToken",
                size: 0,
                archiveId: "archiveId"
            });

            fileInfoObject = buildFileInformationObject(
                "metadata-filename",
                "basePath/rest/dossier/123/content",
                undefined,
                "archiveId",
                "archiveName",
                2026,
                "requestToken"
            );

            expect(fileInfoObject).to.deep.equal({
                pathParts: ["archiveName", 2026, "metadata-filename"],
                url: "basePath/rest/dossier/123/content?Token=requestToken",
                size: 0,
                archiveId: "archiveId"
            });
        });

        it("should preserve numeric archiveId and include foldernames in pathParts", () => {
            const fileInfoObject = buildFileInformationObject(
                "file.txt",
                "basePath/rest/dossier/123/content",
                42,
                999,
                "archiveName",
                "metadata",
                "requestToken"
            );

            expect(fileInfoObject.archiveId).to.equal(999);
            expect(fileInfoObject.pathParts).to.deep.equal(["archiveName", "metadata", "file.txt"]);
        });
    });

    describe("saveAs", () => {
        let clock;

        afterEach(() => {
            sinon.restore();
            if (clock) {
                clock.restore();
                clock = null;
            }
        });

        it("should use createObjectURL and revokeObjectURL when blob is provided", () => {
            const blob = new Blob(["x"]);
            const objUrl = "blob:fake-url";
            const createStub = sinon.stub(window.URL, "createObjectURL").returns(objUrl);
            const revokeStub = sinon.stub(window.URL, "revokeObjectURL");

            const originalCreate = document.createElement;
            const anchor = originalCreate.call(document, "a");
            const clickStub = sinon.stub(anchor, "click").callsFake(() => {
                return null;
            });

            sinon.stub(document, "createElement").callsFake((tag) => tag === "a" ? anchor : originalCreate.call(document, tag));
            const appendSpy = sinon.spy(document.body, "appendChild");
            const removeSpy = sinon.spy(document.body, "removeChild");

            clock = sinon.useFakeTimers();
            saveAs(blob, null, "file.txt");

            sinon.assert.calledOnce(createStub);
            sinon.assert.calledWith(appendSpy, anchor);
            sinon.assert.calledOnce(clickStub);
            sinon.assert.calledWith(removeSpy, anchor);

            // revoke is scheduled after 1000ms
            clock.tick(1000);
            sinon.assert.calledOnce(revokeStub);
            sinon.assert.calledWith(revokeStub, objUrl);
        });

        it("should not call createObjectURL when url is provided and blob is null", () => {
            const createStub = sinon.stub(window.URL, "createObjectURL");
            const revokeStub = sinon.stub(window.URL, "revokeObjectURL");

            const originalCreate = document.createElement;
            const anchor = originalCreate.call(document, "a");
            const clickStub = sinon.stub(anchor, "click").callsFake(() => {
                return null;
            });

            sinon.stub(document, "createElement").callsFake((tag) => tag === "a" ? anchor : originalCreate.call(document, tag));
            const appendSpy = sinon.spy(document.body, "appendChild");
            const removeSpy = sinon.spy(document.body, "removeChild");

            const testUrl = "https://example.com/file";

            saveAs(null, testUrl, "remote.txt");

            sinon.assert.notCalled(createStub);
            sinon.assert.notCalled(revokeStub);
            sinon.assert.calledOnce(appendSpy);
            sinon.assert.calledOnce(clickStub);

            // anchor should have used the provided url
            expect(anchor.href).to.equal(testUrl);
            expect(anchor.download).to.equal("remote.txt");
            sinon.assert.calledOnce(removeSpy);
        });

        it("should use blob and ignore url when both are provided", () => {
            const blob = new Blob(["x"]);
            const objUrl = "blob:fake-url";
            const createStub = sinon.stub(window.URL, "createObjectURL").returns(objUrl);
            const revokeStub = sinon.stub(window.URL, "revokeObjectURL");

            const originalCreate = document.createElement;
            const anchor = originalCreate.call(document, "a");
            const clickStub = sinon.stub(anchor, "click").callsFake(() => {
                return null;
            });

            sinon.stub(document, "createElement").callsFake((tag) => tag === "a" ? anchor : originalCreate.call(document, tag));
            const appendSpy = sinon.spy(document.body, "appendChild");
            const removeSpy = sinon.spy(document.body, "removeChild");

            const testUrl = "https://example.com/file";

            clock = sinon.useFakeTimers();
            saveAs(blob, testUrl, "remote.txt");

            sinon.assert.calledOnce(createStub);
            sinon.assert.calledWith(appendSpy, anchor);
            sinon.assert.calledOnce(clickStub);
            sinon.assert.calledWith(removeSpy, anchor);

            expect(anchor.href).to.equal(objUrl);
            expect(anchor.download).to.equal("remote.txt");

            // revoke is scheduled after 1000ms
            clock.tick(1000);
            sinon.assert.calledOnce(revokeStub);
            sinon.assert.calledWith(revokeStub, objUrl);
        });
    });

    describe("fetchWithProgress", () => {
        afterEach(() => {
            sinon.restore();
        });

        it("should stream chunks, call onProgress and return concatenated bytes", async () => {
            const chunks = [new Uint8Array([10, 20, 30]), new Uint8Array([40, 50])];
            const reader = {
                read: sinon.stub()
                    .onFirstCall().resolves({done: false, value: chunks[0]})
                    .onSecondCall().resolves({done: false, value: chunks[1]})
                    .onThirdCall().resolves({done: true})
            };
            const body = {getReader: () => reader};
            const response = {ok: true, body};
            const fetchStub = sinon.stub(global, "fetch").resolves(response);

            const progressCalls = [];
            const result = await fetchWithProgress("https://example.test/file", (loaded) => progressCalls.push(loaded));

            expect(Array.from(result)).to.deep.equal([10, 20, 30, 40, 50]);
            expect(progressCalls).to.deep.equal([3, 5]);
            sinon.assert.calledWith(fetchStub, "https://example.test/file", {credentials: "same-origin"});
        });

        it("should throw an error when response is not ok", async () => {
            const response = {ok: false, status: 404, statusText: "Not Found"};

            sinon.stub(global, "fetch").resolves(response);

            try {
                await fetchWithProgress("https://example.test/missing", () => undefined);
                throw new Error("should have thrown");
            }
            catch (err) {
                expect(err.message).to.equal("404 Not Found");
            }
        });
    });

    describe("getHumanReadableFileSize", () => {
        it("should return the correct human readable file size", () => {
            const prevI18next = global.i18next;

            expect(getHumanReadableFileSize(0)).to.equal("0 kB");
            expect(getHumanReadableFileSize()).to.equal("0 kB");
            expect(getHumanReadableFileSize("test")).to.equal("0 kB");
            expect(getHumanReadableFileSize(null)).to.equal("0 kB");
            expect(getHumanReadableFileSize({bla: "foo"})).to.equal("0 kB");
            expect(getHumanReadableFileSize([1, 2])).to.equal("0 kB");
            expect(getHumanReadableFileSize(true)).to.equal("0 kB");
            expect(getHumanReadableFileSize(false)).to.equal("0 kB");
            expect(getHumanReadableFileSize(undefined)).to.equal("0 kB");
            expect(getHumanReadableFileSize(-209)).to.equal("0 kB");
            expect(getHumanReadableFileSize("")).to.equal("0 kB");

            global.i18next = {language: "de"};
            expect(getHumanReadableFileSize(100)).to.equal("0,10 kB");
            expect(getHumanReadableFileSize(213354841)).to.equal("213,35 MB");
            expect(getHumanReadableFileSize(500000000)).to.equal("500 MB");
            expect(getHumanReadableFileSize(2136548410)).to.equal("2,14 GB");
            expect(getHumanReadableFileSize("2136548410")).to.equal("2,14 GB");
            expect(getHumanReadableFileSize(50000000000)).to.equal("50 GB");

            global.i18next = {language: "en"};
            expect(getHumanReadableFileSize(100)).to.equal("0.10 kB");
            expect(getHumanReadableFileSize(213354841)).to.equal("213.35 MB");
            expect(getHumanReadableFileSize(500000000)).to.equal("500 MB");
            expect(getHumanReadableFileSize(2136548410)).to.equal("2.14 GB");
            expect(getHumanReadableFileSize("2136548410")).to.equal("2.14 GB");
            expect(getHumanReadableFileSize(50000000000)).to.equal("50 GB");

            global.i18next = prevI18next;
        });
    });

    describe("roundFileSizeToFixed", () => {
        it("should return the correct number with or without decimals", () => {
            const prevI18next = global.i18next;

            expect(roundFileSizeToFixed(0)).to.equal("0");
            expect(roundFileSizeToFixed()).to.equal("0");
            expect(roundFileSizeToFixed("test")).to.equal("0");
            expect(roundFileSizeToFixed(null)).to.equal("0");
            expect(roundFileSizeToFixed({bla: "foo"})).to.equal("0");
            expect(roundFileSizeToFixed([1, 2])).to.equal("0");
            expect(roundFileSizeToFixed(true)).to.equal("0");
            expect(roundFileSizeToFixed(false)).to.equal("0");
            expect(roundFileSizeToFixed(undefined)).to.equal("0");
            expect(roundFileSizeToFixed("")).to.equal("0");

            global.i18next = {language: "de"};
            expect(roundFileSizeToFixed(-209)).to.equal("-209");
            expect(roundFileSizeToFixed(100)).to.equal("100");
            expect(roundFileSizeToFixed(21335.4841)).to.equal("21335,48");
            expect(roundFileSizeToFixed(50.000)).to.equal("50");
            expect(roundFileSizeToFixed("2136548.410")).to.equal("2136548,41");

            global.i18next = {language: "en"};
            expect(roundFileSizeToFixed(-209)).to.equal("-209");
            expect(roundFileSizeToFixed(100)).to.equal("100");
            expect(roundFileSizeToFixed(21335.4841)).to.equal("21335.48");
            expect(roundFileSizeToFixed(50.000)).to.equal("50");
            expect(roundFileSizeToFixed("2136548.410")).to.equal("2136548.41");

            global.i18next = {language: "de"};
            expect(roundFileSizeToFixed(0, true)).to.equal("0,00");
            expect(roundFileSizeToFixed("test", true)).to.equal("0,00");
            expect(roundFileSizeToFixed(null, true)).to.equal("0,00");
            expect(roundFileSizeToFixed({bla: "foo"}, true)).to.equal("0,00");
            expect(roundFileSizeToFixed([1, 2], true)).to.equal("0,00");
            expect(roundFileSizeToFixed(true, true)).to.equal("0,00");
            expect(roundFileSizeToFixed(false, true)).to.equal("0,00");
            expect(roundFileSizeToFixed(undefined, true)).to.equal("0,00");
            expect(roundFileSizeToFixed("", true)).to.equal("0,00");

            expect(roundFileSizeToFixed(-209, true)).to.equal("-209,00");
            expect(roundFileSizeToFixed(100, true)).to.equal("100,00");
            expect(roundFileSizeToFixed(21335.4841, true)).to.equal("21335,48");
            expect(roundFileSizeToFixed(50.000, true)).to.equal("50,00");
            expect(roundFileSizeToFixed("2136548.410", true)).to.equal("2136548,41");

            global.i18next = {language: "en"};
            expect(roundFileSizeToFixed(-209, true)).to.equal("-209.00");
            expect(roundFileSizeToFixed(100, true)).to.equal("100.00");
            expect(roundFileSizeToFixed(21335.4841, true)).to.equal("21335.48");
            expect(roundFileSizeToFixed(50.000, true)).to.equal("50.00");
            expect(roundFileSizeToFixed("2136548.410", true)).to.equal("2136548.41");

            global.i18next = prevI18next;
        });
    });

    describe("calcProgress", () => {
        it("should return start when total is 0", () => {
            const result = calcProgress({value: 50, total: 0, start: 10, end: 100});

            expect(result).to.equal(10);
        });

        it("should return start when value is negative", () => {
            const result = calcProgress({value: -10, total: 100, start: 10, end: 100});

            expect(result).to.equal(10);
        });

        it("should return end when value is greater than total", () => {
            const result = calcProgress({value: 150, total: 100, start: 10, end: 100});

            expect(result).to.equal(100);
        });

        it("should calculate progress correctly", () => {
            const result = calcProgress({value: 50, total: 100, start: 20, end: 70});

            expect(result).to.equal(45);
        });
    });
});
