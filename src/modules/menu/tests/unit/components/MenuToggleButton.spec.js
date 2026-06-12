import {createStore} from "vuex";
import sinon from "sinon";
import {config, mount} from "@vue/test-utils";
import {expect} from "chai";
import MenuToggleButton from "@modules/menu/components/MenuToggleButton.vue";

config.global.mocks.$t = key => key;

/**
 * Factory to create a Vuex store for Menu module tests
 *
 * @typedef {Object} MenuStoreOptions
 * @property {boolean} [mainExpanded=false]
 * @property {boolean} [secondaryExpanded=false]
 * @property {boolean} [secondaryMenuEnabled=true]
 * @property {Function} [toggleMenuSpy]
 *
 * @param {MenuStoreOptions} [options]
 * @returns {Object} Vuex store instance configured for Menu module tests
 */
function createMenuStore ({
    mainExpanded = false,
    secondaryExpanded = false,
    secondaryMenuEnabled = true,
    toggleMenuSpy = sinon.spy()
} = {}) {
    return createStore({
        modules: {
            Menu: {
                namespaced: true,
                getters: {
                    mainExpanded: () => mainExpanded,
                    secondaryExpanded: () => secondaryExpanded,
                    mainToggleButtonIcon: () => "bi-list",
                    secondaryToggleButtonIcon: () => "bi-tools",
                    secondaryMenuEnabled: () => secondaryMenuEnabled
                },
                actions: {
                    toggleMenu: toggleMenuSpy
                }
            }
        }
    });
}

describe("src/modules/menu/MenuToggleButton.vue", () => {
    let store,
        side,
        wrapper,
        toggleMenuSpy;

    beforeEach(() => {
        side = "mainMenu";
        toggleMenuSpy = sinon.spy();

        store = createMenuStore({toggleMenuSpy});
    });

    afterEach(() => {
        if (typeof wrapper !== "undefined") {
            wrapper.unmount();
        }
    });

    it("should render the button including 'mainToggleButtonIcon' as the icon class for side 'main'", () => {
        wrapper = mount(MenuToggleButton, {
            global: {
                plugins: [store]
            },
            propsData: {side}
        });
        const button = wrapper.find(`#${side}-toggle-button`),
            icon = button.find("i");

        expect(button.exists()).to.be.true;
        expect(button.classes()).to.eql(["btn", "btn-light", "bootstrap-icon", "shadow", "menu-toggle-button", "toggle-button-mainMenu"]);
        expect(button.attributes("type")).to.equal("button");
        expect(button.attributes("aria-label")).to.equal("common:modules.menu.ariaLabelOpen");
        expect(icon.exists()).to.be.true;
        expect(icon.classes()).to.eql(["bi-list"]);
    });
    it("should render the button including 'secondaryToggleButtonIcon' as the icon class for side 'secondaryMenu'", () => {
        side = "secondaryMenu";
        wrapper = mount(MenuToggleButton, {
            global: {
                plugins: [store]
            },
            propsData: {side}
        });
        const button = wrapper.find(`#${side}-toggle-button`),
            icon = button.find("i");

        expect(button.exists()).to.be.true;
        expect(button.classes()).to.eql(["btn", "btn-light", "bootstrap-icon", "shadow", "menu-toggle-button", "toggle-button-secondaryMenu"]);
        expect(button.attributes("type")).to.equal("button");
        expect(button.attributes("aria-label")).to.equal("common:modules.menu.ariaLabelOpen");
        expect(icon.exists()).to.be.true;
        expect(icon.classes()).to.eql(["bi-tools"]);
    });

    it("mainMenu: calls toggleMenu if clicked on button", async () => {
        wrapper = mount(MenuToggleButton, {
            global: {
                plugins: [store]
            }, propsData: {side}});
        const button = wrapper.find(`#${side}-toggle-button`);

        await button.trigger("click");
        expect(toggleMenuSpy.calledOnce).to.be.true;
        expect(toggleMenuSpy.firstCall.args[1]).to.be.equals("mainMenu");

    });

    it("secondaryMenu: calls toggleMenu if clicked on button", async () => {
        side = "secondaryMenu";
        wrapper = mount(MenuToggleButton, {
            global: {
                plugins: [store]
            }, propsData: {side}});
        const button = wrapper.find(`#${side}-toggle-button`);

        await button.trigger("click");
        expect(toggleMenuSpy.calledOnce).to.be.true;
        expect(toggleMenuSpy.firstCall.args[1]).to.be.equals("secondaryMenu");

    });
    describe("showButton", () => {
        it("should NOT render secondary button if disabled", () => {
            store = createMenuStore({
                secondaryMenuEnabled: false,
                toggleMenuSpy
            });

            wrapper = mount(MenuToggleButton, {
                global: {plugins: [store]},
                propsData: {side: "secondaryMenu"}
            });

            expect(wrapper.find("#secondaryMenu-toggle-button").exists()).to.be.false;
        });

        it("should render secondary button if enabled", () => {
            store = createMenuStore({
                secondaryMenuEnabled: true,
                toggleMenuSpy
            });

            wrapper = mount(MenuToggleButton, {
                global: {plugins: [store]},
                propsData: {side: "secondaryMenu"}
            });

            expect(wrapper.find("#secondaryMenu-toggle-button").exists()).to.be.true;
        });
    });
});
