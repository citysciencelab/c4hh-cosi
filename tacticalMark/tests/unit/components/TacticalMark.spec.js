import axios from "axios";
import {config, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import TacticalMarkComponent from "../../../components/TacticalMark.vue";
import TacticalMark from "../../../store/indexTacticalMark";

config.global.mocks.$t = key => key;

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

    beforeAll(() => {
        mapCollection.clear();
        const map = {
            id: "ol",
            mode: "2D",
            getLayers: () => {
                return {
                    getArray: () => {
                        return [];
                    }
                };
            },
            addLayer: sinon.stub()
        };

        mapCollection.addMap(map, "2D");
    });

    beforeEach(() => {
        sinon.stub(axios, "get").resolves({
            data: {icon: "test"}
        });
        store = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules:
                        {
                            TacticalMark
                        }
                },
                Maps: {
                    namespaced: true,
                    getters: mockMapGetters,
                    mutations: mockMapMutations,
                    actions: mockMapActions
                }
            },
            state: {
                configJson: mockConfigJson
            }
        });
        wrapper = shallowMount(TacticalMarkComponent, {
            global: {plugins: [store]},
            data () {
                return {
                    mapElement: {
                        style: {
                            cursor: "",
                            onmousedown: "",
                            onmouseup: ""
                        }
                    },
                    layer: {
                        layerSource: {
                            getFeatures: () => ({getFeatures})
                        }
                    }
                };
            },
            setCanvasCursor: sinon.stub(),
            resetCanvasCursor: sinon.stub(),
            computed: {
                isLayerVisible: () => true,
                hasTacticalFeatures: () => true,
                hasVisibleFeatures: () => true
            }
        });
    });

    beforeEach(() => {
        sinon.restore();
    });

    sinon.stub(TacticalMarkComponent, "created");

    describe("Component DOM", () => {
        it("wrapper should exist", () => {
            expect(wrapper.exists()).to.be.true;
        });

        it("renders TacticalMark", () => {
            expect(wrapper.find("#tacticalMark").exists()).to.be.true;
        });

        it("Element should exists", () => {
            sinon.stub(axios, "get").resolves({
                data: {icon: "test"}
            });
            wrapper = shallowMount(TacticalMarkComponent, {
                global: {plugins: [store]},
                data () {
                    return {
                        mapElement: {
                            style: {
                                cursor: "",
                                onmousedown: "",
                                onmouseup: ""
                            }
                        }
                    };
                },
                computed: {
                    isLayerVisible: () => true,
                    hasTacticalFeatures: () => true,
                    hasVisibleFeatures: () => true
                },
                setCanvasCursor: sinon.stub(),
                resetCanvasCursor: sinon.stub()
            });

            expect(wrapper.find("#dmg").exists()).to.be.true;
            expect(wrapper.find("#rsc").exists()).to.be.true;
            expect(wrapper.find("#dma").exists()).to.be.true;
        });

        it("check if buttons, images and texts exists in dmg container", () => {
            sinon.stub(axios, "get").resolves({
                data: {icon: "test"}
            });
            wrapper = shallowMount(TacticalMarkComponent, {
                global: {plugins: [store]},
                data () {
                    return {
                        mapElement: {
                            style: {
                                cursor: "",
                                onmousedown: "",
                                onmouseup: ""
                            }
                        }
                    };
                },
                computed: {
                    isLayerVisible: () => true,
                    hasTacticalFeatures: () => true,
                    hasVisibleFeatures: () => true
                },
                setCanvasCursor: sinon.stub(),
                resetCanvasCursor: sinon.stub()
            });

            const elements = wrapper.findAll("#dmg .tm-container");

            elements.forEach(tr => {
                const tds = tr.findAll(".tm-item");

                tds.forEach(tts => {
                    const txt = tts.find(".tm-btn-txt"),
                        img = tts.find("img");

                    expect(txt.exists()).to.be.true;
                    expect(img.exists()).to.be.true;
                });
            });
        });

        it("check if buttons, images and texta exists in rsc container", () => {
            sinon.stub(axios, "get").resolves({
                data: {icon: "test"}
            });
            wrapper = shallowMount(TacticalMarkComponent, {
                global: {plugins: [store]},
                data () {
                    return {
                        mapElement: {
                            style: {
                                cursor: "",
                                onmousedown: "",
                                onmouseup: ""
                            }
                        }
                    };
                },
                computed: {
                    isLayerVisible: () => true,
                    hasTacticalFeatures: () => true,
                    hasVisibleFeatures: () => true
                }
            });

            const elements = wrapper.findAll("#rsc .tm-container");

            elements.forEach(tr => {
                const tds = tr.findAll(".tm-item");

                tds.forEach(tts => {
                    const txt = tts.find(".tm-btn-txt"),
                        img = tts.find("img");

                    expect(txt.exists()).to.be.true;
                    expect(img.exists()).to.be.true;
                });
            });
        });

        it("check if buttons, images and texta exists in dma container", () => {
            sinon.stub(axios, "get").resolves({
                data: {icon: "test"}
            });
            wrapper = shallowMount(TacticalMarkComponent, {
                global: {plugins: [store]},
                data () {
                    return {
                        mapElement: {
                            style: {
                                cursor: "",
                                onmousedown: "",
                                onmouseup: ""
                            }
                        }
                    };
                },
                computed: {
                    isLayerVisible: () => true,
                    hasTacticalFeatures: () => true,
                    hasVisibleFeatures: () => true
                }
            });

            const elements = wrapper.findAll("#dma .tm-container");

            elements.forEach(tr => {
                const tds = tr.findAll(".tm-item");

                tds.forEach(tts => {
                    const txt = tts.find(".tm-btn-txt"),
                        img = tts.find("img");

                    expect(txt.exists()).to.be.true;
                    expect(img.exists()).to.be.true;
                });
            });
        });

        it("should render FlatButton component", () => {
            expect(wrapper.findAllComponents({name: "FlatButton"}).length).to.be.equal(4);
        });
    });

    describe("Methods", () => {
        it("check getIconPath function", () => {
            const iPath = wrapper.vm.getIconPath("Vorlage_Dammbalken.jpg");

            expect(iPath).to.equal("https://geodienste.hamburg.de/lgv-config/img/Vorlage_Dammbalken.jpg");
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
            sinon.stub(axios, "get").resolves({
                data: {icon: "test"}
            });
            wrapper = shallowMount(TacticalMarkComponent, {
                global: {plugins: [store]},
                data () {
                    return {
                        mapElement: {
                            style: {
                                cursor: "",
                                onmousedown: "",
                                onmouseup: ""
                            }
                        }
                    };
                },
                computed: {
                    isLayerVisible: () => true,
                    hasTacticalFeatures: () => true,
                    hasVisibleFeatures: () => true
                }
            });

            wrapper.vm.layer = {
                layerSource: {
                    getFeatures: () => ({getFeatures})
                }
            };

            wrapper.vm.filename = "test";
            wrapper.vm.enableDownloadBtn();

            expect(wrapper.vm.disableFileDownload).to.equal(true);
        });
    });
});
