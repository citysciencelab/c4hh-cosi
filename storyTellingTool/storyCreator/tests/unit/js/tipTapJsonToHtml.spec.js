import {expect} from "chai";
import sinon from "sinon";
import {beforeEach, describe, it, vi} from "vitest";
import {generateHTML} from "@tiptap/core";
import tipTapJsonToHtml from "../../../shared/modules/tipTapEditor/js/tipTapJsonToHtml.js";

vi.mock("@tiptap/core", () => ({
    generateHTML: sinon.stub()
}));

describe("addons/storyCreator/shared/modules/tipTapEditor/js/tipTapJsonToHtml", () => {
    beforeEach(async () => {
        generateHTML.reset();
    });

    it("should return expected result", () => {
        const content = {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Hello world"
                        }
                    ]
                }
            ]
        };

        generateHTML.returns("<p>Hello world</p>");

        expect(tipTapJsonToHtml(content)).to.equal("<p>Hello world</p>");
    });

    it("should throw if lib call throws", () => {
        const invalidContent = {
            type: "doc",
            content: [
                {
                    type: "unsupportedNode"
                }
            ]
        };

        generateHTML.throws(new Error("boom"));

        expect(() => tipTapJsonToHtml(invalidContent)).to.throw();
    });
});
