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
                            namespaced: true
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
    });
});
