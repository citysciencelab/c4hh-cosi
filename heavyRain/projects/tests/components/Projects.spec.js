import {createStore} from "vuex";
import {expect} from "chai";
import Feature from "ol/Feature.js";
import {flushPromises, shallowMount} from "@vue/test-utils";
import layerCollection from "@core/layers/js/layerCollection.js";
import Projects from "../../components/Projects.vue";
import sinon from "sinon";

describe("addons/heavyRain/projects/components/Projects.vue", () => {
    let addOrReplaceLayerSpy,
        replaceByIdInLayerConfigSpy,
        store;

    /**
     * Creates the store for the tests.
     * @param {String|null} wfstLayerId - The id of the WFS-T layer showing the saved projects.
     * @returns {Object} the store.
     */
    function createTestStore (wfstLayerId) {
        return createStore({
            namespaced: true,
            actions: {
                addOrReplaceLayer: addOrReplaceLayerSpy,
                replaceByIdInLayerConfig: replaceByIdInLayerConfigSpy
            },
            modules: {
                namespaced: true,
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
                                currentView: () => "main",
                                currentProject: () => undefined,
                                wfstAttributes: () => ({criteria: "kriterien"}),
                                wfstLayerId: () => wfstLayerId
                            },
                            mutations: {
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
        replaceByIdInLayerConfigSpy = sinon.spy();
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

            sinon.stub(layerCollection, "getLayerById").returns({setStyle: setStyleSpy});
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

        it("should neither add nor hide a layer if no layer is configured", () => {
            const wrapper = shallowMount(Projects, {global: {plugins: [createTestStore(null)]}});

            wrapper.unmount();

            expect(addOrReplaceLayerSpy.notCalled).to.be.true;
            expect(replaceByIdInLayerConfigSpy.notCalled).to.be.true;
        });
    });

    describe("Methods", () => {
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
        });
    });
});
