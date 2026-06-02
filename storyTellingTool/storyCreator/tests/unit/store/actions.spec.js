import {expect} from "chai";
import {afterEach, beforeEach, describe, it} from "vitest";
import sinon from "sinon";
import actions, {sanitizeFileName} from "../../../store/actions.js";

describe("addons/storyTellingTool/storyCreator/store/actions.js", () => {
    const originalCreateObjectURL = globalThis.URL?.createObjectURL,
        hasCreateObjectURL = typeof originalCreateObjectURL === "function";

    beforeEach(() => {
        if (!hasCreateObjectURL) {
            Object.defineProperty(globalThis.URL, "createObjectURL", {
                configurable: true,
                writable: true,
                value: () => ""
            });
        }

        sinon.stub(globalThis.URL, "createObjectURL").returns("blob:test-created-url");
        sinon.stub(globalThis.crypto, "randomUUID").returns("test-uuid");
    });

    afterEach(() => {
        sinon.restore();

        if (hasCreateObjectURL) {
            Object.defineProperty(globalThis.URL, "createObjectURL", {
                configurable: true,
                writable: true,
                value: originalCreateObjectURL
            });
        }
        else {
            delete globalThis.URL.createObjectURL;
        }
    });

    it("sanitizeFileName should replace unsafe characters and trim", () => {
        const sanitized = sanitizeFileName("  my:unsafe?name.svg  ");

        expect(sanitized).to.equal("my_unsafe_name.svg");
    });

    it("addImageAsset should store blob metadata and return generated id", () => {
        const state = {
                imageAssetsById: {}
            },
            blob = new Blob(["<svg/>"], {type: "image/svg+xml"});

        Object.defineProperty(blob, "name", {
            configurable: true,
            value: "te:st?.svg"
        });

        const id = actions.addImageAsset({state}, blob);

        expect(id).to.equal("test-uuid");
        expect(state.imageAssetsById[id]).to.deep.equal({
            blob,
            objectURL: "blob:test-created-url",
            mimeType: "image/svg+xml",
            originalName: "te:st?.svg",
            archivePath: "images/test-uuid__te_st_.svg"
        });
    });
});
