import {createStore} from "vuex";
import {expect} from "chai";
import Feature from "ol/Feature.js";
import {flushPromises, shallowMount} from "@vue/test-utils";
import layerCollection from "@core/layers/js/layerCollection.js";
import sinon from "sinon";
import UpdateRequirements from "../../components/UpdateRequirements.vue";

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
        replaceByIdInLayerConfigSpy,
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
                                wfstAttributes: () => ({informationType: "art_der_angabe"}),
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
        replaceByIdInLayerConfigSpy = sinon.spy();
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

            sinon.stub(layerCollection, "getLayerById").returns({setStyle: setStyleSpy});
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
