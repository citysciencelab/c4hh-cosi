import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";

import LayerComponentIconFilter from "@modules/layerTree/components/LayerComponentIconFilter.vue";

config.global.mocks.$t = key => key;

describe("src/modules/layerTree/components/LayerComponentIconFilter.vue", () => {
    let icon,
        layer,
        propsData,
        store,
        wrapper;


    beforeEach(() => {
        layer = {
            id: "1",
            name: "layer",
            typ: "WFS"
        };

        propsData = {
            layerConf: layer
        };

        icon = "bi-test";

        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        Filter: {
                            namespaced: true,
                            getters: {
                                icon: () => icon
                            }
                        }
                    }
                }
            }
        });
    });


    it("renders the filter icon given for layer with filterRefId", () => {
        layer.filterRefId = 1;
        wrapper = shallowMount(LayerComponentIconFilter, {
            global: {
                plugins: [store]
            },
            propsData: propsData
        });

        expect(wrapper.find("icon-button-stub").exists()).to.be.true;
    });


    it("renders the filter icon given for layer with filterRefId 0", () => {
        layer.filterRefId = 1;
        wrapper = shallowMount(LayerComponentIconFilter, {
            global: {
                plugins: [store]
            },
            propsData: propsData
        });

        expect(wrapper.find("icon-button-stub").exists()).to.be.true;
    });


    it("dont renders the filter icon given for layer without filterRefId", () => {
        wrapper = shallowMount(LayerComponentIconFilter, {
            global: {
                plugins: [store]
            },
            propsData: propsData
        });

        expect(wrapper.find("icon-button-stub").exists()).to.be.false;
    });
});
