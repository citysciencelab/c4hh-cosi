import {config, shallowMount} from "@vue/test-utils";
import sinon from "sinon";
import {expect} from "chai";
import {createStore} from "vuex";
import GeoMarker from "../../../components/GeoMarker.vue";


config.global.mocks.$t = key => key;

describe("addons/geoMarker/components/GeoMarker.vue", () => {
    let wrapper,
        store;

    beforeEach(() => {
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        GeoMarker: {
                            namespaced: true,
                            getters: {
                                geoMarkerActiveTab: () => "tabFilter"
                            },
                            actions: {
                                loadCategories: () => [],
                                loadDepartments: () => []
                            },
                            mutations: {
                                setLayerInformation: sinon.stub()
                            }
                        }
                    }
                }
            },
            getters: {
                allLayerConfigs: () => []
            }
        });

        wrapper = shallowMount(GeoMarker, {
            global: {
                plugins: [store]
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("should exist and have the correct id", () => {
        expect(wrapper.exists()).to.be.true;
        expect(wrapper.attributes("id")).to.be.equal("geoMarker");
    });

    it("should have all navigation tabs", () => {
        expect(wrapper.find("#tabNew").exists()).to.be.true;
        expect(wrapper.find("#tabList").exists()).to.be.true;
        expect(wrapper.find("#tabFilter").exists()).to.be.true;
        expect(wrapper.find("#tabFilter").attributes("active")).to.equal("true");
    });
});
