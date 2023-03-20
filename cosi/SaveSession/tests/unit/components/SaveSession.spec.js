import {config, mount, createLocalVue} from "@vue/test-utils";
import {expect} from "chai";
import Vuex from "vuex";
import SaveSession from "../../../components/SaveSession.vue";
import SaveSessionStore from "../../../store/indexSaveSession";
import ScenarioBuilderStore from "../../../../ScenarioBuilder/store/indexScenarioBuilder";
import DrawStore from "../../../../../../src/modules/tools/draw/store/indexDraw";
import Vuetify from "vuetify";
import sinon from "sinon";
import Vue from "vue";
import Tool from "../../../../../../src/modules/tools/ToolTemplate.vue";
require("fake-indexeddb/auto");

config.mocks.$t = key => key;

const localVue = createLocalVue();

Vue.use(Vuetify);
localVue.use(Vuex);

global.requestAnimationFrame = (fn) => fn();

describe("addons/cosi/SaveSession/components/SaveSession.vue", () => {
    let vuetify, store,
        wrapper = null;

    const factory = {
            getMount: () => {
                return mount(SaveSession, {
                    store,
                    localVue,
                    vuetify
                });
            }
        },
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
        })(),
        layerMock = {
            getSource: () => ({
                getFeatures: sinon.stub().returns([{
                    type: "Feature",
                    properties: {
                        "isOuterCircle": false,
                        "isVisible": true,
                        "drawState": {
                            "opacity": 1,
                            "fontSize": null,
                            "drawType": {
                                "id": "drawSymbol",
                                "geometry": "Point"
                            },
                            "symbol": {
                                "id": "iconPoint",
                                "type": "simple_point",
                                "value": "simple_point"
                            },
                            "zIndex": 0,
                            "imgPath": "https://geodienste.hamburg.de/lgv-config/img/",
                            "pointSize": 16,
                            "color": [
                                55,
                                126,
                                184,
                                1
                            ]
                        },
                        "fromDrawTool": true
                    },
                    geometry: {
                        "type": "Point",
                        "coordinates": [
                            571253.6428829662,
                            5939501.987404781
                        ]
                    }
                }])
            })
        };

    Object.defineProperty(window, "localStorage", {
        value: mock
    });

    beforeEach(() => {
        vuetify = new Vuetify();
        store = new Vuex.Store({
            namespaced: true,
            modules: {
                Maps: {
                    namespaced: true
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
                        ScenarioBuilder: ScenarioBuilderStore,
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
                        Draw: DrawStore,
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
        sinon.restore();
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            wrapper = factory.getMount();
            expect(wrapper.exists()).to.be.true;
        });

        it("should find Tool component", () => {
            wrapper = factory.getMount();
            const toolWrapper = wrapper.findComponent(Tool);

            expect(toolWrapper.exists()).to.be.true;
        });

        it("should not render if active is false", async () => {
            wrapper = factory.getMount();
            await wrapper.vm.$nextTick();
            expect(wrapper.find("#save-session").exists()).to.be.false;
        });

        describe("buttons should call their respective methods", async () => {
            it("save-session button calls quickSave", async () => {
                const stubQuickSave = sinon.stub(SaveSession.methods, "quickSave");

                wrapper = factory.getMount();
                store.commit("Tools/SaveSession/setActive", true);
                await wrapper.vm.$nextTick();
                await wrapper.find("#save-session").trigger("click");
                expect(stubQuickSave.calledOnce).to.be.true;
            });

            it("load-session button calls loadLastSession", async () => {
                const stubLoadLastSession = sinon.stub(SaveSession.methods, "loadLastSession");

                wrapper = factory.getMount();
                store.commit("Tools/SaveSession/setActive", true);
                await wrapper.vm.$nextTick();
                await wrapper.setData({latestDate: "2022-03-22"});
                wrapper.find("#load-session").trigger("click");
                expect(stubLoadLastSession.calledOnce).to.be.true;
            });

            it("save-to-file opens snackbar", async () => {
                wrapper = factory.getMount();
                store.commit("Tools/SaveSession/setActive", true);
                await wrapper.vm.$nextTick();
                const snackbar = wrapper.find("#save-dialog").find(".v-snack__wrapper");

                expect(snackbar.attributes().style).to.eql("display: none;");
                wrapper.find("#save-to-file").trigger("click");
                await wrapper.vm.$nextTick();
                expect(snackbar.attributes().style).to.eql("");
            });

            it("close-save-dialog button closes the snackbar", async () => {
                wrapper = factory.getMount();
                store.commit("Tools/SaveSession/setActive", true);
                await wrapper.vm.$nextTick();
                wrapper.find("#save-to-file").trigger("click");
                await wrapper.vm.$nextTick();
                const snackbar = wrapper.find("#save-dialog").find(".v-snack__wrapper");

                expect(snackbar.attributes().style).to.eql("");
                wrapper.find("#close-save-dialog").trigger("click");
                await wrapper.vm.$nextTick();
                expect(snackbar.attributes().style).to.eql("display: none;");
            });

            it("save-to-file button calls downloadJsonToFile", async () => {
                const stubDownloadJsonToFile = sinon.stub(SaveSession.methods, "downloadJsonToFile");

                wrapper = factory.getMount();
                store.commit("Tools/SaveSession/setActive", true);
                await wrapper.vm.$nextTick();
                wrapper.find("#save-to-file").trigger("click");
                await wrapper.vm.$nextTick();
                wrapper.find("#save-to-file-action").trigger("click");
                expect(stubDownloadJsonToFile.calledOnce).to.be.true;
            });

            it.skip("save-session button saves state to localStorage", async () => {
                wrapper = factory.getMount();
                store.commit("Tools/SaveSession/setActive", true);
                await wrapper.vm.$nextTick();

                // eslint-disable-next-line require-atomic-updates
                store.state.Tools.Draw.layer = layerMock;

                wrapper.find("#save-session").trigger("click");
                const state = JSON.parse(window.localStorage.getItem("cosi-state")).state;

                expect(state.Tools.Draw.layer).to.deep.equal(layerMock.getSource().getFeatures());
            });

            it("load-from-file button calls loadFromFile", async () => {
                const stubLoadFromFile = sinon.stub(SaveSession.methods, "loadFromFile");

                wrapper = factory.getMount();
                store.commit("Tools/SaveSession/setActive", true);
                await wrapper.vm.$nextTick();
                wrapper.find("#load-from-file").trigger("click");
                expect(stubLoadFromFile.calledOnce).to.be.true;
            });

            it("auto-save checkbox toggles", async () => {
                wrapper = factory.getMount();
                store.commit("Tools/SaveSession/setActive", true);
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.autoSave).to.be.null;
                wrapper.find("#auto-save").trigger("click");
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.autoSave).to.be.true;
                wrapper.find("#auto-save").trigger("click");
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.autoSave).to.be.false;
            });
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
