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
                                storyList: (state) => state.storyList
                            },
                            state: {
                                storyList: [
                                    {
                                        title: "Story 1"
                                    },
                                    {
                                        title: "Story 2"
                                    }
                                ]
                            }
                        },
                        StoryCreator: {
                            namespaced: true,
                            getters: {
                                imageAssetsById: (state) => state.imageAssetsById
                            },
                            state: {
                                imageAssetsById: {}
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
    });
});
