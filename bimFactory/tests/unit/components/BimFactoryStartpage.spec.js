import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";

import Component from "../../../components/BimFactoryStartpage.vue";
import BimFactory from "../../../store/indexBimFactory.js";

config.global.mocks.$t = key => key;

describe("addons/bimFactory/components/BimFactoryStartpage.vue", () => {
    const store = createStore({
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        BimFactory
                    }
                }
            }
        }),
        globalMocks = {
            plugins: [store],
            stubs: {
                i18next: {
                    props: ["translation"],
                    template: `
                    <div>
                        <div class='i18next-title'><slot name='title' /></div>
                        <div class='i18next-link'><slot name='link' /></div>
                    </div>
                    `
                }
            }
        };

    it("should exist", async () => {
        const wrapper = shallowMount(Component, {
            global: globalMocks
        });

        expect(wrapper.exists()).to.be.true;
    });

    it("should have all necessary elements", async () => {
        const wrapper = shallowMount(Component, {
                global: globalMocks
            }),
            images = wrapper.findAll("img"),
            titleSlot = wrapper.find(".i18next-title"),
            linkSlot = wrapper.find(".i18next-link");

        expect(images).to.be.a("array").with.lengthOf(2);
        expect(images[0].classes().includes("bimFactoryLogo")).to.be.true;
        expect(images[1].classes().includes("bimFactoryConcept")).to.be.true;

        expect(titleSlot.exists()).to.be.true;
        expect(titleSlot.text()).to.include("additional:modules.bimfactory.startPage.headline.title");

        expect(linkSlot.exists()).to.be.true;
        expect(linkSlot.text()).to.include("additional:modules.bimfactory.startPage.headline.linkTitle");
    });
});
