import {expect} from "chai";

import globalUrlParams from "../../../js/globalUrlParams.js";

describe("src/core/urlParams/js/globalUrlParams.js", () => {
    let origWindow;

    beforeAll(() => {
        origWindow = global.window;
    });

    afterEach(() => {
        global.window = origWindow;
    });

    describe("getConfigJsPath", () => {
        it("configjs with local path is read", () => {
            global.window = {
                location: {
                    search: "?configjs=../otherPortal/config.js",
                    href: "https://example.com/portal/path/?configjs=../otherPortal/config.js"
                }
            };
            const configPath = globalUrlParams.getConfigJsPath();

            expect(configPath).to.be.not.null;
            expect(configPath).to.be.equals("https://example.com/portal/path/../otherPortal/config.js");
        });

        it("configjs as full url is read", () => {
            global.window = {
                location: {
                    search: "?configjs=https://geoportal-hamburg.de/config.js",
                    href: "https://example.com/portal/path/?configjs=https://geoportal-hamburg.de/config.js"
                }
            };
            const configPath = globalUrlParams.getConfigJsPath();

            expect(configPath).to.be.not.null;
            expect(configPath).to.be.equals("https://geoportal-hamburg.de/config.js");
        });

        it("configjs is not read", () => {
            global.window = {
                location: {
                    search: "?configjson=../otherPortal/config.json",
                    href: "https://example.com/portal/path/?configjs=../otherPortal/config.js"
                }
            };
            const configPath = globalUrlParams.getConfigJsPath();

            expect(configPath).to.be.null;
        });

        it("no urlparams", () => {
            global.window = {
                location: {
                    href: "https://example.com/portal/path/"
                }
            };
            const configPath = globalUrlParams.getConfigJsPath();

            expect(configPath).to.be.null;
        });
    });
});
