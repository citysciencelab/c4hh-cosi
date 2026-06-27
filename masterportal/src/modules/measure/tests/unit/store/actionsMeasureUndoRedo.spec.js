import {expect} from "chai";
import sinon from "sinon";
import Feature from "ol/Feature.js";
import {LineString, Polygon} from "ol/geom.js";

import actions from "@modules/measure/store/actionsMeasureUndoRedo.js";
import source from "@modules/measure/js/measureSource.js";

const {
    undoPointOnFeature,
    redoPointOnFeature,
    undoModifyCoordinates,
    redoModifyCoordinates,
    capturePreModifyCoords,
    regulateDeleteAll,
    syncFeatureHistories,
    regulateUndo,
    undoInitialPoint,
    regulateRedo,
    undoLastPointInSketch,
    redoLastPointInSketch,
    abortCurrentDrawing
} = actions;

describe("src/modules/measure/store/actionsMeasureUndoRedo", function () {
    let commit, dispatch, state, getters, warn, error;

    beforeEach(() => {
        warn = sinon.spy();
        sinon.stub(console, "warn").callsFake(warn);
        error = sinon.spy();
        sinon.stub(console, "error").callsFake(error);
        commit = sinon.spy();
        dispatch = sinon.spy();
        state = {
            interaction: null,
            currentSketch: null,
            drawingPointHistory: [],
            featureHistories: {},
            featureId: null
        };
        getters = {getFeatureById: sinon.stub()};
    });


    describe("regulateDeleteAll", function () {
        it("dispatches cleanupAllInteractions", function () {
            regulateDeleteAll({commit, dispatch});

            expect(dispatch.calledWith("cleanupAllInteractions")).to.be.true;
        });

        it("commits clearAllFeatureHistories", function () {
            regulateDeleteAll({commit, dispatch});

            expect(commit.calledWith("clearAllFeatureHistories")).to.be.true;
        });

        it("commits setCurrentSketch null and setDrawingPointHistory []", function () {
            regulateDeleteAll({commit, dispatch});

            expect(commit.calledWith("setCurrentSketch", null)).to.be.true;
            expect(commit.calledWith("setDrawingPointHistory", [])).to.be.true;
        });

        it("dispatches deleteFeatures and createDrawInteraction", function () {
            regulateDeleteAll({commit, dispatch});

            expect(dispatch.calledWith("deleteFeatures")).to.be.true;
            expect(dispatch.calledWith("createDrawInteraction")).to.be.true;
        });
    });

    describe("syncFeatureHistories", function () {
        it("calls initFeatureHistory for each item in the list", function () {
            syncFeatureHistories({commit}, [{id: "10"}, {id: "20"}]);

            expect(commit.calledWith("initFeatureHistory", 10)).to.be.true;
            expect(commit.calledWith("initFeatureHistory", 20)).to.be.true;
        });

        it("does nothing for an empty list", function () {
            syncFeatureHistories({commit}, []);

            expect(commit.called).to.be.false;
        });

        it("normalizes string IDs to numbers", function () {
            syncFeatureHistories({commit}, [{id: "42"}]);

            expect(commit.calledWith("initFeatureHistory", 42)).to.be.true;
        });
    });

    describe("regulateUndo", function () {
        it("dispatches undoLastPointInSketch when currentSketch matches featureId", function () {
            const sketch = new Feature();

            sketch.ol_uid = "5";
            state.currentSketch = sketch;

            regulateUndo({state, commit, dispatch, getters}, "5");

            expect(dispatch.calledWith("undoLastPointInSketch")).to.be.true;
        });

        it("does nothing when feature is not found in source", function () {
            getters.getFeatureById.returns(undefined);

            regulateUndo({state, commit, dispatch, getters}, "99");

            expect(dispatch.calledWith("undoPointOnFeature")).to.be.false;
            expect(dispatch.calledWith("undoInitialPoint")).to.be.false;
        });

        it("dispatches undoInitialPoint when history is empty", function () {
            const feature = new Feature({geometry: new LineString([[0, 0], [1, 1]])});

            feature.ol_uid = "10";
            getters.getFeatureById.returns(feature);
            state.featureHistories = {10: {undo: [], redo: []}};

            regulateUndo({state, commit, dispatch, getters}, "10");

            expect(dispatch.calledWith("undoInitialPoint")).to.be.true;
        });

        it("dispatches undoInitialPoint when featureHistories has no entry", function () {
            const feature = new Feature({geometry: new LineString([[0, 0], [1, 1]])});

            feature.ol_uid = "10";
            getters.getFeatureById.returns(feature);
            state.featureHistories = {};

            regulateUndo({state, commit, dispatch, getters}, "10");

            expect(dispatch.calledWith("undoInitialPoint")).to.be.true;
        });

        it("pops undo entry and dispatches undoPointOnFeature for addPoint mode", function () {
            const feature = new Feature({geometry: new LineString([[0, 0], [1, 1]])});
            const entry = {mode: "addPoint", data: {geometryType: "LineString", pointIndex: 1, point: [1, 1]}};

            feature.ol_uid = "10";
            getters.getFeatureById.returns(feature);
            state.featureHistories = {10: {undo: [entry], redo: []}};

            regulateUndo({state, commit, dispatch, getters}, "10");

            expect(commit.calledWith("popUndoEntry", 10)).to.be.true;
            expect(dispatch.calledWith("undoPointOnFeature", {feature, historyEntry: entry})).to.be.true;
            expect(commit.calledWith("pushRedoEntry", {normalizedId: 10, entry})).to.be.true;
        });

        it("pops undo entry and dispatches undoModifyCoordinates for modifyCoordinates mode", function () {
            const feature = new Feature({geometry: new LineString([[0, 0], [1, 1]])});
            const entry = {mode: "modifyCoordinates", data: {geometryType: "LineString", previousCoordinates: [[0, 0]], newCoordinates: [[1, 1]]}};

            feature.ol_uid = "10";
            getters.getFeatureById.returns(feature);
            state.featureHistories = {10: {undo: [entry], redo: []}};

            regulateUndo({state, commit, dispatch, getters}, "10");

            expect(dispatch.calledWith("undoModifyCoordinates", {feature, historyEntry: entry})).to.be.true;
        });
    });

    describe("undoInitialPoint", function () {
        it("does nothing when feature has too few coordinates for a synthetic entry", function () {
            const feature = new Feature({geometry: new LineString([[0, 0]])});

            undoInitialPoint({commit, dispatch}, {feature, normalizedId: 1});

            expect(dispatch.calledWith("undoPointOnFeature")).to.be.false;
        });

        it("creates history and dispatches undoPointOnFeature when entry can be synthesized", function () {
            const feature = new Feature({geometry: new LineString([[0, 0], [1, 1]])});

            undoInitialPoint({commit, dispatch}, {feature, normalizedId: 1});

            expect(commit.calledWith("initFeatureHistory", 1)).to.be.true;
            expect(dispatch.calledWith("undoPointOnFeature")).to.be.true;
            expect(commit.calledWith("pushRedoEntry")).to.be.true;
        });
    });

    describe("regulateRedo", function () {
        it("dispatches redoLastPointInSketch when currentSketch matches featureId", function () {
            const sketch = new Feature();

            sketch.ol_uid = "5";
            state.currentSketch = sketch;

            regulateRedo({state, commit, dispatch, getters}, "5");

            expect(dispatch.calledWith("redoLastPointInSketch")).to.be.true;
        });

        it("does nothing when feature is not found in source", function () {
            getters.getFeatureById.returns(undefined);

            regulateRedo({state, commit, dispatch, getters}, "99");

            expect(commit.calledWith("popRedoEntry")).to.be.false;
        });

        it("does nothing when redo stack is empty", function () {
            const feature = new Feature({geometry: new LineString([[0, 0], [1, 1]])});

            feature.ol_uid = "10";
            getters.getFeatureById.returns(feature);
            state.featureHistories = {10: {undo: [], redo: []}};

            regulateRedo({state, commit, dispatch, getters}, "10");

            expect(commit.calledWith("popRedoEntry")).to.be.false;
        });

        it("pops redo entry and dispatches redoPointOnFeature for addPoint mode", function () {
            const feature = new Feature({geometry: new LineString([[0, 0], [1, 1]])});
            const entry = {mode: "addPoint", data: {geometryType: "LineString", point: [2, 2], pointIndex: 2}};

            feature.ol_uid = "10";
            getters.getFeatureById.returns(feature);
            state.featureHistories = {10: {undo: [], redo: [entry]}};

            regulateRedo({state, commit, dispatch, getters}, "10");

            expect(commit.calledWith("popRedoEntry", 10)).to.be.true;
            expect(dispatch.calledWith("redoPointOnFeature", {feature, historyEntry: entry})).to.be.true;
            expect(commit.calledWith("pushUndoEntry", {normalizedId: 10, entry})).to.be.true;
        });

        it("pops redo entry and dispatches redoModifyCoordinates for modifyCoordinates mode", function () {
            const feature = new Feature({geometry: new LineString([[0, 0], [1, 1]])});
            const entry = {mode: "modifyCoordinates", data: {geometryType: "LineString", previousCoordinates: [[0, 0]], newCoordinates: [[1, 1]]}};

            feature.ol_uid = "10";
            getters.getFeatureById.returns(feature);
            state.featureHistories = {10: {undo: [], redo: [entry]}};

            regulateRedo({state, commit, dispatch, getters}, "10");

            expect(dispatch.calledWith("redoModifyCoordinates", {feature, historyEntry: entry})).to.be.true;
        });
    });

    describe("undoLastPointInSketch", function () {
        it("does nothing when there is no currentSketch", function () {
            state.interaction = {removeLastPoint: sinon.spy()};

            undoLastPointInSketch({state, commit, dispatch});

            expect(state.interaction.removeLastPoint.called).to.be.false;
        });

        it("does nothing when there is no interaction", function () {
            state.currentSketch = new Feature({geometry: new LineString([[0, 0], [1, 1]])});
            state.interaction = null;

            undoLastPointInSketch({state, commit, dispatch});

            expect(dispatch.calledWith("abortCurrentDrawing")).to.be.false;
        });

        it("aborts drawing when LineString has only one coordinate", function () {
            const sketch = new Feature({geometry: new LineString([[0, 0]])});

            sketch.ol_uid = "1";
            state.currentSketch = sketch;
            state.interaction = {removeLastPoint: sinon.spy()};

            undoLastPointInSketch({state, commit, dispatch});

            expect(dispatch.calledWith("abortCurrentDrawing")).to.be.true;
            // saves the coordinate to the redo history
            const pushCall = commit.getCalls().find(c => c.args[0] === "setDrawingPointHistory");

            expect(pushCall).to.exist;
        });

        it("calls interaction.removeLastPoint for a normal LineString undo", function () {
            const sketch = new Feature({geometry: new LineString([[0, 0], [1, 1], [2, 2], [3, 3]])});

            sketch.ol_uid = "1";
            state.currentSketch = sketch;
            state.interaction = {removeLastPoint: sinon.spy()};

            undoLastPointInSketch({state, commit, dispatch});

            expect(state.interaction.removeLastPoint.calledOnce).to.be.true;
        });

        it("aborts drawing after removeLastPoint when only minValidPoints remain for LineString", function () {
            const sketch = new Feature({geometry: new LineString([[0, 0], [1, 1], [2, 2]])});

            sketch.ol_uid = "1";
            state.currentSketch = sketch;
            state.interaction = {
                removeLastPoint: sinon.spy(() => {
                    sketch.getGeometry().setCoordinates([[0, 0], [1, 1]]);
                })
            };

            undoLastPointInSketch({state, commit, dispatch});

            expect(dispatch.calledWith("abortCurrentDrawing")).to.be.true;
        });

        it("saves removed point to drawingPointHistory for a LineString", function () {
            const sketch = new Feature({geometry: new LineString([[0, 0], [1, 1], [2, 2], [3, 3]])});

            sketch.ol_uid = "1";
            state.currentSketch = sketch;
            state.drawingPointHistory = [];
            state.interaction = {
                removeLastPoint: sinon.spy(() => {
                    sketch.getGeometry().setCoordinates([[0, 0], [1, 1], [2, 2]]);
                })
            };

            undoLastPointInSketch({state, commit, dispatch});

            const historyCommit = commit.getCalls().find(c => c.args[0] === "setDrawingPointHistory");

            expect(historyCommit).to.exist;
            expect(historyCommit.args[1]).to.deep.include({type: "point", coord: [3, 3]});
        });

        it("calls interaction.removeLastPoint for a normal Polygon undo", function () {
            const ring = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]],
                sketch = new Feature({geometry: new Polygon([ring])});

            sketch.ol_uid = "2";
            state.currentSketch = sketch;
            state.interaction = {removeLastPoint: sinon.spy()};

            undoLastPointInSketch({state, commit, dispatch});

            expect(state.interaction.removeLastPoint.calledOnce).to.be.true;
        });
    });

    describe("redoLastPointInSketch", function () {
        it("does nothing when drawingPointHistory is empty", function () {
            state.currentSketch = new Feature({geometry: new LineString([[0, 0], [1, 1]])});
            state.interaction = {appendCoordinates: sinon.spy()};
            state.drawingPointHistory = [];

            redoLastPointInSketch({state, commit});

            expect(state.interaction.appendCoordinates.called).to.be.false;
        });

        it("does nothing when there is no currentSketch", function () {
            state.currentSketch = null;
            state.drawingPointHistory = [{type: "point", coord: [1, 1]}];

            redoLastPointInSketch({state, commit});

            expect(commit.calledWith("setDrawingPointHistory")).to.be.false;
        });

        it("calls appendCoordinates when available on the interaction", function () {
            const sketch = new Feature({geometry: new LineString([[0, 0], [1, 1]])});

            sketch.ol_uid = "1";
            state.currentSketch = sketch;
            state.interaction = {appendCoordinates: sinon.spy()};
            state.drawingPointHistory = [{type: "point", coord: [2, 2]}];

            redoLastPointInSketch({state, commit});

            expect(state.interaction.appendCoordinates.calledWith([[2, 2]])).to.be.true;
            expect(commit.calledWith("setDrawingPointHistory", [])).to.be.true;
        });

        it("manually appends to LineString when appendCoordinates is unavailable", function () {
            const sketch = new Feature({geometry: new LineString([[0, 0], [1, 1]])});

            sketch.ol_uid = "1";
            state.currentSketch = sketch;
            state.interaction = {};
            state.drawingPointHistory = [{type: "point", coord: [2, 2]}];

            redoLastPointInSketch({state, commit});

            expect(sketch.getGeometry().getCoordinates()).to.deep.include([2, 2]);
            expect(commit.calledWith("setDrawingPointHistory", [])).to.be.true;
        });

        it("manually inserts into Polygon ring when appendCoordinates is unavailable", function () {
            const ring = [[0, 0], [1, 0], [1, 1], [0, 0]],
                sketch = new Feature({geometry: new Polygon([ring])});

            sketch.ol_uid = "2";
            state.currentSketch = sketch;
            state.interaction = {};
            state.drawingPointHistory = [{type: "point", coord: [0, 1]}];

            redoLastPointInSketch({state, commit});

            const coords = sketch.getGeometry().getCoordinates()[0];

            // [0,1] inserted before ring closure
            expect(coords).to.deep.include([0, 1]);
        });

        it("ignores non-point entries in drawingPointHistory", function () {
            const sketch = new Feature({geometry: new LineString([[0, 0], [1, 1]])});

            sketch.ol_uid = "1";
            state.currentSketch = sketch;
            state.interaction = {appendCoordinates: sinon.spy()};
            state.drawingPointHistory = [{type: "other", coord: [2, 2]}];

            redoLastPointInSketch({state, commit});

            expect(state.interaction.appendCoordinates.called).to.be.false;
        });
    });

    describe("abortCurrentDrawing", function () {
        it("dispatches removeTooltipForFeature for the current sketch", function () {
            const sketch = new Feature();

            sketch.ol_uid = "5";
            state.currentSketch = sketch;
            state.interaction = null;
            sinon.stub(source, "removeFeature");

            abortCurrentDrawing({state, commit, dispatch});

            expect(dispatch.calledWith("removeTooltipForFeature", "5")).to.be.true;
        });

        it("removes the sketch feature from the source", function () {
            const sketch = new Feature({geometry: new LineString([[0, 0], [1, 1]])});

            sketch.ol_uid = "5";
            state.currentSketch = sketch;
            state.interaction = null;
            const removeStub = sinon.stub(source, "removeFeature");

            abortCurrentDrawing({state, commit, dispatch});

            expect(removeStub.calledWith(sketch)).to.be.true;
        });

        it("commits removeFeature for the sketch ol_uid", function () {
            const sketch = new Feature({geometry: new LineString([[0, 0], [1, 1]])});

            sketch.ol_uid = "5";
            state.currentSketch = sketch;
            state.interaction = null;
            sinon.stub(source, "removeFeature");

            abortCurrentDrawing({state, commit, dispatch});

            expect(commit.calledWith("removeFeature", "5")).to.be.true;
        });

        it("calls interaction.abortDrawing when interaction is active", function () {
            const sketch = new Feature();

            sketch.ol_uid = "1";
            state.currentSketch = sketch;
            state.interaction = {abortDrawing: sinon.spy()};
            sinon.stub(source, "removeFeature");

            abortCurrentDrawing({state, commit, dispatch});

            expect(state.interaction.abortDrawing.calledOnce).to.be.true;
        });

        it("does not throw when interaction.abortDrawing throws", function () {
            const sketch = new Feature();

            sketch.ol_uid = "1";
            state.currentSketch = sketch;
            state.interaction = {abortDrawing: sinon.stub().throws(new Error("OL error"))};
            sinon.stub(source, "removeFeature");

            expect(() => abortCurrentDrawing({state, commit, dispatch})).not.to.throw();
        });

        it("commits setCurrentSketch null and setDrawingPointHistory []", function () {
            state.currentSketch = null;
            state.interaction = null;

            abortCurrentDrawing({state, commit, dispatch});

            expect(commit.calledWith("setCurrentSketch", null)).to.be.true;
            expect(commit.calledWith("setDrawingPointHistory", [])).to.be.true;
        });

        it("does not try to remove from source when there is no currentSketch", function () {
            state.currentSketch = null;
            state.interaction = null;
            const removeStub = sinon.stub(source, "removeFeature");

            abortCurrentDrawing({state, commit, dispatch});

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
