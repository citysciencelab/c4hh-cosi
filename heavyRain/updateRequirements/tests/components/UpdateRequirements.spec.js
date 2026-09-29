import {createStore} from "vuex";
import {expect} from "chai";
import Feature from "ol/Feature.js";
import {flushPromises, shallowMount} from "@vue/test-utils";
import layerCollection from "@core/layers/js/layerCollection.js";
import Polygon from "ol/geom/Polygon.js";
import sinon from "sinon";
import UpdateRequirements from "../../components/UpdateRequirements.vue";
import VectorLayer from "ol/layer/Vector.js";

describe("addons/heavyRain/updateRequirements/components/updateRequirements.vue", () => {
    const informationTypes = [
        {
            "cat": "Eingabe",
            "name": "Ortskenntnis",
            "color": "#0055A4"
        },
        {
            "cat": "Aktualisierungsbedarf",
            "name": "SRGK",
            "color": "#D55E00"
        }
    ];
    let addOrReplaceLayerSpy,
        placingPointMarkerSpy,
        registerListenerSpy,
        removePointMarkerSpy,
        replaceByIdInLayerConfigSpy,
        unregisterListenerSpy,
        setCurrentRequirementSpy,
        setCurrentViewSpy,
        store;

    /**
     * Creates the store for the tests.
     * @param {Object} [options={}] - The values of the getters.
     * @param {String|null} [options.wfstLayerId="36013"] - The id of the WFS-T layer showing the saved reports.
     * @param {Object[]} [options.informationType=[]] - The information types with their colors.
     * @param {Object} [options.currentRequirement={}] - The current requirement.
     * @param {String} [options.currentView="main"] - The current view.
     * @returns {Object} the store.
     */
    function createTestStore ({wfstLayerId = "36013", informationType = [], currentRequirement = {}, currentView = "main"} = {}) {
        return createStore({
            namespaced: true,
            actions: {
                addOrReplaceLayer: addOrReplaceLayerSpy,
                replaceByIdInLayerConfig: replaceByIdInLayerConfigSpy
            },
            modules: {
                namespaced: true,
                Maps: {
                    namespaced: true,
                    actions: {
                        placingPointMarker: placingPointMarkerSpy,
                        registerListener: registerListenerSpy,
                        removePointMarker: removePointMarkerSpy,
                        unregisterListener: unregisterListenerSpy
                    }
                },
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        UpdateRequirements: {
                            namespaced: true,
                            getters: {
                                currentRequirement: () => currentRequirement,
                                currentView: () => currentView,
                                informationType: () => informationType,
                                wfstAttributes: () => ({informationType: "art_der_angabe", name: "name"}),
                                wfstLayerId: () => wfstLayerId
                            },
                            mutations: {
                                setCurrentRequirement: setCurrentRequirementSpy,
                                setCurrentView: setCurrentViewSpy
                            }
                        }
                    }
                }
            }
        });
    }

    beforeEach(() => {
        addOrReplaceLayerSpy = sinon.spy();
        placingPointMarkerSpy = sinon.spy();
        registerListenerSpy = sinon.spy();
        removePointMarkerSpy = sinon.spy();
        replaceByIdInLayerConfigSpy = sinon.spy();
        unregisterListenerSpy = sinon.spy();
        setCurrentRequirementSpy = sinon.spy();
        setCurrentViewSpy = sinon.spy();
        store = createTestStore();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Lifecycle Hooks", () => {
        it("should show the configured layer on the map when mounted", () => {
            shallowMount(UpdateRequirements, {global: {plugins: [store]}});

            expect(addOrReplaceLayerSpy.calledOnce).to.be.true;
            expect(addOrReplaceLayerSpy.firstCall.args[1]).to.deep.equal({layerId: "36013", visibility: true});
        });

        it("should color the polygons of the layer by the information type when mounted", async () => {
            const setStyleSpy = sinon.spy();

            sinon.stub(layerCollection, "getLayerById").withArgs("36013").returns({getLayer: () => new VectorLayer(), setStyle: setStyleSpy});
            shallowMount(UpdateRequirements, {global: {plugins: [createTestStore({informationType: informationTypes})]}});
            await flushPromises();

            const style = setStyleSpy.firstCall.args[0](new Feature({art_der_angabe: "Aktualisierungsbedarf SRGK"}));

            expect(setStyleSpy.calledOnce).to.be.true;
            expect(style.getFill().getColor()).to.deep.equal([213, 94, 0, 0.3]);
        });

        it("should hide the layer when unmounted", () => {
            const wrapper = shallowMount(UpdateRequirements, {global: {plugins: [store]}});

            wrapper.unmount();

            expect(replaceByIdInLayerConfigSpy.calledOnce).to.be.true;
            expect(replaceByIdInLayerConfigSpy.firstCall.args[1]).to.deep.equal({layerConfigs: [{id: "36013", layer: {visibility: false}}]});
        });

        it("should disable the gfi of the layer when mounted, as the module shows the clicked report", async () => {
            const olLayer = new VectorLayer({gfiAttributes: "showAll"});

            sinon.stub(layerCollection, "getLayerById").withArgs("36013").returns({getLayer: () => olLayer, setStyle: sinon.spy()});
            shallowMount(UpdateRequirements, {global: {plugins: [store]}});
            await flushPromises();

            expect(olLayer.get("gfiAttributes")).to.equal("ignore");
        });

        it("should remove the point marker when unmounted", () => {
            const wrapper = shallowMount(UpdateRequirements, {global: {plugins: [store]}});

            wrapper.unmount();

            expect(removePointMarkerSpy.calledOnce).to.be.true;
        });

        it("should register the map click listener when mounted and unregister it when unmounted", async () => {
            const wrapper = shallowMount(UpdateRequirements, {global: {plugins: [store]}});

            await flushPromises();
            wrapper.unmount();

            expect(registerListenerSpy.calledOnce).to.be.true;
            expect(registerListenerSpy.firstCall.args[1]).to.deep.include({type: "singleclick", keyForBoundFunctions: "heavyRainUpdateRequirementsClick"});
            expect(unregisterListenerSpy.calledOnce).to.be.true;
            expect(unregisterListenerSpy.firstCall.args[1]).to.deep.include({type: "singleclick", keyForBoundFunctions: "heavyRainUpdateRequirementsClick"});
        });

        it("should neither add nor hide a layer if no layer is configured", () => {
            const wrapper = shallowMount(UpdateRequirements, {global: {plugins: [createTestStore({wfstLayerId: null})]}});

            wrapper.unmount();

            expect(addOrReplaceLayerSpy.notCalled).to.be.true;
            expect(replaceByIdInLayerConfigSpy.notCalled).to.be.true;
        });
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(UpdateRequirements, {global: {plugins: [store]}});

            expect(wrapper.exists()).to.be.true;
        });

        it("should render HrHeader in main view", () => {
            const wrapper = shallowMount(UpdateRequirements, {global: {plugins: [store]}});

            expect(wrapper.findComponent({name: "HrHeader"}).exists()).to.be.true;
            expect(wrapper.findComponent({name: "HrFooter"}).exists()).to.be.false;
        });

        it("should render UpdateEdit in create-new view", async () => {
            const wrapper = shallowMount(UpdateRequirements, {global: {plugins: [createTestStore({informationType: informationTypes, currentView: "create-new"})]}});

            expect(wrapper.findComponent({name: "HrHeader"}).exists()).to.be.false;
            expect(wrapper.findComponent({name: "UpdateEdit"}).exists()).to.be.true;
        });

        it("should render HrSnackbar", async () => {
            const wrapper = shallowMount(UpdateRequirements, {global: {plugins: [store]}});

            await wrapper.setData({showSnackbar: true});

            expect(wrapper.findComponent({name: "HrSnackbar"}).exists()).to.be.true;
        });
    });

    describe("Computed Properties", () => {
        it("should get the source of the saved image of the current report", () => {
            const currentRequirement = {formValues: {name: "Meldung A", image: "data:image/png;base64,iVBOR"}},
                wrapper = shallowMount(UpdateRequirements, {global: {plugins: [createTestStore({currentRequirement})]}});

            expect(wrapper.vm.imageSrc).to.equal("data:image/png;base64,iVBOR");
        });

        it("should get no image source if the report has no image", () => {
            const currentRequirement = {formValues: {name: "Meldung A", image: ""}},
                wrapper = shallowMount(UpdateRequirements, {global: {plugins: [createTestStore({currentRequirement})]}});

            expect(wrapper.vm.imageSrc).to.be.undefined;
        });

        it("should get currentOpinion as undefined", () => {
            const wrapper = shallowMount(UpdateRequirements, {global: {plugins: [store]}});

            expect(wrapper.vm.currentOpinion).to.be.undefined;
        });

        it("should get currentOpinion from the first element of informationType", () => {
            const currentRequirement = {
                    formValues: {
                        informationType: "Aktualisierungsbedarf SRGK"
                    }
                },
                wrapper = shallowMount(UpdateRequirements, {global: {plugins: [createTestStore({informationType: informationTypes, currentRequirement})]}});

            expect(wrapper.vm.currentOpinion).to.deep.equal({
                "cat": "Aktualisierungsbedarf",
                "name": "SRGK",
                "color": "#D55E00"
            });
        });
    });

    describe("Methods", () => {
        describe("onMapClick", () => {
            const olLayer = new VectorLayer(),
                feature = new Feature({
                    geometry: new Polygon([[[0, 0], [1, 0], [1, 1], [0, 0]]]),
                    art_der_angabe: "Aktualisierungsbedarf SRGK",
                    name: "Meldung A"
                }),
                evt = {
                    coordinate: [565000, 5935000],
                    pixel: [0, 0],
                    map: {forEachFeatureAtPixel: (pixel, callback, {layerFilter}) => layerFilter(olLayer) ? callback(feature) : undefined}
                };

            beforeEach(() => {
                feature.setId("ortskenntnisse_aktualisierungsbedarfe.42");
                sinon.stub(layerCollection, "getLayerById").withArgs("36013").returns({getLayer: () => olLayer, setStyle: sinon.spy()});
            });

            it("should set the clicked feature as current requirement", () => {
                const wrapper = shallowMount(UpdateRequirements, {global: {plugins: [store]}});

                wrapper.vm.onMapClick(evt);

                expect(setCurrentRequirementSpy.calledOnce).to.be.true;
                expect(setCurrentRequirementSpy.firstCall.args[1].id).to.equal("ortskenntnisse_aktualisierungsbedarfe.42");
                expect(setCurrentRequirementSpy.firstCall.args[1].formValues).to.deep.equal({
                    informationType: "Aktualisierungsbedarf SRGK",
                    name: "Meldung A"
                });
                expect(setCurrentRequirementSpy.firstCall.args[1].geometry.getCoordinates()).to.deep.equal(feature.getGeometry().getCoordinates());
                expect(placingPointMarkerSpy.calledOnce).to.be.true;
                expect(placingPointMarkerSpy.firstCall.args[1]).to.deep.equal([565000, 5935000]);
            });

            it("should not set a requirement if no feature was clicked", () => {
                const wrapper = shallowMount(UpdateRequirements, {global: {plugins: [store]}});

                wrapper.vm.onMapClick({pixel: [0, 0], map: {forEachFeatureAtPixel: () => undefined}});

                expect(setCurrentRequirementSpy.notCalled).to.be.true;
                expect(placingPointMarkerSpy.notCalled).to.be.true;
            });

            it("should not set a requirement in the create-new view", () => {
                const wrapper = shallowMount(UpdateRequirements, {global: {plugins: [createTestStore({informationType: informationTypes, currentView: "create-new"})]}});

                wrapper.vm.onMapClick(evt);

                expect(setCurrentRequirementSpy.notCalled).to.be.true;
                expect(placingPointMarkerSpy.notCalled).to.be.true;
            });
        });

        it("should return the color of the information type of the feature", () => {
            const wrapper = shallowMount(UpdateRequirements, {global: {plugins: [createTestStore({informationType: informationTypes})]}});

            expect(wrapper.vm.getFeatureColor(new Feature({art_der_angabe: "Aktualisierungsbedarf SRGK"}))).to.equal("#D55E00");
        });

        it("should return the first color if the information type of the feature is unknown", () => {
            const wrapper = shallowMount(UpdateRequirements, {global: {plugins: [createTestStore({informationType: informationTypes})]}});

            expect(wrapper.vm.getFeatureColor(new Feature())).to.equal("#0055A4");
            expect(wrapper.vm.getFeatureColor(new Feature({art_der_angabe: "unbekannt"}))).to.equal("#0055A4");
        });

        it("should return undefined as color if there are no information types", () => {
            const wrapper = shallowMount(UpdateRequirements, {global: {plugins: [store]}});

            expect(wrapper.vm.getFeatureColor(new Feature())).to.be.undefined;
        });

        it("should reset the current report and its marker when a new report is created", () => {
            const wrapper = shallowMount(UpdateRequirements, {global: {plugins: [store]}});

            wrapper.vm.createRequirement();

            expect(removePointMarkerSpy.calledOnce).to.be.true;
            expect(setCurrentRequirementSpy.calledOnce).to.be.true;
            expect(setCurrentRequirementSpy.firstCall.args[1]).to.be.undefined;
            expect(setCurrentViewSpy.firstCall.args[1]).to.equal("create-new");
        });

        it("should set snackbar data on showSnackbarMessage", () => {
            const wrapper = shallowMount(UpdateRequirements, {global: {plugins: [store]}});

            wrapper.vm.showSnackbarMessage("test message", "error");

            expect(wrapper.vm.showSnackbar).to.be.true;
            expect(wrapper.vm.snackbarMessage).to.equal("test message");
            expect(wrapper.vm.snackbarColor).to.equal("error");
        });

        it("should default snackbarColor to success", () => {
            const wrapper = shallowMount(UpdateRequirements, {global: {plugins: [store]}});

            wrapper.vm.showSnackbarMessage("test message");

            expect(wrapper.vm.snackbarColor).to.equal("success");
        });
    });
});
