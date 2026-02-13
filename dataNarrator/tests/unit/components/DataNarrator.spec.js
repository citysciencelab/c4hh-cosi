import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";

import Component from "../../../components/DataNarrator.vue";


describe("addons/dataNarrator/tests/unit/DataNarrator.spec.js", () => {
    let wrapper,
        store;

    beforeEach(() => {

        store = createStore({
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        DataNarrator: {
                            namespaced: true,
                            state: () => ({
                                showLoadingSpinner: false,
                                autoplay: true,
                                storyConfJson: "mockConfigJsStoryConf.json"
                            }),
                            getters: {
                                showLoadingSpinner: state => state.showLoadingSpinner,
                                autoplay: state => state.autoplay,
                                storyConfJson: state => state.storyConfJson
                            },
                            mutations: {
                                setShowLoadingSpinner (state, payload) {
                                    state.showLoadingSpinner = payload;
                                },
                                setMode: (state, payload) => {
                                    state.mode = payload;
                                }
                            }
                        }
                    }
                }
            },
            state: {
                configJs: {
                    storyConf: "mockConfigJsStoryConf.json"
                }
            },
            getters: {
                configJs: state => state.configJs
            }
        });

        wrapper = shallowMount(Component, {
            props: {
            },
            global: {
                mocks: {
                    $t: key => key
                },
                plugins: [store]
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("DataNarrator should exist", () => {
        expect(wrapper.exists()).to.be.true;
    });

    it("should render StoryPlayer component", () => {
        const storyPlayer = wrapper.findComponent({name: "StoryPlayer"});

        expect(storyPlayer.exists()).to.be.true;
    });
});
