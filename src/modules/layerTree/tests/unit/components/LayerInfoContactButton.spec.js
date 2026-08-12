import {createStore} from "vuex";
import {createPinia, setActivePinia} from "pinia";
import {mount} from "@vue/test-utils";
import {expect} from "chai";
import LayerInfoContactButton from "@modules/layerTree/components/LayerInfoContactButton.vue";
import {useLayerInformationStore} from "@modules/layerInformation/store/layerInformationStore.js";

describe("src/modules/layerTree/components/LayerInfoContactButton.vue", () => {
    let store,
        pinia,
        layerInformationStore,
        pointOfContact,
        publisher,
        isModuleAvailable,
        contactPublisherName;

    const propsData = {
        layerName: "Layer XYZ",
        previousComponent: "layerInformation"
    };

    beforeEach(() => {
        isModuleAvailable = true;
        pinia = createPinia();
        setActivePinia(pinia);
        layerInformationStore = useLayerInformationStore();
        layerInformationStore.layerInfo = {
            "metaIdArray": [],
            "url": [
                "https://wms.example.org/",
                "https://wfs.example.org/?evil=1",
                "./local.geojson"
            ],
            "typ": ["WMS", "WFS", "GeoJSON"],
            "layerNames": ["X-WMS", "X-WFS", ""]
        };
        store = createStore({
            namespaced: true,
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        Contact: {
                            namespaced: true,
                            getters: {
                                name: () => "Contactname",
                                type: () => "contact"
                            }
                        }
                    }
                },
                Menu: {
                    namespaced: true,
                    getters: {
                        secondaryMenu: () => {
                            return {
                                sections: [
                                    [
                                        {
                                            type: "section1"
                                        },
                                        {
                                            type: "section2"
                                        }
                                    ]
                                ]
                            };
                        }
                    }
                }
            },
            getters: {
                isModuleAvailable: () => () => isModuleAvailable,
                portalConfig: () => {
                    return {
                        tree: {
                            contactPublisherName: () => contactPublisherName
                        }
                    };
                }
            }
        });
    });


    it("should show contact button", async () => {
        pointOfContact = {
            "name": "Behörde ABC",
            "positionName": ["Metadaten-Verantwortlicher"],
            "street": "XYZ Straße 99",
            "housenr": "",
            "postalCode": "D-12345",
            "city": "Hamburg",
            "email": "test@gv.hamburg.de",
            "country": "DEU"
        };
        publisher = "";
        layerInformationStore.pointOfContact = pointOfContact;
        layerInformationStore.publisher = publisher;

        const wrapper = mount(LayerInfoContactButton, {
            global: {
                plugins: [store, pinia]
            },
            propsData
        });

        expect(wrapper.find(".openContactButton").exists()).to.be.true;
    });

    it("should not show contact button if no contact information is in the metadata", async () => {
        pointOfContact = "";
        publisher = "";
        layerInformationStore.pointOfContact = pointOfContact;
        layerInformationStore.publisher = publisher;

        const wrapper = mount(LayerInfoContactButton, {
            global: {
                plugins: [store, pinia]
            },
            propsData
        });

        expect(wrapper.find(".openContactButton").exists()).to.be.false;
    });

    it("should not show contact button if contact module is not configured", async () => {
        pointOfContact = {
            "name": "Behörde ABC",
            "positionName": ["Metadaten-Verantwortlicher"],
            "street": "XYZ Straße 99",
            "housenr": "",
            "postalCode": "D-12345",
            "city": "Hamburg",
            "email": "test@gv.hamburg.de",
            "country": "DEU"
        };
        publisher = "";
        isModuleAvailable = false;
        layerInformationStore.pointOfContact = pointOfContact;
        layerInformationStore.publisher = publisher;

        const wrapper = mount(LayerInfoContactButton, {
            global: {
                plugins: [store, pinia]
            },
            propsData
        });

        expect(wrapper.find(".openContactButton").exists()).to.be.false;
    });

    it("should return contact message with publisher name when contactPublisherName is true and contactName exists", () => {
        contactPublisherName = true;
        layerInformationStore.pointOfContact = {
            "name": "Behörde ABC"
        };

        const wrapper = mount(LayerInfoContactButton, {
            global: {
                plugins: [store, pinia]
            },
            propsData
        });

        expect(wrapper.componentVM.infoMessage).to.equal(
            "common:modules.layerInformation.contactPublisherBehörde ABC"
        );
    });
});
