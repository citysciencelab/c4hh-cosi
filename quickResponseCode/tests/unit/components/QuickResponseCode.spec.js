import Vuex from "vuex";
import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";

import QuickResponseCodeComponent from "../../../components/QuickResponseCode.vue";
import QuickResponseCode from "../../../store/indexQuickResponseCode";

const localVue = createLocalVue();

localVue.use(Vuex);
config.mocks.$t = key => key;

describe("addons/quickResponseCode/components/QuickResponseCode.vue", () => {
    const mockConfigJson = {
            Portalconfig: {
                menu: {
                    tools: {
                        children: {
                            QuickResponseCode: {
                                "name": "translate#additional:modules.tools.quickResponseCode.title",
                                "icon": "bi-signpost"
                            }
                        }
                    }
                }
            }
        },
        QuickResponseCodeOverlayComponentMock = {
            template: "<span />"
        };
    let store,
        wrapperElements;

    beforeEach(() => {
        store = new Vuex.Store({
            namespaces: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        QuickResponseCode
                    }
                },
                Maps: {
                    namespaced: true,
                    actions: {
                        registerListener: sinon.stub(),
                        unregisterListener: sinon.stub()
                    }
                }
            },
            state: {
                configJson: mockConfigJson
            }
        });
        store.commit("Tools/QuickResponseCode/setActive", true);
        wrapperElements = {
            store,
            localVue,
            components: {
                QuickResponseCodeOverlay: QuickResponseCodeOverlayComponentMock
            }
        };
    });

    it("renders the QuickResponseCode", () => {
        const wrapper = shallowMount(QuickResponseCodeComponent, wrapperElements);

        expect(wrapper.find("#tool-quick-response-code").exists()).to.be.true;
        expect(wrapper.find("#tool-quick-response-code").text()).to.equals("additional:modules.tools.quickResponseCode.text");
        expect(wrapper.findComponent(QuickResponseCodeOverlayComponentMock).exists()).to.be.true;
    });

    it("do not render the QuickResponseCode if not active", () => {
        let wrapper = null;

        store.commit("Tools/QuickResponseCode/setActive", false);
        wrapper = shallowMount(QuickResponseCodeComponent, wrapperElements);

        expect(wrapper.find("#tool-quick-response-code").exists()).to.be.false;
        expect(wrapper.findComponent(QuickResponseCodeOverlayComponentMock).exists()).to.be.false;
    });
});
