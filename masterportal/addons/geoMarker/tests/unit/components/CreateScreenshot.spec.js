import {expect} from "chai";
import {config, shallowMount} from "@vue/test-utils";
import CreateScreenshot from "../../../components/CreateScreenshot.vue";

config.global.mocks.$t = key => key;

describe("CreateScreenshot.vue", () => {
    beforeAll(() => {
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

    afterEach(()=> {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("should exist and have the correct class", () => {
        expect(wrapper.exists()).to.be.true;
        expect(wrapper.attributes("class")).to.be.equal("createScreenshotContainer");
    });

    it("renders camera icon when no image is provided", () => {
        const iconButtons = wrapper.findAllComponents({name: "IconButton"});

        expect(wrapper.find(".placeholderIcon.icon.bi-camera-fill").exists()).to.be.true;
        expect(wrapper.find("img.screenshotArea").exists()).to.be.false;
        expect(iconButtons).to.be.an("array");
        expect(iconButtons).to.have.lengthOf(1);
        expect(iconButtons[0].vm.icon).to.equal("bi-camera-fill");
    });

    it("renders image when screenshotImage prop is set", () => {
        const base64 = "data:image/png;base64,abc123";

        wrapper = shallowMount(CreateScreenshot, {
            props: {screenshotImage: base64}
        });

        const iconButtons = wrapper.findAllComponents({name: "IconButton"});

        expect(wrapper.find("img.screenshotArea").exists()).to.be.true;
        expect(wrapper.find("img.screenshotArea").attributes("src")).to.equal(base64);
        expect(iconButtons).to.be.an("array");
        expect(iconButtons).to.have.lengthOf(3);
        expect(iconButtons[0].vm.icon).to.equal("bi-camera-fill");
        expect(iconButtons[1].vm.icon).to.equal("bi-image");
        expect(iconButtons[2].vm.icon).to.equal("bi-trash3");
        expect(wrapper.find(".placeholderIcon.icon.bi-camera-fill").exists()).to.be.false;
    });

    it("emits onScreenshotCreated with base64 string when createScreenshot is called", () => {
        wrapper.vm.createScreenshot();

        expect(wrapper.emitted().onScreenshotCreated).to.exist;
        expect(wrapper.emitted().onScreenshotCreated[0][0]).to.equal("data:image/png;base64,mockedImage");
    });

    it("emits onScreenshotDeleted when deleteScreenshot is called", () => {
        wrapper.vm.deleteScreenshot();

        expect(wrapper.emitted().onScreenshotDeleted).to.exist;
        expect(wrapper.vm.base64Image).to.be.undefined;
    });

    it("opens modal with preview on button click", async () => {
        const base64 = "data:image/png;base64,abc123";

        wrapper = shallowMount(CreateScreenshot, {
            props: {screenshotImage: base64}
        });

        const iconButtons = wrapper.findAllComponents({name: "IconButton"});

        expect(iconButtons).to.be.an("array");
        expect(iconButtons).to.have.lengthOf(3);
        expect(iconButtons[0].vm.icon).to.equal("bi-camera-fill");
        expect(iconButtons[1].vm.icon).to.equal("bi-image");
        expect(iconButtons[2].vm.icon).to.equal("bi-trash3");
        expect(wrapper.vm.showModal).to.be.false;
        expect(wrapper.findComponent({name: "ModalItem"}).vm.showModal).to.be.false;

        await iconButtons[1].trigger("click");

        expect(wrapper.vm.showModal).to.be.true;
        expect(wrapper.findComponent({name: "ModalItem"}).vm.showModal).to.be.true;
    });
});
