import sinon from "sinon";
import {expect} from "chai";
import actions from "../../../store/actionsDistrictSelector.js";
import crs from "@masterportal/masterportalapi/src/crs";

describe.skip("addons/DistrictSelector/store/actionsDistrictSelector.js", () => {
    const fs = require("fs"),
        rootGetters = {
            "Maps/projectionCode": "EPSG:25832"
        };
    let xmlDoc;
    // payload;
    // spyGetStatFeatures;

    beforeAll(function () {
        crs.registerProjections();
        // test statFeatures
        xmlDoc = fs.readFileSync("./addons/cosi/DistrictSelector/tests/unit/store/testFeatures.xml", "utf8");
        // payload for loadStatFeatures
        /*
        payload = {
            districtLevel: {
                label: "Bezirke",
                featureTypes: [["v_hh_bezirk_bev_insgesamt"]],
                propertyNameList: [["bezirk"]],
                keyOfAttrName: "bezirk_name",
                referenceLevel: null,
                stats: {
                    "layers": ["123"],
                    "keyOfAttrName": "bezirk",
                    "baseUrl": ["https://geodienste.hamburg.de/HH_WFS_Regionalstatistische_Daten_Bezirke"]
                }
            },
            districts: [{
                statFeatures: [],
                getName: () => "Mordor",
                getReferencDistrictName: () => "Mordor"
            }],
            getStatFeatures: () => Promise.resolve(xmlDoc)
        };*/
        // spyGetStatFeatures = sinon.spy(payload, "getStatFeatures");
    });

    describe("loadStatFeatures", () => {
        it("should load two statFeatures", async () => {
            const localSpyGetStatFeaturesII = sinon.stub().resolves(xmlDoc),
                localPayloadII = {
                    districtLevel: {
                        label: "Bezirke",
                        featureTypes: [["v_hh_bezirk_bev_insgesamt"]],
                        propertyNameList: [["bezirk"]],
                        keyOfAttrName: "bezirk_name",
                        referenceLevel: null,
                        stats: {
                            "layers": [{typ: "WFS"}],
                            "keyOfAttrName": "bezirk",
                            "baseUrl": ["https://geodienste.hamburg.de/HH_WFS_Regionalstatistische_Daten_Bezirke"]
                        }
                    },
                    districts: [{
                        statFeatures: [],
                        getName: () => "Mordor",
                        getReferencDistrictName: () => "Mordor"
                    }],
                    getStatFeatures: localSpyGetStatFeaturesII
                },
                commit = sinon.spy(),
                dispatch = sinon.spy();

            await actions.loadStatFeatures({commit, dispatch, rootGetters}, localPayloadII);

            expect(localSpyGetStatFeaturesII.calledOnce).to.be.true;
            expect(localPayloadII.districts[0].statFeatures).to.have.lengthOf(2);
        });

        it("should not load statFeatures, when they are already loaded", async () => {
            const localSpyGetStatFeaturesIII = sinon.stub().resolves(xmlDoc),
                localPayloadIII = {
                    districtLevel: {
                        label: "Bezirke",
                        featureTypes: [["v_hh_bezirk_bev_insgesamt"]],
                        propertyNameList: [["bezirk"]],
                        keyOfAttrName: "bezirk_name",
                        referenceLevel: null,
                        stats: {
                            "layers": [{typ: "WFS"}],
                            "keyOfAttrName": "bezirk",
                            "baseUrl": ["https://geodienste.hamburg.de/HH_WFS_Regionalstatistische_Daten_Bezirke"]
                        }
                    },
                    districts: [{
                        statFeatures: [],
                        getName: () => "Mordor",
                        getReferencDistrictName: () => "Mordor"
                    }],
                    getStatFeatures: localSpyGetStatFeaturesIII
                },
                commit = sinon.spy(),
                dispatch = sinon.spy();

            await actions.loadStatFeatures({commit, dispatch, rootGetters}, localPayloadIII);
            expect(localSpyGetStatFeaturesIII.callCount).to.be.equal(1);
        });

        it.skip("should call loadStatFeatures (recursivly), if refernceLevel exists", async () => {
            const localSpyGetStatFeaturesIV = sinon.stub().resolves(xmlDoc),
                localPayloadIV = {
                    districtLevel: {
                        label: "Bezirke",
                        featureTypes: [["v_hh_bezirk_bev_insgesamt"]],
                        propertyNameList: [["bezirk"]],
                        keyOfAttrName: "bezirk_name",
                        referenceLevel: null,
                        stats: {
                            "layers": [{typ: "WFS"}],
                            "keyOfAttrName": "bezirk",
                            "baseUrl": ["https://geodienste.hamburg.de/HH_WFS_Regionalstatistische_Daten_Bezirke"]
                        }
                    },
                    districts: [{
                        statFeatures: [],
                        getName: () => "Mordor",
                        getReferencDistrictName: () => "Mordor"
                    }],
                    getStatFeatures: localSpyGetStatFeaturesIV
                },
                commit = sinon.spy(),
                dispatch = sinon.spy();

            localPayloadIV.districtLevel.referenceLevel = {
                label: "Hamburg",
                keyOfAttrName: "verwaltungseinheit",
                stats: {
                    "keyOfAttrName": "verwaltungseinheit",
                    "baseUrl": ["https://geodienste.hamburg.de/HH_WFS_Regionalstatistische_Daten_Bezirke"]
                },
                districts: [{
                    statFeatures: [],
                    getName: () => "hamburg_gesamt"
                }]
            };

            await actions.loadStatFeatures({commit, dispatch, rootGetters}, localPayloadIV);

            expect(dispatch.args[2][0]).to.equal("loadStatFeatures");
            expect(dispatch.args[2][1]).to.be.an("object").to.have.all.keys("districts", "districtLevel", "getStatFeatures");
        });
    });

    describe("getStatsByDistrict", () => {
        const districtLevel = {
            districts: [
                {
                    getId: () => "Tick",
                    statFeatures: ["Chip", "Chap"]
                },
                {
                    getId: () => "Trick",
                    statFeatures: []
                },
                {
                    getId: () => "Track",
                    statFeatures: []
                }
            ]
        };

        it("should return the statFeatures, if they are already loaded", async () => {
            const dispatch = sinon.spy(),
                statFeatures = await actions.getStatsByDistrict({dispatch}, {id: "Tick", districtLevel: districtLevel});

            expect(statFeatures).to.be.an("array").to.have.lengthOf(2);
            expect(statFeatures).to.deep.equal(["Chip", "Chap"]);
        });

        it("should call dispatch 'loadStatFeatures', if they are not already loaded", async () => {
            const dispatch = sinon.spy();

            await actions.getStatsByDistrict({dispatch}, {id: "Trick", districtLevel: districtLevel});

            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.args[0][0]).to.equal("loadStatFeatures");
            expect(dispatch.args[0][1]).to.be.an("object").to.have.all.keys("districts", "districtLevel", "getStatFeatures", "recursive");
        });

        it("should return an empty array, if the statFeatures need to be loaded", async () => {
            const dispatch = sinon.spy(),
                statFeatures = await actions.getStatsByDistrict({dispatch}, {id: "Track", districtLevel: districtLevel});

            expect(statFeatures).to.be.an("array").to.have.lengthOf(0);
        });
    });
});
