import Vuex from "vuex";
import {shallowMount} from "@vue/test-utils";
import DetailComponent from "../../../components/DetailComponent.vue";
import Boris from "../../../store/indexBoris";
import {expect} from "chai";
import sinon from "sinon";


// config.global.mocks.$t = key => key;

describe.skip("ADDONS: addons/boris/components/DetailComponent.vue", () => {
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
        store = new Vuex.Store({
            namespaces: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        Boris
                    }
                }
            },
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
    afterEach(function () {
        sinon.restore();
        // if (wrapper) {
        //     wrapper.destroy();
        // }
    });

    describe("Boris Detail Component template", () => {
        const data = {
            strassenname: "Sesamstraße",
            hausnummer: "10",
            hausnummerzusatz: "abc"
        };

        it("renders Detail Component", () => {
            wrapper = shallowMount(DetailComponent, {
                store,
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
                store,
                propsData: {...propsData, feature: {}}
            });

            expect(wrapper.find(".detail-component").exists()).to.be.false;
        });
        it("test method getValue", () => {
            wrapper = shallowMount(DetailComponent, {
                store,
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
