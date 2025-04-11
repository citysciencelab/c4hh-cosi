import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";

import Component from "../../../components/BimFactoryWorkflow.vue";

config.global.mocks.$t = key => key;

describe("addons/bimFactory/components/BimFactoryWorkflow.vue", () => {
    const mockWorkflows = {
            "workflows": [
                {
                    "id": 1,
                    "name": "Straßenbaumkataster",
                    "layerIds": {
                        "background": ["123"],
                        "foreground": ["182", "234"]
                    },
                    "config": "pfadZurWorkflowJson"
                },
                {
                    "id": 2,
                    "name": "Gelände",
                    "layerIds": {
                        "background": ["456"],
                        "foreground": ["789", "234"]
                    },
                    "config": "pfadZurWorkflowJson"
                }
            ]
        },
        store = createStore({
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        BimFactory: {
                            namespaced: true,
                            getters: {
                                workflowsJSON: () => {
                                    return mockWorkflows;
                                }
                            }
                        }
                    }
                }
            }
        }),
        globalMocks = {
            plugins: [store]
        };

    it("should exist", () => {
        const wrapper = shallowMount(Component, {
            global: globalMocks,
            propsData: {
                workflowId: 1
            }
        });

        expect(wrapper.exists()).to.be.true;
    });

    it("should find the correct workflow", () => {
        const wrapper = shallowMount(Component, {
            global: globalMocks,
            propsData: {
                workflowId: 1
            }
        });

        expect(wrapper.exists()).to.be.true;
        expect(wrapper.vm.currentWorkflow).to.be.an("object");
        expect(wrapper.vm.currentWorkflow).to.deep.equal(mockWorkflows.workflows[0]);
    });

    it("should find nothing for the wrong workflowId", () => {
        const wrapper = shallowMount(Component, {
            global: globalMocks,
            propsData: {
                workflowId: 3
            }
        });

        expect(wrapper.exists()).to.be.true;
        expect(wrapper.vm.currentWorkflow).to.be.null;
    });
});
