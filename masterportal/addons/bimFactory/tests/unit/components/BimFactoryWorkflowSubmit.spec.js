import {config, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import BimFactoryWorkflowSubmit from "../../../components/BimFactoryWorkflowSubmit.vue";
import FlatButton from "../../../../../src/shared/modules/buttons/components/FlatButton.vue";

config.global.mocks.$t = key => key;

describe("BimFactoryWorkflowSubmit.vue", () => {
    /**
     * Creates a clean store mock object.
     * @param {Object} Mixed params to set
     * @returns {Store} Mock store
     */
    function createBimFactoryStore (
        {
            isRequestErrorGeneral = false,
            isLoading = false,
            workflowFormData = {},
            generatedIfcUrl = {},
            currentWorkflowId = 1,
            bimViewerFullyLoaded = true,
            isMobile = false,
            mainMenu = {sections: []},
            secondaryMenu = {sections: []},
            currentComponent = () => ({type: ""})
        } = {}) {

        return createStore({
            modules: {
                Menu: {
                    namespaced: true,
                    getters: {
                        mainMenu: () => mainMenu,
                        secondaryMenu: () => secondaryMenu,
                        currentComponent: () => currentComponent
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
                                isLoading: () => isLoading,
                                workflowFormData: () => workflowFormData,
                                generatedIfcUrl: () => generatedIfcUrl,
                                currentWorkflowId: () => currentWorkflowId,
                                isRequestErrorGeneral: () => isRequestErrorGeneral
                            },
                            actions: {
                                submitCreateIfcRequest: sinon.stub(),
                                forceFileDownload: sinon.stub()
                            }
                        },
                        BimViewer: {
                            namespaced: true,
                            getters: {
                                bimViewerFullyLoaded: () => bimViewerFullyLoaded
                            },
                            actions: {
                                loadModel: sinon.stub().resolves()
                            }
                        }
                    }
                }
            },
            getters: {
                isMobile: () => isMobile
            }
        });
    }

    /**
     * Shallow mount component.
     * @param {Object} storeOptions
     * @returns {Wrapper} Wrapper object
     */
    function mountComponent (storeOptions = {}) {
        const store = createBimFactoryStore(storeOptions);

        return shallowMount(BimFactoryWorkflowSubmit, {
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
    }

    it("renders the submit step component", () => {
        const wrapper = mountComponent();

        expect(wrapper.exists()).to.be.true;
    });

    it("renders one button before IFC has been generated", () => {
        const
            wrapper = mountComponent(),
            flatButtonComponents = wrapper.findAllComponents(FlatButton);

        expect(flatButtonComponents.length).to.equal(1);
    });

    it("renders three buttons after Url to IFC is there", () => {
        const
            wrapper = mountComponent({
                generatedIfcUrl: {1: "http://example.com/generated.ifc"},
                currentWorkflowId: 1,
                mainMenu: {sections: [[{type: "bimViewer"}]]},
                isMobile: false
            }),
            flatButtonComponents = wrapper.findAllComponents(FlatButton);

        expect(flatButtonComponents.length).to.equal(3);
    });

    it("renders two buttons after Url to IFC is there and the BimViewer is not configured", () => {
        const
            wrapper = mountComponent({
                generatedIfcUrl: {1: "http://example.com/generated.ifc"},
                currentWorkflowId: 1,
                mainMenu: {sections: [[]]},
                secondaryMenu: {sections: [[]]},
                isMobile: false
            }),
            flatButtonComponents = wrapper.findAllComponents(FlatButton);

        expect(flatButtonComponents.length).to.equal(2);
    });

    it("checks general error message: isRequestErrorGeneral is set", () => {
        const
            wrapper = mountComponent({
                isRequestErrorGeneral: "General error detected"
            }),
            errorParagraph = wrapper.find("p");

        expect(errorParagraph.exists()).to.be.true;
        expect(errorParagraph.text()).to.include("General error detected");
    });
});
