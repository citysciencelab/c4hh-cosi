import {expect} from "chai";
import sanitizeConfiguredUrl from "../../../js/sanitizeConfiguredUrl.js";

describe("addons/simulationTool/js/sanitizeConfiguredUrl.js", () => {

    describe("sanitizeConfiguredUrl", () => {
        it("positive: sanitizes an absolute URL", () => {
            const result = sanitizeConfiguredUrl("https://example.com//api/v1.0///?foo=bar#hash");

            expect(result).to.equal("https://example.com/api/v1.0?foo=bar");
        });

        it("positive: sanitizes a relative URL", () => {
            const result = sanitizeConfiguredUrl("/api/v1.0///?foo=bar", {
                baseUrl: "https://example.com"
            });

            expect(result).to.equal("/api/v1.0?foo=bar");
        });

        it("positive: returns absolute URL when configured", () => {
            const result = sanitizeConfiguredUrl("/api/v1.0", {
                baseUrl: "https://example.com",
                returnAbsolute: true
            });

            expect(result).to.equal("https://example.com/api/v1.0");
        });

        it("negative: throws for unsupported protocols", () => {
            expect(() => sanitizeConfiguredUrl("ftp://example.com")).to.throw();
        });

        it("negative: throws for empty values", () => {
            expect(() => sanitizeConfiguredUrl("   ")).to.throw();
        });
    });
});
