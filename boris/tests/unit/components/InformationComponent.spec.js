import Vuex from "vuex";
import {config, shallowMount, mount, createLocalVue} from "@vue/test-utils";
import InformationComponent from "../../../components/InformationComponent.vue";
import Boris from "../../../store/indexBoris";
import {expect} from "chai";
import sinon from "sinon";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";

const localVue = createLocalVue();

localVue.use(Vuex);

config.mocks.$t = key => key;

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
            store,
            propsData: propsData,
            localVue
        });
    });
    afterEach(() => {
        sinon.restore();
        if (wrapper) {
            wrapper.destroy();
        }
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
                store,
                propsData: {
                    ...propsData,
                    buttonValue: "lage"
                },
                localVue
            });
            expect(wrapper.find(".information-position").exists()).to.be.true;
            expect(wrapper.find(".detail-component").exists()).to.be.true;
        });
    });
});
