import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import {nextTick} from "vue";

import Component from "../../../components/PopulationRequest.vue";
import GraphicalSelectComponent from "../../../../../../src_3_0_0/shared/modules/graphicalSelect/components/GraphicalSelect.vue";
import SwitchInputComponent from "../../../../../../src_3_0_0/shared/modules/checkboxes/components/SwitchInput.vue";
import Module from "../../../store/indexPopulationRequest";

config.global.mocks.$t = key => key;

describe("addons/addons_3_0_0/PopulationRequest/components/PopulationRequest.vue", () => {
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
            selectedAreaGeoJson: sinon.stub(),
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
            setDefaultSelection: sinon.stub(),
            resetGeographicSelection: sinon.stub()
        };
    let store;

    beforeEach(() => {
        store = createStore({
            namespaces: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        PopulationRequest: Module,
                        GraphicalSelect: {
                            namespaced: true,
                            getters: mockGraphicalSelectGetters,
                            actions: mockGraphicalSelectActions,
                            mutations: mockGraphicalSelectMutations
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    mutations: mockMapMutations,
                    actions: mockMapActions
                }
                // GraphicalSelect: {
                //     namespaced: true,
                //     getters: mockGraphicalSelectGetters,
                //     actions: mockGraphicalSelectActions,
                //     mutations: mockGraphicalSelectMutations
                // }
            },
            getters: {
                isDefaultStyle: () => true,
                uiStyle: () => true,
                restServiceById: () => () => true
            }
        });
    });

    it("should exist", async () => {
        const wrapper = shallowMount(Component, {global: {plugins: [store]}});

        expect(wrapper.exists()).to.be.true;
    });

    it("should find GraphicalSelect component", async () => {
        const wrapper = shallowMount(Component, {global: {plugins: [store]}}),
            graphicalSelectWrapper = wrapper.findComponent({name: "GraphicalSelect"});

        expect(graphicalSelectWrapper.exists()).to.be.true;
    });

    it("renders the PopulationRequest tool with the expected divs", async () => {
        const wrapper = shallowMount(Component, {global: {plugins: [store]}});

        expect(wrapper.find("div.dropdown").exists()).to.be.true;
        expect(wrapper.find("div.result").exists()).to.be.false;
        expect(wrapper.find("div.checkbox").exists()).to.be.true;
    });

    it("should call triggerRaster if Raster Checkbox is changed", () => {
        const spyRaster = sinon.spy(Component.methods, "triggerRaster"),
            wrapper = shallowMount(Component, {global: {plugins: [store]}, stubs: {"GraphicalSelect": GraphicalSelectComponent}}),
            rasterComponent = wrapper.findComponent({ref: "rasterCheckBox"});

        rasterComponent.trigger("click");

        nextTick(() => {
            expect(spyRaster.calledOnce).to.be.true;
        });

    });

    it("should call triggerAlkisAdresses if alkisAdresses Checkbox is changed", () => {
        const spyAlkisAdresses = sinon.spy(Component.methods, "triggerAlkisAdresses"),
            wrapper = shallowMount(Component, {global: {plugins: [store]}, stubs: {"SwitchInput": SwitchInputComponent, "GraphicalSelect": GraphicalSelectComponent}}),
            alkisAdressesComponent = wrapper.findComponent({ref: "alkisAdressesCheckBox"});

        alkisAdressesComponent.vm.$emit("change");

        nextTick(() => {
            expect(spyAlkisAdresses.calledOnce).to.be.true;
        });

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
