import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";

import Component from "../../../components/PlanParken.vue";
import PlanParken from "../../../store/indexPlanParken.js";

config.global.mocks.$t = key => key;

describe("addons/PlanParken/components/PlanParken.vue", () => {
    const geographicValues = ["Box", "Circle", "Polygon"],
        selectionElements = ["Dropdown"],
        mockGraphicalSelectGetters = {
            circleOverlay: sinon.stub(),
            tooltipOverlay: sinon.stub(),
            selectedAreaGeoJson: sinon.stub(),
            geographicValues: () => geographicValues,
            selectionElements: () => selectionElements
        };
    let store,
        spyAddLayerToLayerConfig,
        spyReplaceByIdInLayerConfig,
        spySetRasterActive,
        spySetAlkisAdressesActive,
        layerConfigById;

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
        PlanParken.state.serviceId = "foo";
        PlanParken.mutations.setRasterActive = spySetRasterActive;
        PlanParken.mutations.setAlkisAdressesActive = spySetAlkisAdressesActive;
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        PlanParken: PlanParken,
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
                                setStatus: sinon.stub()
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
                        addLayerOnTop: sinon.stub()
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

    afterEach(() => {
        sinon.restore();
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
    });

    describe("chooseUnitAndThousandsSeparator", () => {
        it("should return m² for value < 1000000", () => {
            expect(Component.methods.chooseUnitAndThousandsSeparator(567, 0)).to.have.string("m²");
        });

        it("should return m² for value slightly below 1000000", () => {
            expect(Component.methods.chooseUnitAndThousandsSeparator(999999.999, 0)).to.have.string("m²");
        });

        it("should return km² for value >= 1000000", () => {
            expect(Component.methods.chooseUnitAndThousandsSeparator(1000000, 0)).to.have.string("km²");
        });

        it("should return correctly formatted number with m² when maxDecimals === 0", () => {
            expect(Component.methods.chooseUnitAndThousandsSeparator(14567.123, 0)).to.equal("14.567 m²");
        });

        it("should return correctly formatted number with km² and decimals", () => {
            expect(Component.methods.chooseUnitAndThousandsSeparator(1234567.123, 3)).to.equal("1,235 km²");
        });

        it("should return correctly formatted number with km² when maxDecimals === 0", () => {
            expect(Component.methods.chooseUnitAndThousandsSeparator(1234567.123, 0)).to.equal("1 km²");
        });

        it("should round km² correctly when maxDecimals === 1", () => {
            expect(Component.methods.chooseUnitAndThousandsSeparator(99999999.999, 1)).to.equal("100 km²");
        });
    });

    describe("handleSuccess", () => {
        it("should format configured area keys with m² or km² and other values with thousandsSeparator", () => {
            PlanParken.state.formatValueOfKeys = ["Suchfläche"];

            const wrapper = shallowMount(Component, {
                    global: {
                        plugins: [store]
                    }
                }),
                setProcessData = sinon.stub(wrapper.vm, "setProcessData");

            sinon.stub(wrapper.vm, "translate").callsFake(key => key);

            const response = JSON.stringify({
                    "Allgemein": {
                        "Suchfläche": {
                            value: 1234567.123,
                            info: "Fläche der Suche"
                        },
                        "Parkplätze": {
                            value: 123456,
                            info: "Anzahl Parkplätze"
                        }
                    }
                }),
                expected = {
                    "Allgemein": {
                        "Suchfläche": {
                            value: "1,23 km²",
                            info: "Fläche der Suche"
                        },
                        "Parkplätze": {
                            value: "123.456",
                            info: "Anzahl Parkplätze"
                        }
                    }
                };

            wrapper.vm.handleSuccess(response);

            expect(setProcessData.calledOnce).to.be.true;
            expect(setProcessData.firstCall.args[0]).to.deep.equal(expected);
        });

        it("should show an error alert and reset the view when response is invalid JSON", () => {
            const wrapper = shallowMount(Component, {
                    global: {
                        plugins: [store]
                    }
                }),
                addSingleAlert = sinon.stub(wrapper.vm, "addSingleAlert"),
                resetView = sinon.stub(wrapper.vm, "resetView"),
                setProcessData = sinon.stub(wrapper.vm, "setProcessData");

            sinon.stub(wrapper.vm, "translate").callsFake(key => key);

            wrapper.vm.handleSuccess("{invalid json");

            expect(setProcessData.called).to.be.false;
            expect(addSingleAlert.calledOnce).to.be.true;
            expect(resetView.calledOnce).to.be.true;

            const alertArg = addSingleAlert.firstCall.args[0];

            expect(alertArg.category).to.equal("error");
            expect(alertArg.title).to.equal("additional:modules.planParken.errors.errorTitle");
        });
    });
});
