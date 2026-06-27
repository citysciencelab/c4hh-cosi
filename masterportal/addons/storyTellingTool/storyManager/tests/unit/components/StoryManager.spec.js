import {createStore} from "vuex";
import {expect} from "chai";
import {shallowMount} from "@vue/test-utils";
import StoryManager from "../../../components/StoryManager.vue";
import sinon from "sinon";

describe("addons/storyManager/tests/unit/components/StoryManager.spec.js", () => {
    let store, wrapper;

    beforeEach(() => {
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        StoryManager: {
                            namespaced: true,
                            getters: {
                                currentStoryIndex: (state) => state.currentStoryIndex,
                                fixedStoryPath: (state) => state.fixedStoryPath,
                                fixedStoryFiles: (state) => state.fixedStoryFiles,
                                fixedStoryLoaded: (state) => state.fixedStoryLoaded,
                                storyList: (state) => state.storyList,
                                subjectLayerCategory: (state) => state.subjectLayerCategory
                            },
                            mutations: {
                                setCurrentStoryIndex (state, value) {
                                    state.currentStoryIndex = value;
                                },
                                setFixedStoryPath (state, value) {
                                    state.fixedStoryPath = value;
                                },
                                setFixedStoryFiles (state, value) {
                                    state.fixedStoryFiles = value;
                                },
                                setFixedStoryLoaded (state, value) {
                                    state.fixedStoryLoaded = value;
                                },
                                setStoryList (state, value) {
                                    state.storyList = value;
                                }
                            },
                            state: {
                                currentStoryIndex: undefined,
                                storyList: [
                                    {
                                        story: {
                                            title: "Story 1",
                                            description: "",
                                            author: "",
                                            imageSrc: "img-1",
                                            imageCopyright: "",
                                            imageAlt: "",
                                            chapters: []
                                        },
                                        imageAssetsById: {
                                            "img-1": {
                                                id: "img-1",
                                                objectURL: "blob:url-1"
                                            }
                                        }
                                    },
                                    {
                                        story: {
                                            title: "Story 2",
                                            description: "",
                                            author: "",
                                            imageSrc: "",
                                            imageCopyright: "",
                                            imageAlt: "",
                                            chapters: []
                                        },
                                        imageAssetsById: {}
                                    }
                                ],
                                fixedStoryPath: "./assets",
                                fixedStoryFiles: [],
                                fixedStoryLoaded: false
                            }
                        }

                    }
                }
            }
        });

        wrapper = shallowMount(StoryManager, {
            global: {
                plugins: [store]
            }
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Component DOM", () => {
        it("should render the story manager container and its content", () => {
            expect(wrapper.exists()).to.be.true;
        });

        it("should find AddCardButton component", () => {
            expect(wrapper.findComponent({name: "AddCardButton"}).exists()).to.be.true;
        });

        it("should find FlatButton component", () => {
            expect(wrapper.findComponent({name: "FlatButton"}).exists()).to.be.true;
        });

        it("should find InfoCard component", () => {
            expect(wrapper.findComponent({name: "InfoCard"}).exists()).to.be.true;
            expect(wrapper.findAllComponents({name: "InfoCard"}).length).to.equal(2);
        });

        it("should not find InfoText component", () => {
            expect(wrapper.findComponent({name: "InfoText"}).exists()).to.be.false;
        });
    });

    describe("Methods", () => {
        describe("createNewStory", () => {
            it("should set currentStoryIndex to undefined and switch to creator view", () => {
                wrapper.vm.createNewStory();

                expect(wrapper.vm.currentView).to.equal("creator");
                expect(store.state.Modules.StoryManager.currentStoryIndex).to.be.undefined;
            });
        });

        describe("editStory", () => {
            it("should set currentStoryIndex and switch to creator view", () => {
                wrapper.vm.editStory(0);

                expect(wrapper.vm.currentView).to.equal("creator");
                expect(store.state.Modules.StoryManager.currentStoryIndex).to.equal(0);
            });
        });

        describe("onSaveStory", () => {
            it("should add a new story when creating", () => {
                const storySnapshot = {
                        title: "New Story",
                        description: "Test",
                        author: "Me",
                        imageSrc: "img-new",
                        imageAlt: "",
                        imageCopyright: "",
                        chapters: []
                    },
                    imageAssetsSnapshot = {
                        "img-new": {id: "img-new", objectURL: "blob:new"}
                    };

                wrapper.vm.onSaveStory(storySnapshot, imageAssetsSnapshot);

                expect(store.state.Modules.StoryManager.storyList.length).to.equal(3);
                expect(store.state.Modules.StoryManager.storyList[2]).to.deep.equal({
                    story: storySnapshot,
                    imageAssetsById: imageAssetsSnapshot
                });
                expect(wrapper.vm.currentView).to.equal("manager");
            });

            it("should update an existing story", () => {
                const storySnapshot = {
                        title: "Updated Story",
                        description: "Updated",
                        author: "Updated",
                        imageSrc: "",
                        imageAlt: "",
                        imageCopyright: "",
                        chapters: []
                    },
                    imageAssetsSnapshot = {};

                store.state.Modules.StoryManager.currentStoryIndex = 0;
                wrapper.vm.onSaveStory(storySnapshot, imageAssetsSnapshot);

                expect(store.state.Modules.StoryManager.storyList[0].story.title).to.equal("Updated Story");
                expect(wrapper.vm.currentView).to.equal("manager");
            });

            it("should revoke orphaned ObjectURLs when updating", () => {
                const revokeObjectURLSpy = sinon.spy(URL, "revokeObjectURL"),
                    storySnapshot = {
                        title: "Story 1",
                        description: "",
                        author: "",
                        imageSrc: "",
                        imageAlt: "",
                        imageCopyright: "",
                        chapters: []
                    },
                    imageAssetsSnapshot = {}; // No images, so img-1 is orphaned

                store.state.Modules.StoryManager.currentStoryIndex = 0;
                wrapper.vm.onSaveStory(storySnapshot, imageAssetsSnapshot);

                expect(revokeObjectURLSpy.calledWith("blob:url-1")).to.be.true;
            });
        });

        describe("onAbortEditing", () => {
            it("should clear currentStoryIndex and switch to manager view", () => {
                store.state.Modules.StoryManager.currentStoryIndex = 0;
                wrapper.vm.onAbortEditing();

                expect(store.state.Modules.StoryManager.currentStoryIndex).to.be.undefined;
                expect(wrapper.vm.currentView).to.equal("manager");
            });
        });

        describe("getCardItems", () => {
            it("should get the card items in object", async () => {
                const story = {
                        author: "test",
                        created: "01.01.2026",
                        chapters: [{}]
                    },
                    cardItems = {
                        author: "test",
                        creation: "01.01.2026",
                        numberOfChapters: 1
                    };

                expect(wrapper.vm.getCardItems(story)).to.deep.equal(cardItems);
            });
        });

        describe("getFixedStoryList", () => {
            it("should return not call setStoryList", async () => {
                const setStoryListSpy = sinon.spy(wrapper.vm, "setStoryList");

                await wrapper.vm.getFixedStoryList(null);
                expect(setStoryListSpy.called).to.be.false;
                await wrapper.vm.getFixedStoryList(0);
                expect(setStoryListSpy.called).to.be.false;
                await wrapper.vm.getFixedStoryList({});
                expect(setStoryListSpy.called).to.be.false;
                await wrapper.vm.getFixedStoryList(undefined);
                expect(setStoryListSpy.called).to.be.false;
                await wrapper.vm.getFixedStoryList(false);
                expect(setStoryListSpy.called).to.be.false;
                await wrapper.vm.getFixedStoryList([]);
                expect(setStoryListSpy.called).to.be.false;
                await wrapper.vm.getFixedStoryList("path", null);
                expect(setStoryListSpy.called).to.be.false;
                await wrapper.vm.getFixedStoryList("path", "");
                expect(setStoryListSpy.called).to.be.false;
                await wrapper.vm.getFixedStoryList("path", {});
                expect(setStoryListSpy.called).to.be.false;
                await wrapper.vm.getFixedStoryList("path", 0);
                expect(setStoryListSpy.called).to.be.false;
                await wrapper.vm.getFixedStoryList("path", false);
                expect(setStoryListSpy.called).to.be.false;
                await wrapper.vm.getFixedStoryList("path", undefined);
                expect(setStoryListSpy.called).to.be.false;
            });

            it("should return call setStoryList", async () => {
                const setStoryListSpy = sinon.spy(wrapper.vm, "setStoryList");

                await wrapper.vm.getFixedStoryList("path", []);
                expect(setStoryListSpy.called).to.be.true;
            });
        });

        describe("toSafeFileName", () => {
            it("should sanitize invalid filename characters", () => {
                const result = wrapper.vm.toSafeFileName("Story:/\\*?\"<>|Name");

                expect(result).to.equal("Story-Name");
            });
        });

        describe("downloadStory", () => {
            it("should return early if story is missing", async () => {
                const createObjectURLSpy = sinon.spy(URL, "createObjectURL");

                await wrapper.vm.downloadStory({});

                expect(createObjectURLSpy.called).to.be.false;
            });
        });

        describe("onStoryImportFileChange", () => {
            it("should return early when no file is selected", async () => {
                const setStoryListSpy = sinon.spy(wrapper.vm, "setStoryList");

                await wrapper.vm.onStoryImportFileChange({target: {files: []}});

                expect(setStoryListSpy.called).to.be.false;
            });

            it("should show AlertMessage when zip import fails", async () => {
                const invalidZipBlob = new Blob(["invalid zip content"], {type: "application/zip"});

                await wrapper.vm.onStoryImportFileChange({target: {files: [invalidZipBlob], value: "dummy"}});
                await wrapper.vm.$nextTick();

                expect(wrapper.vm.showImportError).to.be.true;
                expect(wrapper.findComponent({name: "AlertMessage"}).exists()).to.be.true;
            });
        });

        describe("playStory", () => {
            it("should set playingStoryIndex to the given index", async () => {
                await wrapper.vm.playStory(1);

                expect(wrapper.vm.playingStoryIndex).to.equal(1);
            });
        });
    });

    describe("User Interaction", () => {
        it("should create new story when AddCardButton is clicked", async () => {
            const addCardBtn = wrapper.findComponent({name: "AddCardButton"});

            await addCardBtn.vm.$emit("click");

            expect(wrapper.vm.currentView).to.equal("creator");
            expect(store.state.Modules.StoryManager.currentStoryIndex).to.be.undefined;
        });
    });

    describe("Asset Cleanup and Child Component Interaction", () => {
        it("should keep image assets that are still referenced", () => {
            const revokeObjectURLSpy = sinon.spy(URL, "revokeObjectURL"),
                storySnapshot = {
                    title: "Story 1",
                    description: "",
                    author: "",
                    imageSrc: "img-1",
                    imageAlt: "",
                    imageCopyright: "",
                    chapters: []
                },
                imageAssetsSnapshot = {
                    "img-1": {id: "img-1", objectURL: "blob:url-1"}
                };

            store.state.Modules.StoryManager.currentStoryIndex = 0;
            wrapper.vm.onSaveStory(storySnapshot, imageAssetsSnapshot);

            expect(revokeObjectURLSpy.called).to.be.false;
        });

        it("should handle multiple orphaned assets correctly", () => {
            const revokeObjectURLSpy = sinon.spy(URL, "revokeObjectURL");

            store.state.Modules.StoryManager.storyList[1].imageAssetsById = {
                "img-a": {id: "img-a", objectURL: "blob:url-a"},
                "img-b": {id: "img-b", objectURL: "blob:url-b"},
                "img-c": {id: "img-c", objectURL: "blob:url-c"}
            };

            store.state.Modules.StoryManager.currentStoryIndex = 1;
            wrapper.vm.onSaveStory({
                title: "Story 2",
                description: "",
                author: "",
                imageSrc: "",
                imageAlt: "",
                imageCopyright: "",
                chapters: []
            }, {
                "img-b": {id: "img-b", objectURL: "blob:url-b"}
            });

            expect(revokeObjectURLSpy.calledWith("blob:url-a")).to.be.true;
            expect(revokeObjectURLSpy.calledWith("blob:url-c")).to.be.true;
            expect(revokeObjectURLSpy.calledWith("blob:url-b")).to.be.false;
        });

        it("should pass correct props to StoryCreator child component", async () => {
            store.state.Modules.StoryManager.currentStoryIndex = 0;
            wrapper.vm.currentView = "creator";
            await wrapper.vm.$nextTick();

            const storyCreatorComponent = wrapper.findComponent({name: "StoryCreator"});

            expect(storyCreatorComponent.exists()).to.be.true;
            if (storyCreatorComponent.exists()) {
                expect(storyCreatorComponent.props("story")).to.be.an("object");
                expect(storyCreatorComponent.props("imageAssetsById")).to.be.an("object");
            }
        });

        it("should set playingStoryIndex when play event is emitted from story card", async () => {
            const storyCards = wrapper.findAllComponents({name: "InfoCard"});

            await storyCards[0].vm.$emit("play");

            expect(wrapper.vm.playingStoryIndex).to.equal(0);
        });

        it("should set playingStoryIndex when story card is clicked", async () => {
            const storyCards = wrapper.findAllComponents({name: "InfoCard"});

            await storyCards[0].trigger("click");

            expect(wrapper.vm.playingStoryIndex).to.equal(0);
        });
    });
});
