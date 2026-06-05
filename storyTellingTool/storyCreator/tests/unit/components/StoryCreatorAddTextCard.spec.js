import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import StoryCreatorAddTextCard from "../../../components/StoryCreatorAddTextCard.vue";

config.global.mocks.$t = key => key;

describe("addons/storyCreator/components/StoryCreatorAddTextCard.vue", () => {
    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(StoryCreatorAddTextCard);

            expect(wrapper.exists()).to.be.true;
        });

        it("should render the card", () => {
            const wrapper = shallowMount(StoryCreatorAddTextCard);

            expect(wrapper.find(".card").exists()).to.be.true;
        });

        it("should render the TipTapEditor component", () => {
            const wrapper = shallowMount(StoryCreatorAddTextCard);

            expect(wrapper.findComponent({name: "TipTapEditor"}).exists()).to.be.true;
        });

        it("should render one IconButton", () => {
            const wrapper = shallowMount(StoryCreatorAddTextCard);

            expect(wrapper.findAllComponents({name: "IconButton"}).length).to.equal(1);
        });

        it("should render two IconButton", async () => {
            const wrapper = shallowMount(StoryCreatorAddTextCard);

            await wrapper.setData({content: "true"});

            expect(wrapper.findAllComponents({name: "IconButton"}).length).to.equal(2);
        });

        it("should emit click:close event when close button is clicked", async () => {
            const wrapper = shallowMount(StoryCreatorAddTextCard);

            await wrapper.find(".btn-close").trigger("click");
            expect(wrapper.emitted("click:close")).to.have.lengthOf(1);
        });

        it("should emit click:close event when abort button interaction is triggered", () => {
            const wrapper = shallowMount(StoryCreatorAddTextCard);
            const buttons = wrapper.findAllComponents({name: "IconButton"});
            const abortButton = buttons[0];

            abortButton.props("interaction")();
            expect(wrapper.emitted("click:close")).to.have.lengthOf(1);
        });
    });
});
