import {createStore} from "vuex";
import {expect} from "chai";
import {shallowMount} from "@vue/test-utils";
import StoryManager from "../../../components/StoryManager.vue";

describe("addons/storyManager/tests/unit/components/StoryManager.spec.js", () => {
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
});
