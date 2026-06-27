import {expect} from "chai";
import {mount} from "@vue/test-utils";
import GeoMarkerForm from "../../../components/GeoMarkerForm.vue";
import GeoMarkerFormBox from "../../../components/GeoMarkerFormBox.vue";
import {createStore} from "vuex";
import sinon from "sinon";
import dayjs from "dayjs";
import departments from "../resources/departments.json";
import categories from "../resources/categories.json";

describe("addons/geoMarker/components/GeoMarkerForm.vue", () => {
    let wrapper,
        store,
        stubs,
        mockGemisFeature = false;

    beforeEach(() => {
        window.activeDirectoryUser = {username: "testuser"};

        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        GeoMarker: {
                            namespaced: true,
                            getters: {
                                categories: state => state.categories,
                                departments: state => state.departments,
                                departmentsAllowNewEdit: state => state.departments,
                                statusOptions: state => state.statusOptions,
                                newGeoMarkerFeature: state => state.newGeoMarkerFeature,
                                geoMarkerFeatureList: state => state.geoMarkerFeatureList,
                                geoMarkerUpdateFeature: state => state.geoMarkerUpdateFeature,
                                isFilterApplied: state => state.isFilterApplied,
                                isGemisFeature: () => () => mockGemisFeature
                            },
                            state: () => ({
                                categories: categories.categories,
                                departments: departments.departments,
                                statusOptions: ["offen", "inaktiv", "geschlossen"],
                                newGeoMarkerFeature: null,
                                geoMarkerFeatureList: [],
                                geoMarkerUpdateFeature: null,
                                isFilterApplied: false
                            }),
                            actions: {
                                upsertPoint: sinon.stub().resolves({transactionResponse: true, transactionFeature: {}}),
                                setMapInteraction: sinon.stub().resolves(),
                                updateGeoMarker: sinon.stub().resolves(),
                                loadPropertyOfFeatureById: sinon.stub().resolves(""),
                                refreshLayer: sinon.stub().resolves(),
                                refreshLayerAndReapplyFilter: sinon.stub().resolves(),
                                setGeoMarkerFeatureListAction: sinon.stub().resolves()
                            },
                            mutations: {
                                setGeoMarkerActiveTab: sinon.stub(),
                                setNewGeoMarkerFeature: sinon.stub(),
                                setGeoMarkerFeatureList: sinon.stub(),
                                setTriggerFilter: sinon.stub(),
                                setGeoMarkerFeatureSelected: sinon.stub()
                            }
                        }
                    }
                },
                Alerting: {
                    namespaced: true,
                    actions: {
                        addSingleAlert: sinon.stub().resolves()
                    }
                }
            },
            getters: {
                visibleLayerConfigs: () => []
            }
        });

        stubs = {
            SwitchInput: true,
            InputText: true,
            IconButton: true,
            FlatButton: true,
            FileUpload: true,
            GeoMarkerFormBox: true,
            SelectableList: true,
            CreateScreenshot: true,
            Multiselect: true
        };

        wrapper = mount(GeoMarkerForm, {
            props: {
                mode: "create",
                selectedFeature: null,
                showCreateAnotherSwitch: true
            },
            global: {
                mocks: {
                    $t: key => key
                },
                plugins: [store],
                stubs: stubs
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("should render and have the correct class", () => {
        expect(wrapper.exists()).to.be.true;
        expect(wrapper.classes()).to.include("GeoMarkerForm");
    });

    it("should initialize categories and departments on mounted", () => {
        expect(wrapper.vm.categories).to.not.be.empty;
        expect(wrapper.vm.departments).to.not.be.empty;
    });

    it("should set initial category id on create mode", () => {
        expect(wrapper.vm.selectedCategoryId).to.be.a("string");
        expect(wrapper.vm.selectedCategoryId).to.not.be.empty;
    });

    it("should initialize departmentData based on selected category", () => {
        expect(wrapper.vm.departmentData).to.be.an("object");
    });

    it("should toggle department selection", () => {
        const departmentId = Object.keys(wrapper.vm.departments)[0],
            initialState = wrapper.vm.departmentData[departmentId];

        wrapper.vm.toggleDepartment(departmentId);

        expect(wrapper.vm.departmentData[departmentId]).to.not.equal(initialState);
    });

    it("should update category selection", () => {
        const secondCategoryId = Object.keys(wrapper.vm.categories)[1];

        wrapper.vm.onCategorySelect(secondCategoryId);

        expect(wrapper.vm.selectedCategoryId).to.equal(secondCategoryId);
    });

    it("should reset form to initial state", () => {
        wrapper.vm.geomarkerDescription = "test description";
        wrapper.vm.reminderDate = "2025-12-25";
        wrapper.vm.attachment = {name: "test.pdf"};
        wrapper.vm.statusForSelectedDepartments = "geschlossen";
        wrapper.vm.getDepartmentsAndCategoriesFromState();
        wrapper.vm.setInitiallySelectedCategoryId();
        wrapper.vm.updateDepartmentsFromCategory();
        wrapper.vm.removeAttachment();
        wrapper.vm.statusForSelectedDepartments = "offen";

        expect(wrapper.vm.statusForSelectedDepartments).to.equal("offen");
        expect(wrapper.vm.attachment).to.be.null;
    });

    it("should remove attachment", () => {
        wrapper.vm.attachment = {name: "test.pdf", base64: "data"};
        wrapper.vm.removeAttachment();

        expect(wrapper.vm.attachment).to.be.null;
    });

    it("should have formValidation set to true when no departments selected", () => {
        wrapper.vm.departmentData = {};

        expect(wrapper.vm.formValidation).to.be.true;
    });

    it("should have formValidation set to false when departments selected", () => {
        const departmentId = Object.keys(wrapper.vm.departments)[0];

        wrapper.vm.departmentData = {
            [departmentId]: {status: "offen", bemerkung: ""}
        };

        store.state.Modules.GeoMarker.newGeoMarkerFeature = {
            getId: () => "feature-1",
            getProperties: () => ({})
        };

        expect(wrapper.vm.formValidation).to.be.false;
    });

    it("appends date and user name to a new geomarker.", () => {
        const clock = sinon.useFakeTimers(new Date("2023-01-10").getTime());

        wrapper.vm.geomarkerDescription = "Main geomarker description.";
        wrapper.vm.departmentData.steuerungsstelle.bemerkung = "Comment for the department Steuerungsstelle.";

        expect(wrapper.vm.newGeoMarker.beschreibung).to.equal("Main geomarker description. [10.01.2023, testuser]");
        expect(wrapper.vm.newGeoMarker.bem_steuerungsstelle).to.equal("Comment for the department Steuerungsstelle. [10.01.2023, testuser]");

        clock.restore();
    });

    it("sets the wiedervorlage field correctly with the reminderDate, if status is inactive", () => {
        wrapper.vm.reminderDate = dayjs("2023-01-10T00:00:00.000Z").toISOString();
        wrapper.vm.departmentData.steuerungsstelle.status = "inaktiv";

        expect(wrapper.vm.newGeoMarker.wie_steuerungsstelle).to.equal(wrapper.vm.reminderDate);
    });

    it("should disable elements if it is a GEMIS feature", async () => {
        wrapper.unmount();

        mockGemisFeature = true;

        wrapper = mount(GeoMarkerForm, {
            props: {
                mode: "create",
                selectedFeature: null,
                showCreateAnotherSwitch: true
            },
            global: {
                mocks: {
                    $t: key => key
                },
                plugins: [store],
                stubs: stubs
            }
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.vm.isGemisFeatureEditNotAllowed).to.be.true;
        expect(wrapper.vm.extractDepartmentData()).to.deep.equal({});
        expect(wrapper.findAllComponents(GeoMarkerFormBox)).to.have.lengthOf(3);
    });
});
