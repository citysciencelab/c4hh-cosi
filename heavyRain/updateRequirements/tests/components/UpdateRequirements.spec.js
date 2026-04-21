import {config, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import UpdateRequirements from "../../components/UpdateRequirements.vue";

config.global.mocks.$t = key => key;

describe("addons/heavyRain/updateRequirements/components/updateRequirements.vue", () => {
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
                                informationType: () => []
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

        it("should render HrFooter in create-new view", async () => {
            const wrapper = shallowMount(UpdateRequirements, {global: {plugins: [store]}});

            await wrapper.setData({currentView: "create-new"});

            expect(wrapper.findComponent({name: "HrHeader"}).exists()).to.be.false;
            expect(wrapper.findComponent({name: "HrFooter"}).exists()).to.be.true;
        });
    });

    describe("Computed Properties", () => {
        it("should get currentOpinion as undefined", () => {
            const wrapper = shallowMount(UpdateRequirements, {global: {plugins: [store]}});

            expect(wrapper.vm.currentOpinion).to.be.undefined;
        });

        it("should get strokeColor as standard array", () => {
            const wrapper = shallowMount(UpdateRequirements, {global: {plugins: [store]}});

            expect(wrapper.vm.strokeColor).to.deep.equal([0, 0, 0]);
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
                "cat": "Eingabe",
                "name": "Ortskenntnis",
                "color": "#0055A4"
            });
        });

        it("should get strokeColor from currentOpinion", () => {
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

            const wrapper = shallowMount(UpdateRequirements, {global: {plugins: [store]}});

            expect(wrapper.vm.strokeColor).to.deep.equal([0, 85, 164]);
        });
    });
});
