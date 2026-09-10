import {expect} from "chai";
import sinon from "sinon";

import globalUrlParams from "../../../js/globalUrlParams.js";

describe("src/core/urlParams/js/globalUrlParams.js", () => {

    describe("getConfigJsPath", () => {
        it("configjs with local path is read", () => {
            sinon.stub(window, "location").value({
                search: "?configjs=../otherPortal/config.js",
                href: "https://example.com/portal/path/?configjs=../otherPortal/config.js",
                origin: "https://example.com"
            });
            const configPath = globalUrlParams.getConfigJsPath();

            expect(configPath).to.be.not.null;
            expect(configPath).to.be.equals("https://example.com/portal/path/../otherPortal/config.js");
        });

        it("configjs as full url is read", () => {
            sinon.stub(window, "location").value({
                search: "?configjs=https://geoportal-hamburg.de/config.js",
                href: "https://example.com/portal/path/?configjs=https://geoportal-hamburg.de/config.js",
                origin: "https://example.com"
            });
            const configPath = globalUrlParams.getConfigJsPath();

            expect(configPath).to.be.not.null;
            expect(configPath).to.be.equals("https://geoportal-hamburg.de/config.js");
        });

        it("configjs is not read", () => {
            sinon.stub(window, "location").value({
                search: "?configjson=../otherPortal/config.json",
                href: "https://example.com/portal/path/?configjson=../otherPortal/config.json",
                origin: "https://example.com"
            });
            const configPath = globalUrlParams.getConfigJsPath();

            expect(configPath).to.be.null;
        });

        it("no urlparams", () => {
            sinon.stub(window, "location").value({
                search: "",
                href: "https://example.com/portal/path/",
                origin: "https://example.com"
            });
            const configPath = globalUrlParams.getConfigJsPath();

            expect(configPath).to.be.null;
        });
    });
});
