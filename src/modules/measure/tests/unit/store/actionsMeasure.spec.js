import {expect} from "chai";
import sinon from "sinon";
import Feature from "ol/Feature.js";
import {LineString, Polygon, Point} from "ol/geom.js";

import actions from "@modules/measure/store/actionsMeasure.js";
import source from "@modules/measure/js/measureSource.js";

const {
    deleteFeatures,
    deleteSingleFeature,
    removeTooltipForFeature,
    updateTooltipPositionForFeature,
    undoPointOnFeature,
    redoPointOnFeature,
    undoModifyCoordinates,
    redoModifyCoordinates,
    capturePreModifyCoords
} = actions;

describe("src/modules/measure/store/actionsMeasure", function () {
    let state, commit, dispatch, clear;

    beforeEach(() => {
        state = {
            unlisteners: [sinon.spy()],
            interaction: {
                abortDrawing: sinon.spy()
            }
        };
        commit = sinon.spy();
        dispatch = sinon.spy();
        clear = sinon.spy();
        sinon.stub(source, "clear").callsFake(clear);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("deleteFeatures", function () {
        it("aborts drawing", function () {
            deleteFeatures({state, commit});

            expect(state.interaction.abortDrawing.calledOnce).to.be.true;
        });

        it("calls all unlisteners", function () {
            deleteFeatures({state, commit});

            expect(state.unlisteners[0].calledOnce).to.be.true;
        });

        it("clears the source", function () {
            deleteFeatures({state, commit});

            expect(clear.calledOnce).to.be.true;
        });

        it("resets lines, polygons, customNames and unlisteners", function () {
            deleteFeatures({state, commit});

            expect(commit.calledWith("setLines", {})).to.be.true;
            expect(commit.calledWith("setPolygons", {})).to.be.true;
            expect(commit.calledWith("setCustomNames", {})).to.be.true;
            expect(commit.calledWith("setUnlisteners", [])).to.be.true;
        });
    });

    describe("removeTooltipForFeature", function () {
        it("removes tooltip features matching the given featureId", function () {
            const tooltipFeature = new Feature({geometry: new Point([0, 0])});

            tooltipFeature.set("featureId", 42);
            const otherFeature = new Feature({geometry: new Point([1, 1])});

            otherFeature.set("featureId", 99);
            const featuresToRemove = [];

            sinon.stub(source, "forEachFeature").callsFake(cb => {
                cb(tooltipFeature);
                return cb(otherFeature);
            });
            sinon.stub(source, "removeFeature").callsFake(f => featuresToRemove.push(f));

            removeTooltipForFeature({}, "42");

            expect(featuresToRemove).to.have.length(1);
            expect(featuresToRemove[0]).to.equal(tooltipFeature);
        });

        it("does not remove non-tooltip features (no featureId property)", function () {
            const normalFeature = new Feature({geometry: new Point([0, 0])});
            const featuresToRemove = [];

            sinon.stub(source, "forEachFeature").callsFake(cb => cb(normalFeature));
            sinon.stub(source, "removeFeature").callsFake(f => featuresToRemove.push(f));

            removeTooltipForFeature({}, "5");

            expect(featuresToRemove).to.have.length(0);
        });
    });

    describe("updateTooltipPositionForFeature", function () {
        it("updates tooltip Point geometry for a LineString feature", function () {
            const line = new Feature({geometry: new LineString([[0, 0], [1, 1], [2, 2]])});

            line.ol_uid = "10";
            const tooltipFeature = new Feature({geometry: new Point([0, 0])});

            tooltipFeature.set("featureId", 10);
            const newCoords = [];

            sinon.stub(source, "forEachFeature").callsFake(cb => cb(tooltipFeature));
            sinon.stub(tooltipFeature.getGeometry(), "setCoordinates").callsFake(c => newCoords.push(c));

            updateTooltipPositionForFeature({state: {featureId: null}, commit}, line);

            expect(newCoords[0]).to.deep.equal([2, 2]);
        });

        it("updates tooltipCoord in store when feature is the current featureId", function () {
            const line = new Feature({geometry: new LineString([[0, 0], [5, 5]])});

            line.ol_uid = "7";
            sinon.stub(source, "forEachFeature").callsFake(() => undefined);

            updateTooltipPositionForFeature({state: {featureId: "7"}, commit}, line);

            expect(commit.calledWith("setTooltipCoord", [5, 5])).to.be.true;
        });

        it("updates correct tooltip coordinate for a Polygon feature", function () {
            const ring = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];
            const polygon = new Feature({geometry: new Polygon([ring])});

            polygon.ol_uid = "20";
            const tooltipFeature = new Feature({geometry: new Point([0, 0])});

            tooltipFeature.set("featureId", 20);
            const newCoords = [];

            sinon.stub(source, "forEachFeature").callsFake(cb => cb(tooltipFeature));
            sinon.stub(tooltipFeature.getGeometry(), "setCoordinates").callsFake(c => newCoords.push(c));

            updateTooltipPositionForFeature({state: {featureId: null}, commit}, polygon);

            // second-to-last coordinate of the ring (index = length-2 = 3)
            expect(newCoords[0]).to.deep.equal([0, 1]);
        });
    });

    describe("deleteSingleFeature", function () {
        it("removes the feature from source and commits removeFeature", function () {
            const feature = new Feature({geometry: new LineString([[0, 0], [1, 1]])});

            feature.ol_uid = "5";
            const removedFromSource = [];

            sinon.stub(source, "getFeatures").returns([feature]);
            sinon.stub(source, "removeFeature").callsFake(f => removedFromSource.push(f));

            deleteSingleFeature({commit, dispatch}, "5");

            expect(removedFromSource).to.have.length(1);
            expect(commit.calledWith("removeFeature", "5")).to.be.true;
            expect(dispatch.calledWith("removeTooltipForFeature", "5")).to.be.true;
        });

        it("does nothing if feature is not found in source", function () {
            sinon.stub(source, "getFeatures").returns([]);
            const removeStub = sinon.stub(source, "removeFeature");

            deleteSingleFeature({commit, dispatch}, "999");

            expect(removeStub.called).to.be.false;
            expect(commit.called).to.be.false;
        });

        it("ignores tooltip features (features with featureId property set)", function () {
            const tooltipFeature = new Feature({geometry: new Point([0, 0])});

            tooltipFeature.ol_uid = "5";
            tooltipFeature.set("featureId", 5);
            sinon.stub(source, "getFeatures").returns([tooltipFeature]);
            const removeStub = sinon.stub(source, "removeFeature");

            deleteSingleFeature({commit, dispatch}, "5");

            expect(removeStub.called).to.be.false;
        });
    });

    describe("undoPointOnFeature", function () {
        it("removes the point at pointIndex from a LineString", function () {
            const feature = new Feature({geometry: new LineString([[0, 0], [1, 1], [2, 2]])});

            feature.ol_uid = "1";
            const historyEntry = {data: {geometryType: "LineString", pointIndex: 2, point: [2, 2]}};

            undoPointOnFeature({commit, dispatch}, {feature, historyEntry});

            expect(feature.getGeometry().getCoordinates()).to.deep.equal([[0, 0], [1, 1]]);
            expect(commit.calledWith("addFeature", feature)).to.be.true;
        });

        it("removes a middle point at pointIndex from a LineString", function () {
            const feature = new Feature({geometry: new LineString([[0, 0], [1, 1], [2, 2], [3, 3]])});

            feature.ol_uid = "1";
            const historyEntry = {data: {geometryType: "LineString", pointIndex: 2, point: [2, 2]}};

            undoPointOnFeature({commit, dispatch}, {feature, historyEntry});

            expect(feature.getGeometry().getCoordinates()).to.deep.equal([[0, 0], [1, 1], [3, 3]]);
        });

        it("dispatches deleteSingleFeature when LineString reaches 1 coordinate", function () {
            const feature = new Feature({geometry: new LineString([[0, 0], [1, 1]])});

            feature.ol_uid = "2";
            const historyEntry = {data: {geometryType: "LineString", pointIndex: 1, point: [1, 1]}};

            undoPointOnFeature({commit, dispatch}, {feature, historyEntry});

            expect(dispatch.calledWith("deleteSingleFeature", "2")).to.be.true;
        });

        it("removes a point at pointIndex from a Polygon ring", function () {
            const ring = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];
            const feature = new Feature({geometry: new Polygon([ring])});

            feature.ol_uid = "3";
            // pointIndex 3: remove [0,1]
            const historyEntry = {data: {geometryType: "Polygon", pointIndex: 3, point: [0, 1]}};

            undoPointOnFeature({commit, dispatch}, {feature, historyEntry});

            const coords = feature.getGeometry().getCoordinates()[0];

            expect(coords).to.deep.equal([[0, 0], [1, 0], [1, 1], [0, 0]]);
        });

        it("dispatches deleteSingleFeature when Polygon would have fewer than 4 ring coords", function () {
            const ring = [[0, 0], [1, 0], [1, 1], [0, 0]];
            const feature = new Feature({geometry: new Polygon([ring])});

            feature.ol_uid = "4";
            const historyEntry = {data: {geometryType: "Polygon", pointIndex: 2, point: [1, 1]}};

            undoPointOnFeature({commit, dispatch}, {feature, historyEntry});

            expect(dispatch.calledWith("deleteSingleFeature", "4")).to.be.true;
        });

        it("does not mutate geometry when pointIndex is out of bounds", function () {
            const feature = new Feature({geometry: new LineString([[0, 0], [1, 1]])});

            feature.ol_uid = "5";
            const historyEntry = {data: {geometryType: "LineString", pointIndex: 99, point: [99, 99]}};

            undoPointOnFeature({commit, dispatch}, {feature, historyEntry});

            expect(feature.getGeometry().getCoordinates()).to.deep.equal([[0, 0], [1, 1]]);
            expect(commit.called).to.be.false;
        });
    });

    describe("redoPointOnFeature", function () {
        it("appends a point to a LineString", function () {
            const feature = new Feature({geometry: new LineString([[0, 0], [1, 1]])});

            feature.ol_uid = "1";
            const historyEntry = {data: {geometryType: "LineString", point: [2, 2], pointIndex: 2}};

            redoPointOnFeature({commit, dispatch}, {feature, historyEntry});

            expect(feature.getGeometry().getCoordinates()).to.deep.equal([[0, 0], [1, 1], [2, 2]]);
            expect(commit.calledWith("addFeature", feature)).to.be.true;
        });

        it("inserts a point before ring closure in a Polygon", function () {
            const ring = [[0, 0], [1, 0], [1, 1], [0, 0]];
            const feature = new Feature({geometry: new Polygon([ring])});

            feature.ol_uid = "2";
            const historyEntry = {data: {geometryType: "Polygon", point: [0, 1], pointIndex: 3}};

            redoPointOnFeature({commit, dispatch}, {feature, historyEntry});

            const coords = feature.getGeometry().getCoordinates()[0];

            // [0,1] should be inserted before the ring closure [0,0]
            expect(coords).to.deep.equal([[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]);
        });
    });

    describe("undoModifyCoordinates", function () {
        it("restores previous LineString coordinates", function () {
            const feature = new Feature({geometry: new LineString([[0, 0], [5, 5]])});

            feature.ol_uid = "1";
            const prev = [[0, 0], [1, 1], [2, 2]];
            const historyEntry = {
                data: {geometryType: "LineString", previousCoordinates: prev, newCoordinates: [[0, 0], [5, 5]]}
            };

            undoModifyCoordinates({commit, dispatch}, {feature, historyEntry});

            expect(feature.getGeometry().getCoordinates()).to.deep.equal(prev);
            expect(commit.calledWith("addFeature", feature)).to.be.true;
        });

        it("restores previous Polygon coordinates", function () {
            const ring = [[0, 0], [5, 0], [5, 5], [0, 0]];
            const feature = new Feature({geometry: new Polygon([ring])});

            feature.ol_uid = "2";
            const prev = [[0, 0], [1, 0], [1, 1], [0, 0]];
            const historyEntry = {data: {geometryType: "Polygon", previousCoordinates: prev, newCoordinates: ring}};

            undoModifyCoordinates({commit, dispatch}, {feature, historyEntry});

            expect(feature.getGeometry().getCoordinates()[0]).to.deep.equal(prev);
        });
    });

    describe("redoModifyCoordinates", function () {
        it("reapplies new LineString coordinates", function () {
            const feature = new Feature({geometry: new LineString([[0, 0], [1, 1]])});

            feature.ol_uid = "1";
            const newCoords = [[0, 0], [3, 3], [6, 6]];
            const historyEntry = {
                data: {geometryType: "LineString", previousCoordinates: [[0, 0], [1, 1]], newCoordinates: newCoords}
            };

            redoModifyCoordinates({commit, dispatch}, {feature, historyEntry});

            expect(feature.getGeometry().getCoordinates()).to.deep.equal(newCoords);
            expect(commit.calledWith("addFeature", feature)).to.be.true;
        });

        it("reapplies new Polygon coordinates", function () {
            const ring = [[0, 0], [1, 0], [1, 1], [0, 0]];
            const feature = new Feature({geometry: new Polygon([ring])});

            feature.ol_uid = "2";
            const newRing = [[0, 0], [2, 0], [2, 2], [0, 0]];
            const historyEntry = {data: {geometryType: "Polygon", previousCoordinates: ring, newCoordinates: newRing}};

            redoModifyCoordinates({commit, dispatch}, {feature, historyEntry});

            expect(feature.getGeometry().getCoordinates()[0]).to.deep.equal(newRing);
        });
    });

    describe("capturePreModifyCoords", function () {
        it("stores a deep clone of LineString coords on the feature", function () {
            const coords = [[0, 0], [1, 1]];
            const feature = new Feature({geometry: new LineString(coords)});

            capturePreModifyCoords({}, feature);

            const captured = feature.get("_beforeModifyCoords");

            expect(captured).to.deep.equal(coords);
            expect(captured).not.to.equal(feature.getGeometry().getCoordinates());
        });

        it("stores a deep clone of Polygon ring coords on the feature", function () {
            const ring = [[0, 0], [1, 0], [1, 1], [0, 0]];
            const feature = new Feature({geometry: new Polygon([ring])});

            capturePreModifyCoords({}, feature);

            const captured = feature.get("_beforeModifyCoords");

            expect(captured).to.deep.equal(ring);
            expect(captured).not.to.equal(feature.getGeometry().getCoordinates()[0]);
        });

        it("sets coords directly as fallback if deep clone fails", function () {
            const coords = [[0, 0], [1, 1]];
            const feature = new Feature({geometry: new LineString(coords)});

            // stub structuredClone and JSON to force fallback
            const origStructuredClone = global.structuredClone;

            global.structuredClone = () => {
                throw new Error("clone failed");
            };
            const origJson = JSON.stringify;

            JSON.stringify = () => {
                throw new Error("stringify failed");
            };

            capturePreModifyCoords({}, feature);

            expect(feature.get("_beforeModifyCoords")).to.be.an("array");

            global.structuredClone = origStructuredClone;
            JSON.stringify = origJson;
        });
    });
});
