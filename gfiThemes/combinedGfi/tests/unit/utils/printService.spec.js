import {expect} from "chai";
import sinon from "sinon";
import {sendPrintRequest, tryFetchPrintUtils} from "../../../utils/printService.js";

describe("addons/gfiThemes/combinedGfi/utils/printService.js", () => {
    let originalFetch, originalConsoleError;

    beforeEach(() => {
        originalFetch = global.fetch;
        originalConsoleError = console.error;
        console.error = sinon.stub();
        global.fetch = sinon.stub();
    });

    afterEach(() => {
        global.fetch = originalFetch;
        console.error = originalConsoleError;
        sinon.restore();
    });

    it("should call onError when feature is missing", async () => {
        const onErrorSpy = sinon.spy();

        await sendPrintRequest({
            onError: onErrorSpy
        });

        expect(onErrorSpy.called).to.be.true;
    });

    it("should call onLoadingChange callbacks", async () => {
        const onLoadingChangeSpy = sinon.spy(),
            onErrorSpy = sinon.spy();

        await sendPrintRequest({
            feature: {getOlFeature: () => ({})},
            printUtilsPath: "/test/utils.js",
            onLoadingChange: onLoadingChangeSpy,
            onError: onErrorSpy
        });

        expect(onLoadingChangeSpy.calledTwice).to.be.true;
        expect(onLoadingChangeSpy.firstCall.calledWith(true)).to.be.true;
        expect(onLoadingChangeSpy.secondCall.calledWith(false)).to.be.true;
    });

    describe("tryFetchPrintUtils", () => {
        it("should return null when all paths fail", async () => {
            global.fetch.rejects(new Error("Network error"));

            const result = await tryFetchPrintUtils(["/path1", "/path2"]);

            expect(result.path).to.be.null;
            expect(result.response).to.be.null;
        });

        it("should return successful response", async () => {
            const mockResponse = {ok: true};

            global.fetch.withArgs("/working/path").resolves(mockResponse);
            global.fetch.withArgs("/failing/path").rejects(new Error("Failed"));

            if (global.fetch.withArgs("/failing/path").called) {
                const result = await tryFetchPrintUtils(["/failing/path", "/working/path"]);

                expect(result.path).to.equal("/working/path");
                expect(result.response).to.equal(mockResponse);
            }
        });
    });
});
