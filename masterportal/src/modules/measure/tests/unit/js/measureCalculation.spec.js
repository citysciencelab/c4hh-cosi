import {Polygon, LineString} from "ol/geom.js";
import Feature from "ol/Feature.js";

import {expect} from "chai";

import {calculateLineLengths, calculatePolygonAreas, formatMeasurementNumber, formatLineLength, formatPolygonArea, formatLiveSketchValue} from "@modules/measure/js/measureCalculation.js";

describe("src/modules/measure/js/measureCalculation", function () {
    describe("formatMeasurementNumber", function () {
        it("should format numbers with German locale (de) separators", function () {
            // i18next mock returns language "de", so thousands=period, decimal=comma
            expect(formatMeasurementNumber(1234.5, 1)).to.equal("1.234,5");
            expect(formatMeasurementNumber(1000, 0)).to.equal("1.000");
            expect(formatMeasurementNumber(85, 0)).to.equal("85");
            expect(formatMeasurementNumber(1.5, 1)).to.equal("1,5");
        });
    });

    describe("calculateLineLengths", function () {
        it("should format measured linestring(s) in m/km/nm correctly", function () {
            const feature = new Feature({
                geometry: new LineString([[0, 0], [1, 1]])
            });
            let result;

            result = calculateLineLengths("EPSG:4326", {}, 6378137, "meter", "0", ["m"]);
            expect(result).to.deep.equal({});

            result = calculateLineLengths("EPSG:4326", {a: feature}, 6378137, "meter", "0", ["m"]);
            expect(result).to.deep.equal({a: "157.426 m"});

            result = calculateLineLengths("EPSG:4326", {a: feature}, 6378137, "decimeter", "0", ["m"]);
            expect(result).to.deep.equal({a: "157.425,5 m"});

            result = calculateLineLengths("EPSG:4326", {a: feature, b: feature}, 6378137, "meter", "0", ["km"]);
            expect(result).to.deep.equal({a: "157,4 km", b: "157,4 km"});

            result = calculateLineLengths("EPSG:4326", {a: feature}, 6378137, "meter", "0", ["nm"]);
            expect(result).to.deep.equal({a: "85 nm"});
        });

        it("should still calculate line length even when polygon tool is currently selected (regression)", function () {
            const lineFeature = new Feature({
                    geometry: new LineString([[0, 0], [1, 1]])
                }),
                selectedGeometry = "Polygon",
                result = calculateLineLengths("EPSG:4326", {line1: lineFeature}, 6378137, "meter", "0", ["m"]);

            expect(selectedGeometry).to.equal("Polygon");
            expect(result).to.deep.equal({line1: "157.426 m"});
        });

    });

    describe("calculatePolygonAreas", function () {
        it("should format measured polygon(s) in m²/ha/km² correctly", function () {
            const feature = new Feature({
                geometry: new Polygon([[[0, 0], [0, 1], [1, 1], [1, 0]]])
            });
            let result;

            result = calculatePolygonAreas("EPSG:4326", {}, 6378137, "meter", "0", ["m²"]);
            expect(result).to.deep.equal({});

            result = calculatePolygonAreas("EPSG:4326", {a: feature}, 6378137, "meter", "0", ["m²"]);
            expect(result).to.deep.equal({a: "12.391.399.902 m²"});

            result = calculatePolygonAreas("EPSG:4326", {a: feature}, 6378137, "decimeter", "0", ["m²"]);
            expect(result).to.deep.equal({a: "12.391.399.902,1 m²"});

            result = calculatePolygonAreas("EPSG:4326", {a: feature, b: feature}, 6378137, "meter", "0", ["km²"]);
            expect(result).to.deep.equal({a: "12.391,4 km²", b: "12.391,4 km²"});

            result = calculatePolygonAreas("EPSG:4326", {a: feature}, 6378137, "decimeter", "0", ["ha"]);
            expect(result).to.deep.equal({a: "1.239.140,0 ha"});
        });

        it("should still calculate polygon area even when line tool is currently selected (regression)", function () {
            const polygonFeature = new Feature({
                    geometry: new Polygon([[[0, 0], [0, 1], [1, 1], [1, 0]]])
                }),
                selectedGeometry = "LineString",
                result = calculatePolygonAreas("EPSG:4326", {poly1: polygonFeature}, 6378137, "meter", "0", ["km²"]);

            expect(selectedGeometry).to.equal("LineString");
            expect(result).to.deep.equal({poly1: "12.391,4 km²"});
        });


    });

    describe("formatLineLength", function () {
        // LineString from [0,0] to [1,1] in EPSG:4326 ≈ 157,425 m
        const lineGeom = new LineString([[0, 0], [1, 1]]);

        it("should format length in meters", function () {
            const result = formatLineLength(lineGeom, "EPSG:4326", ["m"], "0");

            expect(result).to.match(/m$/);
            expect(result).to.include("m");
        });
        it("should format length in kilometers", function () {
            const result = formatLineLength(lineGeom, "EPSG:4326", ["km"], "0");

            expect(result).to.match(/km$/);
        });
        it("should format length in nautical miles", function () {
            const result = formatLineLength(lineGeom, "EPSG:4326", ["nm"], "0");

            expect(result).to.match(/nm$/);
        });
        it("should return empty string for an unrecognized unit", function () {
            const result = formatLineLength(lineGeom, "EPSG:4326", ["furlong"], "0");

            expect(result).to.equal("");
        });
        it("should use 1 decimal for lengths below 10 m", function () {
            // Very short line: [0,0] → [0.00001, 0] ≈ 1.1 m
            const shortGeom = new LineString([[0, 0], [0.00001, 0]]),
                result = formatLineLength(shortGeom, "EPSG:4326", ["m"], "0");

            expect(result).to.match(/,\d m$/);
        });
        it("should use 0 decimals for lengths >= 10 m", function () {
            const result = formatLineLength(lineGeom, "EPSG:4326", ["m"], "0");

            // 157,426 m — no decimal comma before the unit
            expect(result).to.not.match(/,\d m$/);
        });
    });

    describe("formatPolygonArea", function () {
        // Polygon [[0,0],[0,1],[1,1],[1,0]] in EPSG:4326 ≈ 12 391 399 902 m²
        const polyGeom = new Polygon([[[0, 0], [0, 1], [1, 1], [1, 0]]]);

        it("should format area in m²", function () {
            const result = formatPolygonArea(polyGeom, "EPSG:4326", ["m²"], "0");

            expect(result).to.match(/m²$/);
        });
        it("should format area in ha", function () {
            const result = formatPolygonArea(polyGeom, "EPSG:4326", ["ha"], "0");

            expect(result).to.match(/ha$/);
        });
        it("should format area in km²", function () {
            const result = formatPolygonArea(polyGeom, "EPSG:4326", ["km²"], "0");

            expect(result).to.match(/km²$/);
        });
        it("should return empty string for an unrecognized unit", function () {
            const result = formatPolygonArea(polyGeom, "EPSG:4326", ["acres"], "0");

            expect(result).to.equal("");
        });
        it("should use 1 decimal for areas below 10 m²", function () {
            // Tiny polygon: [0,0],[0,0.00001],[0.00001,0.00001],[0.00001,0] ≈ 1.2 m²
            const tinyGeom = new Polygon([[[0, 0], [0, 0.00001], [0.00001, 0.00001], [0.00001, 0]]]),
                result = formatPolygonArea(tinyGeom, "EPSG:4326", ["m²"], "0");

            expect(result).to.match(/,\d m²$/);
        });
    });

    describe("formatLiveSketchValue", function () {
        const lineGeom = new LineString([[0, 0], [1, 1]]),
            polyGeom = new Polygon([[[0, 0], [0, 1], [1, 1], [1, 0]]]);

        it("should delegate to formatLineLength for type LineString", function () {
            const result = formatLiveSketchValue(lineGeom, "LineString", "EPSG:4326", ["m"], "0", ["m²"], "0");

            expect(result).to.match(/m$/);
        });
        it("should delegate to formatPolygonArea for type Polygon", function () {
            const result = formatLiveSketchValue(polyGeom, "Polygon", "EPSG:4326", ["m"], "0", ["m²"], "0");

            expect(result).to.match(/m²$/);
        });
        it("should return empty string for an unknown geometry type", function () {
            const result = formatLiveSketchValue(lineGeom, "Point", "EPSG:4326", ["m"], "0", ["m²"], "0");

            expect(result).to.equal("");
        });
    });
});
