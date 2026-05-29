import {expect} from "chai";
import {shallowMount, config} from "@vue/test-utils";
import CompareFeaturesComponent from "@modules/compareFeatures/components/CompareFeatures.vue";
import TableComponent from "@shared/modules/table/components/TableComponent.vue";
import {createStore} from "vuex";
import sinon from "sinon";

config.global.mocks.$t = key => key;


describe("CompareFeatures.vue", () => {
    let store, hasMultipleLayersValue, hasFeaturesValue;

    const getters = {
            hasFeatures: () => hasFeaturesValue,
            hasMultipleLayers: () => hasMultipleLayersValue,
            active: () => true,
            selectedLayerId: () => "layer1",
            preparedListDisplayTable: () => ({
                layer1: [{id: 1, name: "Feature 1"}]
            }),
            selectableLayers: () => [
                {layerId: "layer1", layerName: "Layer 1"},
                {layerId: "layer2", layerName: "Layer 2"}
            ],
            numberOfAttributesToShow: () => 12
        },

        mutations = {
            selectLayerWithFeatures: sinon.stub()
        },

        actions = {
            removeFeature: sinon.stub()
        };

    beforeAll(() => {
        i18next.init({
            lng: "cimode",
            debug: false
        });
    });
    beforeEach(() => {

        store = createStore({
            namespaced: true,
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        CompareFeatures: {
                            namespaced: true,
                            getters,
                            mutations,
                            actions
                        }
                    }
                }
            }
        });
    });

    it("renders the component correctly", () => {
        const wrapper = shallowMount(CompareFeaturesComponent, {global: {plugins: [store]}});

        expect(wrapper.exists()).to.be.true;
    });

    it("renders the select dropdown when multiple layers are available", () => {
        hasMultipleLayersValue = true;

        const wrapper = shallowMount(CompareFeaturesComponent, {global: {plugins: [store]}}),
            selectContainer = wrapper.find("#module-compareFeatures-select-container");

        expect(selectContainer.exists()).to.be.true;
    });
    it("doesn't render the select dropdown when no multiple layers are available", () => {
        hasMultipleLayersValue = false;

        const wrapper = shallowMount(CompareFeaturesComponent, {global: {plugins: [store]}}),
            selectContainer = wrapper.find("#module-compareFeatures-select-container");

        expect(selectContainer.exists()).to.be.false;
    });

    it("shows the no features message when no features are available", () => {
        hasFeaturesValue = false;

        const wrapper = shallowMount(CompareFeaturesComponent, {global: {plugins: [store]}}),

            noFeaturesElement = wrapper.find("#module-compareFeatures-no-features");

        expect(noFeaturesElement.exists()).to.be.true;
    });

    it("renders TableComponent when there are features and a single layer", () => {
        hasFeaturesValue = true;
        hasMultipleLayersValue = false;
        const wrapper = shallowMount(CompareFeaturesComponent, {global: {plugins: [store]}}),

            tableComponent = wrapper.findComponent(TableComponent);

        expect(tableComponent.exists()).to.be.true;
        expect(tableComponent.props("data")).to.deep.equal([{id: 1, name: "Feature 1"}]);
    });

    it("renders TableComponent when there are features and multiple layers", () => {
        hasMultipleLayersValue = true;

        const wrapper = shallowMount(CompareFeaturesComponent, {global: {plugins: [store]}}),

            tableComponent = wrapper.findComponent(TableComponent);

        expect(tableComponent.exists()).to.be.true;
        expect(tableComponent.props("data")).to.deep.equal([{id: 1, name: "Feature 1"}]);
    });

    it("calls removeFeature when removeItem is triggered", async () => {
        const wrapper = shallowMount(CompareFeaturesComponent, {global: {plugins: [store]}}),

            tableComponent = wrapper.findComponent(TableComponent);

        await tableComponent.vm.$emit("removeItem", 1, "layer1");

        expect(actions.removeFeature.calledOnce).to.be.true;
        expect(actions.removeFeature.calledWithMatch({}, {idFeature: 1, idLayer: "layer1"})).to.be.true;
    });

    it("updates the selected layer when changed", async () => {
        const wrapper = shallowMount(CompareFeaturesComponent, {global: {plugins: [store]}});

        wrapper.vm.selected = "layer2";
        await wrapper.vm.$nextTick();

        expect(mutations.selectLayerWithFeatures.calledOnce).to.be.true;
        expect(mutations.selectLayerWithFeatures.calledWith({}, "layer2")).to.be.true;
    });

    it("displays the correct options in the select dropdown", () => {
        getters.hasMultipleLayers = () => true;

        const wrapper = shallowMount(CompareFeaturesComponent, {global: {plugins: [store]}}),

            options = wrapper.findAll("option");

        expect(options).to.have.length(2);
        expect(options.at(0).text()).to.include("Layer 1");
        expect(options.at(1).text()).to.include("Layer 2");
    });
});
