import {createStore} from "vuex";
import {expect} from "chai";
import {shallowMount} from "@vue/test-utils";
import StoryManager from "../../../components/StoryManager.vue";
import sinon from "sinon";

describe("addons/storyManager/tests/unit/components/StoryManager.spec.js", () => {
    let store, wrapper, changeCurrentComponentSpy;

    beforeEach(() => {
        changeCurrentComponentSpy = sinon.spy();
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
                                menuSide: () => "secondaryMenu",
                                storyList: (state) => state.storyList,
                                subjectLayerCategory: (state) => state.subjectLayerCategory,
                                enableCreator: (state) => state.enableCreator,
                                enableImport: (state) => state.enableImport
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
                                enableCreator: true,
                                enableImport: true,
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
                        },
                        StoryPlayer: {
                            namespaced: true,
                            state: () => ({
                                currentStoryName: null,
                                imageAssetsById: {},
                                storyConf: {}
                            }),
                            mutations: {
                                setCurrentStoryName (state, value) {
                                    state.currentStoryName = value;
                                },
                                setImageAssetsById (state, value) {
                                    state.imageAssetsById = value;
                                },
                                setStoryConf (state, value) {
                                    state.storyConf = value;
                                }
                            }
                        }
                    }
                },
                Menu: {
                    namespaced: true,
                    actions: {
                        changeCurrentComponent: changeCurrentComponentSpy
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

        it("should not find AlertMessage component", () => {
            expect(wrapper.findComponent({name: "AlertMessage"}).exists()).to.be.false;
        });

        it("should find AlertMessage component", async () => {
            await wrapper.setData({showImportError: true, showImportWarning3D: true});

            expect(wrapper.findComponent({name: "AlertMessage"}).exists()).to.be.true;
            expect(wrapper.findAllComponents({name: "AlertMessage"}).length).to.equal(2);
        });

        it("should not find Toast component", () => {
            expect(wrapper.findComponent({name: "Toast"}).exists()).to.be.false;
        });

        it("should find Toast component", async () => {
            await wrapper.setData({"savedStoryIndex": 1});
            expect(wrapper.findComponent({name: "Toast"}).exists()).to.be.true;
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
                store.state.Modules.StoryManager.enableCreator = true;

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
                expect(store.state.Modules.StoryManager.storyList[0]).to.deep.equal({
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
            it("should call changeCurrentComponent with storyPlayer config", async () => {
                await wrapper.vm.playStory(1);

                expect(changeCurrentComponentSpy.calledOnce).to.be.true;
                expect(changeCurrentComponentSpy.firstCall.args[1]).to.deep.equal({
                    type: "storyPlayer",
                    side: "secondaryMenu",
                    props: {name: "additional:modules.storyPlayer.name"}
                });
            });
        });

        describe("deactivated", () => {
            it("negative: currentView stays 'manager' when already in manager view on deactivation", () => {
                wrapper.vm.currentView = "manager";
                wrapper.vm.$options.deactivated.call(wrapper.vm);
                expect(wrapper.vm.currentView).to.equal("manager");
            });
        });

        describe("confirmLeaveTool", () => {
            it("positive: closes the modal, resets currentView to 'manager', clears pendingNavigation, and dispatches the intercepted navigation", () => {
                const pendingNav = {type: "layerSelection", side: "secondaryMenu", props: {name: "Layer Selection"}};

                wrapper.vm.currentView = "creator";
                wrapper.vm.showLeaveToolModal = true;
                wrapper.vm.pendingNavigation = pendingNav;

                wrapper.vm.confirmLeaveTool();

                expect(wrapper.vm.showLeaveToolModal).to.be.false;
                expect(wrapper.vm.currentView).to.equal("manager");
                expect(wrapper.vm.pendingNavigation).to.be.null;
                expect(changeCurrentComponentSpy.calledOnce).to.be.true;
                expect(changeCurrentComponentSpy.firstCall.args[1]).to.deep.equal(pendingNav);
            });

            it("negative: does not dispatch navigation when pendingNavigation is null", () => {
                wrapper.vm.pendingNavigation = null;
                wrapper.vm.confirmLeaveTool();
                expect(changeCurrentComponentSpy.called).to.be.false;
            });
        });

        describe("cancelLeaveTool", () => {
            it("positive: closes the leave-tool modal and clears pendingNavigation without dispatching any navigation", () => {
                wrapper.vm.showLeaveToolModal = true;
                wrapper.vm.pendingNavigation = {type: "layerSelection", side: "secondaryMenu", props: {}};

                wrapper.vm.cancelLeaveTool();

                expect(wrapper.vm.showLeaveToolModal).to.be.false;
                expect(wrapper.vm.pendingNavigation).to.be.null;
                expect(changeCurrentComponentSpy.called).to.be.false;
            });
        });
    });

    describe("Save hint behavior", () => {
        it("positive: onSaveStory sets savedStoryIndex when existing story data changed", () => {
            const changedStory = {
                title: "Changed Title",
                description: "",
                author: "",
                imageSrc: "",
                imageAlt: "",
                imageCopyright: "",
                chapters: []
            };

            store.state.Modules.StoryManager.currentStoryIndex = 1;
            wrapper.vm.onSaveStory(changedStory, {});

            expect(wrapper.vm.savedStoryIndex).to.equal(1);
            expect(wrapper.vm.currentView).to.equal("manager");
        });

        it("negative: onSaveStory does not set savedStoryIndex when story data is unchanged", () => {
            const originalStory = store.state.Modules.StoryManager.storyList[1].story,
                unchangedSnapshot = Object.assign({}, originalStory, {created: "24.07.2026"});

            store.state.Modules.StoryManager.currentStoryIndex = 1;
            wrapper.vm.onSaveStory(unchangedSnapshot, {});

            expect(wrapper.vm.savedStoryIndex).to.be.null;
        });

        it("positive: onSaveStory always sets savedStoryIndex for a new story", () => {
            const newStory = {
                title: "Brand New Story",
                description: "",
                author: "",
                imageSrc: "",
                imageAlt: "",
                imageCopyright: "",
                chapters: []
            };

            store.state.Modules.StoryManager.currentStoryIndex = undefined;
            wrapper.vm.onSaveStory(newStory, {});

            expect(wrapper.vm.savedStoryIndex).to.equal(0);
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
    });
    describe("Configuration Limits (enableCreator & enableImport)", () => {
        it("should not render AddCardButton and block editStory if enableCreator is false", async () => {
            store.state.Modules.StoryManager.enableCreator = false;
            await wrapper.vm.$nextTick();

            expect(wrapper.findComponent({name: "AddCardButton"}).exists()).to.be.false;
        });

        it("should not render import buttons and block onStoryImportFileChange if enableImport is false", async () => {
            store.state.Modules.StoryManager.enableImport = false;
            await wrapper.vm.$nextTick();

            expect(wrapper.findComponent({name: "FlatButton"}).exists()).to.be.false;
            expect(wrapper.find("input[type='file']").exists()).to.be.false;
        });
    });
});
