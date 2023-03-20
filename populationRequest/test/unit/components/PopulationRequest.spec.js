import Vuex from "vuex";
import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";

import Component from "../../../components/PopulationRequest.vue";
import GraphicalSelectComponent from "../../../../../src/share-components/graphicalSelect/components/GraphicalSelect.vue";
import ToggleCheckboxComponent from "../../../../../src/share-components/toggleCheckbox/components/ToggleCheckbox.vue";
import Module from "../../../store/indexPopulationRequest";

const localVue = createLocalVue();

localVue.use(Vuex);
config.mocks.$t = key => key;

describe("addons/PopulationRequest/components/PopulationRequest.vue", () => {
    const geographicValues = ["Box", "Circle", "Polygon"],
        selectionElements = ["Dropdown"],
        mockMapMutations = {
            addLayerToMap: sinon.stub(),
            removeLayerFromMap: sinon.stub()
        },
        mockMapActions = {
            addInteraction: sinon.stub(),
            registerListener: sinon.stub(),
            addLayerOnTop: sinon.stub()
        },
        mockGraphicalSelectGetters = {
            circleOverlay: sinon.stub(),
            tooltipOverlay: sinon.stub(),
            geographicValues: () => geographicValues,
            selectionElements: () => selectionElements
        },
        mockGraphicalSelectActions = {
            createDomOverlay: sinon.stub(),
            toggleOverlay: sinon.stub(),
            setDrawInteractionListener: sinon.stub(),
            setDefaultSelection: sinon.stub()
        },
        mockGraphicalSelectMutations = {
            setCurrentValue: sinon.stub(),
            setDrawInteraction: sinon.stub(),
            setDefaultSelection: sinon.stub()
        };
    let store;

    beforeEach(() => {
        store = new Vuex.Store({
            namespaced: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        PopulationRequest: Module
                    }
                },
                Maps: {
                    namespaced: true,
                    mutations: mockMapMutations,
                    actions: mockMapActions
                },
                GraphicalSelect: {
                    namespaced: true,
                    getters: mockGraphicalSelectGetters,
                    actions: mockGraphicalSelectActions,
                    mutations: mockGraphicalSelectMutations
                }
            },
            getters: {
                isDefaultStyle: () => true,
                uiStyle: () => true
            }
        });

        store.commit("Tools/PopulationRequest/setActive", true);
    });

    it("should exist", async () => {
        const wrapper = shallowMount(Component, {store, localVue});

        expect(wrapper.exists()).to.be.true;
    });

    it("should find Tool component", async () => {
        const wrapper = shallowMount(Component, {store, localVue}),
            toolWrapper = wrapper.findComponent({name: "ToolTemplate"});

        expect(toolWrapper.exists()).to.be.true;
    });

    it("should not render if active is false", () => {

        const wrapper = shallowMount(Component, {store, localVue}),
            divWrapper = wrapper.findComponent({name: "div.dropdown"});

        expect(divWrapper.exists()).to.be.false;
    });

    it("should render if active is true", async () => {
        const wrapper = shallowMount(Component, {store, localVue});

        expect(wrapper.find("div.dropdown").exists()).to.be.true;
    });

    it("renders the PopulationRequest tool with the expected divs", async () => {
        const wrapper = shallowMount(Component, {store, localVue});

        expect(wrapper.find("div.dropdown").exists()).to.be.true;
        expect(wrapper.find("div.result").exists()).to.be.false;
        expect(wrapper.find("div.checkbox").exists()).to.be.true;
    });

    it("should call toggleRasterLayer if Raster Checkbox is changed", async () => {
        const spyRaster = sinon.spy(Component.methods, "triggerRaster"),
            wrapper = shallowMount(Component, {store, localVue, stubs: {"ToggleCheckbox": ToggleCheckboxComponent, "GraphicalSelect": GraphicalSelectComponent}}),
            rasterComponent = wrapper.findComponent({ref: "rasterCheckBox"});

        await rasterComponent.vm.$emit("change");
        expect(spyRaster.calledOnce).to.be.true;

        spyRaster.restore();
    });

    it("should call toggleAlkisAdresses if alkisAdresses Checkbox is changed", async () => {
        const spyAlkisAdresses = sinon.spy(Component.methods, "triggerAlkisAdresses"),
            wrapper = shallowMount(Component, {store, localVue, stubs: {"ToggleCheckbox": ToggleCheckboxComponent, "GraphicalSelect": GraphicalSelectComponent}}),
            alkisAdressesComponent = wrapper.findComponent({ref: "alkisAdressesCheckBox"});

        await alkisAdressesComponent.vm.$emit("change");
        expect(spyAlkisAdresses.calledOnce).to.be.true;

        spyAlkisAdresses.restore();
    });

    describe("chooseUnitAndThousandsSeparator", function () {
        it("should return correct unit for value < 250000", function () {
            expect(Component.methods.chooseUnitAndThousandsSeparator(567, 0)).to.have.string("m²");
        });
        it("should return correct unit for value > 250000 and value < 10000000", function () {
            expect(Component.methods.chooseUnitAndThousandsSeparator(250000.1, 1)).to.have.string("ha");
        });
        it("should return correct unit for value >  250000", function () {
            expect(Component.methods.chooseUnitAndThousandsSeparator(99999999, 0)).to.have.string("km²");
        });
        it("should return correctly formatted number with unit", function () {
            expect(Component.methods.chooseUnitAndThousandsSeparator(1234567.123, 3)).to.equal("123,457 ha");
        });
        it("should return correctly formatted number with unit when number > 250000 and value < 10000000 maxlength === 0", function () {
            expect(Component.methods.chooseUnitAndThousandsSeparator(1234567.123, 0)).to.equal("123 ha");
        });
        it("should return correctly formatted number with unit when value < 250000 && maxlength === 0", function () {
            expect(Component.methods.chooseUnitAndThousandsSeparator(14567.123, 0)).to.equal("14.567 m²");
        });
        it("should return correctly formatted number with unit when value > 10000000 &&  maxlength === 1", function () {
            expect(Component.methods.chooseUnitAndThousandsSeparator(99999999.999, 1)).to.equal("100,0 km²");
        });
    });
});
