// Most of the tests will be transferred to geomarkerForm component test file.
// Commenting this for a while.

// import {expect} from "chai";
// import {mount, flushPromises} from "@vue/test-utils";
// import TabNewContent from "../../../../components/tabs/TabNewContent.vue";
// import {createStore} from "vuex";
// import departments from "../../../../../../portalconfigs/geomarker/resources/departments.json";
// import categories from "../../../../../../portalconfigs/geomarker/resources/categories.json";
// import sinon from "sinon";


// describe("addons/geoMarker/components/tabs/TabNewContent.vue", () => {
//     let wrapper,
//         store;

//     window.activeDirectoryUser = {username: "testuser"};

//     beforeEach(async () => {
//         store = createStore({
//             modules: {
//                 Modules: {
//                     namespaced: true,
//                     modules: {
//                         GeoMarker: {
//                             namespaced: true,
//                             getters: {
//                                 categories: state => state.categories,
//                                 departments: state => state.departments,
//                                 newGeoMarkerFeature: state => state.newGeoMarkerFeature
//                             },
//                             state: () => ({
//                                 categories: categories.categories,
//                                 departments: departments.departments,
//                                 statusOptions: ["offen", "inaktiv", "geschlossen"],
//                                 newGeoMarkerFeature: {
//                                     getProperties: () => ({
//                                         quelle: "source",
//                                         kategorie: "category",
//                                         beschreibung: "description",
//                                         zeitstempel: new Date().toISOString()
//                                     }),
//                                     getId: () => "feature-1"
//                                 }
//                             }),
//                             mutations: {
//                                 setNewGeoMarkerFeature: sinon.stub().resolves()
//                             },
//                             actions: {
//                                 loadCategories: sinon.stub().resolves(),
//                                 loadDepartments: sinon.stub().resolves(),
//                                 upsertPointStub: sinon.stub().resolves(true),
//                                 setMapInteraction: sinon.stub().resolves()
//                             }
//                         }
//                     }
//                 }
//             },
//             getters: {
//                 visibleLayerConfigs: () => []
//             }
//         });

//         wrapper = mount(TabNewContent, {
//             global: {
//                 mocks: {
//                     $t: key => key
//                 },
//                 plugins: [store],
//                 stubs: {
//                     InputText: true,
//                     FlatButton: true,
//                     IconButton: true,
//                     FileUpload: true,
//                     FormBox: true,
//                     SelectableList: true,
//                     CreateScreenshot: true,
//                     Multiselect: true
//                 }
//             }
//         });

//         await flushPromises();
//     });

//     afterEach(() => {
//         if (wrapper) {
//             wrapper.unmount();
//         }
//         sinon.restore();
//     });


//     it("should render and have the correct class", () => {
//         expect(wrapper.exists()).to.be.true;
//         expect(wrapper.classes()).to.include("TabNewContent");
//     });

//     it("should toggle createAnotherGeoMarker when SwitchInput is interacted", async () => {
//         const switchInput = wrapper.findAllComponents({name: "SwitchInput"}).at(-1);

//         expect(wrapper.vm.createAnotherGeoMarker).to.be.false;

//         await switchInput.props("interaction")();

//         expect(wrapper.vm.createAnotherGeoMarker).to.be.true;
//     });


//     it("should reset form fields on refreshForm", async () => {
//         wrapper.vm.geomarkerDescription = "test";
//         wrapper.vm.attachment = {name: "file"};
//         wrapper.vm.reminderDate = "22.09.2026";

//         await wrapper.vm.refreshForm();

//         expect(wrapper.vm.geomarkerDescription).to.equal("");
//         expect(wrapper.vm.attachment).to.equal("");
//         expect(wrapper.vm.reminderDate).to.equal(null);
//         expect(wrapper.vm.screenshotImage).to.equal("");
//         expect(wrapper.vm.statusForSelectedDepartments).to.equal("offen");
//     });


//     it("should call setGeoMarkerActiveTab on createNewGeomarker if createAnotherGeoMarker is false", async () => {
//         wrapper.vm.createAnotherGeoMarker = false;
//         wrapper.vm.upsertPoint = async () => ({transactionFeature: {}, transactionResponse: true});
//         wrapper.vm.setGeoMarkerActiveTab = function (tab) {
//             this._tabSet = tab;
//         };

//         await wrapper.vm.createNewGeomarker();

//         expect(wrapper.vm._tabSet).to.equal("tabList");
//     });

//     it("should update selectedCategoryId and departments on category select", async () => {
//         wrapper.vm.onCategorySelect("aussendienst");

//         await flushPromises();

//         expect(wrapper.vm.selectedCategoryId).to.equal("aussendienst");
//         expect(Object.keys(wrapper.vm.departmentData)).to.deep.equal(["alkis_geotopographie", "atkis"]);
//     });

//     it("should remove attachment when removeAttachment is called", () => {
//         wrapper.vm.attachment = {name: "file"};
//         wrapper.vm.removeAttachment();
//         expect(wrapper.vm.attachment).to.equal("");
//     });

//     it("should update department status to 'inaktiv' if reminderDate is in future", async () => {
//         const futureDate = new Date();

//         futureDate.setDate(futureDate.getDate() + 1);
//         wrapper.vm.reminderDate = futureDate.toISOString().slice(0, 10);

//         await flushPromises();

//         Object.values(wrapper.vm.departmentData).forEach(dep => {
//             expect(dep.status).to.equal("inaktiv");
//         });
//     });

//     it("should compute newGeoMarker correctly", () => {
//         wrapper.vm.selectedCategoryId = "allgemeines";
//         wrapper.vm.attachment = {name: "file", base64: "base64data"};
//         wrapper.vm.screenshotImage = "imgdata";
//         wrapper.vm.geomarkerDescription = "desc";
//         wrapper.vm.departmentData = {
//             steuerungsstelle: {status: "offen", bemerkung: "bem"}
//         };

//         const marker = wrapper.vm.newGeoMarker;

//         expect(marker.kategorie).to.equal("Allgemeines");
//         expect(marker.anhang_name).to.equal("file");
//         expect(marker.anhang_base_64).to.equal("base64data");
//         expect(marker.screenshot_base_64).to.equal("imgdata");
//         expect(marker.beschreibung).to.equal("desc");
//         expect(marker.sta_steuerungsstelle).to.equal("offen");
//         expect(marker.bem_steuerungsstelle).to.equal("bem");
//         expect(marker.zeitstempel).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
//         expect(marker.quelle).to.be.oneOf(["geomarker", "testuser"]);
//     });
// });
