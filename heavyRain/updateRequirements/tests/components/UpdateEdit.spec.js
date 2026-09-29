import {createStore} from "vuex";
import {expect} from "chai";
import layerCollection from "@core/layers/js/layerCollection.js";
import Polygon from "ol/geom/Polygon.js";
import {rawLayerList} from "@masterportal/masterportalapi/src/index.js";
import {shallowMount} from "@vue/test-utils";
import sinon from "sinon";
import UpdateEdit from "../../components/UpdateEdit.vue";
import wfs from "@masterportal/masterportalapi/src/layer/wfs";


describe("addons/heavyRain/updateRequirements/components/UpdateEdit.vue", () => {
    let currentRequirement,
        drawnGeometry,
        placingPointMarkerSpy,
        store;

    beforeEach(() => {
        currentRequirement = undefined;
        placingPointMarkerSpy = sinon.spy();
        store = createStore({
            namespaced: true,
            modules: {
                namespaced: true,
                Maps: {
                    namespaced: true,
                    actions: {
                        placingPointMarker: placingPointMarkerSpy
                    },
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
                                currentRequirement: () => currentRequirement,
                                maxImageSize: () => 1024 * 1024,
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
                                wfstLayerId: () => "36013"
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
        describe("getCurrentOption", () => {
            it("should return the information type of the given value", () => {
                const wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}});

                expect(wrapper.vm.getCurrentOption("Aktualisierungsbedarf SRGK")).to.deep.equal({
                    "cat": "Aktualisierungsbedarf",
                    "name": "SRGK",
                    "color": "#D55E00"
                });
            });

            it("should return undefined if no information type was selected", () => {
                const wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}});

                expect(wrapper.vm.getCurrentOption(undefined)).to.be.undefined;
                expect(wrapper.vm.getCurrentOption(null)).to.be.undefined;
                expect(wrapper.vm.getCurrentOption("")).to.be.undefined;
                expect(wrapper.vm.getCurrentOption("unbekannt")).to.be.undefined;
            });
        });

        /**
         * Mounts the component with all required fields and a drawn geometry filled in.
         * @returns {Object} the wrapper of the component.
         */
        async function mountFilledForm () {
            const wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}});

            await wrapper.setData({name: "name", initiator: "initiator", contactPerson: "contactPerson"});
            // assigned directly, as setData copies the geometry into a plain object
            wrapper.vm.drawnGeometry = drawnGeometry;

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

        it("should update an edited report instead of inserting a copy", async () => {
            currentRequirement = {id: "ortskenntnisse_aktualisierungsbedarfe.42", formValues: {name: "name", initiator: "initiator", contactPerson: "contactPerson", comment: "", infoLink: "", creationDate: "2026-01-15", informationType: "Eingabe Ortskenntnis"}};

            const sendTransactionStub = sinon.stub(wfs, "sendTransaction").resolves("feature"),
                wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}});

            sinon.stub(rawLayerList, "getLayerWhere").returns({id: "36013", url: "https://example.com/wfs", featurePrefix: "de.hh.up"});
            // assigned directly, as setData copies the geometry into a plain object
            wrapper.vm.drawnGeometry = drawnGeometry;
            await wrapper.vm.onSave();

            expect(sendTransactionStub.firstCall.args[1].getId()).to.equal("ortskenntnisse_aktualisierungsbedarfe.42");
            expect(sendTransactionStub.firstCall.args[4]).to.equal("selectedUpdate");
        });

        it("should insert a new report", async () => {
            const sendTransactionStub = sinon.stub(wfs, "sendTransaction").resolves("feature"),
                wrapper = await mountFilledForm();

            sinon.stub(rawLayerList, "getLayerWhere").returns({id: "36013", url: "https://example.com/wfs"});
            await wrapper.vm.onSave();

            expect(sendTransactionStub.firstCall.args[1].getId()).to.be.undefined;
            expect(sendTransactionStub.firstCall.args[4]).to.equal("insert");
        });

        it("should place the point marker in the center of the saved report", async () => {
            const wrapper = await mountFilledForm();

            sinon.stub(rawLayerList, "getLayerWhere").returns({id: "36013", url: "https://example.com/wfs"});
            sinon.stub(wfs, "sendTransaction").resolves("feature");

            await wrapper.vm.onSave();

            expect(placingPointMarkerSpy.calledOnce).to.be.true;
            expect(placingPointMarkerSpy.firstCall.args[1]).to.deep.equal(drawnGeometry.getInteriorPoint().getCoordinates().slice(0, 2));
        });

        it("should not place the point marker if the transaction fails", async () => {
            const wrapper = await mountFilledForm();

            sinon.stub(console, "error");
            sinon.stub(rawLayerList, "getLayerWhere").returns({id: "36013", url: "https://example.com/wfs"});
            sinon.stub(wfs, "sendTransaction").rejects(new Error("transaction failed"));

            await wrapper.vm.onSave();

            expect(placingPointMarkerSpy.notCalled).to.be.true;
        });

        it("should reload the layer of the saved reports after the report was inserted", async () => {
            const refreshSpy = sinon.spy(),
                getLayerByIdStub = sinon.stub(layerCollection, "getLayerById").withArgs("36013").returns({getLayerSource: () => ({refresh: refreshSpy})}),
                wrapper = await mountFilledForm();

            sinon.stub(rawLayerList, "getLayerWhere").returns({id: "36013", url: "https://example.com/wfs"});
            sinon.stub(wfs, "sendTransaction").resolves("feature");

            await wrapper.vm.onSave();

            expect(getLayerByIdStub.calledOnceWith("36013")).to.be.true;
            expect(refreshSpy.calledOnce).to.be.true;
        });

        it("should show a message and keep the form open if the transaction fails", async () => {
            const getLayerByIdSpy = sinon.spy(layerCollection, "getLayerById"),
                wrapper = await mountFilledForm();

            sinon.stub(console, "error");
            sinon.stub(rawLayerList, "getLayerWhere").returns({id: "36013", url: "https://example.com/wfs"});
            sinon.stub(wfs, "sendTransaction").rejects(new Error("transaction failed"));

            await wrapper.vm.onSave();

            expect(getLayerByIdSpy.notCalled).to.be.true;
            expect(wrapper.vm.isSaving).to.be.false;
            expect(wrapper.vm.showSnackbar).to.be.true;
            expect(wrapper.emitted("click:save")).to.be.undefined;
        });
    });

    describe("Edited report", () => {
        it("should hide the edited report on its layer while it is edited and show it again afterwards", () => {
            const setStyleSpy = sinon.spy();

            currentRequirement = {id: "ortskenntnisse_aktualisierungsbedarfe.42", formValues: {name: "name", initiator: "initiator", contactPerson: "contactPerson", comment: "", infoLink: "", informationType: ""}};
            sinon.stub(layerCollection, "getLayerById").withArgs("36013").returns({getLayerSource: () => ({getFeatureById: () => ({setStyle: setStyleSpy})})});

            const wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}});

            expect(setStyleSpy.calledOnce).to.be.true;
            expect(setStyleSpy.firstCall.args[0]).to.not.be.undefined;

            wrapper.unmount();

            expect(setStyleSpy.calledTwice).to.be.true;
            expect(setStyleSpy.secondCall.args[0]).to.be.undefined;
        });

        it("should pass the geometry of the edited report to the draw component", () => {
            currentRequirement = {id: "ortskenntnisse_aktualisierungsbedarfe.42", geometry: drawnGeometry, formValues: {name: "name", initiator: "initiator", contactPerson: "contactPerson", comment: "", infoLink: "", informationType: ""}};

            const wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}});

            expect(wrapper.findComponent({name: "HrDraw"}).props("geometry")).to.equal(drawnGeometry);
        });
    });

    describe("Image", () => {
        it("should show a preview and a delete button for the saved image of an edited report", async () => {
            currentRequirement = {formValues: {name: "name", initiator: "initiator", contactPerson: "contactPerson", comment: "", infoLink: "", informationType: "", image: "data:image/png;base64,iVBOR"}};

            const wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}});

            // the image is set in mounted, so it is rendered after the next tick
            await wrapper.vm.$nextTick();

            expect(wrapper.find("img.image-preview").attributes("src")).to.equal("data:image/png;base64,iVBOR");
            expect(wrapper.findAllComponents({name: "IconButton"}).some(button => button.props("icon") === "bi bi-trash")).to.be.true;
        });

        it("should not show a preview without an image", () => {
            const wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}});

            expect(wrapper.find("img.image-preview").exists()).to.be.false;
        });

        it("should reject an image which is larger than 1 MB", () => {
            const wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}}),
                file = new File(["x"], "gross.png", {type: "image/png"});

            Object.defineProperty(file, "size", {value: 1024 * 1024 + 1});
            wrapper.vm.loadImage({target: {files: [file]}});

            expect(wrapper.vm.image).to.be.undefined;
            expect(wrapper.vm.imageName).to.be.undefined;
            expect(wrapper.vm.showSnackbar).to.be.true;
            expect(wrapper.vm.snackbarColor).to.equal("error");
        });

        it("should load an image of 1 MB", async () => {
            const wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}}),
                file = new File(["x"], "klein.png", {type: "image/png"});

            Object.defineProperty(file, "size", {value: 1024 * 1024});
            wrapper.vm.loadImage({target: {files: [file]}});
            await vi.waitFor(() => expect(wrapper.vm.image).to.be.a("string"));

            expect(wrapper.vm.image).to.match(/^data:image\/png;base64,/);
            expect(wrapper.vm.imageName).to.equal("klein.png");
        });

        it("should do nothing if no file was chosen", () => {
            const wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}});

            expect(() => wrapper.vm.loadImage({target: {files: []}})).to.not.throw();
            expect(wrapper.vm.image).to.be.undefined;
        });

        it("should delete the image, so that it is removed when the report is saved", async () => {
            currentRequirement = {formValues: {name: "name", initiator: "initiator", contactPerson: "contactPerson", comment: "", infoLink: "", informationType: "", image: "data:image/png;base64,iVBOR"}};

            const wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}});

            wrapper.vm.removeImage();
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.formValues.image).to.be.undefined;
            expect(wrapper.vm.formValues.imageName).to.be.undefined;
            expect(wrapper.find("img.image-preview").exists()).to.be.false;
        });
    });

    describe("Creation date", () => {
        it("should keep the creation date of an edited report", () => {
            currentRequirement = {formValues: {name: "name", initiator: "initiator", contactPerson: "contactPerson", comment: "", infoLink: "", creationDate: "2026-01-15Z", informationType: "Eingabe Ortskenntnis"}};

            const wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}});

            expect(wrapper.vm.creationDate).to.equal("15.01.2026");
            expect(wrapper.vm.formValues.creationDate).to.equal("2026-01-15");
            expect(wrapper.vm.formValues.lastUpdate).to.not.equal("2026-01-15");
        });

        it("should use the current date for a new report", () => {
            const wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}});

            expect(wrapper.vm.formValues.creationDate).to.equal(wrapper.vm.formValues.lastUpdate);
        });

        it("should use the current date for an edited report without a valid creation date", () => {
            const wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}});

            expect(wrapper.vm.getCreatedAt(undefined).isValid()).to.be.true;
            expect(wrapper.vm.getCreatedAt("").format("YYYY-MM-DD")).to.equal(wrapper.vm.formValues.lastUpdate);
            expect(wrapper.vm.getCreatedAt("unbekannt").format("YYYY-MM-DD")).to.equal(wrapper.vm.formValues.lastUpdate);
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
            expect(wrapper.vm.formValues.lastUpdate).to.match(/^\d{4}-\d{2}-\d{2}$/);
        });

        it("should detect a drawn geometry", async () => {
            const wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}});

            expect(wrapper.vm.hasDrawnGeometry).to.be.false;

            await wrapper.setData({drawnGeometry});

            expect(wrapper.vm.hasDrawnGeometry).to.be.true;
        });
    });
});
