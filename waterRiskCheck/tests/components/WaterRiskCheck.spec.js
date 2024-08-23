import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import WaterRiskCheck from "../../components/WaterRiskCheck.vue";
import {createStore} from "vuex";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import layerCollection from "../../../../src/core/layers/js/layerCollection";
import sinon from "sinon";
import VectorLayer from "ol/layer/Vector.js";

config.global.mocks.$t = key => key;

describe("addons/waterRiskCheck/components/WaterRiskCheck.vue", () => {
    const factory = {
        createVuexStore: (initialState) => {
            return createStore({
                namespaced: true,
                modules: {
                    Modules: {
                        namespaced: true,
                        modules: {
                            namespaced: true,
                            WaterRiskCheck: {
                                namespaced: true,
                                state: {
                                    address: "",
                                    configuredQuestions: [],
                                    ...initialState
                                },
                                getters: {
                                    address: (state) => state.address,
                                    configuredQuestions: (state) => state.configuredQuestions
                                }
                            }
                        }
                    }
                }
            });
        }
    };

    beforeEach(() => {
        sinon.stub(layerCollection, "getLayerById").returns(
            {
                getLayer: () => {
                    return new VectorLayer();
                },
                getLayerSource: sinon.stub(),
                setStyle: sinon.stub()
            }
        );
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            expect(wrapper.exists()).to.be.true;
        });
        it("should find a start button", () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            expect(wrapper.find("#start-form").exists()).to.be.true;
        });
        it("should find a disabled back and forward button", async () => {
            const store = factory.createVuexStore({
                    configuredQuestions: [{title: "foo", question: "bar", info: {}}]
                }),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            wrapper.vm.formStarted = true;

            await wrapper.vm.$nextTick();
            expect(wrapper.find("#page-back").exists()).to.be.true;
            expect(wrapper.findAllComponents(FlatButton).length).to.be.equal(2);
        });
        it("should have increased progress if page is not 0", async () => {
            const store = factory.createVuexStore({
                    configuredQuestions: [
                        {title: "foo", question: "bar", info: {}},
                        {title: "foo", question: "bar", info: {}},
                        {title: "foo", question: "bar", info: {}},
                        {title: "foo", question: "bar", info: {}},
                        {title: "foo", question: "bar", info: {}},
                        {title: "foo", question: "bar", info: {}}
                    ]
                }),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            wrapper.vm.currentQuestionIdx = 1;
            wrapper.vm.formStarted = true;

            await wrapper.vm.$nextTick();
            expect(wrapper.findAll(".progress-bar").at(0).attributes()).to.have.property("aria-valuenow", "20.00");
        });
    });

    describe("Computed", () => {
        it("should return the correct parcel number", async () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            expect(wrapper.vm.parcelNumber).to.be.equal("");
            await wrapper.setData({
                parcel: [{
                    properties: {
                        flstnrzae: "666"
                    }
                }]
            });
            expect(wrapper.vm.parcelNumber).to.be.equal("666");
        });
        it("should return an empty string for the parcel number", async () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            await wrapper.setData({
                parcel: [{
                    properties: {}
                }]
            });
            expect(wrapper.vm.parcelNumber).to.be.equal("");
        });
        it("should return the correct district name", async () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            await wrapper.setData({
                parcel: [{
                    properties: {
                        gemarkung: "Hell's Kitchen"
                    }
                }]
            });
            expect(wrapper.vm.districtName).to.be.equal("Hell's Kitchen");
        });
        it("should return an empty string for the district name", async () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            await wrapper.setData({
                parcel: [{
                    gemarkung: {}
                }]
            });
            expect(wrapper.vm.districtName).to.be.equal("");
        });
        it("should return one for the count of buildings", async () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            await wrapper.setData({
                buildings: [{
                    properties: {
                        gebnutzbez: "Gebaeude"
                    }
                }]
            });
            expect(wrapper.vm.countOfBuildings).to.be.equal(1);
        });
        it("should return null for the count of buildings", async () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            await wrapper.setData({
                buildings: [{
                    properties: {
                        gebnutzbez: "Rote Flora"
                    }
                }]
            });
            expect(wrapper.vm.countOfBuildings).to.be.equal(0);
        });
    });

    describe("Hook", () => {
        it("should call createLayer on mount", () => {
            const stubCreateLayer = sinon.stub(WaterRiskCheck.methods, "createLayer"),
                store = factory.createVuexStore();

            shallowMount(WaterRiskCheck, {
                global: {
                    plugins: [store]
                }
            });

            expect(stubCreateLayer.calledOnce).to.be.true;
        });
    });

    describe("Watcher", () => {
        it("should call walkTroughToFetchAndAdd, if the address watcher triggers", () => {
            const stubWalkTroughToFetchAndAdd = sinon.stub(WaterRiskCheck.methods, "walkTroughToFetchAndAdd"),
                store = factory.createVuexStore(),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            wrapper.vm.$options.watch.address.call(wrapper.vm, [true]);
            expect(stubWalkTroughToFetchAndAdd.calledOnce).to.be.true;
        });
    });
});
