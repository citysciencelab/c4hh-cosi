import Vuex from "vuex";
import {shallowMount, createLocalVue, config} from "@vue/test-utils";
import {expect} from "chai";
import TacticalMarkComponent from "../../../components/TacticalMark.vue";
import TacticalMark from "../../../store/indexTacticalMark";

import sinon from "sinon";

const localVue = createLocalVue();

localVue.use(Vuex);

config.mocks.$t = key => key;

describe("addons/tacticalMark/components/TacticalMark.vue", () => {

    const mockMapGetters = {
            map: () => sinon.stub()
        },
        mockMapActions = {
            removeInteraction: sinon.stub(),
            addInteraction: sinon.stub()
        },
        mockMapMutations = {
        },
        mockConfigJson = {
            Portalconfig: {
                menu: {
                    tools: {
                        children: {
                            TacticalMark:
                                {
                                    "name": "Taktischen Zeichen",
                                    "icon": "bi-geo-fill"
                                }
                        }
                    }
                }
            }
        },
        arr = [],
        getFeatures = sinon.fake.returns(arr);

    let store,
        wrapper;

    beforeEach(() => {
        store = new Vuex.Store({
            namespaced: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules:
                        {
                            TacticalMark
                        }
                },
                Map: {
                    namespaced: true,
                    getters: mockMapGetters,
                    mutations: mockMapMutations,
                    actions: mockMapActions
                }
            },
            getters: {
                imagePath: () => "https://test-url/"
            },
            state: {
                configJson: mockConfigJson
            }
        });
        wrapper = shallowMount(TacticalMarkComponent, {
            store,
            localVue,
            mapElement: {
                style: {
                    cursor: "",
                    onmousedown: "",
                    onmouseup: ""
                }
            },
            layer: {
                getSource: () => ({
                    getFeatures: () => ({getFeatures})
                })
            },
            setCanvasCursor: sinon.stub(),
            resetCanvasCursor: sinon.stub(),
            computed: {
                isLayerVisible: () => true,
                hasTacticalFeatures: () => true,
                hasVisibleFeatures: () => true
            }
        });
        store.commit("Tools/TacticalMark/setActive", true);
    });

    sinon.stub(TacticalMarkComponent, "mounted");

    it("wrapper should exist", () => {
        expect(wrapper.exists()).to.be.true;
    });

    it("renders TacticalMark", () => {
        expect(wrapper.find("#tacticalMark").exists()).to.be.true;
    });

    it("Element should exists", () => {
        wrapper = shallowMount(TacticalMarkComponent, {
            store,
            localVue,
            computed: {
                isLayerVisible: () => true,
                hasTacticalFeatures: () => true,
                hasVisibleFeatures: () => true
            },
            setCanvasCursor: sinon.stub(),
            resetCanvasCursor: sinon.stub()
        });
        store.commit("Tools/TacticalMark/setActive", true);

        expect(wrapper.find("#dmg").exists()).to.be.true;
        expect(wrapper.find("#rsc").exists()).to.be.true;
        expect(wrapper.find("#dma").exists()).to.be.true;
    });

    it("Element should exists", () => {
        wrapper = shallowMount(TacticalMarkComponent, {
            store,
            localVue,
            computed: {
                isLayerVisible: () => true,
                hasTacticalFeatures: () => true,
                hasVisibleFeatures: () => true
            },
            setCanvasCursor: sinon.stub(),
            resetCanvasCursor: sinon.stub()
        });
        store.commit("Tools/TacticalMark/setActive", true);

        expect(wrapper.findComponent({ref: "gefahr_akut"}).exists()).to.be.true;
    });

    it("check if buttons, images and texts exists in dmg container", () => {
        wrapper = shallowMount(TacticalMarkComponent, {
            store,
            localVue,
            computed: {
                isLayerVisible: () => true,
                hasTacticalFeatures: () => true,
                hasVisibleFeatures: () => true
            },
            setCanvasCursor: sinon.stub(),
            resetCanvasCursor: sinon.stub()
        });
        store.commit("Tools/TacticalMark/setActive", true);

        const elements = wrapper.findAll("#dmg .tm-container");

        expect(elements.exists()).to.be.true;

        elements.wrappers.forEach(tr => {
            const tds = tr.findAll(".tm-item");

            expect(tds.exists()).to.be.true;

            tds.wrappers.forEach(tts => {
                const txt = tts.findAll(".tm-btn-txt"),
                    img = tts.findAll("img");

                expect(txt.exists()).to.be.true;
                expect(img.exists()).to.be.true;
            });
        });
    });

    it("check if buttons, images and texta exists in rsc container", () => {
        wrapper = shallowMount(TacticalMarkComponent, {
            store,
            localVue,
            computed: {
                isLayerVisible: () => true,
                hasTacticalFeatures: () => true,
                hasVisibleFeatures: () => true
            }
        });
        store.commit("Tools/TacticalMark/setActive", true);

        const elements = wrapper.findAll("#rsc .tm-container");

        expect(elements.exists()).to.be.true;

        elements.wrappers.forEach(tr => {
            const tds = tr.findAll(".tm-item");

            expect(tds.exists()).to.be.true;

            tds.wrappers.forEach(tts => {
                const txt = tts.findAll(".tm-btn-txt"),
                    img = tts.findAll("img");

                expect(txt.exists()).to.be.true;
                expect(img.exists()).to.be.true;
            });
        });
    });

    it("check if buttons, images and texta exists in dma container", () => {
        wrapper = shallowMount(TacticalMarkComponent, {
            store,
            localVue,
            computed: {
                isLayerVisible: () => true,
                hasTacticalFeatures: () => true,
                hasVisibleFeatures: () => true
            }
        });
        store.commit("Tools/TacticalMark/setActive", true);

        const elements = wrapper.findAll("#dma .tm-container");

        expect(elements.exists()).to.be.true;

        elements.wrappers.forEach(tr => {
            const tds = tr.findAll(".tm-item");

            expect(tds.exists()).to.be.true;

            tds.wrappers.forEach(tts => {
                const txt = tts.findAll(".tm-btn-txt"),
                    img = tts.findAll("img");

                expect(txt.exists()).to.be.true;
                expect(img.exists()).to.be.true;
            });
        });
    });

    it("check getIconPath function", () => {
        const iPath = wrapper.vm.getIconPath("Vorlage_Dammbalken.jpg");

        expect(iPath).to.equal("https://test-url/Vorlage_Dammbalken.jpg");
    });

    it("check prepareFileName function with suffix", () => {
        const res = wrapper.vm.prepareFileName("filename.kml");

        expect(res).to.equal("filename.kml");
    });

    it("check prepareFileName function without suffix", () => {
        const res = wrapper.vm.prepareFileName("filename");

        expect(res).to.equal("filename.kml");
    });

    it("check download function if showDownload is false", () => {
        wrapper.vm.showDownload = false;
        wrapper.vm.download();

        expect(wrapper.vm.showDownload).to.equal(true);
    });

    it("check download function if showDownload is true", () => {
        wrapper.vm.showDownload = true;
        wrapper.vm.download();

        expect(wrapper.vm.showDownload).to.equal(false);
    });

    it("check enableDownloadBtn function with filename ", () => {
        wrapper = shallowMount(TacticalMarkComponent, {
            store,
            localVue,
            computed: {
                isLayerVisible: () => true,
                hasTacticalFeatures: () => true,
                hasVisibleFeatures: () => true
            }
        });
        store.commit("Tools/TacticalMark/setActive", true);
        wrapper.vm.layer = {
            getSource: () => ({
                getFeatures: () => ({getFeatures})
            })
        };

        wrapper.vm.filename = "test";
        wrapper.vm.enableDownloadBtn();

        expect(wrapper.vm.disableFileDownload).to.equal(true);
    });
});
