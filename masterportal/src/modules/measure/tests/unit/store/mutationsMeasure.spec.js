import {expect} from "chai";

import mutations from "@modules/measure/store/mutationsMeasure.js";

const {addFeature, addUnlistener, removeFeature, setCustomName} = mutations;

describe("src/modules/measure/store/mutationsMeasure", function () {
    describe("addFeature", function () {
        it("adds LineString measurements to lines object by key", function () {
            const lines = {0: {}, 1: {}, 2: {}},
                state = {
                    selectedGeometry: "LineString",
                    lines
                };

            addFeature(state, {ol_uid: "id"});

            expect(state.lines).not.to.equal(lines);
            expect(state.lines).to.deep.equal({0: {}, 1: {}, 2: {}, id: {ol_uid: "id"}});
        });


        it("adds Polygon measurements to polygon object by key", function () {
            const polygons = {0: {}, 1: {}, 2: {}},
                state = {
                    selectedGeometry: "Polygon",
                    polygons
                };

            addFeature(state, {ol_uid: "id"});

            expect(state.polygons).not.to.equal(polygons);
            expect(state.polygons).to.deep.equal({0: {}, 1: {}, 2: {}, id: {ol_uid: "id"}});
        });

        it("uses the geometry type from the feature when available", function () {
            const polygons = {},
                state = {
                    selectedGeometry: "LineString",
                    lines: {},
                    polygons
                },
                feature = {
                    ol_uid: "42",
                    getGeometry: () => ({getType: () => "Polygon"})
                };

            addFeature(state, feature);

            expect(state.polygons["42"]).to.equal(feature);
            expect(Object.keys(state.lines)).to.have.length(0);
        });
    });

    describe("removeFeature", function () {
        it("removes a line feature from lines and cleans up custom name", function () {
            const state = {
                lines: {"1": {ol_uid: "1"}, "2": {ol_uid: "2"}},
                polygons: {},
                customNames: {"1": "My Line"}
            };

            removeFeature(state, "1");

            expect(state.lines).not.to.have.property("1");
            expect(state.lines).to.have.property("2");
            expect(state.customNames).not.to.have.property("1");
        });

        it("removes a polygon feature from polygons", function () {
            const state = {
                lines: {},
                polygons: {"3": {ol_uid: "3"}},
                customNames: {}
            };

            removeFeature(state, "3");

            expect(state.polygons).not.to.have.property("3");
        });

        it("accepts numeric feature IDs", function () {
            const state = {
                lines: {"5": {ol_uid: "5"}},
                polygons: {},
                customNames: {}
            };

            removeFeature(state, 5);

            expect(state.lines).not.to.have.property("5");
        });
    });

    describe("setCustomName", function () {
        it("sets a custom name for a feature", function () {
            const state = {customNames: {}};

            setCustomName(state, {featureId: "10", name: "Meine Messung"});

            expect(state.customNames["10"]).to.equal("Meine Messung");
        });

        it("updates an existing custom name", function () {
            const state = {customNames: {"10": "Old Name"}};

            setCustomName(state, {featureId: "10", name: "New Name"});

            expect(state.customNames["10"]).to.equal("New Name");
        });

        it("accepts numeric featureId", function () {
            const state = {customNames: {}};

            setCustomName(state, {featureId: 7, name: "Test"});

            expect(state.customNames["7"]).to.equal("Test");
        });

        it("does not mutate original customNames object", function () {
            const customNames = {},
                state = {customNames};

            setCustomName(state, {featureId: "1", name: "X"});

            expect(state.customNames).not.to.equal(customNames);
        });
    });

    describe("addUnlistener", function () {
        it("adds payload as last element to new spread array", function () {
            const unlisteners = [0, 1, 2],
                state = {unlisteners};

            addUnlistener(state, 3);

            expect(state.unlisteners).not.to.equal(unlisteners);
            expect(state.unlisteners).to.deep.equal([0, 1, 2, 3]);
        });
    });
});
