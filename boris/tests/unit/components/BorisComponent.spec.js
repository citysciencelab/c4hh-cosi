import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import BorisComponent from "../../../components/BorisComponent.vue";
import Boris from "../../../store/indexBoris.js";
import {expect} from "chai";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("ADDONS: addons/boris/components/BorisComponent.vue", () => {
    const mockConfigJson = {
        Portalconfig: {
            menu: {
                modules: {
                    children: {
                        borisComponent: {
                            "name": "common:menu.tools.boris",
                            "icon": "bi-vinyl"
                        }
                    }
                }
            }
        }
    };
    let store,
        wrapper,
        originalInitialize,
        originalMatchPolygonFeatureWithLanduse,
        originalSimulateLanduseSelect,
        originalSendWpsConvertRequest,
        originalUpdateSelectedBrwFeature;

    beforeAll(() => {
        mapCollection.clear();
        const map = {
            id: "ol",
            mode: "2D",
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
        originalInitialize = Boris.actions.initialize;
        Boris.actions.initialize = sinon.spy();

        originalMatchPolygonFeatureWithLanduse = Boris.actions.matchPolygonFeatureWithLanduse;
        Boris.actions.matchPolygonFeatureWithLanduse = sinon.spy();

        originalSimulateLanduseSelect = Boris.actions.simulateLanduseSelect;
        Boris.actions.simulateLanduseSelect = sinon.spy();

        originalSendWpsConvertRequest = Boris.actions.sendWpsConvertRequest;
        Boris.actions.sendWpsConvertRequest = sinon.spy();

        originalUpdateSelectedBrwFeature = Boris.actions.updateSelectedBrwFeature;
        Boris.actions.updateSelectedBrwFeature = sinon.spy();

        store = createStore({
            namespaces: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        BorisComponent: Boris,
                        Print: {
                            namespaced: true,
                            getters: {printFileReady: () => sinon.stub(),
                                fileDownloadUrl: () => sinon.stub(),
                                filename: () => sinon.stub(),
                                printStarted: () => sinon.stub(),
                                progressWidth: () => sinon.stub()}
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    actions: {
                        registerListener: () => sinon.stub(),
                        unregisterListener: () => sinon.stub()
                    }
                },
                Menu: {
                    namespaced: true,
                    actions: {
                        changeCurrentMouseMapInteractionsComponent: sinon.stub()
                    },
                    mutations: {
                        setDefaultComponent: sinon.stub()
                    }
                }
            },
            getters: {
                mobile: () => false
            },
            state: {
                configJson: mockConfigJson,
                urlParams: {}
            }
        });
    });
    afterEach(() => {
        Boris.actions.initialize = originalInitialize;
        Boris.actions.matchPolygonFeatureWithLanduse = originalMatchPolygonFeatureWithLanduse;
        Boris.actions.simulateLanduseSelect = originalSimulateLanduseSelect;
        Boris.actions.sendWpsConvertRequest = originalSendWpsConvertRequest;
        Boris.actions.updateSelectedBrwFeature = originalUpdateSelectedBrwFeature;

    });

    describe("Boris template", () => {
        it("renders Boris", () => {
            wrapper = shallowMount(BorisComponent, {global: {plugins: [store]}});
            expect(wrapper.find("#boris").exists()).to.be.true;
        });
        it("renders input to toggle boarder stripes", () => {
            wrapper = shallowMount(BorisComponent, {global: {plugins: [store]}});

            expect(wrapper.find("#showStripes").exists()).to.be.true;
            expect(wrapper.find("#showStripes").element.checked).to.be.false;
            expect(wrapper.find(".form-check-label").exists()).to.be.true;
            expect(wrapper.find(".form-check-label").text()).to.equals("additional:modules.boris.toggleStripesLayer");
            expect(wrapper.find(".bootstrap-icon", "bi-question-circle-fill").exists()).to.be.true;
            expect(wrapper.find(".info-text").exists()).to.be.false;

        });
        it("render text to click on polygon if no polygon is selected", () => {
            wrapper = shallowMount(BorisComponent, {global: {plugins: [store]}});
            expect(wrapper.find("#selectPolygonText").text()).to.equals("additional:modules.boris.SelectAreaInMap");
        });
        it("render choose landuse selection", () => {
            const feature = {
                get: () => "value"
            };

            store.commit("Modules/BorisComponent/setSelectedPolygon", feature);
            wrapper = shallowMount(BorisComponent, {global: {plugins: [store]}});

            expect(wrapper.find("#landuseSelect").exists()).to.be.true;
        });
    });

    describe("getFilterListWithoutStripes computed property", () => {
        const layer1 = {
                name: "ich habe -stripes"
            },
            layer2 = {
                name: "ich nicht"
            };

        it("getFilterListWithoutStripes includes & does not include layer without stripes", () => {
            store.state.Modules.BorisComponent.filteredLayerList.push(layer1);
            store.state.Modules.BorisComponent.filteredLayerList.push(layer2);
            wrapper = shallowMount(BorisComponent, {global: {plugins: [store]}});

            expect(wrapper.vm.getFilterListWithoutStripes).to.have.lengthOf(1);
            expect(wrapper.vm.getFilterListWithoutStripes[0]).to.deep.equal(layer2);
        });
    });
    describe("selectedLanduseComputed computed property", () => {
        const oldValue = "BH Burohäuser",
            newValue = "A Acker";

        it("selectedLanduseComputed equals newValue but does not equal oldValue", () => {
            store.commit("Modules/BorisComponent/setSelectedLanduse", newValue);
            wrapper = shallowMount(BorisComponent, {global: {plugins: [store]}});
            expect(wrapper.vm.selectedLanduseComputed).to.equal(newValue);
            expect(wrapper.vm.selectedLanduseComputed).to.not.equal(oldValue);
        });
    });
    describe("selectedPolygon watcher", () => {
        it("landuse select should be simulated if parametric Url is being used ", () => {
            store.state.Modules.BorisComponent.isProcessFromParametricUrl = true;
            wrapper = shallowMount(BorisComponent, {global: {plugins: [store]}});
            wrapper.vm.$options.watch.selectedPolygon.call(wrapper.vm);

            expect(Boris.actions.simulateLanduseSelect.calledOnce).to.equal(true);

        });
    });
    describe("selectedLanduse watcher", () => {
        it("selectedLanduse shall change buttonValue and call matchPolygonFeatureWithLanduse", () => {
            const oldValue = "BH Bürohäuser",
                newValue = "A Acker";

            store.state.Modules.BorisComponent.buttonValue = "liste";
            wrapper = shallowMount(BorisComponent, {global: {plugins: [store]}});
            wrapper.vm.$options.watch.selectedLanduse.call(wrapper.vm, newValue, oldValue);

            expect(store.state.Modules.BorisComponent.buttonValue).to.equals("info");
            expect(Boris.actions.matchPolygonFeatureWithLanduse.calledOnce).to.equal(true);
        });
        it("selectedLanduse shall change selectedBuildDesign to 'EFH Ein- und Zweifamilienhäuser'", () => {
            const oldValue = "BH Bürohäuser",
                newValue = "EFH Ein- und Zweifamilienhäuser";

            store.state.Modules.BorisComponent.buttonValue = "liste";
            wrapper = shallowMount(BorisComponent, {global: {plugins: [store]}});
            wrapper.vm.$options.watch.selectedLanduse.call(wrapper.vm, newValue, oldValue);

            expect(store.state.Modules.BorisComponent.buttonValue).to.equals("info");
            expect(store.state.Modules.BorisComponent.selectedBuildDesign).to.equals("eh Einzelhaus (freistehend)");
            expect(Boris.actions.matchPolygonFeatureWithLanduse.calledOnce).to.equal(true);
        });
        it("selectedLanduse shall change selectedBuildDesign to ''", () => {
            const oldValue = "EFH Ein- und Zweifamilienhäuser",
                newValue = "MFH Mehrfamilienhäuser";

            store.state.Modules.BorisComponent.buttonValue = "liste";
            wrapper = shallowMount(BorisComponent, {global: {plugins: [store]}});
            wrapper.vm.$options.watch.selectedLanduse.call(wrapper.vm, newValue, oldValue);

            expect(store.state.Modules.BorisComponent.selectedBuildDesign).to.equals("");
            expect(Boris.actions.matchPolygonFeatureWithLanduse.calledOnce).to.equal(true);
        });
    });
    describe("selectedBrwFeature watcher", () => {
        it("selectedBrwFeature: should change buttonValue to 'info'", () => {
            const oldVal = {"schichtwert": 3},
                newVal = {"schichtwert": null},
                values = [{
                    "attributes": oldVal,
                    get: (key)=> {
                        return oldVal[key];
                    }
                },
                {"attributes": newVal,
                    get: (key)=> {
                        return newVal[key];
                    }
                }
                ],
                oldValue = values[0],
                newValue = values[1];

            store.state.Modules.BorisComponent.selectedPolygon = null;
            store.state.Modules.BorisComponent.buttonValue = "liste";
            wrapper = shallowMount(BorisComponent, {global: {plugins: [store]}});
            wrapper.vm.$options.watch.selectedBrwFeature.call(wrapper.vm, newValue, oldValue);
            expect(store.state.Modules.BorisComponent.buttonValue).to.equals("info");
        });
    });
    describe("toggleInfoText method", () => {
        it("toggleInfoText", () => {
            store.state.Modules.BorisComponent.textIds = ["id1", "id2"];
            wrapper = shallowMount(BorisComponent, {global: {plugins: [store]}});
            wrapper.vm.toggleInfoText("id3");
            wrapper.vm.toggleInfoText("id2");

            expect(store.state.Modules.BorisComponent.textIds).to.have.lengthOf(2);
            expect(store.state.Modules.BorisComponent.textIds).that.includes("id3");
            expect(store.state.Modules.BorisComponent.textIds).that.does.not.include("id2");
        });
    });
    describe("handle input and option change methods", () => {
        it("handle option change: handleBuildingDesignOptionChange", () => {
            const event = {target: {value: store.state.Modules.BorisComponent.buildingDesigns[1]}, get: () => "value"},
                subject = "zBauweise";

            wrapper = shallowMount(BorisComponent, {global: {plugins: [store]}});

            wrapper.vm.handleBuildingDesignOptionChange(event, subject);
            expect(store.state.Modules.BorisComponent.selectedBuildDesign).to.equal(store.state.Modules.BorisComponent.buildingDesigns[1]);
            expect(Boris.actions.updateSelectedBrwFeature.calledOnce).to.equal(true);
            expect(Boris.actions.sendWpsConvertRequest.calledOnce).to.equal(true);

        });
        it("handle option change: handlePositionToStreetOptionChange", () => {
            const event = {target: {value: store.state.Modules.BorisComponent.positionsToStreet[1]}, get: () => "value"},
                subject = "zStrassenLage";

            wrapper = shallowMount(BorisComponent, {global: {plugins: [store]}});
            wrapper.vm.handlePositionToStreetOptionChange(event, subject);

            expect(store.state.Modules.BorisComponent.selectedPositionToStreet).to.equal(store.state.Modules.BorisComponent.positionsToStreet[1]);
            expect(Boris.actions.updateSelectedBrwFeature.calledOnce).to.equal(true);
            expect(Boris.actions.sendWpsConvertRequest.calledOnce).to.equal(true);

        });
        it("handleInputChange", () => {
            const event = {type: "change", key: "Enter", currentTarget: {value: "12,34"}},
                subject = "345";

            wrapper = shallowMount(BorisComponent, {global: {plugins: [store]}});
            wrapper.vm.handleInputChange(event, subject);
            expect(Boris.actions.updateSelectedBrwFeature.calledOnce).to.equal(true);
            expect(Boris.actions.sendWpsConvertRequest.calledOnce).to.equal(true);

        });
    });
    describe("startPrint method", () => {
        it("startPrint", () => {
            store.state.Modules.BorisComponent.selectedBrwFeature = {id: 1, name: "feature1", get: () => "value"};

            let printButton = null;
            const startPrintSpy = sinon.stub(BorisComponent.methods, "startPrint");

            wrapper = shallowMount(BorisComponent, {global: {plugins: [store]}});
            printButton = wrapper.find(".btn-infos");

            printButton.trigger("click");
            wrapper.vm.$nextTick();

            expect(startPrintSpy.calledOnce).to.equal(true);
        });
    });

});


