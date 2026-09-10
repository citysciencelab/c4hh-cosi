import {expect} from "chai";
import sinon from "sinon";
import processUrlParams from "@shared/js/utils/processUrlParams.js";
import store from "@appstore/index.js";


describe("src/shared/js/utils/processUrlParams.js", () => {
    let spyMenu;
    const originStoreGetter = store.getters;

    beforeEach(() => {
        spyMenu = sinon.spy();

        store.getters = {
            getUrlParamValue: () => "draw"
        };
    });

    afterEach(() => {
        store.getters = originStoreGetter;
    });

    it("should start the function of MENU param", () => {
        const params = {
                MENU: spyMenu
            },
            legacyParams = {};

        processUrlParams(params, legacyParams);

        expect(spyMenu.called).to.be.true;
        expect(spyMenu.firstCall.args[0]).to.deep.equals({MENU: "draw"});
    });
});
