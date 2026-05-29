import {expect} from "chai";
import sinon from "sinon";
import getters from "@modules/featureLister/store/gettersFeatureLister.js";
import layerCollection from "@core/layers/js/layerCollection.js";
const {featureDetails, getGeometryType, headers, selectedFeature} = getters;

describe("src/modules/featureLister/store/gettersFeatureLister", () => {
    let state;
    const olFeature1 = {
            getId: () => "1",
            getGeometry: () => ({getType: () => "Polygon"})
        },
        olFeature2 = {
            getId: () => "2"
        },
        olFeature3 = {
            getId: () => "3"
        },
        olFeature4_1 = {
            getId: () => "4.1"
        },
        olFeature4_2 = {
            getId: () => "4.2"
        },
        gfiFeature1 = {
            id: "1",
            olFeature: olFeature1,
            getAttributesToShow: () => "showAll",
            getProperties: () => ({generic: "Hallo", alpha: "Dies", beta: "ist", gamma: "ein", delta: "Test"}),
            getGeometry: () => ({
                getType: () => "Polygon"
            })
        },
        gfiFeature2 = {
            id: "2",
            olFeature: olFeature2,
            getAttributesToShow: () => ({generic: "Show Generic", alpha: "Show Alpha"}),
            getProperties: () => ({generic: "Test", alpha: "ohne", beta: "Gamma und Delta"})
        },
        gfiFeature3 = {
            id: "3",
            olFeature: olFeature3,
            getAttributesToShow: () => ({generic: "Show Generic", beta: "Show Beta"}),
            getProperties: () => ({generic: "Test", alpha: "ohne", beta: "", gamma: "Delta"})
        };

    beforeEach(() => {
        state = {
            selectedRow: {
                id: 0
            },
            gfiFeaturesOfLayer: [gfiFeature1, gfiFeature2, gfiFeature3, {id: "4.1", olFeature: olFeature4_1}, {id: "4.2", olFeature: olFeature4_2}],
            layer: {id: "id"}
        };
        sinon.stub(layerCollection, "getLayerById").returns(
            {
                getLayerSource: () => {
                    return {
                        getFeatures: () => {
                            return [olFeature1, olFeature2, olFeature3, olFeature4_1, olFeature4_2];
                        }
                    };
                }
            }
        );
    });


    describe("getGeometryType", () => {
        it("returns geometryType from state's layer", () => {
            state.layer.geometryType = "Point";
            expect(getGeometryType(state)).to.be.equal("Point");
        });
        it("returns geometryType of first feature", () => {
            expect(getGeometryType(state)).to.be.equal("Polygon");
        });
    });

    describe("selectedFeature", () => {
        it("returns the feature at index 0", () => {
            expect(selectedFeature(state)("1")).to.be.deep.equal(olFeature1);
        });
        it("returns the feature at index 1", () => {
            expect(selectedFeature(state)("2")).to.be.deep.equal(olFeature2);
        });
        it("returns nested feature", () => {
            expect(selectedFeature(state)("4.1")).to.be.deep.equal(olFeature4_1);
        });
        it("falls back to layer source when olFeature is missing", () => {
            state.gfiFeaturesOfLayer = [{id: "1"}];
            expect(selectedFeature(state)("1")).to.be.deep.equal(olFeature1);
        });
    });

    describe("headers", () => {
        it("lists all used attributes", () => {
            state.gfiFeaturesOfLayer = [gfiFeature2, gfiFeature3];
            const headerNames = headers(state, {}, {}, {ignoredKeys: []}).map(header => header.name);

            expect(headerNames).to.deep.equal(["id", "Show Generic", "Show Alpha", "Show Beta"]);
        });
        it("shows all properties with showAll feature", () => {
            state.gfiFeaturesOfLayer = [gfiFeature1, gfiFeature2];
            const headerNames = headers(state, {}, {}, {ignoredKeys: []}).map(header => header.name);

            expect(headerNames).to.deep.equal(["id", "generic", "alpha", "beta", "gamma", "delta"]);
        });
        it("header value as object, use name as value", () => {
            const gfiFeature = {
                getAttributesToShow: () => ({
                    generic: "Show Generic",
                    alpha: {
                        "name": "Name Von Alpha",
                        "condition": "contains",
                        "type": "date",
                        "format": "MM.DD.YYYY"
                    }
                }),
                getProperties: () => ({generic: "Test", alpha: "01.01.2022"})
            };
            let headerNames = [];

            state.gfiFeaturesOfLayer = [gfiFeature];
            headerNames = headers(state, {}, {}, {ignoredKeys: []}).map(header => header.name);
            expect(headerNames).to.deep.equal(["id", "Show Generic", "Name Von Alpha"]);
        });
    });

    describe("featureDetails", () => {

        it("returns the exactly the attribute titles and values that are to show", () => {
            state.selectedRow = {
                id: "2",
                "Show Generic": "Test",
                "Show Alpha": "ohne",
                "Show Beta": "Gamma und Delta"
            };

            expect(featureDetails(state, {}, {}, {ignoredKeys: []})).to.deep.equal({"Show Generic": "Test", "Show Alpha": "ohne"});
        });
        it("returns all attribute values if showAll is set", () => {
            state.selectedRow = {
                id: "1",
                generic: "Hallo",
                alpha: "Dies",
                beta: "ist",
                gamma: "ein",
                delta: "Test"
            };
            expect(featureDetails(state, {}, {}, {ignoredKeys: []})).to.deep.equal({generic: "Hallo", alpha: "Dies", beta: "ist", gamma: "ein", delta: "Test"});
        });
        it("ignores globally hidden keys if showAll is set", () => {
            state.selectedRow = {
                id: "1",
                generic: "Hallo",
                alpha: "Dies",
                beta: "ist",
                gamma: "ein",
                delta: "Test"
            };
            expect(featureDetails(state, {}, {}, {ignoredKeys: ["ALPHA", "BETA", "GAMMA", "DELTA"]})).to.deep.equal({generic: "Hallo"});
        });
        it("ignores false-ish values", () => {
            state.selectedRow = {
                id: "3",
                "Show Generic": "Test",
                "Show Alpha": "ohne",
                "Show Beta": "",
                gamma: "Delta"
            };
            expect(featureDetails(state, {}, {}, {ignoredKeys: []})).to.deep.equal({"Show Generic": "Test"});
        });
    });
});
