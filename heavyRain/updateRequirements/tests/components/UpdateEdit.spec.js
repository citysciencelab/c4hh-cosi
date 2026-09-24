import {createStore} from "vuex";
import {expect} from "chai";
import Polygon from "ol/geom/Polygon.js";
import {rawLayerList} from "@masterportal/masterportalapi/src/index.js";
import {shallowMount} from "@vue/test-utils";
import sinon from "sinon";
import UpdateEdit from "../../components/UpdateEdit.vue";
import wfs from "@masterportal/masterportalapi/src/layer/wfs";


describe("addons/heavyRain/updateRequirements/components/UpdateEdit.vue", () => {
    let drawnGeometry,
        store;

    beforeEach(() => {
        store = createStore({
            namespaced: true,
            modules: {
                namespaced: true,
                Maps: {
                    namespaced: true,
                    getters: {
                        projectionCode: () => "EPSG:25832"
                    }
                },
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        UpdateRequirements: {
                            namespaced: true,
                            getters: {
                                informationType: () => [
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
                                ],
                                currentRequirement: () => undefined,
                                wfstAttributes: () => {
                                    return {
                                        projectName: "projektname",
                                        creator: "initiator",
                                        startDate: "baubeginn",
                                        endDate: "bauende",
                                        source: "quelle",
                                        contactPerson: "ansprechpartner",
                                        lastUpdate: "letzte_aktualisierung",
                                        description: "art_der_massnahme",
                                        contactExt: "kontakt_extern",
                                        infoLink: "info_link",
                                        criteria: "kriterien",
                                        history: "historie",
                                        protectedAreas: "schutzniveau"
                                    };
                                },
                                wfstGeometryName: () => "geom",
                                wfstDateFormat: () => "YYYY-MM-DD",
                                wfstId: () => "36013"
                            },
                            mutations: {
                                setCurrentRequirement: sinon.spy()
                            }
                        }
                    }
                }
            }
        });
        drawnGeometry = new Polygon([[[0, 0], [0, 1], [1, 1], [0, 0]]]);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}});

            expect(wrapper.exists()).to.be.true;
        });

        it("should render InputText components", () => {
            const wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}});

            expect(wrapper.findAllComponents({name: "InputText"}).length).to.be.equal(6);
        });

        it("should render FileUpload component", () => {
            const wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}});

            expect(wrapper.findComponent({name: "FileUpload"}).exists()).to.be.true;
        });

        it("should render HrFooter component", () => {
            const wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}});

            expect(wrapper.findComponent({name: "HrFooter"}).exists()).to.be.true;
        });

        it("should render HrSnackbar component", async () => {
            const wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}});

            await wrapper.setData({showSnackbar: true});

            expect(wrapper.findComponent({name: "HrSnackbar"}).exists()).to.be.true;
        });
    });

    describe("Computed Properties", () => {
        it("should get currentOpinion from the first element of informationType", () => {
            const wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}});

            expect(wrapper.vm.currentOpinion).to.deep.equal({
                "cat": "Eingabe",
                "name": "Ortskenntnis",
                "color": "#0055A4"
            });
        });

        it("should get strokeColor from currentOpinion", () => {
            const wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}});

            expect(wrapper.vm.strokeColor).to.deep.equal([0, 85, 164]);
        });
    });

    describe("Methods", () => {
        /**
         * Mounts the component with all required fields and a drawn geometry filled in.
         * @returns {Object} the wrapper of the component.
         */
        async function mountFilledForm () {
            const wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}});

            await wrapper.setData({name: "name", initiator: "initiator", contactPerson: "contactPerson", drawnGeometry});

            return wrapper;
        }

        it("should set invalid to true if required fields are empty", async () => {
            const wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}});

            await wrapper.vm.onSave();

            expect(wrapper.vm.invalid).to.be.true;
            expect(wrapper.emitted("click:save")).to.be.undefined;
        });

        it("should not send a transaction if no geometry was drawn", async () => {
            const sendTransactionStub = sinon.stub(wfs, "sendTransaction"),
                wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}});

            sinon.stub(rawLayerList, "getLayerWhere").returns({id: "36013", url: "https://example.com/wfs"});
            await wrapper.setData({name: "name", initiator: "initiator", contactPerson: "contactPerson"});

            await wrapper.vm.onSave();

            expect(wrapper.vm.invalid).to.be.false;
            expect(sendTransactionStub.notCalled).to.be.true;
            expect(wrapper.vm.showSnackbar).to.be.true;
            expect(wrapper.emitted("click:save")).to.be.undefined;
        });

        it("should insert the report and emit events if the form is filled in", async () => {
            const layerConfig = {id: "36013", url: "https://example.com/wfs"},
                sendTransactionStub = sinon.stub(wfs, "sendTransaction").resolves("feature"),
                wrapper = await mountFilledForm();

            sinon.stub(rawLayerList, "getLayerWhere").returns(layerConfig);

            await wrapper.vm.onSave();

            expect(sendTransactionStub.calledOnce).to.be.true;
            expect(sendTransactionStub.firstCall.args[0]).to.equal("EPSG:25832");
            expect(sendTransactionStub.firstCall.args[2]).to.equal(layerConfig.url);
            expect(sendTransactionStub.firstCall.args[4]).to.equal("insert");
            expect(wrapper.vm.invalid).to.be.false;
            expect(wrapper.emitted("showSnackbarMessage")).to.not.be.undefined;
            expect(wrapper.emitted("click:save")).to.not.be.undefined;
        });

        it("should show a message and keep the form open if the transaction fails", async () => {
            const wrapper = await mountFilledForm();

            sinon.stub(console, "error");
            sinon.stub(rawLayerList, "getLayerWhere").returns({id: "36013", url: "https://example.com/wfs"});
            sinon.stub(wfs, "sendTransaction").rejects(new Error("transaction failed"));

            await wrapper.vm.onSave();

            expect(wrapper.vm.isSaving).to.be.false;
            expect(wrapper.vm.showSnackbar).to.be.true;
            expect(wrapper.emitted("click:save")).to.be.undefined;
        });
    });

    describe("Computed Properties of the transaction", () => {
        it("should trim the values of the form and take the type from the selected opinion", async () => {
            const wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}});

            await wrapper.setData({name: " name ", initiator: "initiator", contactPerson: "contactPerson", comment: " comment "});

            expect(wrapper.vm.formValues.name).to.equal("name");
            expect(wrapper.vm.formValues.comment).to.equal("comment");
            expect(wrapper.vm.formValues.informationType).to.equal("Eingabe Ortskenntnis");
            expect(wrapper.vm.formValues.creationDate).to.match(/^\d{4}-\d{2}-\d{2}$/);
        });

        it("should detect a drawn geometry", async () => {
            const wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}});

            expect(wrapper.vm.hasDrawnGeometry).to.be.false;

            await wrapper.setData({drawnGeometry});

            expect(wrapper.vm.hasDrawnGeometry).to.be.true;
        });
    });
});
