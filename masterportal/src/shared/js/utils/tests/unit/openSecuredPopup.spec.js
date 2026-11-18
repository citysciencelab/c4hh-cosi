import {expect} from "chai";
import sinon from "sinon";
import {openSecuredPopup} from "@shared/js/utils/openSecuredPopup.js";

describe("src/shared/js/utils/openSecuredPopup.js", () => {
    let originalOpen;

    beforeEach(() => {
        originalOpen = window.open;
    });

    afterEach(() => {
        window.open = originalOpen;
        sinon.restore();
    });

    it("should set the popup opener to null and return the popup", () => {
        const url = "https://example.com",
            target = "_blank",
            specs = "width=400,height=300",
            popup = {opener: window},
            openStub = sinon.stub().returns(popup);

        window.open = openStub;

        const result = openSecuredPopup(url, target, specs);

        expect(openStub.calledOnce).to.be.true;
        expect(openStub.firstCall.args).to.deep.equal([url, target, specs]);
        expect(popup.opener).to.be.null;
        expect(result).to.equal(popup);
    });

    it("should return null when the popup could not be opened", () => {
        const openStub = sinon.stub().returns(null);

        window.open = openStub;

        expect(openSecuredPopup("https://example.com", "_blank", "")).to.be.null;
        expect(openStub.calledOnce).to.be.true;
    });
});
