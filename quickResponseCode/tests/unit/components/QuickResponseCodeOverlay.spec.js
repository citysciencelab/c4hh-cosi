import Vuex from "vuex";
import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import Overlay from "ol/Overlay.js";

import QuickResponseCodeOverlayComponent from "../../../components/QuickResponseCodeOverlay.vue";
import QuickResponseCode from "../../../store/indexQuickResponseCode";

const localVue = createLocalVue();

localVue.use(Vuex);
config.mocks.$t = key => key;

describe("addons/quickResponseCode/components/QuickResponseCodeOverlay.vue", () => {
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
    };
    let store,
        map = null;

    before(() => {
        map = {
            id: "ol",
            mode: "2D",
            addOverlay: sinon.spy(),
            removeOverlay: sinon.spy()
        };

        mapCollection.clear();
        mapCollection.addMap(map, "2D");
    });

    beforeEach(() => {
        store = new Vuex.Store({
            namespaces: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        QuickResponseCode
                    }
                }
            },
            state: {
                configJson: mockConfigJson
            }
        });
    });

    it("render the QuickResponseCodeOverlay", () => {
        const wrapper = shallowMount(QuickResponseCodeOverlayComponent, {
            store,
            localVue,
            data () {
                return {
                    overlay: new Overlay({
                        id: "quick-response-code-overlay",
                        element: document.createElement("DIV"),
                        positioning: "bottom-left"
                    }),
                    qrDataUrl: null
                };
            }
        });

        expect(wrapper.find("#quick-response-code-overlay").exists()).to.be.true;
        expect(wrapper.find("#quick-response-code-overlay-body").exists()).to.be.false;
    });

    it("render the qr code as overlay", () => {
        const wrapper = shallowMount(QuickResponseCodeOverlayComponent, {
            store,
            localVue,
            data () {
                return {
                    overlay: new Overlay({
                        id: "quick-response-code-overlay",
                        element: document.createElement("DIV"),
                        positioning: "bottom-left"
                    }),
                    qrDataUrl: "bubble gum"
                };
            }
        });

        expect(wrapper.find("#quick-response-code-overlay").exists()).to.be.true;
        expect(wrapper.find("#quick-response-code-overlay-body").exists()).to.be.true;
        expect(wrapper.find("#quick-response-code-overlay-body-heading > span.bootstrap-icon > i.bi-x-lg").exists()).to.be.true;
        expect(wrapper.find("#quick-response-code-overlay-body-content > img").exists()).to.be.true;
    });

    it("reset the data value 'resetQrDataUrl'", () => {
        const wrapper = shallowMount(QuickResponseCodeOverlayComponent, {
            store,
            localVue,
            data () {
                return {
                    overlay: new Overlay({
                        id: "quick-response-code-overlay",
                        element: document.createElement("DIV"),
                        positioning: "bottom-left"
                    }),
                    qrDataUrl: "bubble gum"
                };
            }
        });

        wrapper.vm.resetQrDataUrl();

        expect(wrapper.vm.qrDataUrl).to.be.null;
    });
});
