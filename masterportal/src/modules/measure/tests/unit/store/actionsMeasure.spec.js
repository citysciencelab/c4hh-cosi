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
    updateTooltipPositionForFeature
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
});
