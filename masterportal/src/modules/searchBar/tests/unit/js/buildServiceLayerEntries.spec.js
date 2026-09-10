import {expect} from "chai";
import buildServiceLayerEntries from "../../../js/buildServiceLayerEntries.js";

describe("src/modules/searchBar/js/buildServiceLayerEntries.js", () => {
    describe("empty / invalid input", () => {
        it("should return [] for an empty entries array", () => {
            expect(buildServiceLayerEntries("WMS", [])).to.deep.equal([]);
        });

        it("should return [] for null entries", () => {
            expect(buildServiceLayerEntries("WMS", null)).to.deep.equal([]);
        });

        it("should return [] for undefined entries", () => {
            expect(buildServiceLayerEntries("WMS", undefined)).to.deep.equal([]);
        });
    });

    describe("WMS entries", () => {
        it("should use title as entry name and name as sourceProps.layers", () => {
            const result = buildServiceLayerEntries("WMS", [{name: "roads", title: "Road Network"}]);

            expect(result).to.deep.equal([{name: "Road Network", sourceProps: {layers: "roads"}, queryable: true}]);
        });

        it("should fall back to name when title is absent", () => {
            const result = buildServiceLayerEntries("WMS", [{name: "roads"}]);

            expect(result).to.deep.equal([{name: "roads", sourceProps: {layers: "roads"}, queryable: true}]);
        });

        it("should handle multiple layers", () => {
            const result = buildServiceLayerEntries("WMS", [
                {name: "roads", title: "Roads"},
                {name: "rivers", title: "Rivers"}
            ]);

            expect(result).to.have.length(2);
            expect(result[0].sourceProps.layers).to.equal("roads");
            expect(result[1].sourceProps.layers).to.equal("rivers");
        });

        it("should include queryable:true when the entry has queryable:true", () => {
            const result = buildServiceLayerEntries("WMS", [{name: "roads", title: "Roads", queryable: true}]);

            expect(result[0].queryable).to.be.true;
        });

        it("should include queryable:false when the entry has queryable:false", () => {
            const result = buildServiceLayerEntries("WMS", [{name: "LU.SpatialPlan", title: "INSPIRE Land Use", queryable: false}]);

            expect(result[0].queryable).to.be.false;
        });

        it("should default queryable to true when the entry has no queryable property", () => {
            const result = buildServiceLayerEntries("WMS", [{name: "roads", title: "Roads"}]);

            expect(result[0].queryable).to.be.true;
        });
    });

    describe("WFS entries", () => {
        it("should use title as entry name and name as sourceProps.featureType", () => {
            const result = buildServiceLayerEntries("WFS", [{name: "ns:roads", title: "Roads"}]);

            expect(result).to.deep.equal([{name: "Roads", sourceProps: {featureType: "ns:roads"}}]);
        });

        it("should include featureNS in sourceProps when present", () => {
            const result = buildServiceLayerEntries("WFS", [{
                name: "ns:roads",
                title: "Roads",
                featureNS: "https://example.com/ns"
            }]);

            expect(result[0].sourceProps.featureNS).to.equal("https://example.com/ns");
        });

        it("should not include featureNS key when featureNS is absent", () => {
            const result = buildServiceLayerEntries("WFS", [{name: "roads", title: "Roads"}]);

            expect(result[0].sourceProps).to.not.have.property("featureNS");
        });
    });

    describe("WMTS entries", () => {
        it("should include layers, format, and tileMatrixSet in sourceProps", () => {
            const result = buildServiceLayerEntries("WMTS", [{
                name: "topo",
                title: "Topo Map",
                format: "image/png",
                tileMatrixSet: "grid_3857"
            }]);

            expect(result).to.deep.equal([{
                name: "Topo Map",
                sourceProps: {
                    layers: "topo",
                    format: "image/png",
                    tileMatrixSet: "grid_3857"
                }
            }]);
        });

        it("should omit format and tileMatrixSet keys when they are absent", () => {
            const result = buildServiceLayerEntries("WMTS", [{name: "topo", title: "Topo"}]);

            expect(result[0].sourceProps).to.not.have.property("format");
            expect(result[0].sourceProps).to.not.have.property("tileMatrixSet");
        });

        it("should fall back to name when title is absent", () => {
            const result = buildServiceLayerEntries("WMTS", [{name: "topo"}]);

            expect(result[0].name).to.equal("topo");
            expect(result[0].sourceProps.layers).to.equal("topo");
        });
    });

    describe("OAF entries", () => {
        it("should use title as entry name and name as sourceProps.collection", () => {
            const result = buildServiceLayerEntries("OAF", [{name: "buildings", title: "Buildings"}]);

            expect(result).to.deep.equal([{name: "Buildings", sourceProps: {collection: "buildings"}}]);
        });

        it("should fall back to name when title is absent", () => {
            const result = buildServiceLayerEntries("OAF", [{name: "rivers"}]);

            expect(result[0].name).to.equal("rivers");
            expect(result[0].sourceProps.collection).to.equal("rivers");
        });
    });
});
