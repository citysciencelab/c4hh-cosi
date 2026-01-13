import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";

import Component from "../../../components/TabSearch.vue";

describe("addons/lzsResearchClient/tests/unit/components/tabs/TabSearch.spec.js", () => {
    let wrapper,
        store;

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
                                // to be used later
                            })
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

    it("clicking first list item shows attribute form", async () => {
        const items = wrapper.findAll("#searchOptionsList li");

        expect(items.length).to.be.at.least(1);

        await items[0].trigger("click");
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.activeContent).to.equal("searchFormWithAttributes");
        expect(wrapper.find("#searchFormWithAttributes").exists()).to.be.true;
    });

    it("clicking second list item shows geometry form", async () => {
        const items = wrapper.findAll("#searchOptionsList li");

        expect(items.length).to.be.at.least(2);

        await items[1].trigger("click");
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.activeContent).to.equal("searchFormWithGeometry");
        expect(wrapper.find("#searchFormWithGeometry").exists()).to.be.true;
    });

    it("back button returns to options list", async () => {
        const items = wrapper.findAll("#searchOptionsList li");

        await items[0].trigger("click");
        await wrapper.vm.$nextTick();

        /* eslint-disable-next-line one-var*/
        const back = wrapper.find("#backButton");

        expect(back.exists()).to.be.true;

        await back.trigger("click");
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.activeContent).to.equal("searchOptionsList");
        expect(wrapper.find("#searchOptionsList").exists()).to.be.true;
    });
});
