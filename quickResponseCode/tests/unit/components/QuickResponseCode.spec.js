import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import sinon from "sinon";

import QuickResponseCodeComponent from "../../../components/QuickResponseCode.vue";
import QuickResponseCodeOverlayComponent from "../../../components/QuickResponseCodeOverlay.vue";
import QuickResponseCode from "../../../store/indexQuickResponseCode";

config.global.mocks.$t = key => key;

describe("addons/quickResponseCode/components/QuickResponseCode.vue", () => {
    const mockConfigJson = {
        portalconfig: {
            secondaryMenu: {
                sections: [
                    [
                        {
                            type: "quickResponseCode",
                            name: "translate#additional:modules.quickResponseCode.title",
                            icon: "bi-signpost"
                        }
                    ]
                ]
            }
        }
    };

    let store,
        wrapper;

    beforeEach(() => {
        store = createStore({
            modules: {
                Modules: {
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

        wrapper = shallowMount(QuickResponseCodeComponent, {
            global: {
                plugins: [store]
            },
            context: {
                children: QuickResponseCodeOverlayComponent
            }
        });
    });

    afterEach(()=> {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("renders the QuickResponseCode", () => {
        expect(wrapper.find("#quick-response-code-container").exists()).to.be.true;
        expect(wrapper.find("#quick-response-code-container").text()).to.equals("additional:modules.quickResponseCode.text");
        expect(wrapper.findComponent(QuickResponseCodeOverlayComponent).exists()).to.be.true;
    });
});
