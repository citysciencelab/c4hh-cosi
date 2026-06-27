import sinon from "sinon";
import {config, mount} from "@vue/test-utils";
import {expect} from "chai";
import FileUpload from "@shared/modules/inputs/components/FileUpload.vue";

config.global.mocks.$t = key => key;

describe("src/shared/components/FileUpload.vue", () => {

    let interactionSpy;

    beforeEach(() => {
        interactionSpy = sinon.spy();
    });


    it("should render a drop area and input", () => {
        const id = "awesome-upload",
            keydown = interactionSpy,
            change = interactionSpy,
            drop = interactionSpy,
            wrapper = mount(FileUpload, {
                props: {id, keydown, change, drop}
            }),
            area = wrapper.find(".drop-area"),
            input = wrapper.find("input");

        expect(area.exists()).to.be.true;
        expect(input.exists()).to.be.true;
        expect(input.attributes("type")).to.equal("file");
    });

    it("should render a drop area and trigger a change event", () => {
        const id = "awesome-upload",
            keydown = interactionSpy,
            change = interactionSpy,
            drop = interactionSpy,
            wrapper = mount(FileUpload, {
                props: {id, keydown, change, drop}
            }),
            area = wrapper.find(".drop-area"),
            input = wrapper.find("input");

        expect(area.exists()).to.be.true;
        expect(input.exists()).to.be.true;

        input.trigger("change");

        expect(interactionSpy.calledOnce).to.be.true;
    });

    it("should render input with multiple attribute set to true by default", () => {
        const id = "awesome-upload",
            keydown = interactionSpy,
            change = interactionSpy,
            drop = interactionSpy,
            wrapper = mount(FileUpload, {
                props: {id, keydown, change, drop}
            }),
            input = wrapper.find("input");

        expect(input.exists()).to.be.true;
        expect(input.element.multiple).to.be.true;
    });

    it("should render input without multiple attribute when multiple prop is false", () => {
        const id = "awesome-upload",
            keydown = interactionSpy,
            change = interactionSpy,
            drop = interactionSpy,
            wrapper = mount(FileUpload, {
                props: {id, keydown, change, drop, multiple: false}
            }),
            input = wrapper.find("input");

        expect(input.exists()).to.be.true;
        expect(input.element.multiple).to.be.false;
    });

    it("should not set accept attribute by default", () => {
        const id = "awesome-upload",
            keydown = interactionSpy,
            change = interactionSpy,
            drop = interactionSpy,
            wrapper = mount(FileUpload, {
                props: {id, keydown, change, drop}
            }),
            input = wrapper.find("input");

        expect(input.exists()).to.be.true;
        expect(input.attributes("accept")).to.be.undefined;
    });

    it("should set accept attribute when accept prop is provided", () => {
        const id = "awesome-upload",
            keydown = interactionSpy,
            change = interactionSpy,
            drop = interactionSpy,
            accept = ".pdf,image/*",
            wrapper = mount(FileUpload, {
                props: {id, keydown, change, drop, accept}
            }),
            input = wrapper.find("input");

        expect(input.exists()).to.be.true;
        expect(input.attributes("accept")).to.equal(accept);
    });

});
