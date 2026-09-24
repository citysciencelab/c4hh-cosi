import {shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import UpdateRequirements from "../../components/UpdateRequirements.vue";

describe("addons/heavyRain/updateRequirements/components/updateRequirements.vue", () => {
    let setCurrentRequirementSpy,
        setCurrentViewSpy,
        store;

    beforeEach(() => {
        setCurrentRequirementSpy = sinon.spy();
        setCurrentViewSpy = sinon.spy();
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
                                currentRequirement: () => {
                                    return {};
                                },
                                currentView: () => "main",
                                informationType: () => []
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
                                    currentRequirement: () => undefined,
                                    currentView: () => "create-new",
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

            const wrapper = shallowMount(UpdateRequirements, {global: {plugins: [store]}});

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
                                    currentRequirement: () => {
                                        return {
                                            formValues: {
                                                informationType: "Aktualisierungsbedarf SRGK"
                                            }
                                        };
                                    },
                                    currentView: () => "main",
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

            const wrapper = shallowMount(UpdateRequirements, {global: {plugins: [store]}});

            expect(wrapper.vm.currentOpinion).to.deep.equal({
                "cat": "Aktualisierungsbedarf",
                "name": "SRGK",
                "color": "#D55E00"
            });
        });
    });

    describe("Methods", () => {
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
