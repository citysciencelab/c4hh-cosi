import {expect} from "chai";
import getGeometry from "@modules/wfsSearch/js/getGeometry.js";

describe("src/modules/wfsSearch/js/getGeometry.js", () => {

    /**
     * Creates a mock OpenLayers geometry object.
     * @param {String} type The geometry type (e.g., "Point", "Polygon")
     * @returns {Object} Mock geometry with getExtent method
     */
    function createMockGeometry (type) {
        return {
            getType: function () {
                return type;
            },
            getExtent: function () {
                return [0, 0, 10, 10];
            },
            type: type
        };
    }

    /**
     * Creates a mock OpenLayers feature.
     * @param {Object} properties Feature properties
     * @param {Object} geometry Feature geometry
     * @returns {Object} Mock feature
     */
    function createMockFeature (properties, geometry) {
        const props = {...properties};

        return {
            get: (key) => props[key],
            getGeometry: () => geometry,
            values_: props
        };
    }

    describe("getGeometry", () => {

        it("should return null when row is null", () => {
            const results = [],
                geom = getGeometry(results, null);

            expect(geom).to.equal(null);
        });

        it("should return null when row is undefined", () => {
            const results = [],
                geom = getGeometry(results, undefined);

            expect(geom).to.equal(null);
        });

        it("should return null when results is null", () => {
            const row = {name: "Test"},
                geom = getGeometry(null, row);

            expect(geom).to.equal(null);
        });

        it("should return null when results is empty array", () => {
            const results = [],
                row = {name: "Test"},
                geom = getGeometry(results, row);

            expect(geom).to.equal(null);
        });

        it("should return geometry from row if it has valid geometry field", () => {
            const mockGeom = createMockGeometry("Point"),
                results = [],
                row = {name: "Test", geometry: mockGeom},
                geom = getGeometry(results, row);

            expect(geom).to.equal(mockGeom);
        });

        it("should return geom from row if it has valid geom field", () => {
            const mockGeom = createMockGeometry("Point"),
                results = [],
                row = {name: "Test", geom: mockGeom},
                geom = getGeometry(results, row);

            expect(geom).to.equal(mockGeom);
        });

        it("should match feature by single field and extract geometry", () => {
            const mockGeom = createMockGeometry("Polygon"),
                feature = createMockFeature({name: "Name1"}, mockGeom),
                results = [feature],
                row = {name: "Name1"},
                geom = getGeometry(results, row);

            expect(geom).to.equal(mockGeom);
        });

        it("should match feature by multiple fields and extract geometry", () => {
            const mockGeom1 = createMockGeometry("Point"),
                mockGeom2 = createMockGeometry("Polygon"),
                feature1 = createMockFeature({name: "Name1", id: "1"}, mockGeom1),
                feature2 = createMockFeature({name: "Name2", id: "2"}, mockGeom2),
                results = [feature1, feature2],
                row = {name: "Name2", id: "2"},
                geom = getGeometry(results, row);

            expect(geom).to.equal(mockGeom2);
        });

        it("should match correct feature from multiple features with partial matching fields", () => {
            const mockGeom1 = createMockGeometry("Point"),
                mockGeom2 = createMockGeometry("Polygon"),
                mockGeom3 = createMockGeometry("LineString"),
                feature1 = createMockFeature({name: "Test", id: "1", type: "A"}, mockGeom1),
                feature2 = createMockFeature({name: "Test", id: "2", type: "B"}, mockGeom2),
                feature3 = createMockFeature({name: "Other", id: "3", type: "C"}, mockGeom3),
                results = [feature1, feature2, feature3],
                row = {name: "Test", id: "2"},
                geom = getGeometry(results, row);

            expect(geom).to.equal(mockGeom2);
        });

        it("should return null when no feature matches row fields", () => {
            const mockGeom = createMockGeometry("Point"),
                feature = createMockFeature({name: "Name1", id: "1"}, mockGeom),
                results = [feature],
                row = {name: "Name2", id: "2"},
                geom = getGeometry(results, row);

            expect(geom).to.equal(null);
        });

        it("should ignore geometry fields when matching features", () => {
            const mockGeom1 = createMockGeometry("Point"),
                mockGeom2 = createMockGeometry("Polygon"),
                feature = createMockFeature({name: "Name1", geometry: mockGeom1}, mockGeom1),
                results = [feature],
                row = {name: "Name1", geometry: mockGeom2},
                geom = getGeometry(results, row);

            // Should return geometry from row first (as it has valid geometry)
            expect(geom).to.equal(mockGeom2);
        });

        it("should find geometry in row with 'the_geom' field name", () => {
            const mockGeom = createMockGeometry("Polygon"),
                results = [],
                row = {name: "Test", the_geom: mockGeom},
                geom = getGeometry(results, row);

            expect(geom).to.equal(mockGeom);
        });

        it("should find geometry in row with 'wkb_geometry' field name", () => {
            const mockGeom = createMockGeometry("Polygon"),
                results = [],
                row = {name: "Test", wkb_geometry: mockGeom},
                geom = getGeometry(results, row);

            expect(geom).to.equal(mockGeom);
        });

        it("should not return invalid geometry from row", () => {
            const mockGeom = createMockGeometry("Point"),
                feature = createMockFeature({name: "Name1"}, mockGeom),
                results = [feature],
                row = {name: "Name1", geometry: "not a geometry object"},
                geom = getGeometry(results, row);

            // Should skip invalid geometry in row and match feature
            expect(geom).to.equal(mockGeom);
        });

        it("should handle features with values_ property", () => {
            const mockGeom = createMockGeometry("Point"),
                feature = {
                    values_: {name: "Test", id: "1"},
                    getGeometry: () => mockGeom
                },
                results = [feature],
                row = {name: "Test"},
                geom = getGeometry(results, row);

            expect(geom).to.equal(mockGeom);
        });

        it("should return null when row has only geometry fields", () => {
            const mockGeom = createMockGeometry("Point"),
                feature = createMockFeature({name: "Name1"}, mockGeom),
                results = [feature],
                row = {geometry: "invalid"},
                geom = getGeometry(results, row);

            expect(geom).to.equal(null);
        });

        it("should handle null features in results array", () => {
            const mockGeom = createMockGeometry("Polygon"),
                feature = createMockFeature({name: "Name1"}, mockGeom),
                results = [null, feature, null],
                row = {name: "Name1"},
                geom = getGeometry(results, row);

            expect(geom).to.equal(mockGeom);
        });

        it("should match feature when all non-geometry fields match exactly", () => {
            const mockGeom1 = createMockGeometry("Point"),
                mockGeom2 = createMockGeometry("Polygon"),
                feature1 = createMockFeature({name: "Test", id: "1", category: "A"}, mockGeom1),
                feature2 = createMockFeature({name: "Test", id: "2", category: "A"}, mockGeom2),
                results = [feature1, feature2],
                row = {name: "Test", id: "2", category: "A"},
                geom = getGeometry(results, row);

            expect(geom).to.equal(mockGeom2);
        });
    });
});
