import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import StoryCreator from "../../../components/StoryCreator.vue";

config.global.mocks.$t = key => key;

describe("addons/storyCreator/components/storyCreator.vue", () => {
    describe("Component DOM", () => {
        const wrapper = shallowMount(StoryCreator);

        it("should exist", () => {
            expect(wrapper.exists()).to.be.true;
        });
        it("should render exactly one FileUpload component", () => {
            const fileUpload = wrapper.findComponent({name: "FileUpload"});

            expect(fileUpload.exists()).to.be.true;
            expect(fileUpload.attributes("id")).to.equal("Story-creator-file-upload");
        });
        it("should render all required InputText fields", () => {
            const allInputTexts = wrapper.findAllComponents({name: "InputText"});

            expect(allInputTexts.length).to.equal(4);
        });
        it("should render the InputText component used for the story description", () => {
            const descriptionInput = wrapper.findAllComponents({name: "InputText"});

            expect(descriptionInput.at(1).attributes("id")).to.equal("storyDescription");
        });
    });
});
