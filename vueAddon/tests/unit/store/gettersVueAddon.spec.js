import {expect} from "chai";
import getters from "../../../store/gettersVueAddon";
import stateVueAddon from "../../../store/stateVueAddon";


const {
    active,
    id,
    name,
    icon,
    renderToWindow,
    resizableWindow,
    isVisibleInMenu,
    deactivateGFI} = getters;

describe("addons/vueAddon/store/gettersVueAddon", function () {
    it("returns the active from state", function () {
        expect(active(stateVueAddon)).to.be.false;
    });
    it("returns the id from state", function () {
        expect(id(stateVueAddon)).to.equals("VueAddon");
    });

    describe("testing default values", function () {
        it("returns the name default value from state", function () {
            expect(name(stateVueAddon)).to.be.equals("Simple Vue Addon");
        });
        it("returns the icon default value from state", function () {
            expect(icon(stateVueAddon)).to.equals("bi-bullseye");
        });
        it("returns the renderToWindow default value from state", function () {
            expect(renderToWindow(stateVueAddon)).to.be.true;
        });
        it("returns the resizableWindow default value from state", function () {
            expect(resizableWindow(stateVueAddon)).to.be.true;
        });
        it("returns the isVisibleInMenu default value from state", function () {
            expect(isVisibleInMenu(stateVueAddon)).to.be.true;
        });
        it("returns the deactivateGFI default value from state", function () {
            expect(deactivateGFI(stateVueAddon)).to.be.true;
        });

    });
});
