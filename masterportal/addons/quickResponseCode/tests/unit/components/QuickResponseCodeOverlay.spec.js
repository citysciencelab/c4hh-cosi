import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import sinon from "sinon";
import Overlay from "ol/Overlay.js";

import QuickResponseCodeOverlayComponent from "../../../components/QuickResponseCodeOverlay.vue";
import QuickResponseCode from "../../../store/indexQuickResponseCode";

config.global.mocks.$t = key => key;

describe("addons/quickResponseCode/components/QuickResponseCodeOverlay.vue", () => {
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
        wrapper = null,
        map = null;

    beforeAll(() => {
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
        store = createStore({
            modules: {
                Modules: {
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

        wrapper = shallowMount(QuickResponseCodeOverlayComponent, {
            global: {
                plugins: [store]
            }
        });
    });

    afterEach(()=> {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("render the QuickResponseCodeOverlay", async () => {
        await wrapper.setData({
            overlay: new Overlay({
                id: "quick-response-code-overlay",
                element: document.createElement("DIV"),
                positioning: "bottom-left"
            }),
            qrDataUrl: null
        });

        expect(wrapper.find("#quick-response-code-overlay").exists()).to.be.true;
        expect(wrapper.find("#quick-response-code-overlay-body").exists()).to.be.false;
    });

    it("render the qr code as overlay", async () => {
        await wrapper.setData({
            overlay: new Overlay({
                id: "quick-response-code-overlay",
                element: document.createElement("DIV"),
                positioning: "bottom-left"
            }),
            qrDataUrl: "bubble gum"
        });

        expect(wrapper.find("#quick-response-code-overlay").exists()).to.be.true;
        expect(wrapper.find("#quick-response-code-overlay-body").exists()).to.be.true;
        expect(wrapper.find("#quick-response-code-overlay-body-heading > span.bootstrap-icon > i.bi-x-lg").exists()).to.be.true;
        expect(wrapper.find("#quick-response-code-overlay-body-content > img").exists()).to.be.true;
    });

    it("reset the data value 'resetQrDataUrl'", async () => {
        await wrapper.setData({
            overlay: new Overlay({
                id: "quick-response-code-overlay",
                element: document.createElement("DIV"),
                positioning: "bottom-left"
            }),
            qrDataUrl: "bubble gum"
        });

        wrapper.vm.resetQrDataUrl();

        expect(wrapper.vm.qrDataUrl).to.be.null;
    });
});
