import {expect} from "chai";
import isLoginRequired from "@shared/js/utils/isLoginRequired.js";

describe("src/shared/js/utils/isLoginRequired.js", () => {
    let originalConfig;

    beforeEach(() => {
        originalConfig = globalThis.Config;
        globalThis.Config = {login: {oidcClientId: "portal"}};
    });

    afterEach(() => {
        globalThis.Config = originalConfig;
    });

    it("should require the login for a secured layer, if the portal uses the login and the user is not logged in", () => {
        expect(isLoginRequired({isSecured: true}, false)).to.be.true;
    });

    it("should not require the login, if the user is logged in", () => {
        expect(isLoginRequired({isSecured: true}, true)).to.be.false;
    });

    it("should not require the login for a layer which is not secured", () => {
        expect(isLoginRequired({isSecured: false}, false)).to.be.false;
        expect(isLoginRequired({}, false)).to.be.false;
    });

    it("should not require the login, if the portal does not use the login", () => {
        globalThis.Config = {};
        expect(isLoginRequired({isSecured: true}, false)).to.be.false;
        globalThis.Config = undefined;
        expect(isLoginRequired({isSecured: true}, false)).to.be.false;
    });

    it("should not require the login without a layer configuration", () => {
        expect(isLoginRequired(undefined, false)).to.be.false;
        expect(isLoginRequired(null, false)).to.be.false;
    });
});
