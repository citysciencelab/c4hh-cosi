import {shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import UpdateEdit from "../../components/UpdateEdit.vue";


describe("addons/heavyRain/updateRequirements/components/UpdateEdit.vue", () => {
    let store;

    beforeEach(() => {
        store = createStore({
            namespaced: true,
            modules: {
                namespaced: true,
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
                                ]
                            }
                        }
                    }
                }
            }
        });
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
        it("should set invalid to true if required fields are empty", () => {
            const wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}});

            wrapper.vm.onSave();

            expect(wrapper.vm.invalid).to.be.true;
        });

        it("should set invalid to false and emit events when required fields are filled", async () => {
            const wrapper = shallowMount(UpdateEdit, {global: {plugins: [store]}});

            await wrapper.setData({name: "name", initiator: "initiator", contactPerson: "contactPerson"});

            wrapper.vm.onSave();

            expect(wrapper.vm.invalid).to.be.false;
            expect(wrapper.emitted("showSnackbarMessage")).to.not.be.undefined;
            expect(wrapper.emitted("click:save")).to.not.be.undefined;
        });
    });
});
