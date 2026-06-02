import {config, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import {vi} from "vitest";

vi.mock("../../../shared/js/storyZipCreator.js", () => ({
    createStoryZip: vi.fn(),
    extractStoryZip: vi.fn()
}));

import StoryCreator from "../../../components/StoryCreator.vue";

config.global.mocks.$t = key => key;

describe("addons/storyCreator/components/storyCreator.vue", () => {
    let store, wrapper;

    beforeEach(() => {
        store = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        StoryCreator: {
                            namespaced: true,
                            getters: {
                                currentView: (state) => state.currentView,
                                story: (state) => state.story
                            },
                            mutations: {
                                setCurrentView (state, value) {
                                    state.currentView = value;
                                }
                            },
                            state: {
                                currentView: "story",
                                story: {
                                    chapters: []
                                }
                            }
                        }
                    }
                }
            }
        });
        wrapper = shallowMount(StoryCreator, {
            global: {
                plugins: [store]
            }
        });
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            expect(wrapper.exists()).to.be.true;
        });
        it("should render exactly one FileUpload component", () => {
            const fileUpload = wrapper.findComponent({name: "FileUpload"});

            expect(fileUpload.exists()).to.be.true;
            expect(fileUpload.attributes("id")).to.equal("Story-creator-file-upload");
        });
        it("should render the InputText component used for the story title", () => {
            const authorInput = wrapper.findComponent("#storyTitle");

            expect(authorInput.exists()).to.be.true;
        });
        it("should render the InputText component used for the story description", () => {
            const descriptionInput = wrapper.findComponent("#storyDescription");

            expect(descriptionInput.exists()).to.be.true;
        });
        it("should render the InputText component used for the story author", () => {
            const authorInput = wrapper.findComponent("#storyAuthor");

            expect(authorInput.exists()).to.be.true;
        });
        it("should render the InputText component used for the image alt text", () => {
            const imageAltInput = wrapper.findComponent("#imageAlt");

            expect(imageAltInput.exists()).to.be.true;
        });
        it("should render the InputText component used for the image copyright", () => {
            const imageCopyrightInput = wrapper.findComponent("#imageCopyright");

            expect(imageCopyrightInput.exists()).to.be.true;
        });
        it("should render the Draggable component.", () => {
            const draggableCard = wrapper.findComponent({name: "Draggable"});

            expect(draggableCard.exists()).to.be.true;
        });
    });

    describe("Component methods", () => {
        describe("updateStory", () => {
            it("should update the story content when updateStory is called", async () => {
                const currentDate = new Date().toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                });

                await wrapper.setData({
                    title: "Test Story",
                    description: "This is a test story."
                });
                wrapper.vm.updateStory();

                expect(wrapper.vm.story.title).to.equal("Test Story");
                expect(wrapper.vm.story.description).to.equal("This is a test story.");
                expect(wrapper.vm.story.created).to.equal(currentDate);
            });
        });

        describe("discardStory", () => {
            it("should reset all story data to default values when discardStory is called", async () => {
                await wrapper.setData({
                    title: "Test Story",
                    description: "This is a test story.",
                    imageAlt: "Test Alt",
                    imageCopyright: "Test Copyright",
                    imageSrc: "Test Src",
                    chapterContent: [{title: "Test Chapter", text: "Test Text"}]
                });
                wrapper.vm.discardStory();

                expect(wrapper.vm.title).to.equal("");
                expect(wrapper.vm.description).to.equal("");
                expect(wrapper.vm.imageAlt).to.equal("");
                expect(wrapper.vm.imageCopyright).to.equal("");
                expect(wrapper.vm.imageSrc).to.equal("");
                expect(wrapper.vm.chapterContent).to.deep.equal([]);
            });
        });

        describe("deleteChapter", () => {
            it("should delete one chapter from the index", async () => {
                await wrapper.setData({
                    chapterContent: [
                        {title: "Test Chapter 1", text: "Test Text 1"},
                        {title: "Test Chapter 2", text: "Test Text 2"}
                    ]
                });

                wrapper.vm.updateStory();
                wrapper.vm.deleteChapter(0);

                expect(wrapper.vm.story.chapters.length).to.equal(1);
                expect(wrapper.vm.story.chapters).to.deep.equal([{title: "Test Chapter 2", text: "Test Text 2"}]);
            });
        });
    });
});
