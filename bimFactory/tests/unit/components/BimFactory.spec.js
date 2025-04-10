import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";

import Component from "../../../components/BimFactory.vue";
import BimFactory from "../../../store/indexBimFactory";

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
                    setCurrentMenuWidth: sinon.stub()
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
});
