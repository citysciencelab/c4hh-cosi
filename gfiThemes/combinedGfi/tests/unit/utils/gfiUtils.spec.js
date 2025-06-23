import {expect} from "chai";
import {
    extractColumnsFromResults,
    extractRowsFromResults,
    getCoordinateFromGeometry,
    extractFeaturesFromOafJson
} from "../../../utils/gfiUtils.js";
import Point from "ol/geom/Point.js";

describe("addons/gfiThemes/combinedGfi/utils/gfiUtils.js", () => {
    describe("extractColumnsFromResults", () => {
        it("extracts column headers from results", () => {
            const features = [
                    {attr1: "value1", attr2: "value2"},
                    {attr1: "value3", attr2: "value4", attr3: "value5"}
                ],
                attributes = ["attr1", "attr2"],
                columns = extractColumnsFromResults(features, attributes);

            expect(columns).to.be.an("array");
            expect(columns.length).to.equal(2);
            expect(columns[0].name).to.equal("attr1");
            expect(columns[1].name).to.equal("attr2");
        });

        it("handles object attributes with name and alias", () => {
            const features = [
                    {attr1: "value1", attr2: "value2"}
                ],
                attributes = [
                    {name: "attr1", alias: "Attribute 1"},
                    "attr2"
                ],
                columns = extractColumnsFromResults(features, attributes);

            expect(columns).to.be.an("array");
            expect(columns.length).to.equal(2);
            expect(columns[0].name).to.deep.equal({name: "attr1", alias: "Attribute 1"});
            expect(columns[1].name).to.equal("attr2");
        });
    });

    describe("extractRowsFromResults", () => {
        it("extracts rows from results", () => {
            const features = [
                    {attr1: "value1", attr2: "value2"},
                    {attr1: "value3", attr2: "value4"}
                ],
                attributes = ["attr1", "attr2"],
                rows = extractRowsFromResults(features, attributes);

            expect(rows).to.be.an("array");
            expect(rows.length).to.equal(2);
            expect(rows[0].attr1).to.equal("value1");
            expect(rows[0].attr2).to.equal("value2");
            expect(rows[1].attr1).to.equal("value3");
            expect(rows[1].attr2).to.equal("value4");
        });

        it("handles object attributes with name and alias", () => {
            const features = [
                    {attr1: "value1", attr2: "value2"}
                ],
                attributes = [
                    {name: "attr1", alias: "Attribute 1"},
                    "attr2"
                ],
                rows = extractRowsFromResults(features, attributes);

            expect(rows).to.be.an("array");
            expect(rows.length).to.equal(1);
            expect(rows[0]["Attribute 1"]).to.equal("value1");
            expect(rows[0].attr2).to.equal("value2");
        });
    });

    describe("getCoordinateFromGeometry", () => {
        it("returns center coordinate from a point geometry", () => {
            const point = new Point([10, 20]),
                coordinate = getCoordinateFromGeometry(point);

            expect(coordinate).to.be.an("array");
            expect(coordinate.length).to.equal(2);
            expect(coordinate[0]).to.equal(10);
            expect(coordinate[1]).to.equal(20);
        });
    });

    describe("extractFeaturesFromOafJson", () => {
        it("extracts features from OAF JSON response", () => {
            const data = {
                    features: [
                        {
                            id: "feature1",
                            properties: {
                                name: "Feature 1",
                                type: "Point",
                                area: 100
                            }
                        },
                        {
                            id: "feature2",
                            properties: {
                                name: "Feature 2",
                                type: "Polygon",
                                area: 200
                            }
                        }
                    ]
                },
                attributes = ["name", "type", "area"],
                result = extractFeaturesFromOafJson(data, attributes);

            expect(result).to.be.an("array");
            expect(result.length).to.equal(2);
            expect(result[0].name).to.equal("Feature 1");
            expect(result[0].type).to.equal("Point");
            expect(result[0].area).to.equal(100);
            expect(result[1].name).to.equal("Feature 2");
        });

        it("handles empty features array", () => {
            const data = {features: []},
                result = extractFeaturesFromOafJson(data, ["name"]);

            expect(result).to.be.an("array");
            expect(result.length).to.equal(0);
        });

        it("handles missing properties", () => {
            const data = {
                    features: [
                        {id: "feature1"}
                    ]
                },
                result = extractFeaturesFromOafJson(data, ["name"]);

            expect(result).to.be.an("array");
            expect(result.length).to.equal(1);
            expect(result[0].name).to.equal("");
        });

        it("extracts all properties if no attributes are specified", () => {
            const data = {
                    features: [
                        {
                            id: "feature1",
                            properties: {
                                name: "Feature 1",
                                type: "Point",
                                area: 100
                            }
                        }
                    ]
                },
                result = extractFeaturesFromOafJson(data, null);

            expect(result).to.be.an("array");
            expect(result.length).to.equal(1);
            expect(result[0].name).to.equal("Feature 1");
            expect(result[0].type).to.equal("Point");
            expect(result[0].area).to.equal(100);
        });
    });
});
