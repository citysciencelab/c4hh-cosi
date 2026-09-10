import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import {shallowMount} from "@vue/test-utils";
import ObliqueViewerComponent from "../../../components/VcOblique.vue";
import VcOblique from "../../../store/indexVcOblique.js";


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

    describe("VcOblique.vue rendering", () => {
        it("should render the vcOblique Viewer", () => {
            const iframe = wrapper.find("#obliqueViewer #obliqueIframe");

            expect(iframe.exists()).to.be.true;
            expect(iframe.attributes("title")).to.equal("ObliqueIframe");
            expect(wrapper.find("#obliqueViewer").exists()).to.be.true;
        });

        it("should not render the #obliqueViewer container when active is false", async () => {
            store.commit("Modules/VcOblique/setActive", false);
            await wrapper.vm.$nextTick();
            expect(wrapper.find("#obliqueViewer").exists()).to.be.false;
        });

        it("should bind obliqueViewerURL to the iframe src attribute", async () => {
            store.commit("Modules/VcOblique/setObliqueViewerURL", "https://example.com/oblique?groundPosition=10,53");
            await wrapper.vm.$nextTick();

            const iframe = wrapper.find("#obliqueIframe");

            expect(iframe.attributes("src")).to.equal("https://example.com/oblique?groundPosition=10,53");
        });
    });

    describe("VcOblique.vue footer", () => {
        it("should not render #oblique-footer when currentImageName is empty", async () => {
            store.commit("Modules/VcOblique/setCurrentImageName", "");
            await wrapper.vm.$nextTick();
            expect(wrapper.find("#oblique-footer").exists()).to.be.false;
        });

        it("should not render #oblique-footer when currentImageName is null", async () => {
            store.commit("Modules/VcOblique/setCurrentImageName", null);
            await wrapper.vm.$nextTick();
            expect(wrapper.find("#oblique-footer").exists()).to.be.false;
        });

        it("should render #oblique-footer when currentImageName is set", async () => {
            store.commit("Modules/VcOblique/setCurrentImageName", "IMG001-Ost");
            await wrapper.vm.$nextTick();
            expect(wrapper.find("#oblique-footer").exists()).to.be.true;
        });

        it("should display the currentImageName in #oblique-footer", async () => {
            store.commit("Modules/VcOblique/setCurrentImageName", "IMG001-Ost");
            await wrapper.vm.$nextTick();
            expect(wrapper.find("#oblique-footer").text()).to.equal("IMG001-Ost");
        });
    });

    describe("VcOblique.vue lifecycle", () => {
        it("should call initObliqueView and createObliqueViewerURL on mount", () => {
            expect(VcOblique.actions.initObliqueView.called).to.be.true;
            expect(VcOblique.actions.createObliqueViewerURL.called).to.be.true;
        });
    });
});
