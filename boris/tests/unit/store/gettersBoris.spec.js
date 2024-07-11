import {expect} from "chai";
import getters from "../../../store/gettersBoris";
import stateBoris from "../../../store/stateBoris";


describe("src/modules/tools/boris/store/gettersBoris.js", () => {

    afterEach(() => {
        // set state back, because of directly use of original state
        stateBoris.selectedPolygon = null;
        stateBoris.paramUrlParams = {};
    });

    describe("Boris getters", () => {
        it("findLanduseByBrwId", () => {
            stateBoris.selectedPolygon = {
                get: () => {
                    return [{
                        richtwertnummer: "rw1",
                        nutzungsart: "art1"
                    },
                    {
                        richtwertnummer: "rw2",
                        nutzungsart: "art2"
                    }];
                }
            };
            stateBoris.paramUrlParams.brwId = "rw1";
            expect(getters.findLanduseByBrwId()).to.equal("art1");

            stateBoris.paramUrlParams.brwId = "nix";
            expect(getters.findLanduseByBrwId()).to.equal(undefined);
        });
    });
});
