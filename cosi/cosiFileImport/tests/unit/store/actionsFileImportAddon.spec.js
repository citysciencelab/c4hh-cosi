/**/
import testAction from "../../../../../../test/unittests/VueTestUtils";
import actions from "../../../store/actionsCosiFileImport";
import state from "../../../store/stateCosiFileImport";
import rawSources from "../../resources/rawSources.js";
import crs from "@masterportal/masterportalapi/src/crs";
import sinon from "sinon";
import {expect} from "chai";

const
    {importKML} = actions,
    namedProjections = [
        ["EPSG:31467", "+title=Bessel/Gauß-Krüger 3 +proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=bessel +datum=potsdam +units=m +no_defs"],
        ["EPSG:25832", "+title=ETRS89/UTM 32N +proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],
        ["EPSG:8395", "+title=ETRS89/Gauß-Krüger 3 +proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=GRS80 +datum=GRS80 +units=m +no_defs"],
        ["EPSG:4326", "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs"]
    ],
    rootGetters = {
        "Maps/projectionCode": "EPSG:25832"
    };

before(() => {
    crs.registerProjections(namedProjections);

    i18next.init({
        lng: "cimode",
        debug: false
    });
});

describe("addons/cosiFileImport/store/actionsCosiFileImport.js", () => {
    describe("file import - file should add some features to the current draw layer", () => {
        const
            checkSameLayer = true,
            pointImages = {
                black: ["cc000000", ".https://localhost:9001/img/tools/draw/circle_black.svg"],
                blue: ["cc0000FF", "https://localhost:9001/img/tools/draw/circle_blue.svg"],
                green: ["cc00FF00", "https://localhost:9001/img/tools/draw/circle_green.svg"],
                yellow: ["cc00FFFF", "https://localhost:9001/img/tools/draw/circle_yellow.svg"],
                red: ["ccFF0000", "https://localhost:9001/img/tools/draw/circle_red.svg"],
                white: ["ccFFFFFF", "https://localhost:9001/img/tools/draw/circle_white.svg"]
            },
            textColors = {
                schwarz: "cc000000",
                blau: "cc0000FF",
                gruen: "cc00FF00",
                gelb: "cc00FFFF",
                rot: "ccFF0000",
                weiss: "ccFFFFFF"
            },
            textSizes = {
                klein: 1,
                mittel: 1.15,
                gross: 1.3
            };

        it("preset \"auto\", correct kml file, correct filename", () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                payload = {raw: rawSources[0], checkSameLayer: checkSameLayer, layerName: "TestFile1", filename: "TestFile1.kml", pointImages: pointImages, textColors: textColors, textSizes: textSizes};

            importKML({dispatch, commit, state, rootGetters}, payload);
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.args).to.deep.equal([
                ["Alerting/addSingleAlert", {
                    category: i18next.t("common:modules.alerting.categories.info"),
                    content: i18next.t("additional:modules.tools.cosiFileImport.alertingMessages.success", {filename: payload.filename})}, {root: true}]
            ]);
        });

        it("preset \"auto\", correct kml file, wrong filename", done => {
            const payload = {raw: rawSources[0], checkSameLayer: checkSameLayer, layerName: "bogus_file", filename: "bogus_file.bog", pointImages: pointImages, textColors: textColors, textSizes: textSizes};

            testAction(importKML, payload, state, {}, [{
                type: "Alerting/addSingleAlert",
                payload: {
                    category: i18next.t("common:modules.alerting.categories.error"),
                    content: i18next.t("additional:modules.tools.cosiFileImport.alertingMessages.missingFormat")
                },
                dispatch: true
            }], {}, done, rootGetters);
        });

        it("preset \"auto\", broken kml file, correct filename", done => {
            const payload = {raw: rawSources[1], checkSameLayer: checkSameLayer, layerName: "TestFile1", filename: "TestFile1.kml", pointImages: pointImages, textColors: textColors, textSizes: textSizes};

            testAction(importKML, payload, state, {}, [{
                type: "Alerting/addSingleAlert",
                payload: {
                    category: i18next.t("common:modules.alerting.categories.error"),
                    content: i18next.t("additional:modules.tools.cosiFileImport.alertingMessages.missingFileContent")
                },
                dispatch: true
            }], {}, done, rootGetters);
        });

        it("preset \"auto\", empty kml file, correct filename", done => {
            const payload = {raw: "", checkSameLayer: checkSameLayer, layerName: "TestFile1", filename: "TestFile1.kml", pointImages: pointImages, textColors: textColors, textSizes: textSizes};

            testAction(importKML, payload, state, {}, [{
                type: "Alerting/addSingleAlert",
                payload: {
                    category: i18next.t("common:modules.alerting.categories.error"),
                    content: i18next.t("additional:modules.tools.cosiFileImport.alertingMessages.missingFileContent")
                },
                dispatch: true
            }], {}, done, rootGetters);
        });

        it("preset \"auto\", correct gpx file, correct filename", () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                payload = {raw: rawSources[2], checkSameLayer: checkSameLayer, layerName: "TestFile1", filename: "TestFile1.gpx", pointImages: pointImages, textColors: textColors, textSizes: textSizes};

            importKML({dispatch, commit, state, rootGetters}, payload);
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.args).to.deep.equal([
                ["Alerting/addSingleAlert", {
                    category: i18next.t("common:modules.alerting.categories.info"),
                    content: i18next.t("additional:modules.tools.cosiFileImport.alertingMessages.success", {filename: payload.filename})}, {root: true}]
            ]);
        });

        it("preset \"auto\", correct geojson file, correct filename", () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy(),
                payload = {raw: rawSources[3], checkSameLayer: checkSameLayer, layerName: "TestFile1", filename: "TestFile1.json", pointImages: pointImages, textColors: textColors, textSizes: textSizes};

            importKML({dispatch, commit, state, rootGetters}, payload);
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.args).to.deep.equal([
                ["Alerting/addSingleAlert", {
                    category: i18next.t("common:modules.alerting.categories.info"),
                    content: i18next.t("additional:modules.tools.cosiFileImport.alertingMessages.success", {filename: payload.filename})}, {root: true}]
            ]);
        });

        it("preset \"gpx\", correct kml file, correct filename", () => {
            const
                commit = sinon.spy(),
                dispatch = sinon.spy(),
                payload = {raw: rawSources[3], checkSameLayer: checkSameLayer, layerName: "TestFile1", filename: "TestFile1.json", pointImages: pointImages, textColors: textColors, textSizes: textSizes};

            state.selectedFiletype = "gpx";
            importKML({dispatch, commit, state, rootGetters}, payload);
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.args).to.deep.equal([
                ["Alerting/addSingleAlert", {
                    category: i18next.t("common:modules.alerting.categories.error"),
                    content: i18next.t("additional:modules.tools.cosiFileImport.alertingMessages.missingFileContent", {filename: payload.filename})}, {root: true}]
            ]);
        });
    });
});
