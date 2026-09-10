import {expect} from "chai";
import escapeXml from "@shared/js/utils/escapeXml.js";

describe("src/shared/js/utils/escapeXml.js", () => {
    it("should escape ampersand", () => {
        expect(escapeXml("a & b")).to.equal("a &amp; b");
    });

    it("should escape less-than and greater-than", () => {
        expect(escapeXml("<tag>")).to.equal("&lt;tag&gt;");
    });

    it("should escape double and single quotes", () => {
        expect(escapeXml("\"quoted\" and 'apostrophe'")).to.equal("&quot;quoted&quot; and &apos;apostrophe&apos;");
    });

    it("should encode non-ASCII characters as numeric character references", () => {
        expect(escapeXml("Schleifmühle")).to.equal("Schleifm&#xfc;hle");
    });

    it("should cast non-string input to string", () => {
        expect(escapeXml(42)).to.equal("42");
    });
});
