import {config, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import StoryCreator from "../../../components/StoryCreator.vue";
import {vi} from "vitest";

vi.mock("../../../shared/js/storyZipCreator.js", () => ({
    createStoryZip: vi.fn(),
    extractStoryZip: vi.fn()
}));

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
                                imageAssetsById: (state) => state.imageAssetsById,
                                story: (state) => state.story
                            },
                            mutations: {
                                setCurrentView (state, value) {
                                    state.currentView = value;
                                }
                            },
                            state: {
                                currentView: "story",
                                imageAssetsById: {
                                    "273a4c04-760f-4abe-8a37-e640fc10fefa": {
                                        "objectURL": "test image"
                                    }
                                },
                                story: {
                                    chapters: []
                                }
                            }
                        },
                        StoryManager: {
                            namespaced: true,
                            getters: {
                                storyList: (state) => state.storyList
                            },
                            mutations: {
                                setStoryList (state, value) {
                                    state.storyList = value;
                                }
                            },
                            state: {
                                storyList: []
                            }
                        }
                    }
                },
                Menu: {
                    namespaced: true,
                    actions: {
                        changeCurrentComponent: sinon.stub()
                    },
                    mutations: {
                        setNavigationHistoryBySide: sinon.stub()
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

    afterEach(() => {
        sinon.restore();
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            expect(wrapper.exists()).to.be.true;
        });
        it("should render exactly one FileUpload component", () => {
            const addImageCard = wrapper.findComponent({name: "StoryCreatorAddImageCard"});

            expect(addImageCard.exists()).to.be.true;
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
        it("should render the Draggable component.", () => {
            const draggableCard = wrapper.findComponent({name: "Draggable"});

            expect(draggableCard.exists()).to.be.true;
        });
        it("should render the InfoText component.", () => {
            const InfoText = wrapper.findComponent({name: "InfoText"});

            expect(InfoText.exists()).to.be.true;
        });
        it("should not render the loaded title image.", () => {
            const titleImage = wrapper.find(".chapter-title-image-preview");

            expect(titleImage.exists()).to.be.false;
        });
        it("should render the loaded title image.", async () => {
            await wrapper.setData({
                imageLoaded: true
            });

            const titleImage = wrapper.find(".chapter-title-image-preview");

            expect(titleImage.exists()).to.be.true;
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

        describe("getAllDeepValues", () => {
            it("should return empty array", () => {
                expect(wrapper.vm.getAllDeepValues(null, "", [])).to.deep.equal([]);
                expect(wrapper.vm.getAllDeepValues(0, "", [])).to.deep.equal([]);
                expect(wrapper.vm.getAllDeepValues("", "", [])).to.deep.equal([]);
                expect(wrapper.vm.getAllDeepValues(false, "", [])).to.deep.equal([]);
                expect(wrapper.vm.getAllDeepValues(undefined, "", [])).to.deep.equal([]);
            });

            it("should return the searched results", () => {
                const val = [
                        {
                            "type": "doc",
                            "content": [
                                {
                                    "type": "paragraph",
                                    "content": [
                                        {
                                            "type": "text",
                                            "text": "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum."
                                        }
                                    ]
                                }
                            ],
                            "id": "bfbdf9b8-a5f8-4844-8a22-29cfc9425cb7"
                        },
                        {
                            "type": "image",
                            "id": "273a4c04-760f-4abe-8a37-e640fc10fefa",
                            "attrs": {
                                "alt": "test",
                                "copyright": "test"
                            }
                        }
                    ],
                    attr = "text",
                    result = ["Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum."];


                expect(wrapper.vm.getAllDeepValues(val, attr, [])).to.deep.equal(result);
            });
        });

        describe("getChapterOverviewAttr", () => {
            it("should return empty string", () => {
                expect(wrapper.vm.getChapterOverviewAttr(null, "text")).to.equal("");
                expect(wrapper.vm.getChapterOverviewAttr(0, "text")).to.equal("");
                expect(wrapper.vm.getChapterOverviewAttr("", "text")).to.equal("");
                expect(wrapper.vm.getChapterOverviewAttr(false, "text")).to.equal("");
                expect(wrapper.vm.getChapterOverviewAttr(undefined, "text")).to.equal("");
                expect(wrapper.vm.getChapterOverviewAttr([], "text")).to.equal("");

                expect(wrapper.vm.getChapterOverviewAttr({}, "text")).to.equal("");
                expect(wrapper.vm.getChapterOverviewAttr({content: 0}, "text")).to.equal("");
                expect(wrapper.vm.getChapterOverviewAttr({content: ""}, "text")).to.equal("");
                expect(wrapper.vm.getChapterOverviewAttr({content: false}, "text")).to.equal("");
                expect(wrapper.vm.getChapterOverviewAttr({content: undefined}, "text")).to.equal("");
                expect(wrapper.vm.getChapterOverviewAttr({content: {}}, "text")).to.equal("");
                expect(wrapper.vm.getChapterOverviewAttr({content: []}, "text")).to.equal("");
            });

            it("should return text", () => {
                const val = {
                    content: [
                        {
                            "type": "doc",
                            "content": [
                                {
                                    "type": "paragraph",
                                    "content": [
                                        {
                                            "type": "text",
                                            "text": "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum."
                                        }
                                    ]
                                }
                            ],
                            "id": "bfbdf9b8-a5f8-4844-8a22-29cfc9425cb7"
                        },
                        {
                            "type": "image",
                            "id": "273a4c04-760f-4abe-8a37-e640fc10fefa",
                            "attrs": {
                                "alt": "test",
                                "copyright": "test"
                            }
                        }
                    ]};

                expect(wrapper.vm.getChapterOverviewAttr(val, "text")).to.equal("Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.");
            });
        });

        describe("getChapterOverviewCardItems", () => {
            it("should return empty object", () => {
                expect(wrapper.vm.getChapterOverviewCardItems(null)).to.deep.equal({});
                expect(wrapper.vm.getChapterOverviewCardItems(0)).to.deep.equal({});
                expect(wrapper.vm.getChapterOverviewCardItems("")).to.deep.equal({});
                expect(wrapper.vm.getChapterOverviewCardItems(false)).to.deep.equal({});
                expect(wrapper.vm.getChapterOverviewCardItems(undefined)).to.deep.equal({});
                expect(wrapper.vm.getChapterOverviewCardItems([])).to.deep.equal({});

                expect(wrapper.vm.getChapterOverviewCardItems({})).to.deep.equal({});
                expect(wrapper.vm.getChapterOverviewCardItems({map: 0})).to.deep.equal({});
                expect(wrapper.vm.getChapterOverviewCardItems({map: ""})).to.deep.equal({});
                expect(wrapper.vm.getChapterOverviewCardItems({map: false})).to.deep.equal({});
                expect(wrapper.vm.getChapterOverviewCardItems({map: undefined})).to.deep.equal({});
                expect(wrapper.vm.getChapterOverviewCardItems({map: []})).to.deep.equal({});
            });

            it("should return card items", () => {
                const val = {
                    map: {
                        layers: ["1", "2"],
                        center: "1, 2",
                        tool: "tool"
                    }
                };

                expect(wrapper.vm.getChapterOverviewCardItems(val).subject).to.equal("2 modules.layerSelection.datalayer");
                expect(wrapper.vm.getChapterOverviewCardItems(val).map).to.equal("1, 2");
                expect(wrapper.vm.getChapterOverviewCardItems(val).tool).to.equal("Tool");
            });
        });

        describe("getChapterOverviewImg", () => {
            it("should return empty string", () => {
                expect(wrapper.vm.getChapterOverviewImg(null)).to.equal("");
                expect(wrapper.vm.getChapterOverviewImg(0)).to.equal("");
                expect(wrapper.vm.getChapterOverviewImg("")).to.equal("");
                expect(wrapper.vm.getChapterOverviewImg(false)).to.equal("");
                expect(wrapper.vm.getChapterOverviewImg(undefined)).to.equal("");
                expect(wrapper.vm.getChapterOverviewImg([])).to.equal("");

                expect(wrapper.vm.getChapterOverviewImg({})).to.equal("");
                expect(wrapper.vm.getChapterOverviewImg({content: 0})).to.equal("");
                expect(wrapper.vm.getChapterOverviewImg({content: ""})).to.equal("");
                expect(wrapper.vm.getChapterOverviewImg({content: false})).to.equal("");
                expect(wrapper.vm.getChapterOverviewImg({content: undefined})).to.equal("");
                expect(wrapper.vm.getChapterOverviewImg({content: {}})).to.equal("");
                expect(wrapper.vm.getChapterOverviewImg({content: []})).to.equal("");
            });

            it("should return image source", () => {
                const val = {
                    content: [
                        {
                            "type": "image",
                            "id": "273a4c04-760f-4abe-8a37-e640fc10fefa",
                            "attrs": {
                                "alt": "test",
                                "copyright": "test"
                            }
                        }
                    ]};

                expect(wrapper.vm.getChapterOverviewImg(val)).to.equal("test image");
            });
        });

        describe("saveStory", () => {
            it("should call function updateStory", async () => {
                const updateStorySpy = sinon.spy(wrapper.vm, "updateStory");

                wrapper.vm.saveStory();

                expect(updateStorySpy.calledOnce).to.be.true;
            });

            it("should call function changeCurrentComponent", async () => {
                const changeCurrentComponentSpy = sinon.spy(wrapper.vm, "changeCurrentComponent");

                wrapper.vm.saveStory();

                expect(changeCurrentComponentSpy.calledOnce).to.be.true;
                expect(changeCurrentComponentSpy.calledWith({type: "storyManager", side: "secondaryMenu", props: {name: "additional:modules.storyManager.title"}})).to.be.true;
            });

            it("should call function setNavigationHistoryBySide", async () => {
                const setNavigationHistoryBySideSpy = sinon.spy(wrapper.vm, "setNavigationHistoryBySide");

                wrapper.vm.saveStory();

                expect(setNavigationHistoryBySideSpy.calledOnce).to.be.true;
                expect(setNavigationHistoryBySideSpy.calledWith({side: "secondaryMenu", newHistory: [{type: "root", props: []}]})).to.be.true;
            });
        });
    });
});
