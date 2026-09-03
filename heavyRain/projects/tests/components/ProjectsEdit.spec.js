import {shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import ProjectsEdit from "../../components/ProjectsEdit.vue";


describe("addons/heavyRain/projects/components/ProjectsEdit.vue", () => {
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
                                }]
                            }
                        }
                    }
                }
            }
        });
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

        it("should set invalid to true if there are required fields with empty text ", async () => {
            const wrapper = shallowMount(ProjectsEdit, {global: {plugins: [store]}});

            wrapper.vm.onSave();

            expect(wrapper.vm.invalid).to.be.true;
        });

        it("should set invalid to true if there are required fields with empty text ", async () => {
            const wrapper = shallowMount(ProjectsEdit, {global: {plugins: [store]}});

            await wrapper.setData({projectName: "name", creator: "creator", contactPerson: "contactPerson"});

            wrapper.vm.onSave();

            expect(wrapper.vm.invalid).to.be.false;
        });
    });
});
