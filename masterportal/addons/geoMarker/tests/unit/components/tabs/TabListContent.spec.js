import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import TabListContent from "../../../../components/tabs/TabListContent.vue";

config.global.mocks.$t = key => key;

describe("addons/geoMarker/components/tabs/TabListContent.vue", () => {
    let wrapper,
        store;

    const mockFeature = {
        getProperties: () => ({
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
                                geoMarkerShortFeatureId: () => () => "1",
                                geoMarkerWfsFeatureType: () => "geomarker",
                                categories: () => [],
                                departments: () => [],
                                geoMarkerUpdateFeature: () => null
                            }
                        }
                    }
                },
                Menu: {
                    namespaced: true,
                    getters: {
                        currentMenuWidth: () => 500,
                        expanded: () => true
                    }
                },
                Maps: {
                    namespaced: true,
                    actions: {
                        registerListener: () => {
                            return null;
                        },
                        unregisterListener: () => {
                            return null;
                        }
                    }
                }
            },
            getters: {
                restServiceById: () => () => ({})
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

        expect(wrapper.find("selectable-list-stub").exists()).to.true;
    });

    // it("renders all action buttons", () => {
    //     wrapper = mount(TabListContent, {
    //         props: {
    //             tabActive: true
    //         },
    //         global: {
    //             plugins: [store]
    //         }
    //     });

    //     const buttons = wrapper.findAll(".listAction");

    //     expect(buttons.length).to.equal(4);
    // });

    // it("all buttons are not disabled when geoMarkerFeatureSelected is a feature", async () => {
    //     wrapper = mount(TabListContent, {
    //         props: {
    //             tabActive: true
    //         },
    //         global: {
    //             plugins: [store]
    //         }
    //     });

    //     const buttons = wrapper.findAll(".listAction");

    //     expect(buttons.at(0).isDisabled()).to.equal(false);
    //     expect(buttons.at(1).isDisabled()).to.equal(false);
    // });
});
