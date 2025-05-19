import {config, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import BimFactoryWorkflowSubmit from "../../../components/BimFactoryWorkflowSubmit.vue";
import FlatButton from "../../../../../src/shared/modules/buttons/components/FlatButton.vue";

config.global.mocks.$t = key => key;

describe("BimFactoryWorkflowSubmit.vue", () => {
    const store = createStore({
        modules: {
            getters: {
                isMobile: () => {
                    return false;
                }
            },
            Menu: {
                namespaced: true,
                getters: {
                    mainMenu: () => ({sections: []}),
                    secondaryMenu: () => ({sections: []}),
                    currentComponent: () => () => ({type: ""})
                },
                actions: {
                    changeCurrentComponent: sinon.stub()
                }
            },
            Modules: {
                namespaced: true,
                modules: {
                    BimFactory: {
                        namespaced: true,
                        getters: {
                            isLoading: () => {
                                return false;
                            },
                            workflowFormData: () => ({}),
                            generatedIfcUrl: () => ({}),
                            currentWorkflowId: () => 1
                        },
                        actions: {
                            submitCreateIfcRequest: sinon.stub(),
                            forceFileDownload: sinon.stub()
                        }
                    },
                    BimViewer: {
                        namespaced: true,
                        getters: {
                            bimViewerFullyLoaded: () => true
                        },
                        actions: {
                            loadModel: sinon.stub().resolves()
                        }
                    }
                }
            }
        }
    });

    it("renders the submit step component", () => {
        const wrapper = shallowMount(BimFactoryWorkflowSubmit, {
            props: {
                config: {
                    component: {
                        title: "Submit Workflow",
                        ogcAPIServiceURL: "http://example.com/api"
                    }
                },
                isOpen: true
            },
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.exists()).to.be.true;
    });

    it("renders one button before IFC has been generated", () => {
        const wrapper = shallowMount(BimFactoryWorkflowSubmit, {
                props: {
                    config: {
                        component: {
                            title: "Submit Workflow",
                            ogcAPIServiceURL: "http://example.com/api"
                        }
                    },
                    isOpen: true
                },
                global: {
                    plugins: [store]
                }
            }),
            flatButtonComponents = wrapper.findAllComponents(FlatButton);

        expect(flatButtonComponents.length).to.equal(1);
    });

    it("renders three buttons after Url to IFC is there", () => {
        const wrapper = shallowMount(BimFactoryWorkflowSubmit, {
                props: {
                    config: {
                        component: {
                            title: "Submit Workflow",
                            ogcAPIServiceURL: "http://example.com/api"
                        }
                    },
                    isOpen: true
                },
                global: {
                    plugins: [store]
                },
                computed: {
                    ifcUrl: () => {
                        return "http://example.com/generated.ifc";
                    },
                    isLoading: () => false,
                    isMobile: () => false,
                    bimViewerConfigured: () => true
                }
            }),
            flatButtonComponents = wrapper.findAllComponents(FlatButton);

        expect(flatButtonComponents.length).to.equal(3);
    });

    it("renders two buttons after Url to IFC is there and the BimViewer is not configured", () => {
        const wrapper = shallowMount(BimFactoryWorkflowSubmit, {
                props: {
                    config: {
                        component: {
                            title: "Submit Workflow",
                            ogcAPIServiceURL: "http://example.com/api"
                        }
                    },
                    isOpen: true
                },
                global: {
                    plugins: [store]
                },
                computed: {
                    ifcUrl: () => {
                        return "http://example.com/generated.ifc";
                    },
                    isLoading: () => false,
                    isMobile: () => false,
                    bimViewerConfigured: () => false
                }
            }),
            flatButtonComponents = wrapper.findAllComponents(FlatButton);

        expect(flatButtonComponents.length).to.equal(2);
    });
});
