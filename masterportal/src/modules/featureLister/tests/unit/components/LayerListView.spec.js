import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import LayerListView from "@modules/featureLister/components/LayerListView.vue";
import sinon from "sinon";
import {expect} from "chai";

describe("src/modules/featureLister/components/LayerListView.vue", () => {
    let store, getters, mutations, actions, mocks;

    beforeEach(() => {
        getters = {
            visibleLayerConfigs: () => [
                {id: "1", name: "Layer 1", typ: "WFS"},
                {id: "2", name: "Layer 2", typ: "OAF"},
                {id: "3", name: "Layer 3", typ: "Raster"}
            ],
            ignoredKeys: () => [],
            layer: () => ({id: "1", name: "Layer 1", typ: "WFS"}),
            loading: () => false,
            showGraphicalSelect: () => true,
            bufferDistance: () => 100,
            selectedArea: () => null
        };
        mutations = {
            setLayer: sinon.stub(),
            setSelectedArea: sinon.stub()
        };
        actions = {
            switchToList: sinon.stub()
        };
        store = createStore({
            getters: {
                visibleLayerConfigs: getters.visibleLayerConfigs,
                ignoredKeys: getters.ignoredKeys
            },
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        FeatureLister: {
                            namespaced: true,
                            getters: {
                                layer: getters.layer,
                                loading: getters.loading,
                                showGraphicalSelect: getters.showGraphicalSelect,
                                bufferDistance: getters.bufferDistance,
                                selectedArea: getters.selectedArea
                            },
                            mutations,
                            actions
                        },
                        GraphicalSelect: {
                            namespaced: true,
                            getters: {
                                selectedAreaGeoJson: () => null
                            }
                        }
                    }
                }
            }
        });
        mocks = {
            $t: msg => msg
        };
    });

    it("renders only supported vector layers", () => {
        const wrapper = shallowMount(LayerListView, {global: {plugins: [store], mocks}}),
            items = wrapper.findAll("li.nav-item");

        expect(items.length).to.equal(2);
        expect(wrapper.text()).to.include("Layer 1");
        expect(wrapper.text()).to.include("Layer 2");
        expect(wrapper.text()).to.not.include("Layer 3");
    });

    it("calls setLayer when a layer is clicked", async () => {
        const wrapper = shallowMount(LayerListView, {global: {plugins: [store], mocks}}),
            setLayerStub = sinon.stub();

        wrapper.vm.setLayer = setLayerStub;
        await wrapper.find("a.nav-link").trigger("click");
        expect(setLayerStub.called).to.be.true;
    });

    it("highlights the selected layer", () => {
        const wrapper = shallowMount(LayerListView, {global: {plugins: [store], mocks}}),
            selected = wrapper.find("a.selected-layer");

        expect(selected.exists()).to.be.true;
        expect(selected.text()).to.equal("Layer 1");
    });

    it("shows GraphicalSelect and FlatButton if a layer is selected", () => {
        const wrapper = shallowMount(LayerListView, {global: {plugins: [store], mocks},
            data () {
                return {
                    manualSelection: true
                };
            }
        });

        expect(wrapper.findComponent({name: "GraphicalSelect"}).exists()).to.be.true;
        expect(wrapper.findComponent({name: "FlatButton"}).exists()).to.be.true;
    });

    it("shows SpinnerItem if loading is true", () => {
        getters.loading = () => true;
        const storeWithLoading = createStore({
                getters: {
                    visibleLayerConfigs: getters.visibleLayerConfigs,
                    ignoredKeys: getters.ignoredKeys
                },
                modules: {
                    Modules: {
                        namespaced: true,
                        modules: {
                            FeatureLister: {
                                namespaced: true,
                                getters: {
                                    layer: getters.layer,
                                    loading: getters.loading,
                                    showGraphicalSelect: getters.showGraphicalSelect,
                                    bufferDistance: getters.bufferDistance,
                                    selectedArea: getters.selectedArea
                                },
                                mutations,
                                actions
                            },
                            GraphicalSelect: {
                                namespaced: true,
                                getters: {
                                    selectedAreaGeoJson: () => null
                                }
                            }
                        }
                    }
                }
            }),
            wrapper = shallowMount(LayerListView, {global: {plugins: [storeWithLoading], mocks}
            });

        expect(wrapper.findComponent({name: "SpinnerItem"}).exists()).to.be.true;
    });

    it("calls setSelectedArea when selectedAreaGeoJson changes", async () => {
        const wrapper = shallowMount(LayerListView, {global: {plugins: [store], mocks}}),
            setSelectedAreaStub = sinon.stub();

        wrapper.vm.setSelectedArea = setSelectedAreaStub;
        await wrapper.setData({});
        await wrapper.vm.$options.watch.selectedAreaGeoJson.call(wrapper.vm, {type: "Polygon"});
        expect(setSelectedAreaStub.calledWith({type: "Polygon"})).to.be.true;
    });

    it("isSelectedLayer returns true for selected layer", () => {
        const wrapper = shallowMount(LayerListView, {global: {plugins: [store], mocks}});

        expect(wrapper.vm.isSelectedLayer({id: "1"})).to.be.true;
        expect(wrapper.vm.isSelectedLayer({id: "2"})).to.be.false;
    });
});
