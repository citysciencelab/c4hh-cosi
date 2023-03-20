import Vuex from "vuex";
import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import RefugeeHomesComponent from "../../../components/RefugeeHomes.vue";
import RefugeeHomes from "../../../store/indexRefugeeHomes";
import {expect} from "chai";
import sinon from "sinon";

const localVue = createLocalVue();

localVue.use(Vuex);
config.mocks.$t = key => key;

describe("ADDONS: addons/refugeeHomes/components/RefugeeHomes.vue", () => {
    const mockConfigJson = {
        Portalconfig: {
            menu: {
                tools: {
                    children: {
                        refugeeHomes: {
                            "icon": "house-fill",
                            "name": "refugeehomes"
                        }
                    }
                }
            }
        }
    };
    let store, wrapper;

    beforeEach(() => {
        store = new Vuex.Store({
            namespaces: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        RefugeeHomes
                    }
                },
                Maps: {
                    namespaced: true,
                    resetView: sinon.spy(),
                    actions: {
                        resetView: sinon.spy()
                    },
                    getters: {
                        clickCoordinate: () => [100, 200]
                    }
                },
                MapMarker: {
                    namespaced: true,
                    actions: {
                        removePointMarker: sinon.spy()
                    },
                    getters: {
                        markerPoint: () => sinon.spy()
                    }
                }
            },
            state: {
                configJson: mockConfigJson,
                features: [{bezirk: "Altona", bezeichnung: "123", strasse: "musterstr", stadtteil: "5", platzzahl: 130}],
                filteredFeatures: [{0: {bezirk: "Altona", bezeichnung: "123", strasse: "musterstr", stadtteil: "5", platzzahl: 130}, 1: {}}]
            }
        });
        store.commit("Tools/RefugeeHomes/addFeature", [{bezirk: "Altona", bezeichnung: "123", strasse: "musterstr", stadtteil: "5", platzzahl: 130}]);
        store.commit("Tools/RefugeeHomes/addFilteredFeature", [{0: {bezirk: "Altona", bezeichnung: "123", strasse: "musterstr", stadtteil: "5", platzzahl: 130}, 1: {}}]);
        store.commit("Tools/RefugeeHomes/setActive", true);
    });
    afterEach(function () {
        sinon.restore();

        if (wrapper) {
            wrapper.destroy();
        }
    });

    it("renders the RefugeeHomes", () => {
        wrapper = shallowMount(RefugeeHomesComponent, {store, localVue});

        expect(wrapper.find("#refugeehomes").exists()).to.be.true;
        expect(wrapper.find("tr").exists()).to.be.true;
    });

    it("if all features watcher is true the sortFeatures is executed", async () => {
        const sortFeaturesStub = sinon.stub();

        wrapper = shallowMount(RefugeeHomesComponent, {store, localVue});
        wrapper.setMethods({sortFeatures: sortFeaturesStub});
        wrapper.vm.allFeatures = true;
        await wrapper.vm.$nextTick();
        expect(sortFeaturesStub.calledOnce).to.be.true;
    });
    it("if the tool is closed the highlighted layer are removed", async () => {
        const removeHighlightLayerStub = sinon.stub();

        wrapper = shallowMount(RefugeeHomesComponent, {store, localVue});
        wrapper.setMethods({removeHighlightLayer: removeHighlightLayerStub});
        wrapper.vm.close();

        await wrapper.vm.$nextTick();
        expect(removeHighlightLayerStub.called).to.be.true;

    });
});
