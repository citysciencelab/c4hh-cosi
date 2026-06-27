import {createStore} from "vuex";
import {config, mount, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import Component from "../../../components/PopulationRequest.vue";
import GraphicalSelectComponent from "../../../../../src/shared/modules/graphicalSelect/components/GraphicalSelect.vue";
import SwitchInputComponent from "../../../../../src/shared/modules/checkboxes/components/SwitchInput.vue";
import PopulationRequest from "../../../store/indexPopulationRequest.js";

config.global.mocks.$t = key => key;

describe("addons/PopulationRequest/components/PopulationRequest.vue", () => {
    const geographicValues = ["Box", "Circle", "Polygon"],
        selectionElements = ["Dropdown"],
        mockGraphicalSelectGetters = {
            circleOverlay: sinon.stub(),
            tooltipOverlay: sinon.stub(),
            selectedAreaGeoJson: sinon.stub(),
            geographicValues: () => geographicValues,
            selectionElements: () => selectionElements
        },
        alkisAdressLayerId = "9726",
        rasterLayerId = "13023";
    let store,
        spyAddLayerToLayerConfig,
        spyReplaceByIdInLayerConfig,
        spySetRasterActive,
        spySetAlkisAdressesActive,
        layerConfigById;

    beforeAll(() => {
        mapCollection.clear();
        const map = {
            id: "ol",
            mode: "2D",
            removeOverlay: sinon.stub(),
            removeLayer: sinon.stub(),
            getLayers: () => {
                return {
                    getArray: () => {
                        return [];
                    }
                };
            }
        };

        mapCollection.addMap(map, "2D");
    });

    beforeEach(() => {
        const warnSpy = sinon.spy(),
            errorSpy = sinon.spy();

        sinon.stub(console, "warn").callsFake(warnSpy);
        sinon.stub(console, "error").callsFake(errorSpy);
        layerConfigById = false;
        spyAddLayerToLayerConfig = sinon.spy();
        spyReplaceByIdInLayerConfig = sinon.spy();
        spySetRasterActive = sinon.spy();
        spySetAlkisAdressesActive = sinon.spy();
        PopulationRequest.state.serviceId = "foo";
        PopulationRequest.mutations.setRasterActive = spySetRasterActive;
        PopulationRequest.mutations.setAlkisAdressesActive = spySetAlkisAdressesActive;
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        PopulationRequest: PopulationRequest,
                        GraphicalSelect: {
                            namespaced: true,
                            getters: mockGraphicalSelectGetters,
                            actions: {
                                createDomOverlay: sinon.stub(),
                                toggleOverlay: sinon.stub(),
                                setDrawInteractionListener: sinon.stub(),
                                setDefaultSelection: sinon.stub()
                            },
                            mutations: {
                                setCurrentValue: sinon.stub(),
                                setDrawInteraction: sinon.stub(),
                                setDefaultSelection: sinon.stub(),
                                resetGeographicSelection: sinon.stub(),
                                setActive: sinon.stub()
                            }
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    mutations: {
                        addLayerToMap: sinon.stub(),
                        removeLayerFromMap: sinon.stub()
                    },
                    actions: {
                        addInteraction: sinon.stub(),
                        registerListener: sinon.stub(),
                        addLayerOnTop: sinon.stub(),
                        removeInteraction: sinon.stub()
                    },
                    getters: {
                        scale: sinon.stub()
                    }
                }
            },
            getters: {
                isDefaultStyle: () => true,
                uiStyle: () => true,
                restServiceById: () => sinon.stub().returns({id: "foo", typ: "wps", url: "bar"}),
                visibleLayerConfigs: sinon.stub(),
                layerConfigById: () => sinon.stub().returns(layerConfigById),
                determineZIndex: () => sinon.stub().returns(2)
            },
            actions: {
                addLayerToLayerConfig: spyAddLayerToLayerConfig,
                replaceByIdInLayerConfig: spyReplaceByIdInLayerConfig
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
    it("should call triggerRaster if Raster Checkbox is changed", async () => {
        const spyRaster = sinon.spy(Component.methods, "triggerRaster"),
            wrapper = mount(Component, {global: {plugins: [store]}, stubs: {"SwitchInput": SwitchInputComponent, "GraphicalSelect": GraphicalSelectComponent}}),
            rasterComponent = wrapper.find("#rasterCheckBox");

        rasterComponent.trigger("change");
        await wrapper.vm.$nextTick();
        expect(spyRaster.calledOnce).to.be.true;

    });

    it("should call triggerAlkisAdresses if alkisAdresses Checkbox is changed", async () => {
        const spyAlkisAdresses = sinon.spy(Component.methods, "triggerAlkisAdresses"),
            wrapper = mount(Component, {global: {plugins: [store]}, stubs: {"SwitchInput": SwitchInputComponent, "GraphicalSelect": GraphicalSelectComponent}}),
            alkisAdressesComponent = wrapper.find("#alkisAdressesCheckBox");

        alkisAdressesComponent.trigger("change");
        await wrapper.vm.$nextTick();
        expect(spyAlkisAdresses.calledOnce).to.be.true;
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

    describe("watcher", () => {
        it("visibleBaselayerConfigs shall set raster layer on", () => {
            const newLayerConfigs = [{
                    id: rasterLayerId
                }],
                oldLayerConfigs = [],

                wrapper = shallowMount(Component, {
                    global: {
                        plugins: [store]
                    },
                    stubs: {
                        "SwitchInput": SwitchInputComponent,
                        "GraphicalSelect": GraphicalSelectComponent}
                });

            wrapper.vm.$options.watch.visibleLayerConfigs.handler.call(wrapper.vm, newLayerConfigs, oldLayerConfigs);
            expect(spySetRasterActive.calledOnce).to.be.true;
            expect(spySetRasterActive.firstCall.args[1]).to.be.true;
        });
        it("visibleBaselayerConfigs shall set alkis addresses layer on", () => {
            const newLayerConfigs = [{
                    id: alkisAdressLayerId
                }],
                oldLayerConfigs = [],

                wrapper = shallowMount(Component, {
                    global: {
                        plugins: [store]
                    },
                    stubs: {
                        "SwitchInput": SwitchInputComponent,
                        "GraphicalSelect": GraphicalSelectComponent}
                });

            wrapper.vm.$options.watch.visibleLayerConfigs.handler.call(wrapper.vm, newLayerConfigs, oldLayerConfigs);
            expect(spySetAlkisAdressesActive.calledOnce).to.be.true;
            expect(spySetAlkisAdressesActive.firstCall.args[1]).to.be.true;
        });
        it("visibleBaselayerConfigs shall set raster layer off", () => {
            const oldLayerConfigs = [{
                    id: rasterLayerId
                }],
                newLayerConfigs = [],

                wrapper = shallowMount(Component, {
                    global: {
                        plugins: [store]
                    },
                    stubs: {
                        "SwitchInput": SwitchInputComponent,
                        "GraphicalSelect": GraphicalSelectComponent}
                });

            wrapper.vm.$options.watch.visibleLayerConfigs.handler.call(wrapper.vm, newLayerConfigs, oldLayerConfigs);
            expect(spySetRasterActive.calledOnce).to.be.true;
            expect(spySetRasterActive.firstCall.args[1]).to.be.false;
        });
        it("visibleBaselayerConfigs shall set alkis address layer off", () => {
            const oldLayerConfigs = [{
                    id: alkisAdressLayerId
                }],
                newLayerConfigs = [],

                wrapper = shallowMount(Component, {
                    global: {
                        plugins: [store]
                    },
                    stubs: {
                        "SwitchInput": SwitchInputComponent,
                        "GraphicalSelect": GraphicalSelectComponent}
                });

            wrapper.vm.$options.watch.visibleLayerConfigs.handler.call(wrapper.vm, newLayerConfigs, oldLayerConfigs);
            expect(spySetAlkisAdressesActive.calledOnce).to.be.true;
            expect(spySetAlkisAdressesActive.firstCall.args[1]).to.be.false;
        });
    });
});
