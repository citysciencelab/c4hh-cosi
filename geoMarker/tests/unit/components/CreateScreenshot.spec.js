import {expect} from "chai";
import {shallowMount} from "@vue/test-utils";
import CreateScreenshot from "../../../components/CreateScreenshot.vue";

describe("CreateScreenshot.vue", () => {
    before(() => {
        mapCollection.clear();
        const map = {
            id: "ol",
            mode: "2D",
            getViewport: () => ({
                querySelector: () => ({
                    toDataURL: () => "data:image/png;base64,mockedImage"
                })
            })
        };

        mapCollection.addMap(map, "2D");
    });

    let wrapper;

    beforeEach(() => {
        wrapper = shallowMount(CreateScreenshot);
    });

    it("should exist and have the correct class", () => {
        expect(wrapper.exists()).to.be.true;
        expect(wrapper.attributes("class")).to.be.equal("createScreenshot");
    });

    it("renders camera icon when no image is provided", () => {
        expect(wrapper.find(".icon.bi-camera-fill").exists()).to.be.true;
        expect(wrapper.find("img.screenshotArea").exists()).to.be.false;
    });

    it("renders image when screenshotImage prop is set", () => {
        const base64 = "data:image/png;base64,abc123";

        wrapper = shallowMount(CreateScreenshot, {
            props: {screenshotImage: base64}
        });

        expect(wrapper.find("img.screenshotArea").exists()).to.be.true;
        expect(wrapper.find("img.screenshotArea").attributes("src")).to.equal(base64);
        expect(wrapper.find(".icon.bi-camera-fill").exists()).to.be.false;
    });

    it("emits onScreenshotCreated with base64 string when createScreenshot is called", () => {
        wrapper.vm.createScreenshot();

        expect(wrapper.emitted().onScreenshotCreated).to.exist;
        expect(wrapper.emitted().onScreenshotCreated[0][0]).to.equal("data:image/png;base64,mockedImage");
    });
});
