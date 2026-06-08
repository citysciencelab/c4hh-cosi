import {expect} from "chai";
import {afterEach, beforeEach, describe, it, vi} from "vitest";
import {createStoryZip, extractStoryZip} from "../../../shared/js/storyZipCreator.js";

describe("storyZipCreator", () => {
    const originalCreateObjectURL = globalThis.URL?.createObjectURL;

    beforeEach(() => {
        Object.defineProperty(globalThis.URL, "createObjectURL", {
            configurable: true,
            writable: true,
            value: vi.fn(() => "blob:mock-url")
        });
    });

    afterEach(() => {
        if (typeof originalCreateObjectURL === "function") {
            Object.defineProperty(globalThis.URL, "createObjectURL", {
                configurable: true,
                writable: true,
                value: originalCreateObjectURL
            });
        }
        else {
            delete globalThis.URL.createObjectURL;
        }

        vi.restoreAllMocks();
    });

    it("zips and unzips a minimal story with one svg asset", async () => {
        const storyJson = {
                title: "Minimal story",
                chapters: [
                    {
                        id: "chapter-1",
                        title: "First chapter",
                        images: ["image-1"]
                    }
                ]
            },
            svgContent = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1 1\"><rect width=\"1\" height=\"1\" fill=\"#000\"/></svg>",
            svgBlob = new Blob([svgContent], {type: "image/svg+xml"}),
            imageAssetsById = {
                "image-1": {
                    blob: svgBlob,
                    objectURL: "blob:original-url",
                    mimeType: "image/svg+xml",
                    originalName: "preview.svg",
                    archivePath: "images/preview.svg"
                }
            };

        const zipBlob = await createStoryZip(storyJson, imageAssetsById),
            {storyJson: extractedStoryJson, imageAssetsById: extractedImageAssetsById} = await extractStoryZip(zipBlob),
            extractedAsset = extractedImageAssetsById["image-1"];

        expect(extractedStoryJson).to.deep.equal(storyJson);
        expect(Object.keys(extractedImageAssetsById)).to.deep.equal(["image-1"]);
        expect({
            mimeType: extractedAsset.mimeType,
            originalName: extractedAsset.originalName,
            archivePath: extractedAsset.archivePath
        }).to.deep.equal({
            mimeType: "image/svg+xml",
            originalName: "preview.svg",
            archivePath: "images/preview.svg"
        });
        expect(await extractedAsset.blob.text()).to.equal(svgContent);
        expect(extractedAsset.blob.type).to.equal("image/svg+xml");
        expect(extractedAsset.objectURL).to.equal("blob:mock-url");
    });
});

