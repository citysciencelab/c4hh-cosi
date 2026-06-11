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
                Menu: {
                    namespaced: true,
                    actions: {
                        changeCurrentComponent: changeCurrentComponentSpy
                    }
                },
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
                                storyList: (state) => state.storyList
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
                                            text: "",
                                            imageSrc: "",
                                            imageCopyright: "",
                                            imageAlt: "",
                                            chapters: []
                                        },
                                        imageAssetsById: {}
                                    },
                                    {
                                        story: {
                                            title: "Story 2",
                                            text: "",
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

        describe("editStory", () => {
            it("should call changeCurrentComponent when createNewStory is triggered", async () => {
                const expectedPayload = {
                    type: "storyCreator",
                    side: "secondaryMenu",
                    props: {
                        name: "additional:modules.storyCreator.title"
                    }
                };

                await wrapper.vm.editStory(1);

                expect(changeCurrentComponentSpy.calledOnce).to.be.true;
                expect(changeCurrentComponentSpy.firstCall.args[1]).to.deep.equal(expectedPayload);
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
        it("should call changeCurrentComponent when createNewStory is triggered", async () => {
            const addCardBtn = wrapper.findComponent({name: "AddCardButton"}),
                expectedPayload = {
                    type: "storyCreator",
                    side: "secondaryMenu",
                    props: {
                        name: "additional:modules.storyCreator.title"
                    }
                };

            await addCardBtn.vm.$emit("click");

            expect(changeCurrentComponentSpy.calledOnce).to.be.true;
            expect(changeCurrentComponentSpy.firstCall.args[1]).to.deep.equal(expectedPayload);
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
