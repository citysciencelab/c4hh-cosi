import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import {config, shallowMount} from "@vue/test-utils";
import ObliqueViewerComponent from "../../../components/VcOblique.vue";
import VcOblique from "../../../store/indexVcOblique.js";

config.global.mocks.$t = key => key;

describe("addons/vcOblique/components/VcOblique.vue", () => {
    const mockConfigJson = {
        Portalconfig: {
            menu: {
                tools: {
                    children: {
                        vcOblique: {
                            "name": "additional:modules.tools.obliqueViewer.title",
                            "icon": "bi-image",
                            "styleId": "obliqueViewer"
                        }
                    }
                }
            }
        }
    };
    let store, wrapper, obliqueViewOrig, initObliqueViewOrig, initResetObliqueViewer, createObliqueViewerURLOrig;

    beforeEach(() => {
        obliqueViewOrig = VcOblique.actions.obliqueView;
        VcOblique.actions.obliqueView = sinon.stub();
        initObliqueViewOrig = VcOblique.actions.initObliqueView;
        VcOblique.actions.initObliqueView = sinon.stub();
        initResetObliqueViewer = VcOblique.actions.resetObliqueViewer;
        VcOblique.actions.resetObliqueViewer = sinon.stub();
        createObliqueViewerURLOrig = VcOblique.actions.createObliqueViewerURL;
        VcOblique.actions.createObliqueViewerURL = sinon.stub();
        const iframe = document.createElement("iframe");

        iframe.id = "obliqueIframe";
        Object.defineProperty(iframe, "contentWindow", {
            value: {
                vcs: {
                    version: "4.0.0"
                }
            },
            writable: false
        });
        document.body.appendChild(iframe);

        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        VcOblique
                    }
                },
                Maps: {
                    namespaced: true,
                    getters: {
                        clickCoordinate: () => [100, 200],
                        initialCenter: () => [565874, 5934140],
                        center: () => [565874, 5934140]
                    }
                }
            },
            state: {
                configJson: mockConfigJson
            },
            getters: {
                mobile: () => false
            }
        });

        store.commit("Modules/VcOblique/setActive", true);
        wrapper = shallowMount(ObliqueViewerComponent, {
            global: {
                plugins: [store]
            },
            directives: {
                resize () { /* stub */ }
            }
        });
    });
    afterEach(function () {
        VcOblique.actions.obliqueView = obliqueViewOrig;
        VcOblique.actions.initObliqueView = initObliqueViewOrig;
        VcOblique.actions.resetObliqueViewer = initResetObliqueViewer;
        VcOblique.actions.createObliqueViewerURL = createObliqueViewerURLOrig;
        document.getElementById("obliqueIframe")?.remove();
    });
    describe("VcOblique.vue watcher", () => {
        it("test watch on clickCoordinate should call action obliqueView", async () => {
            expect(wrapper.find("#obliqueIframe").exists()).to.be.true;
            wrapper.vm.$options.watch.clickCoordinate.handler.call(wrapper.vm, [10, 20]);
            expect(VcOblique.actions.obliqueView.calledOnce).to.be.true;
        });
    });
});
