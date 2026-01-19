import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";

import Component from "../../../components/TabResult.vue";

describe("addons/lzsResearchClient/tests/unit/components/tabs/TabResult.spec.js", () => {
    let wrapper,
        store;

    beforeEach(() => {
        const mockSearchAttributeResponse = [
            {"archiveId": "DKL_3DSTADT_LOD1", "attributes": [{"name": "JAHRGANG", "value": "2022", "type": "I"}, {"name": "KACHELNUMMER", "value": "6232", "type": "I"}]},
            {"archiveId": "DKL_3DSTADT_LOD1", "attributes": [{"name": "JAHRGANG", "value": "2022", "type": "I"}, {"name": "KACHELNUMMER", "value": "4835", "type": "I"}]}
        ];

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
                                searchAttributeResponse: () => mockSearchAttributeResponse
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
