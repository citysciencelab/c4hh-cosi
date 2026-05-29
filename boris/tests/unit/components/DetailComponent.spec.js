import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import DetailComponent from "../../../components/DetailComponent.vue";
import {expect} from "chai";
import sinon from "sinon";


describe("ADDONS: addons/boris/components/DetailComponent.vue", () => {
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
            feature: {},
            keys: ["entwicklungszustand"],
            label: "Entwicklungszustand"
        };

    });

    describe("Boris Detail Component template", () => {
        const data = {
            strassenname: "Sesamstraße",
            hausnummer: "10",
            hausnummerzusatz: "abc"
        };

        it("renders Detail Component", () => {
            wrapper = shallowMount(DetailComponent, {
                global: {plugins: [store]},
                propsData: {...propsData, feature: {
                    get: (key) => {
                        return key;
                    }
                }}
            });
            expect(wrapper.find(".detail-component").exists()).to.be.true;
        });
        it("does not render Detail Component if feature is empty", () => {
            wrapper = shallowMount(DetailComponent, {
                global: {plugins: [store]},
                propsData: {...propsData, feature: {}}
            });

            expect(wrapper.find(".detail-component").exists()).to.be.false;
        });
        it("test method getValue", () => {
            wrapper = shallowMount(DetailComponent, {
                global: {plugins: [store]},
                propsData: {
                    feature: {
                        values: data,
                        get: (key) => {
                            return data[key];
                        }
                    },
                    keys: ["strassenname", "hausnummer", "hausnummerzusatz"],
                    label: "Adresse"
                }
            });

            const result = wrapper.vm.getValue();

            expect(result).to.be.equal("Sesamstraße 10 abc");
        });
    });
});
