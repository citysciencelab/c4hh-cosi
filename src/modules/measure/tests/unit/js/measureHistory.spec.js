import {Polygon, LineString} from "ol/geom.js";
import Feature from "ol/Feature.js";

import {expect} from "chai";

import {
    isFeatureGeometryValid,
    canUndoFeature,
    canRedoFeature,
    buildDrawEndHistory,
    createSyntheticUndoEntry
} from "@modules/measure/js/measureHistory.js";

describe("src/modules/measure/js/measureHistory", function () {
    describe("isFeatureGeometryValid", function () {
        it("should return false for undefined", function () {
            expect(isFeatureGeometryValid(undefined)).to.be.false;
        });
        it("should return false for null", function () {
            expect(isFeatureGeometryValid(null)).to.be.false;
        });
        it("should return false for a feature without geometry", function () {
            const feature = new Feature();

            expect(isFeatureGeometryValid(feature)).to.be.false;
        });

        it("should return false for a LineString with fewer than 2 coordinates", function () {
            const feature = new Feature({geometry: new LineString([[0, 0]])});

            expect(isFeatureGeometryValid(feature)).to.be.false;
        });
        it("should return true for a LineString with 2 coordinates", function () {
            const feature = new Feature({geometry: new LineString([[0, 0], [1, 1]])});

            expect(isFeatureGeometryValid(feature)).to.be.true;
        });
        it("should return true for a LineString with 3+ coordinates", function () {
            const feature = new Feature({geometry: new LineString([[0, 0], [1, 1], [2, 2]])});

            expect(isFeatureGeometryValid(feature)).to.be.true;
        });

        it("should return false for a Polygon with fewer than 4 ring points", function () {
            // A ring with only 3 points (not yet closed)
            const feature = new Feature({geometry: new Polygon([[[0, 0], [1, 0], [1, 1]]])});

            expect(isFeatureGeometryValid(feature)).to.be.false;
        });
        it("should return true for a Polygon with 4 ring points (minimum closed ring)", function () {
            const feature = new Feature({geometry: new Polygon([[[0, 0], [1, 0], [1, 1], [0, 0]]])});

            expect(isFeatureGeometryValid(feature)).to.be.true;
        });
        it("should return true for a Polygon with 5+ ring points", function () {
            const feature = new Feature({geometry: new Polygon([[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]])});

            expect(isFeatureGeometryValid(feature)).to.be.true;
        });
    });

    describe("canUndoFeature", function () {
        it("should return true when the undo stack is non-empty", function () {
            const histories = {42: {undo: [{mode: "addPoint"}], redo: []}},
                feature = new Feature({geometry: new LineString([[0, 0], [1, 1]])});

            expect(canUndoFeature(histories, "42", feature)).to.be.true;
        });
        it("should return false when undo stack is empty and feature is undefined", function () {
            const histories = {42: {undo: [], redo: []}};

            expect(canUndoFeature(histories, "42", undefined)).to.be.false;
        });
        it("should return false when there is no history entry and feature is undefined", function () {
            expect(canUndoFeature({}, "42", undefined)).to.be.false;
        });

        it("should fall back to geometry: return true for LineString with > 1 coord", function () {
            const feature = new Feature({geometry: new LineString([[0, 0], [1, 1]])});

            expect(canUndoFeature({}, "42", feature)).to.be.true;
        });
        it("should fall back to geometry: return false for LineString with exactly 1 coord", function () {
            const feature = new Feature({geometry: new LineString([[0, 0]])});

            expect(canUndoFeature({}, "42", feature)).to.be.false;
        });

        it("should fall back to geometry: return true for Polygon ring with > 3 points", function () {
            const feature = new Feature({geometry: new Polygon([[[0, 0], [1, 0], [1, 1], [0, 0]]])});

            expect(canUndoFeature({}, "42", feature)).to.be.true;
        });
        it("should fall back to geometry: return false for Polygon ring with exactly 3 points", function () {
            const feature = new Feature({geometry: new Polygon([[[0, 0], [1, 0], [1, 1]]])});

            expect(canUndoFeature({}, "42", feature)).to.be.false;
        });

        it("normalizes string feature IDs (string '42' matches numeric key 42)", function () {
            const histories = {42: {undo: [{mode: "addPoint"}], redo: []}},
                feature = new Feature({geometry: new LineString([[0, 0], [1, 1]])});

            // "42" (string) should normalize to 42 (number) to find the history
            expect(canUndoFeature(histories, "42", feature)).to.be.true;
        });
    });

    describe("canRedoFeature", function () {
        it("should return true when redo stack is non-empty", function () {
            const histories = {42: {undo: [], redo: [{mode: "addPoint"}]}};

            expect(canRedoFeature(histories, "42")).to.be.true;
        });
        it("should return false when redo stack is empty", function () {
            const histories = {42: {undo: [], redo: []}};

            expect(canRedoFeature(histories, "42")).to.be.false;
        });
        it("should return false when there is no history entry for the feature", function () {
            expect(canRedoFeature({}, "42")).to.be.false;
        });
        it("normalizes string feature IDs", function () {
            const histories = {42: {undo: [], redo: [{mode: "addPoint"}]}};

            expect(canRedoFeature(histories, "42")).to.be.true;
        });
    });

    describe("buildDrawEndHistory", function () {
        it("should return [] for a LineString with only 2 coordinates", function () {
            const feature = new Feature({geometry: new LineString([[0, 0], [1, 1]])});

            expect(buildDrawEndHistory(feature)).to.deep.equal([]);
        });
        it("should return [] for a Polygon ring with only 2 points after stripping closing coord", function () {
            // ring = [[0,0],[1,1],[0,0]] → open = [[0,0],[1,1]] → length <= 2 → []
            const feature = new Feature({geometry: new Polygon([[[0, 0], [1, 1], [0, 0]]])});

            expect(buildDrawEndHistory(feature)).to.deep.equal([]);
        });

        it("should return one entry for a LineString with 3 coordinates", function () {
            const feature = new Feature({geometry: new LineString([[0, 0], [1, 1], [2, 2]])}),
                result = buildDrawEndHistory(feature);

            expect(result).to.have.length(1);
            expect(result[0].mode).to.equal("addPoint");
            expect(result[0].data.pointIndex).to.equal(2);
            expect(result[0].data.point).to.deep.equal([2, 2]);
            expect(result[0].data.geometryType).to.equal("LineString");
        });

        it("should return two entries for a LineString with 4 coordinates", function () {
            const feature = new Feature({geometry: new LineString([[0, 0], [1, 1], [2, 2], [3, 3]])}),
                result = buildDrawEndHistory(feature);

            expect(result).to.have.length(2);
            expect(result[0].data.pointIndex).to.equal(2);
            expect(result[1].data.pointIndex).to.equal(3);
        });

        it("should strip the closing coordinate for a Polygon and return correct entries", function () {
            // ring = [[0,0],[1,0],[1,1],[0,1],[0,0]]
            // open (slice 0,-1) = [[0,0],[1,0],[1,1],[0,1]] → indices 2 and 3 become entries
            const feature = new Feature({geometry: new Polygon([[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]])}),
                result = buildDrawEndHistory(feature);

            expect(result).to.have.length(2);
            expect(result[0].data.geometryType).to.equal("Polygon");
            expect(result[0].data.pointIndex).to.equal(2);
            expect(result[0].data.point).to.deep.equal([1, 1]);
            expect(result[1].data.pointIndex).to.equal(3);
            expect(result[1].data.point).to.deep.equal([0, 1]);
        });

        it("each entry should have a numeric timestamp", function () {
            const feature = new Feature({geometry: new LineString([[0, 0], [1, 1], [2, 2]])}),
                result = buildDrawEndHistory(feature);

            expect(result[0].timestamp).to.be.a("number");
        });
    });

    describe("createSyntheticUndoEntry", function () {
        it("should return null for a LineString with only 1 coordinate", function () {
            const feature = new Feature({geometry: new LineString([[0, 0]])});

            expect(createSyntheticUndoEntry(feature)).to.be.null;
        });
        it("should return an entry pointing to the last coord of a LineString", function () {
            const feature = new Feature({geometry: new LineString([[0, 0], [1, 1], [2, 2]])}),
                result = createSyntheticUndoEntry(feature);

            expect(result).to.not.be.null;
            expect(result.mode).to.equal("addPoint");
            expect(result.data.point).to.deep.equal([2, 2]);
            expect(result.data.pointIndex).to.equal(2);
            expect(result.data.geometryType).to.equal("LineString");
        });
        it("should return an entry for a LineString with exactly 2 coordinates", function () {
            const feature = new Feature({geometry: new LineString([[0, 0], [1, 1]])}),
                result = createSyntheticUndoEntry(feature);

            expect(result).to.not.be.null;
            expect(result.data.pointIndex).to.equal(1);
            expect(result.data.point).to.deep.equal([1, 1]);
        });

        it("should return null for a Polygon ring with only 3 points (not yet closeable)", function () {
            const feature = new Feature({geometry: new Polygon([[[0, 0], [1, 0], [1, 1]]])});

            expect(createSyntheticUndoEntry(feature)).to.be.null;
        });
        it("should return an entry pointing to the second-to-last ring point for a Polygon", function () {
            // ring = [[0,0],[1,0],[1,1],[0,1],[0,0]]
            // last non-closing meaningful point is coords[coords.length - 2] = [0,1]
            const feature = new Feature({geometry: new Polygon([[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]])}),
                result = createSyntheticUndoEntry(feature);

            expect(result).to.not.be.null;
            expect(result.mode).to.equal("addPoint");
            expect(result.data.geometryType).to.equal("Polygon");
        });
        it("each entry should have a numeric timestamp", function () {
            const feature = new Feature({geometry: new LineString([[0, 0], [1, 1]])}),
                result = createSyntheticUndoEntry(feature);

            expect(result.timestamp).to.be.a("number");
        });
    });
});
