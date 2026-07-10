import {beforeEach} from "vitest";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import StoryCreatorAddVideoCard from "../../../components/StoryCreatorAddVideoCard.vue";

config.global.mocks.$t = key => key;

describe("addons/storyCreator/components/StoryCreatorAddVideoCard.vue", () => {
    let wrapper;

    beforeEach(() => {
        wrapper = shallowMount(StoryCreatorAddVideoCard);
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            expect(wrapper.exists()).to.be.true;
        });

        it("should render a title", () => {
            expect(wrapper.find("h5").exists()).to.be.true;
        });

        it("should render the InputText component", () => {
            expect(wrapper.findComponent({name: "InputText"}).exists()).to.be.true;
            expect(wrapper.findAllComponents({name: "InputText"}).length).to.equal(3);
        });

        it("should render the FlatButton component", () => {
            expect(wrapper.findComponent({name: "FlatButton"}).exists()).to.be.true;
            expect(wrapper.findAllComponents({name: "FlatButton"}).length).to.equal(2);
        });
    });

    describe("Methods", () => {
        describe("handleDiscardButtonClick", () => {
            it("should return the original object", async () => {
                await wrapper.setData({videoObj: {
                    link: "test.mp4",
                    title: "title",
                    accessibleText: "one test"
                }});

                await wrapper.vm.handleDiscardButtonClick();

                expect(wrapper.vm.videoObj).to.deep.equal({
                    link: "",
                    title: "",
                    accessibleText: ""
                });
            });
        });
    });
});
