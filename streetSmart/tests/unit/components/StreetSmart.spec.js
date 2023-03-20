import Vuex from "vuex";
import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import StreetSmartComponent from "../../../components/StreetSmart.vue";
import StreetSmart from "../../../store/indexStreetSmart";
import {expect} from "chai";
import sinon from "sinon";

const localVue = createLocalVue();

localVue.use(Vuex);
config.mocks.$t = key => key;

describe("ADDONS: addons/streetSmart/components/StreetSmart.vue", () => {
    const mockConfigJson = {
        Portalconfig: {
            menu: {
                tools: {
                    children: {
                        streetSmart: {
                            name: "translate#additional:menu.tools.streetsmart",
                            glyphicon: "glyphicon-picture",
                            streetsmartAPIVersion: "v22.2",
                            reactVersion: "16.13.0"
                        }
                    }
                }
            }
        }
    };
    let store, wrapper, destroyApiOrig, initApiOrig, setPositionOrig;

    beforeEach(() => {
        destroyApiOrig = StreetSmart.actions.destroyApi;
        StreetSmart.actions.destroyApi = sinon.stub();
        initApiOrig = StreetSmart.actions.initApi;
        StreetSmart.actions.initApi = sinon.stub();
        setPositionOrig = StreetSmart.actions.setPosition;
        StreetSmart.actions.setPosition = sinon.stub();

        store = new Vuex.Store({
            namespaces: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        StreetSmart
                    }
                },
                Maps: {
                    namespaced: true,
                    getters: {
                        clickCoordinate: () => [100, 200]
                    }
                },
                MapMarker: {
                    namespaced: true,
                    getters: {
                        markerPoint: () => sinon.spy()
                    }
                }
            },
            state: {
                configJson: mockConfigJson
            }
        });
    });
    afterEach(function () {
        sinon.restore();
        // set back to original functions, else next test actionsStreetSmart.spec.js fails
        StreetSmart.actions.destroyApi = destroyApiOrig;
        StreetSmart.actions.initApi = initApiOrig;
        StreetSmart.actions.setPosition = setPositionOrig;
        if (wrapper) {
            wrapper.destroy();
        }
    });

    it("renders the StreetSmart", () => {
        store.state.Tools.StreetSmart.active = true;
        wrapper = shallowMount(StreetSmartComponent, {store, localVue});

        expect(wrapper.find("#streetsmart").exists()).to.be.true;
    });

    it("do not render the StreetSmart if not active", () => {
        store.state.Tools.StreetSmart.active = false;
        wrapper = shallowMount(StreetSmartComponent, {store, localVue});

        expect(wrapper.find("#streetsmart").exists()).to.be.false;
    });

    it("if active is set to false destroyApi should be called", async () => {
        store.state.Tools.StreetSmart.active = true;
        wrapper = shallowMount(StreetSmartComponent, {store, localVue});

        store.commit("Tools/StreetSmart/setActive", false);
        await wrapper.vm.$nextTick();
        expect(wrapper.find("#streetsmart").exists()).to.be.false;
        expect(StreetSmart.actions.destroyApi.calledOnce).to.be.true;
    });
    it("if active is set to true initApi should be called", async () => {
        store.state.Tools.StreetSmart.active = false;
        wrapper = shallowMount(StreetSmartComponent, {store, localVue});

        wrapper.vm.apiIsLoaded = true;
        store.commit("Tools/StreetSmart/setActive", true);
        await wrapper.vm.$nextTick();
        expect(wrapper.find("#streetsmart").exists()).to.be.true;
        expect(StreetSmart.actions.initApi.calledOnce).to.be.true;
    });
    it("if active is set to true, but api loading has not finished: initApi should not be called", async () => {
        store.state.Tools.StreetSmart.active = false;
        wrapper = shallowMount(StreetSmartComponent, {store, localVue});

        wrapper.vm.apiIsLoaded = false;
        store.commit("Tools/StreetSmart/setActive", true);
        await wrapper.vm.$nextTick();
        expect(wrapper.find("#streetsmart").exists()).to.be.true;
        expect(StreetSmart.actions.initApi.notCalled).to.be.true;
    });

    it("test watch on clickCoordinate should call action setPosition", async () => {
        store.state.Tools.StreetSmart.active = true;
        wrapper = shallowMount(StreetSmartComponent, {store, localVue});

        expect(wrapper.find("#streetsmart").exists()).to.be.true;
        wrapper.vm.$options.watch.clickCoordinate.call(wrapper.vm, [10, 20]);
        expect(StreetSmart.actions.setPosition.calledOnce).to.be.true;
    });
});
