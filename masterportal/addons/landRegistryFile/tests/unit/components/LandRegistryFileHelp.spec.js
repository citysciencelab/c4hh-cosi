import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";

import Component from "../../../components/LandRegistryFileHelp.vue";

describe("addons/landRegistryFile/tests/unit/components/LandRegistryFileHelp.spec.js", () => {
    let wrapper,
        store;

    beforeEach(() => {
        store = createStore({
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        LandRegistryFile: {
                            namespaced: true,
                            state: () => ({
                                linkToHelp: "https://geoportal-hamburg.de/",
                                landRegistryFileTourUrl: "./resources/tour.json"
                            }),
                            getters: {
                                linkToHelp: state => state.linkToHelp,
                                landRegistryFileTourUrl: state => state.landRegistryFileTourUrl
                            },
                            actions: {
                                startGuidedTour: () => Promise.resolve()
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(Component, {
            props: {
            },
            global: {
                mocks: {
                    $t: key => key
                },
                plugins: [store]
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("should exist", () => {
        expect(wrapper.exists()).to.be.true;
    });

    it("should show helpLink-button only if helpLink is valid", async () => {
        expect(wrapper.vm.helpLinkIsValid).to.be.true;
        expect(wrapper.findComponent("[icon='bi-question-square']").exists()).to.be.true;

        store.state.Modules.LandRegistryFile.linkToHelp = "";
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.helpLinkIsValid).to.be.false;
        expect(wrapper.findComponent("[icon='bi-question-square']").exists()).to.be.false;

        store.state.Modules.LandRegistryFile.linkToHelp = null;
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.helpLinkIsValid).to.be.false;
        expect(wrapper.findComponent("[icon='bi-question-square']").exists()).to.be.false;

        store.state.Modules.LandRegistryFile.linkToHelp = false;
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.helpLinkIsValid).to.be.false;
        expect(wrapper.findComponent("[icon='bi-question-square']").exists()).to.be.false;

        store.state.Modules.LandRegistryFile.linkToHelp = "dies ist kein gültiger Link";
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.helpLinkIsValid).to.be.false;
        expect(wrapper.findComponent("[icon='bi-question-square']").exists()).to.be.false;

        store.state.Modules.LandRegistryFile.linkToHelp = "https://geoportal-hamburg.de/";
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.helpLinkIsValid).to.be.true;
        expect(wrapper.findComponent("[icon='bi-question-square']").exists()).to.be.true;
    });

    it("should show guided tour button only if guided tour link is valid", async () => {
        expect(wrapper.vm.tourLinkIsValid).to.be.true;
        expect(wrapper.findComponent("[icon='bi-person-raised-hand']").exists()).to.be.true;

        store.state.Modules.LandRegistryFile.landRegistryFileTourUrl = "";
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.tourLinkIsValid).to.be.false;
        expect(wrapper.findComponent("[icon='bi-person-raised-hand']").exists()).to.be.false;

        store.state.Modules.LandRegistryFile.landRegistryFileTourUrl = null;
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.tourLinkIsValid).to.be.false;
        expect(wrapper.findComponent("[icon='bi-person-raised-hand']").exists()).to.be.false;

        store.state.Modules.LandRegistryFile.landRegistryFileTourUrl = false;
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.tourLinkIsValid).to.be.false;
        expect(wrapper.findComponent("[icon='bi-person-raised-hand']").exists()).to.be.false;

        store.state.Modules.LandRegistryFile.landRegistryFileTourUrl = "dies ist kein gültiger Link";
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.tourLinkIsValid).to.be.false;
        expect(wrapper.findComponent("[icon='bi-person-raised-hand']").exists()).to.be.false;

        store.state.Modules.LandRegistryFile.landRegistryFileTourUrl = "./resources/tour.json";
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.tourLinkIsValid).to.be.true;
        expect(wrapper.findComponent("[icon='bi-person-raised-hand']").exists()).to.be.true;
    });

    it("should show hint text instead of buttons when no valid help files are configured", async () => {
        expect(wrapper.vm.tourLinkIsValid).to.be.true;
        expect(wrapper.vm.helpLinkIsValid).to.be.true;
        expect(wrapper.findComponent("[icon='bi-person-raised-hand']").exists()).to.be.true;
        expect(wrapper.findComponent("[icon='bi-question-square']").exists()).to.be.true;
        expect(wrapper.find("p").exists()).to.be.false;

        store.state.Modules.LandRegistryFile.landRegistryFileTourUrl = null;
        store.state.Modules.LandRegistryFile.linkToHelp = null;
        await wrapper.vm.$nextTick();
        expect(wrapper.findComponent("[icon='bi-person-raised-hand']").exists()).to.be.false;
        expect(wrapper.findComponent("[icon='bi-question-square']").exists()).to.be.false;
        expect(wrapper.find("p").exists()).to.be.true;
        expect(wrapper.find("div#LandRegistryFileHelp > div.ScrollableContent > p").text()).to.equal("additional:modules.landRegistryFile.tabs.tabHelp.noHelpConfigured");
    });
});
