import {expect} from "chai";
import {mount} from "@vue/test-utils";
import TabNewContent from "../../../../components/tabs/TabNewContent.vue";
import {createStore} from "vuex";
import departments from "../../resources/departments.json";
import categories from "../../resources/categories.json";

describe("addons/geoMarker/components/tabs/TabNewContent.vue", () => {
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
                                categories: state => state.categories,
                                departments: state => state.departments
                            },
                            state: () => ({
                                categories: categories.categories,
                                departments: departments.departments,
                                statusOptions: ["offen", "inaktiv", "geschlossen"]
                            })
                        }
                    }
                }
            },
            getters: {
                visibleLayerConfigs: () => []
            }
        });

        wrapper = mount(TabNewContent, {
            props: {
                tabActive: true
            },
            global: {
                mocks: {
                    $t: key => key
                },
                plugins: [store],
                stubs: {
                    GeoMarkerForm: true
                }
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("should render and have the correct class", () => {
        expect(wrapper.exists()).to.be.true;
        expect(wrapper.classes()).to.include("TabNewContent");
    });

    it("should render GeoMarkerForm component", () => {
        const geoMarkerForm = wrapper.findComponent({name: "GeoMarkerForm"});

        expect(geoMarkerForm.exists()).to.be.true;
    });

    it("should pass correct props to GeoMarkerForm", () => {
        const geoMarkerForm = wrapper.findComponent({name: "GeoMarkerForm"});

        expect(geoMarkerForm.props("mode")).to.equal("create");
        expect(geoMarkerForm.props("showCreateAnotherSwitch")).to.be.true;
    });
});
