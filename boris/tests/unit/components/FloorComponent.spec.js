import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import FloorComponent from "../../../components/FloorComponent.vue";
import {expect} from "chai";
import sinon from "sinon";


config.global.mocks.$t = key => key;

describe("ADDONS: addons/boris/components/FloorComponent.vue", () => {
    const mockConfigJson = {
        Portalconfig: {
            menu: {
                tools: {
                    children: {
                        boris: {
                            "name": "common:menu.tools.boris",
                            "icon": "bi-vinyl"
                        }
                    }
                }
            }
        }
    };
    let store, propsData, wrapper;

    beforeEach(() => {
        store = createStore({
            namespaces: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        BorisComponent: {
                            namespaced: true,
                            actions: {
                                initialize: () => sinon.stub()
                            }
                        },
                        Print: {
                            namespaced: true,
                            getters: {printFileReady: () => sinon.stub(),
                                fileDownloadUrl: () => sinon.stub(),
                                filename: () => sinon.stub(),
                                printStarted: () => sinon.stub(),
                                progressWidth: () => sinon.stub()}
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    actions: {registerListener: () => sinon.stub(),
                        unregisterListener: () => sinon.stub()}
                }
            },
            getters: {mobile: () => false},
            state: {
                configJson: mockConfigJson
            }
        });

        propsData = {
            title: "title",
            feature: {
            },
            label: "subtitle",
            landuse: "MFH Mehrfamilienhäuser"
        };
        wrapper = shallowMount(FloorComponent, {
            global: {plugins: [store]},
            propsData: propsData
        });
    });

    describe("Boris floor component template", () => {

        it("renders floor compponent", () => {
            expect(wrapper.find(".floor-component").exists()).to.be.true;
        });
        it("renders 'schichtwerte'", () => {
            wrapper = shallowMount(FloorComponent, {
                global: {plugins: [store]},
                propsData: {...propsData, feature: {schichtwerte: {
                    schichtwert: "blaa"
                }}}
            });

            expect(wrapper.find(".floorvalue-part-I").exists()).to.be.true;
        });
        it("does not render 'schichtwerte'", () => {
            const feature = {key1: "euro"};

            wrapper = shallowMount(FloorComponent, {
                global: {plugins: [store]},

                propsData: {...propsData, feature: feature
                }
            });
            expect(wrapper.find(".floorvalue-part-II").exists()).to.be.true;
        });
    });
});
