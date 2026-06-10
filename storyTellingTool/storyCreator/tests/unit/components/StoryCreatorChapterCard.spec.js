import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import StoryCreatorChapterCard from "../../../components/StoryCreatorChapterCard.vue";

config.global.mocks.$t = key => key;

describe("addons/storyCreator/components/StoryCreatorChapterCard.vue", () => {
    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(StoryCreatorChapterCard, {
                props: {
                    chapterTitle: "Test"
                }
            });

            expect(wrapper.exists()).to.be.true;
        });
        it("renders the card title", () => {
            const wrapper = shallowMount(StoryCreatorChapterCard, {
                props: {
                    chapterTitle: "Test"
                }
            });

            expect(wrapper.find(".card-title").text()).to.equal("Test");
        });
        it("renders the chapter text", () => {
            const wrapper = shallowMount(StoryCreatorChapterCard, {
                props: {
                    chapterTitle: "Test",
                    chapterText: "Kapiteltext"}
            });

            expect(wrapper.find(".chapter-text-fixed").text()).to.equal("Kapiteltext");
        });
        it("renders the image if chapterImage is set", () => {
            const wrapper = shallowMount(StoryCreatorChapterCard, {
                props: {
                    chapterTitle: "Test",
                    chapterImage: "https://example.com/image.jpg"
                }
            });

            expect(wrapper.find("img.card-img-top").exists()).to.be.true;
        });
        it("does not render the image if chapterImage is empty", () => {
            const wrapper = shallowMount(StoryCreatorChapterCard, {
                props: {chapterTitle: "Test", chapterImage: ""}
            });

            expect(wrapper.find("img.card-img-top").exists()).to.be.false;
        });
        it("renders the copyright if copyright is set", () => {
            const wrapper = shallowMount(StoryCreatorChapterCard, {
                props: {
                    chapterTitle: "Test",
                    copyright: "Max Mustermann"
                }
            });

            expect(wrapper.find(".copyright").text()).to.include("Max Mustermann");
        });
        it("does not render the copyright if copyright is empty", () => {
            const wrapper = shallowMount(StoryCreatorChapterCard, {
                props: {chapterTitle: "Test", copyright: ""}
            });

            expect(wrapper.find(".copyright").exists()).to.be.false;
        });
        it("renders the IconButton", () => {
            const wrapper = shallowMount(StoryCreatorChapterCard, {
                props: {chapterTitle: "Test"}
            });

            expect(wrapper.findComponent({name: "IconButton"}).exists()).to.be.true;
        });
        it("renders chapter setting icons if chapterItems are set", () => {
            const wrapper = shallowMount(StoryCreatorChapterCard, {
                props: {
                    chapterTitle: "Test",
                    chapterItems: {subject: "A", map: "B"}
                }
            });

            expect(wrapper.findAll(".settings").length).to.be.above(0);
        });
        it("shows noSettings text if chapterItems is empty", () => {
            const wrapper = shallowMount(StoryCreatorChapterCard, {
                props: {
                    chapterTitle: "Test",
                    chapterItems: {}
                }
            });

            expect(wrapper.find(".fst-italic").text()).to.equal("additional:modules.storyCreator.noSettings");
        });
    });
});
