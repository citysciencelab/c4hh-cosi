import {expect} from "chai";
import Feature from "ol/Feature.js";
import {LineString, Polygon} from "ol/geom.js";
import getters from "@modules/measure/store/gettersMeasure.js";

describe("src/modules/measure/store/gettersMeasure", function () {
    describe("lineLengths and polygonAreas", function () {
        it("calculates line lengths even if selectedGeometry is Polygon (regression)", function () {
            const lineFeature = new Feature({
                    geometry: new LineString([[0, 0], [1, 1]])
                }),
                state = {
                    selectedGeometry: "Polygon",
                    lines: {line1: lineFeature},
                    polygons: {},
                    earthRadius: 6378137,
                    measurementAccuracy: "meter",
                    selectedLineStringUnit: "0",
                    lineStringUnits: ["m"],
                    geometryUpdateTrigger: 0
                },
                rootGetters = {
                    "Maps/projection": {getCode: () => "EPSG:4326"}
                },
                result = getters.lineLengths(state, {}, {}, rootGetters);

            expect(result).to.deep.equal({line1: "157.426 m"});
        });

        it("calculates polygon areas even if selectedGeometry is LineString (regression)", function () {
            const polygonFeature = new Feature({
                    geometry: new Polygon([[[0, 0], [0, 1], [1, 1], [1, 0]]])
                }),
                state = {
                    selectedGeometry: "LineString",
                    lines: {},
                    polygons: {poly1: polygonFeature},
                    earthRadius: 6378137,
                    measurementAccuracy: "meter",
                    selectedPolygonUnit: "0",
                    polygonUnits: ["km²"],
                    geometryUpdateTrigger: 0
                },
                rootGetters = {
                    "Maps/projection": {getCode: () => "EPSG:4326"}
                },
                result = getters.polygonAreas(state, {}, {}, rootGetters);

            expect(result).to.deep.equal({poly1: "12.391,4 km²"});
        });
    });

    describe("measurementList", function () {
        it("returns an empty array when no measurements exist", function () {
            const state = {lines: {}, polygons: {}, customNames: {}},
                mockGetters = {lineLengths: {}, polygonAreas: {}},
                result = getters.measurementList(state, mockGetters);

            expect(result).to.deep.equal([]);
        });

        it("returns line measurements with type and displayValue", function () {
            const feature = {ol_uid: "10"},
                state = {lines: {"10": feature}, polygons: {}, customNames: {}},
                mockGetters = {lineLengths: {"10": "157.426 m"}, polygonAreas: {}},
                result = getters.measurementList(state, mockGetters);

            expect(result).to.have.length(1);
            expect(result[0]).to.deep.equal({
                id: "10",
                type: "LineString",
                displayValue: "157.426 m",
                customName: null
            });
        });

        it("returns polygon measurements with type and displayValue", function () {
            const feature = {ol_uid: "20"},
                state = {lines: {}, polygons: {"20": feature}, customNames: {}},
                mockGetters = {lineLengths: {}, polygonAreas: {"20": "12.391,4 km²"}},
                result = getters.measurementList(state, mockGetters);

            expect(result).to.have.length(1);
            expect(result[0]).to.deep.equal({
                id: "20",
                type: "Polygon",
                displayValue: "12.391,4 km²",
                customName: null
            });
        });

        it("includes custom names when set", function () {
            const feature = {ol_uid: "5"},
                state = {
                    lines: {"5": feature},
                    polygons: {},
                    customNames: {"5": "Testmessung"}
                },
                mockGetters = {lineLengths: {"5": "50 m"}, polygonAreas: {}},
                result = getters.measurementList(state, mockGetters);

            expect(result[0].customName).to.equal("Testmessung");
        });

        it("combines lines and polygons into a single list", function () {
            const state = {
                    lines: {"1": {ol_uid: "1"}},
                    polygons: {"2": {ol_uid: "2"}},
                    customNames: {}
                },
                mockGetters = {
                    lineLengths: {"1": "100 m"},
                    polygonAreas: {"2": "500 m²"}
                },
                result = getters.measurementList(state, mockGetters);

            expect(result).to.have.length(2);
            expect(result.find(m => m.id === "1").type).to.equal("LineString");
            expect(result.find(m => m.id === "2").type).to.equal("Polygon");
        });

        it("uses empty string for missing displayValue", function () {
            const state = {
                    lines: {"3": {ol_uid: "3"}},
                    polygons: {},
                    customNames: {}
                },
                mockGetters = {lineLengths: {}, polygonAreas: {}},
                result = getters.measurementList(state, mockGetters);

            expect(result[0].displayValue).to.equal("");
        });
    });
});
