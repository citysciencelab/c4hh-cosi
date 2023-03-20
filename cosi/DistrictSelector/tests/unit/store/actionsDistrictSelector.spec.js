import sinon from "sinon";
import {expect} from "chai";
import actions from "../../../store/actionsDistrictSelector.js";
import crs from "@masterportal/masterportalapi/src/crs";

describe("addons/DistrictSelector/store/actionsDistrictSelector.js", () => {
    const fs = require("fs"),
        rootGetters = {
            "Maps/projectionCode": "EPSG:25832"
        };
    let xmlDoc,
        payload,
        spyGetStatFeatures;

    before(function () {
        crs.registerProjections();
        // test statFeatures
        xmlDoc = fs.readFileSync("./addons/cosi/DistrictSelector/tests/unit/store/testFeatures.xml", "utf8");
        // payload for loadStatFeatures
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
                getName: () => "Mordor"
            }],
            getStatFeatures: () => Promise.resolve(xmlDoc)
        };
        spyGetStatFeatures = sinon.spy(payload, "getStatFeatures");
    });

    describe("loadStatFeatures", () => {
        it("should call dispatch 'Alerting/addSingleAlert' and 'Alerting/cleanup", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy();

            await actions.loadStatFeatures({commit, dispatch, rootGetters}, payload);

            expect(dispatch.args).to.deep.equal([
                ["Alerting/addSingleAlert", {content: "Datensätze werden geladen"}, {root: true}],
                ["fetchMetaData"],
                ["updateDistricts"],
                ["Alerting/cleanup", null, {root: true}]
            ]);
        });

        it("should load two statFeatures", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy();

            await actions.loadStatFeatures({commit, dispatch, rootGetters}, payload);

            expect(spyGetStatFeatures.calledOnce).to.be.true;
            expect(payload.districts[0].statFeatures).to.have.lengthOf(2);
        });

        it("should not load statFeatures, when they are already loaded", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy();

            await actions.loadStatFeatures({commit, dispatch, rootGetters}, payload);
            expect(spyGetStatFeatures.callCount).to.be.equal(1);
        });

        it("should call loadStatFeatures (recursivly), if refernceLevel exists", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy();

            payload.districtLevel.referenceLevel = {
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

            await actions.loadStatFeatures({commit, dispatch, rootGetters}, payload);

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
