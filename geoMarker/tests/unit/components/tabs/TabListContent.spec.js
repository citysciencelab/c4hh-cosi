import {config, shallowMount} from "@vue/test-utils";
import {Polygon} from "ol/geom";
import {expect} from "chai";
import {createStore} from "vuex";
import TabListContent from "../../../../components/tabs/TabListContent.vue";

config.global.mocks.$t = key => key;

describe("addons/geoMarker/components/tabs/TabListContent.vue", () => {
    let wrapper,
        store;

    const mockFeature = {
        getProperties: () => ({
            geom: new Polygon([[[0, 0], [1, 0], [1, 1], [0, 0]]]),
            quelle: "source",
            kategorie: "category",
            beschreibung: "description",
            zeitstempel: new Date().toISOString()
        }),
        getId: () => "feature-1"
    };

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    beforeEach(() => {
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        GeoMarker: {
                            namespaced: true,
                            getters: {
                                geoMarkerFeatureList: () => [mockFeature],
                                geoMarkerState: () => () => "offen",
                                geoMarkerFeatureSelected: () => mockFeature,
                                geoMarkerShortFeatureId: () => () => "feature-1"
                            }
                        } /* ,
                        GraphicalSelect: {
                            namespaced: true,
                            getters: {
                                selectedAreaGeoJson: () => null
                            }
                        }*/
                    }
                }
            }
        });
    });

    it("should exist and have the correct id", () => {
        wrapper = shallowMount(TabListContent, {
            props: {
                tabActive: true
            },
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.exists()).to.be.true;
        expect(wrapper.attributes("id")).to.be.equal("tabListContent");
    });

    it("should contain required components", () => {
        wrapper = shallowMount(TabListContent, {
            props: {
                tabActive: true
            },
            global: {
                plugins: [store]
            }
        });

        // expect(wrapper.find("graphical-select-stub").exists()).to.true;
        expect(wrapper.find("selectable-list-stub").exists()).to.true;
    });

});
