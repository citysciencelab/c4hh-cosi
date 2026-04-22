/**/
import testAction from "@devtools/tests/VueTestUtils.js";
import actions from "../../../store/actionsFileImportAddon";
import importedState from "../../../store/stateFileImportAddon";
import rawSources from "../../resources/rawSources.js";
import crs from "@masterportal/masterportalapi/src/crs";
import {beforeAll} from "vitest";

const
    {importKML} = actions,
    namedProjections = [
        ["EPSG:31467", "+title=Bessel/Gauß-Krüger 3 +proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=bessel +datum=potsdam +units=m +no_defs"],
        ["EPSG:25832", "+title=ETRS89/UTM 32N +proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],
        ["EPSG:8395", "+title=ETRS89/Gauß-Krüger 3 +proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=GRS80 +datum=GRS80 +units=m +no_defs"],
        ["EPSG:4326", "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs"]
    ];

beforeAll(() => {
    crs.registerProjections(namedProjections);

    i18next.init({
        lng: "cimode",
        debug: false
    });
});

/**
 * Wraps the callback-based action test helper so this spec can use async/await.
 * @returns {Promise<void>} resolves when the helper reports success
 */
function testActionAsync (action, payload, state, rootState, expectedMutationsAndActions, getters = {}, rootGetters = {}) {
    return new Promise((resolve, reject) => {
        testAction(
            action,
            payload,
            state,
            rootState,
            expectedMutationsAndActions,
            getters,
            error => error ? reject(error) : resolve(),
            rootGetters
        );
    });
}

describe("addons/fileImportAddon/store/actionsFileImportAddon.js", () => {
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

        it("preset \"auto\", correct kml file, correct filename", async () => {
            const payload = {raw: rawSources[0], checkSameLayer: checkSameLayer, layerName: "TestFile1", filename: "TestFile1.kml", pointImages: pointImages, textColors: textColors, textSizes: textSizes};

            await testActionAsync(importKML, payload, importedState, {}, [{
                type: "Alerting/addSingleAlert",
                payload: {
                    category: i18next.t("common:modules.alerting.categories.info"),
                    content: i18next.t("additional:modules.tools.fileImportAddon.alertingMessages.success", {filename: payload.filename})},
                dispatch: true
            }]);
        });

        it("preset \"auto\", correct kml file, wrong filename", async () => {
            const payload = {raw: rawSources[0], checkSameLayer: checkSameLayer, layerName: "bogus_file", filename: "bogus_file.bog", pointImages: pointImages, textColors: textColors, textSizes: textSizes};

            await testActionAsync(importKML, payload, importedState, {}, [{
                type: "Alerting/addSingleAlert",
                payload: {
                    category: i18next.t("common:modules.alerting.categories.error"),
                    content: i18next.t("additional:modules.tools.fileImportAddon.alertingMessages.missingFormat")
                },
                dispatch: true
            }]);
        });

        it("preset \"auto\", broken kml file, correct filename", async () => {
            const payload = {raw: rawSources[1], checkSameLayer: checkSameLayer, layerName: "TestFile1", filename: "TestFile1.kml", pointImages: pointImages, textColors: textColors, textSizes: textSizes};

            await testActionAsync(importKML, payload, importedState, {}, [{
                type: "Alerting/addSingleAlert",
                payload: {
                    category: i18next.t("common:modules.alerting.categories.error"),
                    content: i18next.t("additional:modules.tools.fileImportAddon.alertingMessages.missingFileContent")
                },
                dispatch: true
            }]);
        });

        it("preset \"auto\", empty kml file, correct filename", async () => {
            const payload = {raw: "", checkSameLayer: checkSameLayer, layerName: "TestFile1", filename: "TestFile1.kml", pointImages: pointImages, textColors: textColors, textSizes: textSizes};

            await testActionAsync(importKML, payload, importedState, {}, [{
                type: "Alerting/addSingleAlert",
                payload: {
                    category: i18next.t("common:modules.alerting.categories.error"),
                    content: i18next.t("additional:modules.tools.fileImportAddon.alertingMessages.missingFileContent")
                },
                dispatch: true
            }]);
        });

        it("preset \"auto\", correct gpx file, correct filename", async () => {
            const payload = {raw: rawSources[2], checkSameLayer: checkSameLayer, layerName: "TestFile1", filename: "TestFile1.gpx", pointImages: pointImages, textColors: textColors, textSizes: textSizes};

            await testActionAsync(importKML, payload, importedState, {}, [{
                type: "Alerting/addSingleAlert",
                payload: {
                    category: i18next.t("common:modules.alerting.categories.info"),
                    content: i18next.t("additional:modules.tools.fileImportAddon.alertingMessages.success", {filename: payload.filename})},
                dispatch: true
            }]);
        });

        it("preset \"auto\", correct geojson file, correct filename", async () => {
            const payload = {raw: rawSources[3], checkSameLayer: checkSameLayer, layerName: "TestFile1", filename: "TestFile1.json", pointImages: pointImages, textColors: textColors, textSizes: textSizes};

            await testActionAsync(importKML, payload, importedState, {}, [{
                type: "Alerting/addSingleAlert",
                payload: {
                    category: i18next.t("common:modules.alerting.categories.info"),
                    content: i18next.t("additional:modules.tools.fileImportAddon.alertingMessages.success", {filename: payload.filename})},
                dispatch: true
            }]);
        });

        it("preset \"gpx\", correct kml file, correct filename", async () => {
            const
                payload = {raw: rawSources[3], checkSameLayer: checkSameLayer, layerName: "TestFile1", filename: "TestFile1.json", pointImages: pointImages, textColors: textColors, textSizes: textSizes},
                tmpState = {...importedState, ...{selectedFiletype: "gpx"}};

            await testActionAsync(importKML, payload, tmpState, {}, [{
                type: "Alerting/addSingleAlert",
                payload: {
                    category: i18next.t("common:modules.alerting.categories.error"),
                    content: i18next.t("additional:modules.tools.fileImportAddon.alertingMessages.missingFileContent")},
                dispatch: true
            }]);
        });

        it("test the function getParsedData for old atlas innere sicherheit Polygon style", async () => {
            const payload = {raw: rawSources[4], checkSameLayer: checkSameLayer, layerName: "TestFile1", filename: "TestFile1.kml", pointImages: pointImages, textColors: textColors, textSizes: textSizes};

            await testActionAsync(importKML, payload, importedState, {}, [{
                type: "Alerting/addSingleAlert",
                payload: {
                    category: i18next.t("common:modules.alerting.categories.info"),
                    content: i18next.t("additional:modules.tools.fileImportAddon.alertingMessages.success", {filename: payload.filename})},
                dispatch: true
            }]);
        });

        it("test the function getParsedData for old atlas innere sicherheit Line style", async () => {
            const payload = {raw: rawSources[5], checkSameLayer: checkSameLayer, layerName: "TestFile1", filename: "TestFile1.kml", pointImages: pointImages, textColors: textColors, textSizes: textSizes};

            await testActionAsync(importKML, payload, importedState, {}, [{
                type: "Alerting/addSingleAlert",
                payload: {
                    category: i18next.t("common:modules.alerting.categories.info"),
                    content: i18next.t("additional:modules.tools.fileImportAddon.alertingMessages.success", {filename: payload.filename})},
                dispatch: true
            }]);
        });

        it("test the function getParsedData for old atlas innere sicherheit Point style", async () => {
            const payload = {raw: rawSources[6], checkSameLayer: checkSameLayer, layerName: "TestFile1", filename: "TestFile1.kml", pointImages: pointImages, textColors: textColors, textSizes: textSizes};

            await testActionAsync(importKML, payload, importedState, {}, [{
                type: "Alerting/addSingleAlert",
                payload: {
                    category: i18next.t("common:modules.alerting.categories.info"),
                    content: i18next.t("additional:modules.tools.fileImportAddon.alertingMessages.success", {filename: payload.filename})},
                dispatch: true
            }]);
        });
    });
});
