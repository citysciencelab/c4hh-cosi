import {expect} from "chai";
import sinon from "sinon";
import {sendPrintRequest, sendPrintRequestToServer} from "../../../utils/printService.js";

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

    it("should throw if no printServerUrl is available", async () => {
        const preparePrintRequestStub = sinon.stub().resolves({
            layout: "A4 Hochformat",
            attributes: {title: "test", datasource: []}
        });

        try {
            await sendPrintRequestToServer(
                preparePrintRequestStub,
                {},
                "/resources/combinedGfiPrintConfig.json",
                [],
                null,
                "",
                []
            );
            expect.fail("Expected sendPrintRequestToServer to throw");
        }
        catch (error) {
            expect(error.message).to.include("No print server URL available");
            expect(global.fetch.called).to.be.false;
        }
    });
});
