import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList.js";
import sinon from "sinon";
import {expect} from "chai";
import {
    extractColumnsFromResults,
    extractRowsFromResults,
    getCoordinateFromGeometry,
    extractFeaturesFromOafJson,
    extractFeaturesFromWfsGml,
    getAllRequestLayers
} from "../../../utils/gfiUtils.js";
import Point from "ol/geom/Point.js";

describe("addons/gfiThemes/combinedGfi/utils/gfiUtils.js", () => {
    describe("extractColumnsFromResults", () => {
        it("extracts column headers from results with array gfiAttributes", () => {
            const features = [
                    {attr1: "value1", attr2: "value2"},
                    {attr1: "value3", attr2: "value4", attr3: "value5"}
                ],
                gfiAttributes = {attr1: "attr1", attr2: "attr2"},
                columns = extractColumnsFromResults(features, gfiAttributes);

            expect(columns).to.be.an("array");
            expect(columns.length).to.equal(2);
            expect(columns[0].name).to.equal("attr1");
            expect(columns[1].name).to.equal("attr2");
        });

        it("handles showAll with ignoredKeys", () => {
            const features = [
                    {attr1: "value1", attr2: "value2", geometry: "point"}
                ],
                ignoredKeys = ["geometry"],
                columns = extractColumnsFromResults(features, "showAll", ignoredKeys);

            expect(columns).to.be.an("array");
            expect(columns.length).to.equal(2);
            expect(columns[0].name).to.equal("attr1");
            expect(columns[1].name).to.equal("attr2");
        });

        it("handles object gfiAttributes", () => {
            const features = [
                    {technical_name: "value1", code: "123"}
                ],
                gfiAttributes = {
                    "technical_name": "Display Name",
                    "code": "Status Code"
                },
                columns = extractColumnsFromResults(features, gfiAttributes);

            expect(columns).to.be.an("array");
            expect(columns.length).to.equal(2);
            expect(columns[0].name).to.equal("technical_name");
            expect(columns[1].name).to.equal("code");
        });

        it("returns empty array for ignore", () => {
            const features = [
                    {attr1: "value1", attr2: "value2"}
                ],
                columns = extractColumnsFromResults(features, "ignore");

            expect(columns).to.be.an("array");
            expect(columns.length).to.equal(0);
        });
    });

    describe("extractRowsFromResults", () => {
        it("extracts rows from results with array gfiAttributes", () => {
            const features = [
                    {attr1: "value1", attr2: "value2"},
                    {attr1: "value3", attr2: "value4"}
                ],
                gfiAttributes = {attr1: "attr1", attr2: "attr2"},
                rows = extractRowsFromResults(features, gfiAttributes);

            expect(rows).to.be.an("array");
            expect(rows.length).to.equal(2);
            expect(rows[0].attr1).to.equal("value1");
            expect(rows[0].attr2).to.equal("value2");
            expect(rows[1].attr1).to.equal("value3");
            expect(rows[1].attr2).to.equal("value4");
        });

        it("handles showAll with ignoredKeys", () => {
            const features = [
                    {attr1: "value1", attr2: "value2", geometry: "point"}
                ],
                ignoredKeys = ["geometry"],
                rows = extractRowsFromResults(features, "showAll", ignoredKeys);

            expect(rows).to.be.an("array");
            expect(rows.length).to.equal(1);
            expect(rows[0].attr1).to.equal("value1");
            expect(rows[0].attr2).to.equal("value2");
            expect(rows[0].geometry).to.be.undefined;
        });

        it("handles object gfiAttributes", () => {
            const features = [
                    {technical_name: "value1", code: "123"}
                ],
                gfiAttributes = {
                    "technical_name": "Display Name",
                    "code": "Status Code"
                },
                rows = extractRowsFromResults(features, gfiAttributes);

            expect(rows).to.be.an("array");
            expect(rows.length).to.equal(1);
            expect(rows[0]["Display Name"]).to.equal("value1");
            expect(rows[0]["Status Code"]).to.equal("123");
        });

        it("returns empty array for ignore", () => {
            const features = [
                    {attr1: "value1", attr2: "value2"}
                ],
                rows = extractRowsFromResults(features, "ignore");

            expect(rows).to.be.an("array");
            expect(rows.length).to.equal(0);
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

        it("applies ignoredKeys when no attributes are specified", () => {
            const data = {
                    features: [
                        {
                            id: "feature1",
                            properties: {
                                name: "Feature 1",
                                type: "Point",
                                area: 100,
                                geometry: "POINT(0 0)"
                            }
                        }
                    ]
                },
                ignoredKeys = ["geometry"],
                result = extractFeaturesFromOafJson(data, null, ignoredKeys);

            expect(result).to.be.an("array");
            expect(result.length).to.equal(1);
            expect(result[0].name).to.equal("Feature 1");
            expect(result[0].type).to.equal("Point");
            expect(result[0].area).to.equal(100);
            expect(result[0].geometry).to.be.undefined;
        });

        it("ignores object attributes with name and alias in array", () => {
            const data = {
                    features: [
                        {
                            properties: {
                                name: "Feature 1",
                                type: "Point"
                            }
                        }
                    ]
                },
                attributes = [
                    {name: "name", alias: "Display Name"}, // Should be ignored
                    "type"
                ],
                result = extractFeaturesFromOafJson(data, attributes);

            expect(result).to.be.an("array");
            expect(result.length).to.equal(1);
            expect(result[0].name).to.be.undefined; // name should not be included
            expect(result[0]["Display Name"]).to.be.undefined; // alias should not work
            expect(result[0].type).to.equal("Point"); // Only type should be included
        });
    });

    describe("extractFeaturesFromWfsGml", () => {
        /**
         * Helper function to create a mock XML document
         * @param {Array} features - Array of feature objects
         * @returns {Document} Parsed XML document
         */
        function createMockXmlDocument (features) {
            const xmlString = `<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs" xmlns:gml="http://www.opengis.net/gml" xmlns:app="http://test.org/app">${
                features.map(feature => `<gml:featureMember><app:TestFeature>${
                    Object.keys(feature).map(key => `<app:${key}>${feature[key]}</app:${key}>`)
                        .join("")
                }</app:TestFeature></gml:featureMember>`).join("")
            }</wfs:FeatureCollection>`;

            return new DOMParser().parseFromString(xmlString, "application/xml");
        }

        it("returns empty array when gfiAttributes is 'ignore'", () => {
            const mockXml = createMockXmlDocument([{name: "Test", type: "Point"}]),
                result = extractFeaturesFromWfsGml(mockXml, "ignore");

            expect(result).to.be.an("array");
            expect(result.length).to.equal(0);
        });

        it("extracts all features when gfiAttributes is 'showAll'", () => {
            const mockData = [{name: "Test Feature", type: "Point", area: "100"}],
                mockXml = createMockXmlDocument(mockData),
                result = extractFeaturesFromWfsGml(mockXml, "showAll");

            expect(result).to.be.an("array");
            expect(result.length).to.equal(1);
            expect(result[0].name).to.equal("Test Feature");
            expect(result[0].type).to.equal("Point");
            expect(result[0].area).to.equal("100");
        });

        it("applies ignoredKeys with showAll", () => {
            const mockData = [{name: "Test Feature", type: "Point", geometry: "POINT(0 0)"}],
                mockXml = createMockXmlDocument(mockData),
                ignoredKeys = ["geometry"],
                result = extractFeaturesFromWfsGml(mockXml, "showAll", ignoredKeys);

            expect(result).to.be.an("array");
            expect(result.length).to.equal(1);
            expect(result[0].name).to.equal("Test Feature");
            expect(result[0].type).to.equal("Point");
            expect(result[0].geometry).to.be.undefined;
        });

        it("filters features when gfiAttributes is an array", () => {
            const mockData = [{name: "Test Feature", type: "Point", area: "100", hidden: "secret"}],
                mockXml = createMockXmlDocument(mockData),
                result = extractFeaturesFromWfsGml(mockXml, ["name", "type"]);

            expect(result).to.be.an("array");
            expect(result.length).to.equal(1);
            expect(result[0].name).to.equal("Test Feature");
            expect(result[0].type).to.equal("Point");
            expect(result[0].area).to.be.undefined;
            expect(result[0].hidden).to.be.undefined;
        });

        it("applies aliases when gfiAttributes is an object", () => {
            const mockData = [{technical_name: "Test Feature", status_code: "Active"}],
                mockXml = createMockXmlDocument(mockData),
                gfiAttributes = {
                    "technical_name": "Display Name",
                    "status_code": "Status"
                },
                result = extractFeaturesFromWfsGml(mockXml, gfiAttributes);

            expect(result).to.be.an("array");
            expect(result.length).to.equal(1);
            expect(result[0]["Display Name"]).to.equal("Test Feature");
            expect(result[0].Status).to.equal("Active");
            expect(result[0].technical_name).to.be.undefined;
            expect(result[0].status_code).to.be.undefined;
        });

        it("ignores objects with name and alias in array", () => {
            const mockData = [{name: "Test", type: "Point", technical_code: "TC001"}],
                mockXml = createMockXmlDocument(mockData),
                gfiAttributes = [
                    "name",
                    {name: "technical_code", alias: "Code"} // Should be ignored
                ],
                result = extractFeaturesFromWfsGml(mockXml, gfiAttributes);

            expect(result).to.be.an("array");
            expect(result.length).to.equal(1);
            expect(result[0].name).to.equal("Test");
            expect(result[0].Code).to.be.undefined; // Alias should not work
            expect(result[0].technical_code).to.be.undefined; // technical_code should not be included
            expect(result[0].type).to.be.undefined;
        });

        it("handles empty array as normal array, not as showAll", () => {
            const mockData = [{name: "Test Feature", type: "Point", area: "100"}],
                mockXml = createMockXmlDocument(mockData),
                result = extractFeaturesFromWfsGml(mockXml, []);

            expect(result).to.be.an("array");
            expect(result.length).to.equal(0); // Empty array should return no features
        });

        it("handles empty or null attributes", () => {
            const mockData = [{name: "Test Feature", type: "Point"}],
                mockXml = createMockXmlDocument(mockData);

            // Test with null
            let result = extractFeaturesFromWfsGml(mockXml, null);

            expect(result).to.be.an("array");
            expect(result.length).to.equal(1);
            expect(result[0].name).to.equal("Test Feature");
            expect(result[0].type).to.equal("Point");

            // Test with undefined
            result = extractFeaturesFromWfsGml(mockXml, undefined);
            expect(result.length).to.equal(1);
            expect(result[0].name).to.equal("Test Feature");
        });

        it("handles multiple values per attribute by collecting contents in an array", () => {
            const mockXml = new DOMParser().parseFromString(
                `<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs" xmlns:gml="http://www.opengis.net/gml" xmlns:app="http://test.org/app">
                    <gml:featureMember>
                        <app:TestFeature>
                            <app:x>5</app:x>
                            <app:x>5</app:x>
                            <app:x>5</app:x>
                        </app:TestFeature>
                    </gml:featureMember>
                </wfs:FeatureCollection>`,
                "application/xml");

            const result = extractFeaturesFromWfsGml(mockXml, ["x"]);

            expect(result).to.be.an("array");
            expect(result.length).to.equal(1);
            expect(result[0].x).to.eql(["5", "5", "5"]);
        });

        it("handles multiple features", () => {
            const mockData = [
                    {name: "Feature 1", type: "Point"},
                    {name: "Feature 2", type: "Polygon"}
                ],
                mockXml = createMockXmlDocument(mockData),
                result = extractFeaturesFromWfsGml(mockXml, ["name"]);

            expect(result).to.be.an("array");
            expect(result.length).to.equal(2);
            expect(result[0].name).to.equal("Feature 1");
            expect(result[1].name).to.equal("Feature 2");
            expect(result[0].type).to.be.undefined;
            expect(result[1].type).to.be.undefined;
        });

        it("handles empty feature collection", () => {
            const xmlString = `
                <wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs" xmlns:gml="http://www.opengis.net/gml">
                </wfs:FeatureCollection>
            `,
                mockXml = new DOMParser().parseFromString(xmlString, "application/xml"),
                result = extractFeaturesFromWfsGml(mockXml, "showAll");

            expect(result).to.be.an("array");
            expect(result.length).to.equal(0);
        });
    });

    describe("getAllRequestLayers", () => {
        let getLayerWhereStub;

        beforeEach(() => {
            getLayerWhereStub = sinon.stub(rawLayerList, "getLayerWhere");
        });


        it("returns layersToRequest when no bufferAttributes are defined", () => {
            const layersToRequest = [{id: "a"}, {id: "b"}],
                bufferAttributes = {},
                result = getAllRequestLayers(layersToRequest, bufferAttributes);

            expect(result).to.deep.equal(layersToRequest);
        });

        it("adds missing bufferAttribute layers", () => {
            getLayerWhereStub.withArgs({id: "b"}).returns({id: "b", layerProp: 123});

            const layersToRequest = [{id: "a"}],
                bufferAttributes = {b: ["bar"]},
                result = getAllRequestLayers(layersToRequest, bufferAttributes);

            expect(result).to.have.length(2);
            expect(result[1]).to.deep.equal({
                id: "b",
                layerProp: 123,
                gfiAttributes: ["bar"]
            });
        });

        it("does not duplicate layers already present", () => {
            getLayerWhereStub.withArgs({id: "b"}).returns({id: "b"});

            const layersToRequest = [{id: "a", gfiAttributes: ["a"]}],
                bufferAttributes = {
                    a: ["x"],
                    b: ["y"]
                },
                result = getAllRequestLayers(layersToRequest, bufferAttributes);

            expect(result.map(l => l.gfiAttributes)).to.deep.equal([["a"], ["y"]]);
        });
    });
});
