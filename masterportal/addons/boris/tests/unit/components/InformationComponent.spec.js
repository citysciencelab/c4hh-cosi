import {createStore} from "vuex";
import {config, shallowMount, mount} from "@vue/test-utils";
import InformationComponent from "../../../components/InformationComponent.vue";
import {expect} from "chai";
import sinon from "sinon";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";


config.global.mocks.$t = key => key;

describe("ADDONS: addons/boris/components/InformationComponent.vue", () => {
    const mockConfigJson = {
        Portalconfig: {
            menu: {
                tools: {
                    children: {
                        boris: {
                            "name": "common:menu.tools.boris",
                            "icon": "bi-vinyl",
                            "active": true,
                            "renderToWindow": false
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
            selectedBrwFeature: new VectorLayer({
                source: new VectorSource(),
                bezirk: "bezirk",
                get: (key) => {
                    return key;
                }
            }),
            buttonValue: "info"
        };
        wrapper = shallowMount(InformationComponent, {
            global: {plugins: [store]},
            propsData: propsData
        });
    });

    describe("Boris Information Component template", () => {
        it("renders Information Component", () => {
            expect(wrapper.find(".information-component").exists()).to.be.true;
        });

        it("renders info part", () => {
            expect(wrapper.find(".information-info").exists()).to.be.true;
        });

        it("renders position part", () => {
            wrapper = mount(InformationComponent, {
                global: {plugins: [store]},
                propsData: {
                    ...propsData,
                    buttonValue: "lage"
                }
            });
            expect(wrapper.find(".information-position").exists()).to.be.true;
            expect(wrapper.find(".detail-component").exists()).to.be.true;
        });
    });
});
