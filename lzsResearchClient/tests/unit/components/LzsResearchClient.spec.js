import {flushPromises, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";

import Component from "../../../components/LzsResearchClient.vue";

describe("addons/lzsResearchClient/tests/unit/LzsResearchClient.spec.js", () => {
    let wrapper,
        store;

    beforeEach(() => {
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        LzsResearchClient: {
                            namespaced: true,
                            state: () => ({
                                showLoadingSpinner: false,
                                requestToken: "test-token"
                            }),
                            getters: {
                                showLoadingSpinner: state => state.showLoadingSpinner,
                                errorMessage: () => "",
                                globalError: state => state.globalError ?? null,
                                requestToken: state => state.requestToken,
                                progressNow: () => -1,
                                currentProgressValue: () => ""
                            },
                            mutations: {
                                setShowLoadingSpinner (state, payload) {
                                    state.showLoadingSpinner = payload;
                                },
                                setGlobalError (state, payload) {
                                    state.globalError = payload;
                                }
                            },
                            actions: {
                                fetchRequestToken: () => Promise.resolve("mocked-request-token")
                            }
                        }
                    }
                }
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

    it("should exist", () => {
        expect(wrapper.exists()).to.be.true;
    });

    it("should have requestToken state set to 'test-token'", () => {
        expect(store.state.Modules.LzsResearchClient.requestToken).to.equal("test-token");
    });

    it("should have showLoadingSpinner state set to false", async () => {
        // Wait for all promises in mounted to resolve
        await flushPromises();

        expect(store.state.Modules.LzsResearchClient.showLoadingSpinner).to.equal(false);
    });

    it("should set globalError state when setGlobalError mutation is committed", async () => {
        const errorPayload = {
            type: "server",
            message: "Test error message"
        };

        store.commit("Modules/LzsResearchClient/setGlobalError", errorPayload);

        await wrapper.vm.$nextTick();

        expect(wrapper.find("confirm-modal-stub").attributes("showmodal")).to.equal("true");
    });
});
