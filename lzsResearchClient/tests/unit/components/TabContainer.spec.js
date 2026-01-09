import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";

import Component from "../../../components/TabContainer.vue";

describe("addons/lzsResearchClient/tests/unit/TabContainer.spec.js", () => {
    let wrapper,
        store;

    const MockTabSearch = {
            name: "MockTabSearch",
            props: ["propsForTabContent"],
            template: "<div class='mock-search'>{{ propsForTabContent.test }}</div>"
        },
        MockTabResult = {
            name: "MockTabResult",
            props: ["propsForTabContent"],
            template: "<div class='mock-result'>{{ propsForTabContent.value }}</div>"
        },
        MockTabDetails = {
            name: "MockTabDetails",
            props: ["propsForTabContent"],
            template: "<div class='mock-result'>{{ propsForTabContent.value }}</div>"
        },
        MockTabDownload = {
            name: "MockTabDownload",
            props: ["propsForTabContent"],
            template: "<div class='mock-result'>{{ propsForTabContent.value }}</div>"
        };

    beforeEach(() => {
        store = createStore({
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        LzsResearchClient: {
                            namespaced: true,
                            state: () => ({
                                // to be used later..
                            })
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(Component, {
            props: {
                tabs: [
                    {
                        id: "tabSearch",
                        contentId: "tabSearchContent",
                        ref: "tabSearch",
                        label: "additional:modules.lzsResearchClient.tabs.tabSearch.label",
                        component: MockTabSearch,
                        propsForTabContent: {},
                        renderComponent: true
                    },
                    {
                        id: "tabResult",
                        contentId: "tabResultContent",
                        ref: "tabResult",
                        label: "additional:modules.lzsResearchClient.tabs.tabResult.label",
                        component: MockTabResult,
                        propsForTabContent: {},
                        renderComponent: true
                    },
                    {
                        id: "tabDetails",
                        contentId: "tabDetailsContent",
                        ref: "tabDetails",
                        label: "additional:modules.lzsResearchClient.tabs.tabDetails.label",
                        component: MockTabDetails,
                        propsForTabContent: {},
                        renderComponent: true
                    },
                    {
                        id: "tabDownload",
                        contentId: "tabDownloadContent",
                        ref: "tabDownload",
                        label: "additional:modules.lzsResearchClient.tabs.tabDownload.label",
                        component: MockTabDownload,
                        propsForTabContent: {},
                        renderComponent: true
                    }
                ]
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

    it("should render nav tabs with the correct ids", () => {
        const ids = ["tabSearch", "tabResult", "tabDetails"];

        ids.forEach(id => {
            const nav = wrapper.find(`#${id}`);

            expect(nav.exists()).to.be.true;
        });
    });

    it("should render tab content element for tabSearch", () => {
        const content = wrapper.find("#tabSearchContent");

        expect(content.exists()).to.be.true;
    });

    it("clicking if by click on setCurrentTab updates the activeTabIdLocal.", async () => {
        const tabSearchNav = wrapper.find("#tabSearch"),
            tabResultNav = wrapper.find("#tabResult"),
            tabDetailsNav = wrapper.find("#tabDetails"),
            tabDownload = wrapper.find("#tabDownload");

        expect(wrapper.vm.activeTabIdLocal).to.equal("tabSearch");

        await tabResultNav.trigger("click");

        expect(wrapper.vm.activeTabIdLocal).to.equal("tabResult");

        await tabSearchNav.trigger("click");

        expect(wrapper.vm.activeTabIdLocal).to.equal("tabSearch");

        await tabDetailsNav.trigger("click");

        expect(wrapper.vm.activeTabIdLocal).to.equal("tabDetails");

        await tabDownload.trigger("click");

        expect(wrapper.vm.activeTabIdLocal).to.equal("tabDownload");
    });
});
