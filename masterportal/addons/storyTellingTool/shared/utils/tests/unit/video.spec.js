import {expect} from "chai";
import {getDirectVideo, getEmbedLink} from "../../video.js";

describe("addons/storyTellingTool/shared/utils/video.js", () => {
    describe("getDirectVideo", () => {
        it("should return empty array if the parameter is not string", () => {
            expect(getDirectVideo(0)).to.deep.equal([]);
            expect(getDirectVideo(null)).to.deep.equal([]);
            expect(getDirectVideo(undefined)).to.deep.equal([]);
            expect(getDirectVideo([])).to.deep.equal([]);
            expect(getDirectVideo({})).to.deep.equal([]);
            expect(getDirectVideo(false)).to.deep.equal([]);
        });

        it("should return empty array if it is not a direct video", () => {
            expect(getDirectVideo("www.youtube.com")).to.deep.equal([]);
        });

        it("should return true", () => {
            expect(getDirectVideo("test.mp4")).to.deep.equal([{type: "mp4", content: "video/mp4"}]);
            expect(getDirectVideo("test.webm")).to.deep.equal([{type: "webm", content: "video/webm"}]);
            expect(getDirectVideo("test.ogg")).to.deep.equal([{type: "ogg", content: "video/ogg"}]);
            expect(getDirectVideo("test.mov")).to.deep.equal([{type: "mov", content: "video/quicktime"}]);
            expect(getDirectVideo("test.m4v")).to.deep.equal([{type: "m4v", content: "video/x-m4v"}]);
            expect(getDirectVideo("test.avi")).to.deep.equal([{type: "avi", content: "video/x-msvideo"}]);
            expect(getDirectVideo("test.mkv")).to.deep.equal([{type: "mkv", content: "video/x-matroska"}]);
            expect(getDirectVideo("test.flv")).to.deep.equal([{type: "flv", content: "video/x-flv"}]);
            expect(getDirectVideo("test.wmv")).to.deep.equal([{type: "wmv", content: "video/x-ms-wmv"}]);
            expect(getDirectVideo("test.3gp")).to.deep.equal([{type: "3gp", content: "video/3gpp"}]);
        });
    });

    describe("getEmbedLink", () => {
        it("should return empty text", () => {
            expect(getEmbedLink(0)).to.equal("");
            expect(getEmbedLink(null)).to.equal("");
            expect(getEmbedLink(false)).to.equal("");
            expect(getEmbedLink([])).to.equal("");
            expect(getEmbedLink({})).to.equal("");
            expect(getEmbedLink(undefined)).to.equal("");
        });

        it("should return the original text", () => {
            expect(getEmbedLink("https://google.de")).to.equal("https://google.de");
        });

        it("should return embed youtube link", () => {
            expect(getEmbedLink("https://www.youtube.com/watch?v=test")).to.equal("https://www.youtube-nocookie.com/embed/test");
            expect(getEmbedLink("https://youtu.be/test")).to.equal("https://www.youtube-nocookie.com/embed/test");
            expect(getEmbedLink("https://www.youtube.com/embed/test")).to.equal("https://www.youtube-nocookie.com/embed/test");
        });
    });
});
