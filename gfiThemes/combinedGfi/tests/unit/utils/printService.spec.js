import {expect} from "chai";
import sinon from "sinon";
import {sendPrintRequest} from "../../../utils/printService.js";

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
});
