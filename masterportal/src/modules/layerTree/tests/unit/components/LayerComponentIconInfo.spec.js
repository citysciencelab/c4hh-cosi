import {createStore} from "vuex";
import {createPinia, setActivePinia} from "pinia";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";

import LayerComponentIconInfo from "@modules/layerTree/components/LayerComponentIconInfo.vue";
import {useLayerInformationStore} from "@modules/layerInformation/store/layerInformationStore.js";

describe("src/modules/layerTree/components/LayerComponentIconInfo.vue", () => {
    let icon,
        layer,
        propsData,
        startLayerInformationSpy,
        store,
        pinia,
        layerInformationStore,
        wrapper,
        isLayerTree,
        setLayerInfoVisibleSpy;

    beforeEach(() => {
        isLayerTree = true;
        layer = {
            id: "1",
            name: "layer",
            typ: "WMS",
            datasets: [
                {
                    md_id: "123456789"
                }
            ]
        };

        propsData = {
            layerConf: layer,
            isLayerTree: isLayerTree
        };

        icon = "bi-test";
        startLayerInformationSpy = sinon.spy();
        setLayerInfoVisibleSpy = sinon.spy;

        pinia = createPinia();
        setActivePinia(pinia);

        layerInformationStore = useLayerInformationStore();
        layerInformationStore.icon = icon;
        layerInformationStore.startLayerInformation = startLayerInformationSpy;

        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        LayerSelection: {
                            namespaced: true,
                            mutations: {
                                setLayerInfoVisible: setLayerInfoVisibleSpy
                            }
                        }
                    }
                }
            }
        });
    });

    it("renders the info icon given as property to the component", () => {
        wrapper = shallowMount(LayerComponentIconInfo, {
            components: {
                IconButton: {
                    name: "IconButton",
                    template: "<button>Hier</button>"
                }
            },
            global: {
                plugins: [store, pinia]
            },
            propsData: propsData
        });

        expect(wrapper.find("#layer-component-icon-info-" + propsData.layerConf.id).exists()).to.be.true;
    });

    it("renders layer with visibility false and checkbox", () => {
        wrapper = shallowMount(LayerComponentIconInfo, {
            components: {
                IconButton: {
                    name: "IconButton",
                    template: "<button>Hier</button>"
                }
            },
            global: {
                plugins: [store, pinia]
            },
            propsData: propsData
        });

        expect(wrapper.find("#layer-component-icon-info-" + propsData.layerConf.id).exists()).to.be.true;
    });

    it("click on button of info icon", async () => {
        wrapper = shallowMount(LayerComponentIconInfo, {
            components: {
                IconButton: {
                    name: "IconButton",
                    template: "<button>Hier</button>"
                }
            },
            global: {
                plugins: [store, pinia]
            },
            propsData: propsData
        });

        expect(wrapper.find("#layer-component-icon-info-" + propsData.layerConf.id).exists()).to.be.true;
        expect(wrapper.find("#layer-component-icon-info-button-" + propsData.layerConf.id).exists()).to.be.true;
    });

    it("click on disabled button of info icon, that layer has no datasets", async () => {
        const layerWithoutDatasets = {
            id: "2",
            name: "layer",
            typ: "WMS"
        };

        propsData = {
            layerConf: layerWithoutDatasets,
            isLayerTree: isLayerTree
        };

        wrapper = shallowMount(LayerComponentIconInfo, {
            components: {
                IconButton: {
                    name: "IconButton",
                    template: "<button>Hier</button>"
                }
            },
            global: {
                plugins: [store, pinia]
            },
            propsData: propsData
        });

        expect(wrapper.find("#layer-component-icon-info-" + propsData.layerConf.id).exists()).to.be.true;
        expect(wrapper.find("#layer-component-icon-info-button-" + propsData.layerConf.id).exists()).to.be.true;
    });
});
