import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";

import Component from "../../../components/TabDetails.vue";

describe("addons/lzsResearchClient/tests/unit/components/tabs/TabDetails.spec.js", () => {
    let wrapper,
        store;

    beforeEach(() => {
        store = createStore({
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        LzsResearchClient: {
                            namespaced: true,
                            state: () => ({
                                // to be used later
                            }),
                            getters: {
                                getDetailsForSelectedInstanceId: () => "Details",
                                nameForArchiveId: () => (id) => {
                                    return id;
                                },
                                dataProtectionClassForArchiveId: () => (id) => {
                                    return id + " Öffentlich";
                                },
                                selectedInstanceId: () => "abc"
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
});
