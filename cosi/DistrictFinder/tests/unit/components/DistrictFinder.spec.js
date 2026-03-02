// import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Vuex from "vuex";
// import DistrictFinder from "../../../components/DistrictFinder.vue";

// config.mocks.$t = key => key;

// const localVue = createLocalVue();

// localVue.use(Vuex);

describe.skip("addons/cosi/DistrictFinder/components/DistrictFinder.vue", () => {
    const store = new Vuex.Store({
            namespaced: true,
            modules: {
                Language: {
                    namespaced: true,
                    getters: {
                        currentLocale: () => "de-DE"
                    }
                },
                Tools: {
                    namespaced: true,
                    modules: {
                        DistrictFinder: {
                            namespaced: true,
                            getters: {
                                deactivateGFI: () => true,
                                active: () => true,
                                icon: () => "small",
                                renderToWindow: () => false,
                                resizableWindow: () => false,
                                selectedDistricts: () => [],
                                readmeUrl: () => ""
                            }
                        },
                        DistrictSelector: {
                            namespaced: true,
                            getters: {
                                districtLevels: () => []
                            }
                        }
                    }
                }
            }
        }),
        DistrictFinder = undefined,
        factory = {
            getShallowMount: (values = {}) => {
                return shallowMount(DistrictFinder, {
                    data () {
                        return {
                            ...values
                        };
                    },
                    store
                    // localVue
                });
            }
        };

    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.exists()).to.be.true;
        });

        it("should find accordion component with id 'district-selection'", () => {
            const wrapper = factory.getShallowMount(),
                accordionWrapper = wrapper.find("accordionitem-stub#district-selection");

            expect(accordionWrapper.exists()).to.be.true;
        });

        it("should find district finder selector component", () => {
            const wrapper = factory.getShallowMount(),
                districtSelectorLevelWrapper = wrapper.find("districtfinderselector-stub");

            expect(districtSelectorLevelWrapper.exists()).to.be.true;
        });

        it("should find district selector filter component", () => {
            const wrapper = factory.getShallowMount(),
                districtSelectorFilterWrapper = wrapper.find("districtfinderfilter-stub");

            expect(districtSelectorFilterWrapper.exists()).to.be.true;
        });
    });
});
