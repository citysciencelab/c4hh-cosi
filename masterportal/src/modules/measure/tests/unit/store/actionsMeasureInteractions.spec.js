import {expect} from "chai";
import sinon from "sinon";
import Feature from "ol/Feature.js";
import {LineString} from "ol/geom.js";

import actions from "@modules/measure/store/actionsMeasureInteractions.js";

const {
    cleanupAllInteractions,
    setInteractionMode,
    removeIncompleteDrawing,
    handleModifyMeasurement,
    handleDeleteMeasurement,
    highlightFeature,
    unhighlightFeature
} = actions;

describe("src/modules/measure/store/actionsMeasureInteractions", function () {
    let commit, dispatch, state, getters;

    beforeEach(() => {
        commit = sinon.spy();
        dispatch = sinon.spy();
        state = {
            interaction: null,
            currentModifyInteraction: null,
            currentSelectInteractions: [],
            selectedEditInteraction: null,
            currentlyModifyingFeatureId: null,
            color: [255, 127, 0, 1.0],
            layer: null,
            featureId: null,
            lines: {},
            polygons: {}
        };
        getters = {getFeatureById: sinon.stub()};
    });


    describe("cleanupAllInteractions", function () {
        it("dispatches removeDrawInteraction when interaction is active", function () {
            state.interaction = {on: sinon.spy()};

            cleanupAllInteractions({state, commit, dispatch});

            expect(dispatch.calledWith("removeDrawInteraction")).to.be.true;
        });

        it("does not dispatch removeDrawInteraction when interaction is null", function () {
            cleanupAllInteractions({state, commit, dispatch});

            expect(dispatch.calledWith("removeDrawInteraction")).to.be.false;
        });

        it("removes currentModifyInteraction from map and commits null", function () {
            const modifyInter = {on: sinon.spy()};

            state.currentModifyInteraction = modifyInter;

            cleanupAllInteractions({state, commit, dispatch});

            expect(dispatch.calledWith("Maps/removeInteraction", modifyInter, {root: true})).to.be.true;
            expect(commit.calledWith("setCurrentModifyInteraction", null)).to.be.true;
        });

        it("does not try to remove modify interaction when it is null", function () {
            cleanupAllInteractions({state, commit, dispatch});

            expect(commit.calledWith("setCurrentModifyInteraction", null)).to.be.false;
        });

        it("removes each select interaction from the map", function () {
            const inter1 = {on: sinon.spy()},
                inter2 = {on: sinon.spy()};

            state.currentSelectInteractions = [inter1, inter2];

            cleanupAllInteractions({state, commit, dispatch});

            expect(dispatch.calledWith("Maps/removeInteraction", inter1, {root: true})).to.be.true;
            expect(dispatch.calledWith("Maps/removeInteraction", inter2, {root: true})).to.be.true;
        });

        it("resets interaction state via commits", function () {
            cleanupAllInteractions({state, commit, dispatch});

            expect(commit.calledWith("setCurrentSelectInteractions", [])).to.be.true;
            expect(commit.calledWith("setSelectedEditInteraction", null)).to.be.true;
            expect(commit.calledWith("setCurrentlyModifyingFeatureId", null)).to.be.true;
        });
    });

    describe("setInteractionMode", function () {
        it("always dispatches cleanupAllInteractions first", function () {
            setInteractionMode({commit, dispatch}, {mode: "IDLE"});

            expect(dispatch.calledWith("cleanupAllInteractions")).to.be.true;
        });

        it("DRAW: commits empty selectedEditInteraction and dispatches createDrawInteraction", function () {
            setInteractionMode({commit, dispatch}, {mode: "DRAW"});

            expect(commit.calledWith("setSelectedEditInteraction", "")).to.be.true;
            expect(dispatch.calledWith("createDrawInteraction")).to.be.true;
        });

        it("MODIFY: commits modify mode + featureId and dispatches setupModifyInteraction", function () {
            setInteractionMode({commit, dispatch}, {mode: "MODIFY", featureId: "42"});

            expect(commit.calledWith("setSelectedEditInteraction", "modify")).to.be.true;
            expect(commit.calledWith("setCurrentlyModifyingFeatureId", "42")).to.be.true;
            expect(dispatch.calledWith("setupModifyInteraction", "42")).to.be.true;
        });

        it("MODIFY: defaults featureId to null when not provided", function () {
            setInteractionMode({commit, dispatch}, {mode: "MODIFY"});

            expect(commit.calledWith("setCurrentlyModifyingFeatureId", null)).to.be.true;
        });

        it("DELETE: commits delete mode and dispatches setupDeleteInteraction", function () {
            setInteractionMode({commit, dispatch}, {mode: "DELETE"});

            expect(commit.calledWith("setSelectedEditInteraction", "delete")).to.be.true;
            expect(dispatch.calledWith("setupDeleteInteraction")).to.be.true;
        });

        it("IDLE: commits empty selectedEditInteraction and does not create interactions", function () {
            setInteractionMode({commit, dispatch}, {mode: "IDLE"});

            expect(commit.calledWith("setSelectedEditInteraction", "")).to.be.true;
            expect(dispatch.calledWith("createDrawInteraction")).to.be.false;
            expect(dispatch.calledWith("setupModifyInteraction")).to.be.false;
            expect(dispatch.calledWith("setupDeleteInteraction")).to.be.false;
        });
    });

    describe("removeIncompleteDrawing", function () {
        it("does nothing when no current feature is tracked", function () {
            state.lines = {};
            state.polygons = {};
            state.featureId = null;

            expect(() => removeIncompleteDrawing({state})).not.to.throw();
        });

        it("removes the last source feature when feature isBeingDrawn", function () {
            const feature = new Feature({geometry: new LineString([[0, 0], [1, 1]])});

            feature.set("isBeingDrawn", true);
            feature.ol_uid = "5";
            state.featureId = "5";
            state.lines = {"5": feature};

            const sentinelFeature = {},
                removeFeatureSpy = sinon.spy(),
                layerSource = {
                    getFeatures: sinon.stub().returns([sentinelFeature]),
                    removeFeature: removeFeatureSpy
                };

            state.layer = {getSource: sinon.stub().returns(layerSource)};

            removeIncompleteDrawing({state});

            expect(removeFeatureSpy.calledWith(sentinelFeature)).to.be.true;
        });

        it("does nothing when feature is not marked as being drawn", function () {
            const feature = new Feature({geometry: new LineString([[0, 0], [1, 1]])});

            feature.set("isBeingDrawn", false);
            feature.ol_uid = "5";
            state.featureId = "5";
            state.lines = {"5": feature};

            const removeFeatureSpy = sinon.spy(),
                layerSource = {getFeatures: sinon.stub().returns([feature]), removeFeature: removeFeatureSpy};

            state.layer = {getSource: sinon.stub().returns(layerSource)};

            removeIncompleteDrawing({state});

            expect(removeFeatureSpy.called).to.be.false;
        });

        it("does nothing when the layer source is empty", function () {
            const feature = new Feature({geometry: new LineString([[0, 0], [1, 1]])});

            feature.set("isBeingDrawn", true);
            feature.ol_uid = "5";
            state.featureId = "5";
            state.lines = {"5": feature};

            const removeFeatureSpy = sinon.spy(),
                layerSource = {getFeatures: sinon.stub().returns([]), removeFeature: removeFeatureSpy};

            state.layer = {getSource: sinon.stub().returns(layerSource)};

            removeIncompleteDrawing({state});

            expect(removeFeatureSpy.called).to.be.false;
        });
    });

    describe("handleModifyMeasurement", function () {
        it("dispatches DRAW mode and unhighlight when already modifying the same feature", function () {
            state.selectedEditInteraction = "modify";
            state.currentlyModifyingFeatureId = "10";

            handleModifyMeasurement({state, dispatch}, "10");

            expect(dispatch.calledWith("unhighlightFeature", "10")).to.be.true;
            expect(dispatch.calledWith("setInteractionMode", {mode: "DRAW"})).to.be.true;
        });

        it("dispatches MODIFY mode for a different feature", function () {
            state.selectedEditInteraction = "modify";
            state.currentlyModifyingFeatureId = "10";

            handleModifyMeasurement({state, dispatch}, "20");

            expect(dispatch.calledWith("setInteractionMode", {mode: "MODIFY", featureId: "20"})).to.be.true;
        });

        it("dispatches MODIFY mode when not in modify mode at all", function () {
            state.selectedEditInteraction = null;
            state.currentlyModifyingFeatureId = null;

            handleModifyMeasurement({state, dispatch}, "5");

            expect(dispatch.calledWith("setInteractionMode", {mode: "MODIFY", featureId: "5"})).to.be.true;
        });

        it("dispatches MODIFY mode when in delete mode", function () {
            state.selectedEditInteraction = "delete";
            state.currentlyModifyingFeatureId = null;

            handleModifyMeasurement({state, dispatch}, "5");

            expect(dispatch.calledWith("setInteractionMode", {mode: "MODIFY", featureId: "5"})).to.be.true;
        });
    });

    describe("handleDeleteMeasurement", function () {
        it("dispatches deleteSingleFeature with given featureId", function () {
            state.selectedEditInteraction = null;

            handleDeleteMeasurement({state, commit, dispatch}, "7");

            expect(dispatch.calledWith("deleteSingleFeature", "7")).to.be.true;
        });

        it("commits removeFeatureHistory for the normalized id", function () {
            state.selectedEditInteraction = null;

            handleDeleteMeasurement({state, commit, dispatch}, "7");

            expect(commit.calledWith("removeFeatureHistory", 7)).to.be.true;
        });

        it("dispatches setInteractionMode DRAW when in modify mode", function () {
            state.selectedEditInteraction = "modify";

            handleDeleteMeasurement({state, commit, dispatch}, "7");

            expect(dispatch.calledWith("setInteractionMode", {mode: "DRAW"})).to.be.true;
        });

        it("does not dispatch DRAW when in delete mode", function () {
            state.selectedEditInteraction = "delete";

            handleDeleteMeasurement({state, commit, dispatch}, "7");

            expect(dispatch.calledWith("setInteractionMode", {mode: "DRAW"})).to.be.false;
        });

        it("does not dispatch DRAW when interaction mode is null", function () {
            state.selectedEditInteraction = null;

            handleDeleteMeasurement({state, commit, dispatch}, "7");

            expect(dispatch.calledWith("setInteractionMode", {mode: "DRAW"})).to.be.false;
        });
    });

    describe("highlightFeature", function () {
        it("sets highlight style on an un-highlighted feature", function () {
            const feature = new Feature();

            feature.setStyle = sinon.spy();
            getters.getFeatureById.returns(feature);

            highlightFeature({getters}, "1");

            expect(feature.get("_isHighlighted")).to.be.true;
            expect(feature.setStyle.calledOnce).to.be.true;
        });

        it("stores the original style before highlighting", function () {
            const feature = new Feature(),
                originalStyle = {};

            feature.getStyle = sinon.stub().returns(originalStyle);
            feature.setStyle = sinon.spy();
            getters.getFeatureById.returns(feature);

            highlightFeature({getters}, "1");

            expect(feature.get("_originalStyle")).to.equal(originalStyle);
        });

        it("does not re-highlight an already highlighted feature", function () {
            const feature = new Feature();

            feature.setStyle = sinon.spy();
            feature.set("_isHighlighted", true);
            getters.getFeatureById.returns(feature);

            highlightFeature({getters}, "1");

            expect(feature.setStyle.called).to.be.false;
        });

        it("does nothing when feature is not found", function () {
            getters.getFeatureById.returns(undefined);

            expect(() => highlightFeature({getters}, "999")).not.to.throw();
        });
    });

    describe("unhighlightFeature", function () {
        it("restores original style and clears highlight markers", function () {
            const feature = new Feature(),
                originalStyle = {};

            feature.setStyle = sinon.spy();
            feature.unset = sinon.spy();
            feature.set("_isHighlighted", true);
            feature.set("_originalStyle", originalStyle);
            getters.getFeatureById.returns(feature);

            unhighlightFeature({state, getters}, "1");

            expect(feature.setStyle.calledWith(originalStyle)).to.be.true;
            expect(feature.unset.calledWith("_originalStyle")).to.be.true;
            expect(feature.unset.calledWith("_isHighlighted")).to.be.true;
        });

        it("falls back to a default style function when no original style was stored", function () {
            const feature = new Feature();

            feature.setStyle = sinon.spy();
            feature.unset = sinon.spy();
            feature.set("_isHighlighted", true);
            feature.set("_originalStyle", undefined);
            getters.getFeatureById.returns(feature);

            unhighlightFeature({state, getters}, "1");

            expect(feature.setStyle.calledOnce).to.be.true;
            // The fallback is a style function, not undefined
            const passedArg = feature.setStyle.firstCall.args[0];

            expect(passedArg).not.to.be.undefined;
        });

        it("does nothing for a feature that is not highlighted", function () {
            const feature = new Feature();

            feature.setStyle = sinon.spy();
            feature.set("_isHighlighted", false);
            getters.getFeatureById.returns(feature);

            unhighlightFeature({state, getters}, "1");

            expect(feature.setStyle.called).to.be.false;
        });

        it("does nothing when feature is not found", function () {
            getters.getFeatureById.returns(undefined);

            expect(() => unhighlightFeature({state, getters}, "999")).not.to.throw();
        });
    });
});
