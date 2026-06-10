import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";

import LayerComponentIconCustom from "@modules/layerTree/components/LayerComponentIconCustom.vue";
import store from "../../../../../app-store/index.js";


describe("src/modules/layerTree/components/LayerComponentIconCustom.vue", () => {
    let wrapper,
        layerConf,
        vuexStore,
        dispatchStub;

    beforeEach(() => {
        layerConf = {
            id: "layer-1",
            customLayerIcon: {
                type: "customLayerIcon",
                icon: "bi-gear",
                description: "custom icon",
                execute: {
                    action: "Menu/setExpanded",
                    payload: true
                }
            }
        };

        dispatchStub = sinon.replace(store, "dispatch", sinon.stub());


        vuexStore = createStore({
            modules: {
                Menu: {
                    namespaced: true,
                    getters: {
                        expanded: () => true
                    }
                }
            }
        });
    });

    it("renders IconButton if customLayerIcon type is set", () => {
        wrapper = shallowMount(LayerComponentIconCustom, {
            global: {
                plugins: [vuexStore]
            },
            propsData: {
                layerConf
            }
        });

        expect(wrapper.findComponent({name: "IconButton"}).exists()).to.be.true;
    });

    it("does not render IconButton if customLayerIcon type is not set", () => {
        layerConf.customLayerIcon.type = "otherType";

        wrapper = shallowMount(LayerComponentIconCustom, {
            global: {
                plugins: [vuexStore]
            },
            propsData: {
                layerConf
            }
        });

        expect(wrapper.findComponent({name: "IconButton"}).exists()).to.be.false;
    });

    it("returns custom icon config from layerConf", () => {
        wrapper = shallowMount(LayerComponentIconCustom, {
            global: {
                plugins: [vuexStore]
            },
            propsData: {
                layerConf
            }
        });

        expect(wrapper.vm.customIconConfig).to.deep.equal(layerConf.customLayerIcon);
    });

    it("returns empty object if no customLayerIcon is defined", () => {
        delete layerConf.customLayerIcon;

        wrapper = shallowMount(LayerComponentIconCustom, {
            global: {
                plugins: [vuexStore]
            },
            propsData: {
                layerConf
            }
        });

        expect(wrapper.vm.customIconConfig).to.deep.equal({});
    });

    it("dispatches configured action when executeCustomAction is called", () => {
        wrapper = shallowMount(LayerComponentIconCustom, {
            global: {
                plugins: [vuexStore]
            },
            propsData: {
                layerConf
            }
        });

        wrapper.vm.executeCustomAction();

        expect(dispatchStub.calledOnce).to.be.true;
        expect(dispatchStub.calledWith(
            "Menu/setExpanded",
            true
        )).to.be.true;
    });

    it("does not dispatch anything if execute config is missing", () => {
        delete layerConf.customLayerIcon.execute;

        wrapper = shallowMount(LayerComponentIconCustom, {
            global: {
                plugins: [vuexStore]
            },
            propsData: {
                layerConf
            }
        });

        wrapper.vm.executeCustomAction();

        expect(dispatchStub.called).to.be.false;
    });
});
