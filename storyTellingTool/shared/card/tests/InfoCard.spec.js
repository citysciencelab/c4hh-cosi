import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import InfoCard from "../components/InfoCard.vue";

config.global.mocks.$t = key => key;

describe("addons/shared/components/InfoCard.vue", () => {
    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(InfoCard, {
                props: {
                    cardTitle: "Test"
                }
            });

            expect(wrapper.exists()).to.be.true;
        });
        it("renders the card title", () => {
            const wrapper = shallowMount(InfoCard, {
                props: {
                    cardTitle: "Test"
                }
            });

            expect(wrapper.find(".card-title").text()).to.equal("Test");
        });
        it("renders the card text", () => {
            const wrapper = shallowMount(InfoCard, {
                props: {
                    cardTitle: "Test",
                    cardText: "Kapiteltext"}
            });

            expect(wrapper.find(".card-text-fixed").text()).to.equal("Kapiteltext");
        });
        it("renders the image if cardImage is set", () => {
            const wrapper = shallowMount(InfoCard, {
                props: {
                    cardTitle: "Test",
                    cardImage: "https://example.com/image.jpg"
                }
            });

            expect(wrapper.find("img.card-img-top").exists()).to.be.true;
        });
        it("does not render the image if cardImage is empty", () => {
            const wrapper = shallowMount(InfoCard, {
                props: {cardTitle: "Test", cardImage: ""}
            });

            expect(wrapper.find("img.card-img-top").exists()).to.be.false;
        });
        it("renders the copyright if copyright is set", () => {
            const wrapper = shallowMount(InfoCard, {
                props: {
                    cardTitle: "Test",
                    copyright: "Max Mustermann"
                }
            });

            expect(wrapper.find(".copyright").text()).to.include("Max Mustermann");
        });
        it("does not render the copyright if copyright is empty", () => {
            const wrapper = shallowMount(InfoCard, {
                props: {cardTitle: "Test", copyright: ""}
            });

            expect(wrapper.find(".copyright").exists()).to.be.false;
        });
        it("renders the IconButton", () => {
            const wrapper = shallowMount(InfoCard, {
                props: {cardTitle: "Test"}
            });

            expect(wrapper.findComponent({name: "IconButton"}).exists()).to.be.true;
        });
        it("renders chapter setting icons if chapterItems are set", () => {
            const wrapper = shallowMount(InfoCard, {
                props: {
                    cardTitle: "Test",
                    cardItems: {subject: "A", map: "B"}
                }
            });

            expect(wrapper.findAll(".settings").length).to.be.above(0);
        });
        it("shows noSettings text if chapterItems is empty", () => {
            const wrapper = shallowMount(InfoCard, {
                props: {
                    cardTitle: "Test",
                    cardItems: {}
                }
            });

            expect(wrapper.find(".fst-italic").text()).to.equal("additional:modules.storyCreator.noSettings");
        });
        it("renders story info when cardType is 'story' and cardItems are set", () => {
            const wrapper = shallowMount(InfoCard, {
                props: {
                    cardType: "story",
                    cardTitle: "Story",
                    cardItems: {
                        author: "Autor",
                        creation: "11.03.2026",
                        numberOfChapters: 3
                    }
                }
            });

            expect(wrapper.find(".Author").text()).to.equal("Autor");
            expect(wrapper.find(".date").text()).to.equal("11.03.2026");
            expect(wrapper.find(".number-of-chapters").text()).to.include("3");
        });
        it("renders readOnly badge if editable is false", () => {
            const wrapper = shallowMount(InfoCard, {
                props: {
                    cardTitle: "Test",
                    editable: false
                }
            });

            expect(wrapper.find(".badge").exists()).to.be.true;
            expect(wrapper.find(".badge").text()).to.equal("additional:modules.storyCreator.readOnly");
        });
        it("renders no button for download and edit", () => {
            const wrapper = shallowMount(InfoCard, {
                props: {
                    cardTitle: "Test",
                    cardType: "story",
                    editable: false
                }
            });

            expect(wrapper.findComponent({name: "IconButton"}).exists()).to.be.false;
        });
    });
});
