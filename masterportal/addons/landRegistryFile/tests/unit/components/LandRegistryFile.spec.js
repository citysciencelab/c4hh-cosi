import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import sinon from "sinon";

import Component from "../../../components/LandRegistryFile.vue";

describe("addons/landRegistryFile/tests/unit/components/LandRegistryFile.spec.js", () => {
    let wrapper,
        store;
    const landRegistryFileFeatures = [
            {
                id: "1",
                properties: {
                    name: "Feature 1"
                }
            },
            {
                id: "2",
                properties: {
                    name: "Feature 2"
                }
            },
            {
                id: "3",
                properties: {
                    name: "Feature 3"
                }
            }
        ],
        tabContainerRef = {
            $refs: {
                tabResults: [{scrollToSelectedDetail: sinon.stub()}]
            }
        };

    beforeEach(() => {
        store = createStore({
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        LandRegistryFile: {
                            namespaced: true,
                            state: () => ({
                                showLoadingSpinner: false,
                                landRegistryFileFeatures: landRegistryFileFeatures,
                                selectedDetailFeatureId: null,
                                autoStartTourUntil: null
                            }),
                            actions: {
                                queryOafSchema: () => Promise.resolve(),
                                startGuidedTour: () => Promise.resolve(),
                                selectFeatureOnMap: ({commit}, {featureId}) => commit("setSelectedDetailFeatureId", featureId)
                            },
                            getters: {
                                showLoadingSpinner: state => state.showLoadingSpinner,
                                getSortedFeatures: state => state.landRegistryFileFeatures,
                                landRegistryFileFeatures: state => state.landRegistryFileFeatures,
                                selectedDetailFeatureId: state => state.selectedDetailFeatureId,
                                autoStartTourUntil: state => state.autoStartTourUntil
                            },
                            mutations: {
                                setShowLoadingSpinner (state, payload) {
                                    state.showLoadingSpinner = payload;
                                },
                                setSelectedDetailFeatureId (state, featureId) {
                                    state.selectedDetailFeatureId = featureId;
                                },
                                setLandRegistryFileFeatures (state, features) {
                                    state.landRegistryFileFeatures = features;
                                }
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(Component, {
            props: {
            },
            global: {
                mocks: {
                    $t: key => key
                },
                plugins: [store]
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("should exist", () => {
        expect(wrapper.exists()).to.be.true;
    });

    it("should have showLoadingSpinner state set to false", () => {
        expect(store.state.Modules.LandRegistryFile.showLoadingSpinner).to.equal(false);
    });

    it("selects the first feature when the details tab opens with no selection", () => {
        wrapper.vm.handleTabChange(tabContainerRef, "tabDetails", "tabResults");

        expect(store.state.Modules.LandRegistryFile.selectedDetailFeatureId).to.equal("1");
    });

    it("preserves the existing selection when the details tab opens", () => {
        store.state.Modules.LandRegistryFile.selectedDetailFeatureId = "2";

        wrapper.vm.handleTabChange(tabContainerRef, "tabDetails", "tabResults");

        expect(store.state.Modules.LandRegistryFile.selectedDetailFeatureId).to.equal("2");
    });

    it("resets the results badge when the results tab opens", () => {
        wrapper.vm.resultsBadge = 5;

        wrapper.vm.handleTabChange(tabContainerRef, "tabResults", "tabSearch");
        expect(wrapper.vm.resultsBadge).to.be.null;
    });

    it("changing the number of features updates the results badge", async () => {
        expect(wrapper.vm.resultsBadge).to.be.null;

        const features = [
            {
                id: "1",
                properties: {
                    name: "Feature 1"
                }
            },
            {
                id: "2",
                properties: {
                    name: "Feature 2"
                }
            }
        ];

        store.commit("Modules/LandRegistryFile/setLandRegistryFileFeatures", features);

        await wrapper.vm.$nextTick();

        expect(wrapper.vm.resultsBadge).to.equal(2);
    });
});
