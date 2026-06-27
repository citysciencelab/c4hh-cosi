import {expect} from "chai";
import sinon from "sinon";
import getters from "../../../store/gettersBoris.js";
import stateBoris from "../../../store/stateBoris.js";


describe("src/modules/tools/boris/store/gettersBoris.js", () => {
    let stateOrig;

    beforeEach(() => {
        stateOrig = Object.assign({}, stateBoris);
        sinon.stub(console, "warn").callsFake(sinon.spy());
    });

    afterEach(() => {
        // set state back, because of directly use of original state
        stateBoris.selectedPolygon = stateOrig.selectedPolygon;
        stateBoris.paramUrlParams = stateOrig.paramUrlParams;
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
            expect(getters.findLanduseByBrwId(stateBoris)).to.equal("art1");

            stateBoris.paramUrlParams.brwId = "nix";
            expect(getters.findLanduseByBrwId(stateBoris)).to.equal(undefined);
        });

        it("urlParams", () => {
            stateBoris.filteredLayerList = [{
                id: "12345",
                name: "name"
            }];
            stateBoris.brwFeatures = [{
                id: "12345",
                name: "name"
            }];
            stateBoris.selectedBrwFeature = {
                id: "12345",
                name: "name"
            };

            expect(getters.urlParams(stateBoris).filteredLayerList).to.be.deep.equal([]);
            expect(getters.urlParams(stateBoris).brwFeatures).to.be.deep.equal([]);
            expect(getters.urlParams(stateBoris).selectedBrwFeature).to.be.deep.equal({});
        });
    });

});
