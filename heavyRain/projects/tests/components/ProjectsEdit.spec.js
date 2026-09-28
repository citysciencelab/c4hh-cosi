import {createStore} from "vuex";
import {expect} from "chai";
import layerCollection from "@core/layers/js/layerCollection.js";
import Polygon from "ol/geom/Polygon.js";
import ProjectsEdit from "../../components/ProjectsEdit.vue";
import {rawLayerList} from "@masterportal/masterportalapi/src/index.js";
import {shallowMount} from "@vue/test-utils";
import sinon from "sinon";
import wfs from "@masterportal/masterportalapi/src/layer/wfs";


describe("addons/heavyRain/projects/components/ProjectsEdit.vue", () => {
    let currentProject,
        drawnGeometry,
        placingPointMarkerSpy,
        setCurrentViewSpy,
        setCurrentProject,
        store;

    beforeEach(() => {
        currentProject = undefined;
        placingPointMarkerSpy = sinon.spy();
        setCurrentViewSpy = sinon.spy();
        setCurrentProject = sinon.spy();
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
                        Projects: {
                            namespaced: true,
                            getters: {
                                criteria: () => [{
                                    "name": "Bekannte Bereiche (z.B. Presse)",
                                    "color": "#D55E00"
                                },
                                {
                                    "name": "Bauprojekte (Umsetzungsmaßnahmen)",
                                    "color": "#0055A4"
                                },
                                {
                                    "name": "Bekannte Bereiche (z.B. Presse)",
                                    "color": "#D55E00"
                                }],
                                currentProject: () => currentProject,
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
                                wfstLayerId: () => "36016"
                            },
                            mutations: {
                                setCurrentView: setCurrentViewSpy,
                                setCurrentProject: setCurrentProject
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
            const wrapper = shallowMount(ProjectsEdit, {global: {plugins: [store]}});

            expect(wrapper.exists()).to.be.true;
        });

        it("should render InputText component", () => {
            const wrapper = shallowMount(ProjectsEdit, {global: {plugins: [store]}});

            expect(wrapper.findAllComponents({name: "InputText"}).length).to.be.equal(11);
        });

        it("should render Multiselect component", () => {
            const wrapper = shallowMount(ProjectsEdit, {global: {plugins: [store]}});

            expect(wrapper.findComponent({name: "FileUpload"}).exists()).to.be.true;
        });

        it("should render FileUpload component", () => {
            const wrapper = shallowMount(ProjectsEdit, {global: {plugins: [store]}});

            expect(wrapper.findComponent({name: "FileUpload"}).exists()).to.be.true;
        });

        it("should render footer component", () => {
            const wrapper = shallowMount(ProjectsEdit, {global: {plugins: [store]}});

            expect(wrapper.findComponent({name: "HrFooter"}).exists()).to.be.true;
        });

        it("should render HrSnackbar component", async () => {
            const wrapper = shallowMount(ProjectsEdit, {global: {plugins: [store]}});

            wrapper.setData({"showSnackbar": true});

            expect(wrapper.findComponent({name: "HrSnackbar"}).exists()).to.be.true;
        });
    });

    describe("Edited project", () => {
        it("should hide the edited project on its layer while it is edited and show it again afterwards", () => {
            const setStyleSpy = sinon.spy();

            currentProject = {id: "starkregenprojekte.7", geometry: drawnGeometry, formValues: {criteria: ""}};
            sinon.stub(layerCollection, "getLayerById").withArgs("36016").returns({getLayerSource: () => ({getFeatureById: () => ({setStyle: setStyleSpy})})});

            const wrapper = shallowMount(ProjectsEdit, {global: {plugins: [store]}});

            expect(setStyleSpy.calledOnce).to.be.true;
            expect(setStyleSpy.firstCall.args[0]).to.not.be.undefined;
            expect(wrapper.findComponent({name: "HrDraw"}).props("geometry")).to.equal(drawnGeometry);

            wrapper.unmount();

            expect(setStyleSpy.calledTwice).to.be.true;
            expect(setStyleSpy.secondCall.args[0]).to.be.undefined;
        });
    });

    describe("Computed Properties", () => {
        it("should get strokeColor as standard array", () => {
            const wrapper = shallowMount(ProjectsEdit, {global: {plugins: [store]}});

            expect(wrapper.vm.strokeColor).to.deep.equal([213, 94, 0]);
        });

        it("should get strokeColor from chosen criteria", async () => {
            const wrapper = shallowMount(ProjectsEdit, {global: {plugins: [store]}});

            await wrapper.setData({chosenCriteria: [{
                "name": "Bauprojekte (Umsetzungsmaßnahmen)",
                "color": "#0055A4"
            }]});

            expect(wrapper.vm.strokeColor).to.deep.equal([0, 85, 164]);
        });

        it("should get strokeColor from chosen criteria with a higher priority", async () => {
            const wrapper = shallowMount(ProjectsEdit, {global: {plugins: [store]}});

            await wrapper.setData({chosenCriteria: [{
                "name": "Bekannte Bereiche (z.B. Presse)",
                "color": "#D55E00"
            },
            {
                "name": "Bauprojekte (Umsetzungsmaßnahmen)",
                "color": "#0055A4"
            }]});

            expect(wrapper.vm.strokeColor).to.deep.equal([213, 94, 0]);
        });

        it("should get the first strokeColor for a criterion which is not in the list", async () => {
            const wrapper = shallowMount(ProjectsEdit, {global: {plugins: [store]}});

            await wrapper.setData({chosenCriteria: [{name: "eigenes Kriterium"}]});

            expect(wrapper.vm.strokeColor).to.deep.equal([213, 94, 0]);
        });

        it("should trim the values of the form and join the chosen criteria", async () => {
            const wrapper = shallowMount(ProjectsEdit, {global: {plugins: [store]}});

            await wrapper.setData({
                chosenCriteria: [{"name": "Bauprojekte (Umsetzungsmaßnahmen)", "color": "#0055A4"}, {"name": "Bekannte Bereiche (z.B. Presse)", "color": "#D55E00"}],
                projectName: " name ",
                startDate: "2026-01-01"
            });

            expect(wrapper.vm.formValues.projectName).to.equal("name");
            expect(wrapper.vm.formValues.startDate).to.equal("2026-01-01");
            expect(wrapper.vm.formValues.criteria).to.equal("Bauprojekte (Umsetzungsmaßnahmen), Bekannte Bereiche (z.B. Presse)");
        });

        it("should detect a drawn geometry", async () => {
            const wrapper = shallowMount(ProjectsEdit, {global: {plugins: [store]}});

            expect(wrapper.vm.hasDrawnGeometry).to.be.false;

            await wrapper.setData({drawnGeometry});

            expect(wrapper.vm.hasDrawnGeometry).to.be.true;
        });
    });

    describe("Methods", () => {
        it("should set invalid to true if there are required fields with empty text", async () => {
            const wrapper = shallowMount(ProjectsEdit, {global: {plugins: [store]}});

            await wrapper.vm.onSave();

            expect(wrapper.vm.invalid).to.be.true;
            expect(setCurrentViewSpy.notCalled).to.be.true;
        });

        it("should not send a transaction if no geometry was drawn", async () => {
            const sendTransactionStub = sinon.stub(wfs, "sendTransaction"),
                wrapper = shallowMount(ProjectsEdit, {global: {plugins: [store]}});

            await wrapper.setData({contactPerson: "contactPerson", creator: "creator", projectName: "name"});
            await wrapper.vm.onSave();

            expect(wrapper.vm.invalid).to.be.false;
            expect(sendTransactionStub.notCalled).to.be.true;
            expect(wrapper.vm.showSnackbar).to.be.true;
            expect(setCurrentViewSpy.notCalled).to.be.true;
        });

        it("should insert the project and switch to the main view if the form is filled in", async () => {
            const layerConfig = {id: "36016", url: "https://example.com/wfs"},
                sendTransactionStub = sinon.stub(wfs, "sendTransaction").resolves("feature"),
                wrapper = shallowMount(ProjectsEdit, {global: {plugins: [store]}});

            sinon.stub(rawLayerList, "getLayerWhere").returns(layerConfig);
            await wrapper.setData({contactPerson: "contactPerson", creator: "creator", projectName: "name"});
            // assigned directly, as setData copies the geometry into a plain object
            wrapper.vm.drawnGeometry = drawnGeometry;
            await wrapper.vm.onSave();

            expect(sendTransactionStub.calledOnce).to.be.true;
            expect(sendTransactionStub.firstCall.args[0]).to.equal("EPSG:25832");
            expect(sendTransactionStub.firstCall.args[2]).to.equal(layerConfig.url);
            expect(sendTransactionStub.firstCall.args[4]).to.equal("insert");
            expect(wrapper.emitted("showSnackbarMessage")).to.not.be.undefined;
            expect(setCurrentViewSpy.calledOnce).to.be.true;
        });

        it("should update an edited project instead of inserting a copy", async () => {
            currentProject = {
                id: "starkregenprojekte.7",
                formValues: {
                    contactExt: "",
                    contactPerson: "contactPerson",
                    creator: "creator",
                    criteria: "",
                    description: "",
                    endDate: "",
                    history: "",
                    infoLink: "",
                    projectName: "name",
                    protectedAreas: "",
                    source: "",
                    startDate: ""
                }
            };

            const sendTransactionStub = sinon.stub(wfs, "sendTransaction").resolves("feature"),
                wrapper = shallowMount(ProjectsEdit, {global: {plugins: [store]}});

            sinon.stub(rawLayerList, "getLayerWhere").returns({id: "36016", url: "https://example.com/wfs", featurePrefix: "de.hh.up"});
            // assigned directly, as setData copies the geometry into a plain object
            wrapper.vm.drawnGeometry = drawnGeometry;
            await wrapper.vm.onSave();

            expect(sendTransactionStub.firstCall.args[1].getId()).to.equal("starkregenprojekte.7");
            expect(sendTransactionStub.firstCall.args[4]).to.equal("selectedUpdate");
            expect(setCurrentProject.firstCall.args[1].id).to.equal("starkregenprojekte.7");
        });

        it("should insert a new project", async () => {
            const sendTransactionStub = sinon.stub(wfs, "sendTransaction").resolves("feature"),
                wrapper = shallowMount(ProjectsEdit, {global: {plugins: [store]}});

            sinon.stub(rawLayerList, "getLayerWhere").returns({id: "36016", url: "https://example.com/wfs"});
            await wrapper.setData({contactPerson: "contactPerson", creator: "creator", projectName: "name"});
            // assigned directly, as setData copies the geometry into a plain object
            wrapper.vm.drawnGeometry = drawnGeometry;
            await wrapper.vm.onSave();

            expect(sendTransactionStub.firstCall.args[1].getId()).to.be.undefined;
            expect(sendTransactionStub.firstCall.args[4]).to.equal("insert");
            expect(setCurrentProject.firstCall.args[1].id).to.be.undefined;
        });

        it("should place the point marker in the center of the saved project", async () => {
            const wrapper = shallowMount(ProjectsEdit, {global: {plugins: [store]}});

            sinon.stub(rawLayerList, "getLayerWhere").returns({id: "36016", url: "https://example.com/wfs"});
            sinon.stub(wfs, "sendTransaction").resolves("feature");
            await wrapper.setData({contactPerson: "contactPerson", creator: "creator", projectName: "name"});
            // assigned directly, as setData copies the geometry into a plain object
            wrapper.vm.drawnGeometry = drawnGeometry;
            await wrapper.vm.onSave();

            expect(placingPointMarkerSpy.calledOnce).to.be.true;
            expect(placingPointMarkerSpy.firstCall.args[1]).to.deep.equal(drawnGeometry.getInteriorPoint().getCoordinates().slice(0, 2));
        });

        it("should reload the layer of the saved projects after the project was inserted", async () => {
            const refreshSpy = sinon.spy(),
                getLayerByIdStub = sinon.stub(layerCollection, "getLayerById").withArgs("36016").returns({getLayerSource: () => ({refresh: refreshSpy})}),
                wrapper = shallowMount(ProjectsEdit, {global: {plugins: [store]}});

            sinon.stub(rawLayerList, "getLayerWhere").returns({id: "36016", url: "https://example.com/wfs"});
            sinon.stub(wfs, "sendTransaction").resolves("feature");
            await wrapper.setData({contactPerson: "contactPerson", creator: "creator", projectName: "name"});
            // assigned directly, as setData copies the geometry into a plain object
            wrapper.vm.drawnGeometry = drawnGeometry;
            await wrapper.vm.onSave();

            expect(getLayerByIdStub.calledOnceWith("36016")).to.be.true;
            expect(refreshSpy.calledOnce).to.be.true;
        });

        it("should send the values of the form under the attribute names of the projects service", async () => {
            const sendTransactionStub = sinon.stub(wfs, "sendTransaction").resolves("feature"),
                wrapper = shallowMount(ProjectsEdit, {global: {plugins: [store]}});

            sinon.stub(rawLayerList, "getLayerWhere").returns({id: "36016", url: "https://example.com/wfs"});
            await wrapper.setData({contactPerson: "contactPerson", creator: "creator", projectName: "name", startDate: "2026-01-01"});
            // assigned directly, as setData copies the geometry into a plain object
            wrapper.vm.drawnGeometry = drawnGeometry;
            await wrapper.vm.onSave();

            const feature = sendTransactionStub.firstCall.args[1];

            expect(feature.get("projektname")).to.equal("name");
            expect(feature.get("initiator")).to.equal("creator");
            expect(feature.get("ansprechpartner")).to.equal("contactPerson");
            expect(feature.get("baubeginn")).to.equal("2026-01-01");
            expect(feature.getGeometryName()).to.equal("geom");
            expect(feature.getGeometry().getType()).to.equal("MultiPolygon");
        });

        it("should show a message and keep the form open if the transaction fails", async () => {
            const getLayerByIdSpy = sinon.spy(layerCollection, "getLayerById"),
                wrapper = shallowMount(ProjectsEdit, {global: {plugins: [store]}});

            sinon.stub(console, "error");
            sinon.stub(rawLayerList, "getLayerWhere").returns({id: "36016", url: "https://example.com/wfs"});
            sinon.stub(wfs, "sendTransaction").rejects(new Error("transaction failed"));
            await wrapper.setData({contactPerson: "contactPerson", creator: "creator", projectName: "name"});
            // assigned directly, as setData copies the geometry into a plain object
            wrapper.vm.drawnGeometry = drawnGeometry;
            await wrapper.vm.onSave();

            expect(getLayerByIdSpy.notCalled).to.be.true;
            expect(wrapper.vm.isSaving).to.be.false;
            expect(wrapper.vm.showSnackbar).to.be.true;
            expect(setCurrentViewSpy.notCalled).to.be.true;
        });
    });
});
