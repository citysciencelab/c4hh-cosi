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
                                geoMarkerActiveTab: () => "tabFilter",
                                categories: () => [],
                                departments: () => [],
                                geoMarkerEditLayerId: () => "geomarker_edit",
                                rollbackGeoMarkerFeature: () => null,
                                geoMarkerFeatureList: () => [],
                                newGeoMarkerCreated: () => false,
                                geoMarkerUpdateFeature: () => null,
                                reloadIntervalId: sinon.stub()
                            },
                            actions: {
                                loadCategories: () => [],
                                loadDepartments: () => [],
                                setMapInteraction: sinon.stub(),
                                getGeoMarkerEditLayerUrl: sinon.stub(),
                                rollbackGeoMarkerUpdateFeature: sinon.stub()
                            },
                            mutations: {
                                setLayerInformation: sinon.stub(),
                                setGeoMarkerActiveTab: sinon.stub(),
                                setNewGeoMarkerFeature: sinon.stub(),
                                setGeoMarkerUpdateFeature: sinon.stub(),
                                setGeoMarkerFeatureSelected: sinon.stub(),
                                setReloadIntervalId: sinon.stub()
                            }
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    actions: {
                        removePointMarker: sinon.stub()
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
