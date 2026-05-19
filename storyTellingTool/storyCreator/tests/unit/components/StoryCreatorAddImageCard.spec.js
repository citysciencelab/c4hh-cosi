import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import StoryCreatorAddImageCard from "../../../components/StoryCreatorAddImageCard.vue";

config.global.mocks.$t = key => key;

describe("addons/storyCreator/components/StoryCreatorAddImageCard.vue", () => {
    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(StoryCreatorAddImageCard);

            expect(wrapper.exists()).to.be.true;
        });

        it("should render the card when showCard is true", () => {
            const wrapper = shallowMount(StoryCreatorAddImageCard);

            expect(wrapper.find(".card").exists()).to.be.true;
        });

        it("should hide the card when showCard is false", async () => {
            const wrapper = shallowMount(StoryCreatorAddImageCard);

            await wrapper.setData({showCard: false});
            expect(wrapper.find(".card").exists()).to.be.false;
        });

        it("should render the headline", () => {
            const wrapper = shallowMount(StoryCreatorAddImageCard);

            expect(wrapper.find(".card-title").text()).to.include("additional:modules.storyCreator.headlines.addImages");
        });

        it("should render the FileUpload component", () => {
            const wrapper = shallowMount(StoryCreatorAddImageCard);

            expect(wrapper.findComponent({name: "FileUpload"}).exists()).to.be.true;
        });

        it("should render two InputText components", () => {
            const wrapper = shallowMount(StoryCreatorAddImageCard);

            expect(wrapper.findAllComponents({name: "InputText"}).length).to.equal(2);
        });

        it("should render the FlatButton component", () => {
            const wrapper = shallowMount(StoryCreatorAddImageCard);

            expect(wrapper.findComponent({name: "FlatButton"}).exists()).to.be.true;
        });
    });
});
