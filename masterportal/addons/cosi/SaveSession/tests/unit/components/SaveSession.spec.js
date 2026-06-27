// import {config, mount, createLocalVue} from "@vue/test-utils";
import {mount} from "@vue/test-utils";
import {expect} from "chai";
import Vuex from "vuex";
// import SaveSession from "../../../components/SaveSession.vue";
import SaveSessionStore from "../../../store/indexSaveSession";
import Vuetify from "vuetify";
import sinon from "sinon";
// import Vue from "vue";
require("fake-indexeddb/auto");

// config.mocks.$t = key => key;

// const localVue = createLocalVue();

// Vue.use(Vuetify);
// localVue.use(Vuex);

global.requestAnimationFrame = (fn) => fn();

describe.skip("addons/cosi/SaveSession/components/SaveSession.vue", () => {
    let vuetify, store, layerListStub,
        wrapper = null;

    const SaveSession = undefined,
        factory = {
            getMount: () => {
                return mount(SaveSession, {
                    store,
                    // localVue,
                    vuetify
                });
            }
        };
        /*
        mock = (function () {
            let storage = {};

            return {
                getItem: function (key) {
                    return storage[key] || null;
                },
                setItem: function (key, value) {
                    storage[key] = value.toString();
                },
                removeItem: function (key) {
                    delete storage[key];
                },
                clear: function () {
                    storage = {};
                }
            };
        })();

    Object.defineProperty(window, "localStorage", {
        value: mock
    }); */

    beforeEach(() => {
        vuetify = new Vuetify();
        layerListStub = sinon.stub();
        store = new Vuex.Store({
            namespaced: true,
            modules: {
                Maps: {
                    namespaced: true,
                    getters: {
                        getVisibleLayerList: layerListStub.returns([{
                            getProperties: () => ({id: "1111"})
                        }])
                    }
                },
                Tools: {
                    namespaced: true,
                    modules: {
                        SaveSession: SaveSessionStore,
                        ChartGenerator: {
                            namespaced: true
                        },
                        CalculateRatio: {
                            namespaced: true
                        },
                        DistrictSelector: {
                            namespaced: true
                        },
                        AccessibilityAnalysis: {
                            namespaced: true
                        },
                        Dashboard: {
                            namespaced: true
                        },
                        AreaSelector: {
                            namespaced: true
                        },
                        QueryDistricts: {
                            namespaced: true
                        }
                    }
                },
                Language: {
                    namespaced: true,
                    getters: {
                        currentLocale: () => "de-DE"
                    }
                }
            },
            getters: {
                uiStyle: () => true,
                mobile: () => sinon.stub()
            }
        });
    });

    afterEach(() => {
        wrapper.destroy();
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            wrapper = factory.getMount();
            expect(wrapper.exists()).to.be.true;
        });

        it("should not render if active is false", async () => {
            wrapper = factory.getMount();
            await wrapper.vm.$nextTick();
            expect(wrapper.find("#save-session").exists()).to.be.false;
        });

        describe("Watchers", () => {
            it("should call 'enableAutoSave' after autoSave was changed to true", async () => {
                const spyEnableAutoSave = sinon.spy(SaveSession.methods, "enableAutoSave");

                wrapper = factory.getMount();
                await wrapper.setData({autoSave: true});
                expect(spyEnableAutoSave.calledOnce).to.be.true;
            });

            it("should call 'load' after sessionToLoad was changed", async () => {
                const stubLoad = sinon.stub(SaveSession.methods, "load");

                wrapper = factory.getMount();
                await wrapper.vm.setSessionToLoad("none");
                expect(stubLoad.calledOnce).to.be.true;
            });
        });
    });
});
