import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";

import Component from "../../../components/TabResultTable.vue";

describe("addons/lzsResearchClient/tests/unit/components/tabs/TabResultTable.spec.js", () => {
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
                                // to be used later
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(Component, {
            props: {
                tableIndex: "tableIndex-1",
                tableHeader: ["header1", "header2", "header3", "header4"],
                tableDatasets: [{
                    instanceId: "dataset1",
                    attributes: [
                        {
                            name: "JAHRGANG",
                            value: "2023"
                        },
                        {
                            name: "NUMMER",
                            value: "6088"
                        }
                    ]
                }]
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
