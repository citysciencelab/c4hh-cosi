import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import {reactive} from "vue";

import Component from "../../../components/TabResult.vue";

describe("addons/lzsResearchClient/tests/unit/components/tabs/TabResult.spec.js", () => {
    let wrapper,
        store,
        mockSearchAttributeResponse;

    beforeEach(() => {
        mockSearchAttributeResponse = reactive([
            {
                "archiveId": "DKL_3DSTADT_LOD1",
                "attributes": [
                    {
                        "name": "JAHRGANG",
                        "value": "2022",
                        "type": "I"
                    },
                    {
                        "name": "KACHELNUMMER",
                        "value": "6232",
                        "type": "I"
                    }
                ],
                "checked": false
            },
            {
                "archiveId": "DKL_3DSTADT_LOD1",
                "attributes": [
                    {
                        "name": "JAHRGANG",
                        "value": "2022",
                        "type": "I"
                    },
                    {
                        "name": "KACHELNUMMER",
                        "value": "4835",
                        "type": "I"
                    }
                ],
                "checked": false
            }
        ]);

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
                                searchAttributeResponse: () => mockSearchAttributeResponse,
                                getNameForArchiveId: () => (id) => {
                                    return id;
                                },
                                archiveHasGeoref: () => (id) => {
                                    return id === "test";
                                },
                                progressNow: () => -1,
                                currentProgressValue: () => ""
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
