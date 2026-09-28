import {createStore} from "vuex";
import {expect} from "chai";
import Feature from "ol/Feature.js";
import {flushPromises, shallowMount} from "@vue/test-utils";
import layerCollection from "@core/layers/js/layerCollection.js";
import Polygon from "ol/geom/Polygon.js";
import Projects from "../../components/Projects.vue";
import sinon from "sinon";
import VectorLayer from "ol/layer/Vector.js";

describe("addons/heavyRain/projects/components/Projects.vue", () => {
    let addOrReplaceLayerSpy,
        placingPointMarkerSpy,
        registerListenerSpy,
        removePointMarkerSpy,
        replaceByIdInLayerConfigSpy,
        setCurrentProjectSpy,
        unregisterListenerSpy,
        store;

    /**
     * Creates the store for the tests.
     * @param {String|null} wfstLayerId - The id of the WFS-T layer showing the saved projects.
     * @param {String} [currentView="main"] - The current view.
     * @returns {Object} the store.
     */
    function createTestStore (wfstLayerId, currentView = "main") {
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
                        Projects: {
                            namespaced: true,
                            getters: {
                                criteria: () => [{
                                    "name": "Bauprojekte (Umsetzungsmaßnahmen)",
                                    "color": "#0055A4"
                                },
                                {
                                    "name": "Bekannte Bereiche (z.B. Presse)",
                                    "color": "#D55E00"
                                }],
                                currentView: () => currentView,
                                currentProject: () => undefined,
                                wfstAttributes: () => ({criteria: "kriterien", projectName: "projektname"}),
                                wfstLayerId: () => wfstLayerId
                            },
                            mutations: {
                                setCurrentProject: setCurrentProjectSpy,
                                setCurrentView: sinon.spy()
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
        setCurrentProjectSpy = sinon.spy();
        unregisterListenerSpy = sinon.spy();
        store = createTestStore("36016");
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(Projects, {global: {plugins: [store]}});

            expect(wrapper.exists()).to.be.true;
        });
    });

    describe("Lifecycle Hooks", () => {
        it("should show the configured layer on the map when mounted", () => {
            shallowMount(Projects, {global: {plugins: [store]}});

            expect(addOrReplaceLayerSpy.calledOnce).to.be.true;
            expect(addOrReplaceLayerSpy.firstCall.args[1]).to.deep.equal({layerId: "36016", visibility: true});
        });

        it("should color the polygons of the layer by the criteria when mounted", async () => {
            const setStyleSpy = sinon.spy();

            sinon.stub(layerCollection, "getLayerById").withArgs("36016").returns({getLayer: () => new VectorLayer(), setStyle: setStyleSpy});
            shallowMount(Projects, {global: {plugins: [store]}});
            await flushPromises();

            const style = setStyleSpy.firstCall.args[0](new Feature({kriterien: "Bekannte Bereiche (z.B. Presse)"}));

            expect(setStyleSpy.calledOnce).to.be.true;
            expect(style.getFill().getColor()).to.deep.equal([213, 94, 0, 0.3]);
        });

        it("should hide the layer when unmounted", () => {
            const wrapper = shallowMount(Projects, {global: {plugins: [store]}});

            wrapper.unmount();

            expect(replaceByIdInLayerConfigSpy.calledOnce).to.be.true;
            expect(replaceByIdInLayerConfigSpy.firstCall.args[1]).to.deep.equal({layerConfigs: [{id: "36016", layer: {visibility: false}}]});
        });

        it("should disable the gfi of the layer when mounted, as the module shows the clicked project", async () => {
            const olLayer = new VectorLayer({gfiAttributes: "showAll"});

            sinon.stub(layerCollection, "getLayerById").withArgs("36016").returns({getLayer: () => olLayer, setStyle: sinon.spy()});
            shallowMount(Projects, {global: {plugins: [store]}});
            await flushPromises();

            expect(olLayer.get("gfiAttributes")).to.equal("ignore");
        });

        it("should remove the point marker when unmounted", () => {
            const wrapper = shallowMount(Projects, {global: {plugins: [store]}});

            wrapper.unmount();

            expect(removePointMarkerSpy.calledOnce).to.be.true;
        });

        it("should register the map click listener when mounted and unregister it when unmounted", async () => {
            const wrapper = shallowMount(Projects, {global: {plugins: [store]}});

            await flushPromises();
            wrapper.unmount();

            expect(registerListenerSpy.calledOnce).to.be.true;
            expect(registerListenerSpy.firstCall.args[1]).to.deep.include({type: "singleclick", keyForBoundFunctions: "heavyRainProjectsClick"});
            expect(unregisterListenerSpy.calledOnce).to.be.true;
            expect(unregisterListenerSpy.firstCall.args[1]).to.deep.include({type: "singleclick", keyForBoundFunctions: "heavyRainProjectsClick"});
        });

        it("should neither add nor hide a layer if no layer is configured", () => {
            const wrapper = shallowMount(Projects, {global: {plugins: [createTestStore(null)]}});

            wrapper.unmount();

            expect(addOrReplaceLayerSpy.notCalled).to.be.true;
            expect(replaceByIdInLayerConfigSpy.notCalled).to.be.true;
        });
    });

    describe("Computed Properties", () => {
        it("should get no criteria if the current project has none", () => {
            const wrapper = shallowMount(Projects, {global: {plugins: [store]}});

            expect(wrapper.vm.projectCriteria).to.deep.equal([]);
        });
    });

    describe("Methods", () => {
        it("should reset the current project and its marker when a new project is created", () => {
            const wrapper = shallowMount(Projects, {global: {plugins: [store]}});

            wrapper.vm.createProject();

            expect(removePointMarkerSpy.calledOnce).to.be.true;
            expect(setCurrentProjectSpy.calledOnce).to.be.true;
            expect(setCurrentProjectSpy.firstCall.args[1]).to.be.undefined;
        });

        describe("onMapClick", () => {
            const olLayer = new VectorLayer(),
                feature = new Feature({
                    geometry: new Polygon([[[0, 0], [1, 0], [1, 1], [0, 0]]]),
                    kriterien: "Bekannte Bereiche (z.B. Presse)",
                    projektname: "Projekt A"
                }),
                evt = {
                    coordinate: [565000, 5935000],
                    pixel: [0, 0],
                    map: {forEachFeatureAtPixel: (pixel, callback, {layerFilter}) => layerFilter(olLayer) ? callback(feature) : undefined}
                };

            beforeEach(() => {
                sinon.stub(layerCollection, "getLayerById").withArgs("36016").returns({getLayer: () => olLayer, setStyle: sinon.spy()});
            });

            it("should set the clicked feature as current project", () => {
                const wrapper = shallowMount(Projects, {global: {plugins: [store]}});

                wrapper.vm.onMapClick(evt);

                expect(setCurrentProjectSpy.calledOnce).to.be.true;
                expect(setCurrentProjectSpy.firstCall.args[1].formValues).to.deep.equal({
                    criteria: "Bekannte Bereiche (z.B. Presse)",
                    projectName: "Projekt A"
                });
                expect(setCurrentProjectSpy.firstCall.args[1].geometry.getCoordinates()).to.deep.equal(feature.getGeometry().getCoordinates());
                expect(placingPointMarkerSpy.calledOnce).to.be.true;
                expect(placingPointMarkerSpy.firstCall.args[1]).to.deep.equal([565000, 5935000]);
            });

            it("should not set a project if no feature was clicked", () => {
                const wrapper = shallowMount(Projects, {global: {plugins: [store]}});

                wrapper.vm.onMapClick({pixel: [0, 0], map: {forEachFeatureAtPixel: () => undefined}});

                expect(setCurrentProjectSpy.notCalled).to.be.true;
                expect(placingPointMarkerSpy.notCalled).to.be.true;
            });

            it("should not set a project in the edit view", () => {
                const wrapper = shallowMount(Projects, {global: {plugins: [createTestStore("36016", "edit")]}});

                wrapper.vm.onMapClick(evt);

                expect(setCurrentProjectSpy.notCalled).to.be.true;
                expect(placingPointMarkerSpy.notCalled).to.be.true;
            });
        });

        describe("getFeatureColor", () => {
            it("should return the color of the criterion with the highest priority", () => {
                const wrapper = shallowMount(Projects, {global: {plugins: [store]}}),
                    feature = new Feature({kriterien: "Bekannte Bereiche (z.B. Presse), Bauprojekte (Umsetzungsmaßnahmen)"});

                expect(wrapper.vm.getFeatureColor(feature)).to.equal("#0055A4");
            });

            it("should return the color of the only criterion", () => {
                const wrapper = shallowMount(Projects, {global: {plugins: [store]}}),
                    feature = new Feature({kriterien: "Bekannte Bereiche (z.B. Presse)"});

                expect(wrapper.vm.getFeatureColor(feature)).to.equal("#D55E00");
            });

            it("should return the first color if the feature has no known criterion", () => {
                const wrapper = shallowMount(Projects, {global: {plugins: [store]}});

                expect(wrapper.vm.getFeatureColor(new Feature())).to.equal("#0055A4");
                expect(wrapper.vm.getFeatureColor(new Feature({kriterien: "unbekannt"}))).to.equal("#0055A4");
            });
        });

        describe("getBgcolor", () => {
            it("should return the first color as standard", () => {
                const wrapper = shallowMount(Projects, {global: {plugins: [store]}});

                expect(wrapper.vm.getBgcolor(0)).to.deep.equal("#0055A4");
                expect(wrapper.vm.getBgcolor(null)).to.deep.equal("#0055A4");
                expect(wrapper.vm.getBgcolor(undefined)).to.deep.equal("#0055A4");
                expect(wrapper.vm.getBgcolor("")).to.deep.equal("#0055A4");
                expect(wrapper.vm.getBgcolor(true)).to.deep.equal("#0055A4");
                expect(wrapper.vm.getBgcolor({})).to.deep.equal("#0055A4");
                expect(wrapper.vm.getBgcolor([])).to.deep.equal("#0055A4");
            });

            it("should return the right color from chosen criteria", () => {
                const wrapper = shallowMount(Projects, {global: {plugins: [store]}}),
                    chosenCriteria = ["Bekannte Bereiche (z.B. Presse)"];

                expect(wrapper.vm.getBgcolor(chosenCriteria)).to.deep.equal("#D55E00");
            });

            it("should ignore empty and unknown criteria", () => {
                const wrapper = shallowMount(Projects, {global: {plugins: [store]}});

                expect(wrapper.vm.getBgcolor([""])).to.equal("#0055A4");
                expect(wrapper.vm.getBgcolor(["unbekannt"])).to.equal("#0055A4");
                expect(wrapper.vm.getBgcolor(["unbekannt", "Bekannte Bereiche (z.B. Presse)"])).to.equal("#D55E00");
            });
        });
    });
});
