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
                        StoryManager: {
                            namespaced: true,
                            actions: {
                                addImageAsset: sinon.stub().resolves({
                                    id: "test-asset-id",
                                    blob: new Blob(),
                                    objectURL: "blob:test-url",
                                    mimeType: "image/png",
                                    originalName: "test.png",
                                    archivePath: "images/test.png"
                                })
                            },
                            state: {}
                        }
                    }
                }
            }
        });
        wrapper = shallowMount(StoryCreator, {
            props: {
                story: {
                    title: "Test Story",
                    description: "Test Description",
                    author: "Test Author",
                    imageAlt: "Test Alt",
                    imageCopyright: "Test Copyright",
                    imageSrc: "test-image-id",
                    chapters: []
                },
                imageAssetsById: {
                    "test-image-id": {
                        id: "test-image-id",
                        blob: new Blob(),
                        objectURL: "blob:test-url",
                        mimeType: "image/png",
                        originalName: "test.png"
                    }
                },
                currentStoryIndex: undefined
            },
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
        it("should not render the loaded title image.", async () => {
            await wrapper.setData({
                imageLoaded: false
            });

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
        describe("deleteChapter", () => {
            it("should delete one chapter from the index", async () => {
                await wrapper.setData({
                    chapterContent: [
                        {title: "Test Chapter 1", text: "Test Text 1"},
                        {title: "Test Chapter 2", text: "Test Text 2"}
                    ]
                });

                wrapper.vm.deleteChapter(0);

                expect(wrapper.vm.chapterContent.length).to.equal(1);
                expect(wrapper.vm.chapterContent).to.deep.equal([{title: "Test Chapter 2", text: "Test Text 2"}]);
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
                        center: [1, 2],
                        tool: "tool"
                    }
                };

                expect(wrapper.vm.getChapterOverviewCardItems(val).subject).to.equal("2 modules.layerSelection.datalayer");
                expect(wrapper.vm.getChapterOverviewCardItems(val).map).to.equal("modules.storyCreator.labels.mapPosition");
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
                            "id": "test-image-id",
                            "attrs": {
                                "alt": "test",
                                "copyright": "test"
                            }
                        }
                    ]};

                expect(wrapper.vm.getChapterOverviewImg(val)).to.equal("blob:test-url");
            });
        });

        describe("saveStory", () => {
            it("should emit save-story event with story snapshot and image assets snapshot", async () => {
                await wrapper.setData({
                    title: "Test Story",
                    description: "Test Description",
                    author: "Test Author",
                    imageSrc: "test-image-id",
                    imageAlt: "Test Alt",
                    imageCopyright: "Test Copyright",
                    chapterContent: [{title: "Chapter 1"}],
                    workingImageAssetsById: {
                        "test-image-id": {
                            id: "test-image-id",
                            objectURL: "blob:test"
                        }
                    }
                });

                wrapper.vm.saveStory();

                const emitted = wrapper.emitted("save-story");

                expect(emitted).to.have.lengthOf(1);
                expect(emitted[0][0]).to.include({
                    title: "Test Story",
                    description: "Test Description",
                    author: "Test Author",
                    imageSrc: "test-image-id",
                    imageAlt: "Test Alt",
                    imageCopyright: "Test Copyright"
                });
                expect(emitted[0][1]).to.have.property("test-image-id");
                expect(emitted[0][1]["test-image-id"]).to.include({
                    id: "test-image-id",
                    objectURL: "blob:test"
                });
            });
        });
    });

    describe("Image and Asset Management", () => {
        describe("addImage", () => {
            it("should set image metadata and mark image as loaded", () => {
                wrapper.vm.addImage({
                    id: "new-img-id",
                    alt: "New Alt",
                    copyright: "New Copyright"
                });

                expect(wrapper.vm.imageSrc).to.equal("new-img-id");
                expect(wrapper.vm.imageAlt).to.equal("New Alt");
                expect(wrapper.vm.imageCopyright).to.equal("New Copyright");
                expect(wrapper.vm.imageLoaded).to.be.true;
            });
        });

        describe("handleSaveChapter", () => {
            it("should append chapter to content and return to story view", () => {
                const chapter = {
                    title: "New Chapter",
                    content: [],
                    map: {center: null, zoomLevel: null, layers: null, tool: null}
                };

                wrapper.vm.currentView = "chapter";
                wrapper.vm.handleSaveChapter(chapter);

                expect(wrapper.vm.chapterContent).to.include(chapter);
                expect(wrapper.vm.currentView).to.equal("story");
            });
        });
    });

    describe("Props and Initialization", () => {
        it("should initialize data from props correctly", () => {
            const newWrapper = shallowMount(StoryCreator, {
                props: {
                    story: {
                        title: "Initial Story",
                        description: "Initial Desc",
                        author: "Initial Author",
                        imageAlt: "Initial Alt",
                        imageCopyright: "Initial Copyright",
                        imageSrc: "test-image-id",
                        chapters: [{title: "Ch1"}]
                    },
                    imageAssetsById: {
                        "test-image-id": {
                            id: "test-image-id",
                            objectURL: "blob:test"
                        }
                    }
                },
                global: {
                    plugins: [store]
                }
            });

            expect(newWrapper.vm.title).to.equal("Initial Story");
            expect(newWrapper.vm.description).to.equal("Initial Desc");
            expect(newWrapper.vm.author).to.equal("Initial Author");
            expect(newWrapper.vm.imageAlt).to.equal("Initial Alt");
            expect(newWrapper.vm.imageCopyright).to.equal("Initial Copyright");
            expect(newWrapper.vm.imageSrc).to.equal("test-image-id");
            expect(newWrapper.vm.chapterContent).to.deep.equal([{title: "Ch1"}]);
        });

        it("should initialize with empty values for missing props", () => {
            const newWrapper = shallowMount(StoryCreator, {
                props: {
                    story: {},
                    imageAssetsById: {}
                },
                global: {
                    plugins: [store]
                }
            });

            expect(newWrapper.vm.title).to.equal("");
            expect(newWrapper.vm.description).to.equal("");
            expect(newWrapper.vm.author).to.equal("");
            expect(newWrapper.vm.chapterContent).to.deep.equal([]);
        });
    });
});
