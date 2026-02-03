import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import BimFactory from "../../../store/indexBimFactory.js";

import Component from "../../../components/BimFactory.vue";

config.global.mocks.$t = key => key;

/**
 * mocks secondary menu
 * @returns {void}
 */
function addSecondaryMenuElement () {
    const app = document.createElement("div"),
        header4 = document.createElement("h4");

    app.setAttribute("id", "mp-menu-navigation-secondaryMenu");
    app.append(header4);
    document.body.append(app);
}

describe("addons/bimFactory/components/BimFactory.vue", () => {
    const store = createStore({
        modules: {
            namespaced: true,
            Modules: {
                namespaced: true,
                modules: {
                    BimFactory
                }
            },
            Menu: {
                namespaced: true,
                mutations: {
                    setCurrentMenuWidth: sinon.stub(),
                    setCurrentMouseMapInteractionsComponent: () => "bimFactory"
                }
            }
        }
    });

    beforeEach(() => {
        addSecondaryMenuElement();
    });

    it("should exist", async () => {
        const wrapper = shallowMount(Component, {global: {plugins: [store]}});

        expect(wrapper.exists()).to.be.true;
    });

    it("should switch to the correct workflow", async () => {
        const wrapper = shallowMount(Component, {global: {plugins: [store]}});

        expect(wrapper.vm.currentWorkflow).to.be.null;
        wrapper.vm.openWorkflow(1);
        expect(wrapper.vm.currentWorkflow).to.equal(1);
        wrapper.vm.openWorkflow(2);
        expect(wrapper.vm.currentWorkflow).to.equal(2);
        wrapper.vm.openWorkflow("start");
        expect(wrapper.vm.currentWorkflow).to.be.null;
    });
});
