import {expect} from "chai";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import {
    nextGroupedFeaturesByDistance,
    groupFeaturesByPropertyName,
    getGroupedAttributes,
    purifyGroupedAttributes,
    concatGroupAttributes
} from "../../../utils/precompiler.nextGroupedFeaturesByDistance.js";

describe("addons/valuationPrint/utils/precompiler.nextGroupedFeaturesByDistance.js", () => {
    describe("concatGroupAttributes", () => {
        it("should return an empty object if anything but an object is given", () => {
            expect(concatGroupAttributes(undefined)).to.be.an("object").that.is.empty;
            expect(concatGroupAttributes(null)).to.be.an("object").that.is.empty;
            expect(concatGroupAttributes(1234)).to.be.an("object").that.is.empty;
            expect(concatGroupAttributes("string")).to.be.an("object").that.is.empty;
            expect(concatGroupAttributes(true)).to.be.an("object").that.is.empty;
            expect(concatGroupAttributes(false)).to.be.an("object").that.is.empty;
            expect(concatGroupAttributes([])).to.be.an("object").that.is.empty;
        });
        it("should return an empty object if there are no objects in the given object", () => {
            expect(concatGroupAttributes({
                0: undefined,
                1: null,
                2: 1234,
                3: "string",
                4: true,
                5: false,
                6: []
            })).to.be.an("object").that.is.empty;
        });
        it("should concat all attributes with focus on the attribute key", () => {
            const groupedAttributes = {
                    U: {
                        lines: "U",
                        lineshortkat: "U1, U2",
                        distance: "5,5"
                    },
                    S: {
                        lines: "S",
                        lineshortkat: "S1, S2",
                        distance: "4,5"
                    }
                },
                expected = {
                    lines: ["U", "S"],
                    lineshortkat: ["U1, U2", "S1, S2"],
                    distance: ["5,5", "4,5"]
                };

            expect(concatGroupAttributes(groupedAttributes)).deep.equal(expected);
        });
    });
    describe("purifyGroupedAttributes", () => {
        it("should return an empty object if anything but an object is given", () => {
            expect(purifyGroupedAttributes(undefined)).to.be.an("object").that.is.empty;
            expect(purifyGroupedAttributes(null)).to.be.an("object").that.is.empty;
            expect(purifyGroupedAttributes(1234)).to.be.an("object").that.is.empty;
            expect(purifyGroupedAttributes("string")).to.be.an("object").that.is.empty;
            expect(purifyGroupedAttributes(true)).to.be.an("object").that.is.empty;
            expect(purifyGroupedAttributes(false)).to.be.an("object").that.is.empty;
            expect(purifyGroupedAttributes([])).to.be.an("object").that.is.empty;
        });
        it("should remove all parts of attribute value that are not part of its top group", () => {
            const groupedAttributes = {
                    U: {
                        propertyNameToGroupBy: ["U,U"],
                        lineshortkat: ["U1,U2"],
                        knowledgeBaseKey: ["3,6"]
                    },
                    S: {
                        propertyNameToGroupBy: ["S,S"],
                        lineshortkat: ["S1,S2"],
                        knowledgeBaseKey: ["4,5"]
                    }
                },
                delimitor = ",",
                expected = {
                    U: {
                        propertyNameToGroupBy: "U",
                        lineshortkat: "U1, U2",
                        knowledgeBaseKey: "3,6"
                    },
                    S: {
                        propertyNameToGroupBy: "S",
                        lineshortkat: "S1, S2",
                        knowledgeBaseKey: "4,5"
                    }
                };

            expect(purifyGroupedAttributes(groupedAttributes, "propertyNameToGroupBy", delimitor, "knowledgeBaseKey")).to.deep.equal(expected);
        });
    });
    describe("getGroupedAttributes", () => {
        it("should hand over an empty object if anything but an array is given as coordinate", () => {
            let lastSuccess = false,
                lastError = null;

            getGroupedAttributes("coordinate", "groupedFeatures", "knowledgeBaseKey", "propertyName", result => {
                lastSuccess = result;
            }, error => {
                lastError = error;
            });

            expect(lastSuccess).to.be.an("object").that.is.empty;
            expect(lastError).to.be.null;
        });
        it("should hand over an empty object if anything but an object is given as groupedFeatures", () => {
            let lastSuccess = false,
                lastError = null;

            getGroupedAttributes([], "groupedFeatures", "knowledgeBaseKey", "propertyName", result => {
                lastSuccess = result;
            }, error => {
                lastError = error;
            });

            expect(lastSuccess).to.be.an("object").that.is.empty;
            expect(lastError).to.be.null;
        });
        it("should use precompiler nextFeatureByDistance to receive the distance for the given features", () => {
            const coordinate = [565449.0700000001, 5937439.2645],
                groupedFeatures = {
                    S: [
                        new Feature({
                            geometry: new Point([565556.73151767, 5935130.20726153]),
                            lines: "S11,S31,S21",
                            otherParam: 1234,
                            lineshortkat: "S,S,S"
                        })
                    ],
                    U: [
                        new Feature({
                            geometry: new Point([565435.80113706, 5937426.29039814]),
                            lines: "U1",
                            otherParam: 5678,
                            lineshortkat: "U"
                        })
                    ]
                },
                propertyName = ["lines", "lineshortkat"],
                expected = {
                    S: {
                        knowledgeBaseKey: ["2,312"],
                        lines: ["S11,S31,S21"],
                        lineshortkat: ["S,S,S"]
                    },
                    U: {
                        knowledgeBaseKey: ["0,019"],
                        lines: ["U1"],
                        lineshortkat: ["U"]
                    }
                };
            let lastSuccess = false,
                lastError = null;

            getGroupedAttributes(coordinate, groupedFeatures, "knowledgeBaseKey", propertyName, result => {
                lastSuccess = result;
            }, error => {
                lastError = error;
            });
            expect(lastSuccess).to.deep.equal(expected);
            expect(lastError).to.be.null;
        });
    });
    describe("groupFeaturesByPropertyName", () => {
        it("should return an empty object if anything but an array is given", () => {
            expect(groupFeaturesByPropertyName(undefined)).to.be.an("object").that.is.empty;
            expect(groupFeaturesByPropertyName(null)).to.be.an("object").that.is.empty;
            expect(groupFeaturesByPropertyName(1234)).to.be.an("object").that.is.empty;
            expect(groupFeaturesByPropertyName("string")).to.be.an("object").that.is.empty;
            expect(groupFeaturesByPropertyName(true)).to.be.an("object").that.is.empty;
            expect(groupFeaturesByPropertyName(false)).to.be.an("object").that.is.empty;
            expect(groupFeaturesByPropertyName({})).to.be.an("object").that.is.empty;
        });
        it("should return an empty object if none of the given features have a get function", () => {
            expect(groupFeaturesByPropertyName([
                undefined,
                null,
                1234,
                "string",
                true,
                false,
                [],
                {}
            ])).to.be.an("object").that.is.empty;
        });
        it("should group the given features by value of given propertyNameToGroupBy, uses delimitor to split keys hidden in strings", () => {
            const featureA = {id: 1, get: propertyNameToGroupBy => propertyNameToGroupBy === "propertyNameToGroupBy" ? "U,U,S" : ""},
                featureB = {id: 2, get: propertyNameToGroupBy => propertyNameToGroupBy === "propertyNameToGroupBy" ? "U,A" : ""},
                featureC = {id: 3, get: propertyNameToGroupBy => propertyNameToGroupBy === "propertyNameToGroupBy" ? "S,S" : ""},
                delimitor = ",",
                expected = {
                    U: [featureA, featureB],
                    S: [featureA, featureC],
                    A: [featureB]
                };

            expect(groupFeaturesByPropertyName([featureA, featureB, featureC], "propertyNameToGroupBy", delimitor)).to.deep.equal(expected);
        });
    });
    describe("nextGroupedFeaturesByDistance", () => {
        it("should hand over an error if anything but an array is given as coordinate", () => {
            let lastSuccess = false,
                lastError = null;

            nextGroupedFeaturesByDistance("coordinate", "features", "knowledgeBaseKey", "propertyNameToGroupBy", "delimitor", "propertyName", result => {
                lastSuccess = result;
            }, error => {
                lastError = error;
            });
            expect(lastSuccess).to.be.false;
            expect(lastError).to.be.instanceof(Error);
        });
        it("should hand over an error if anything but an array is given as features", () => {
            let lastSuccess = false,
                lastError = null;

            nextGroupedFeaturesByDistance([], "features", "knowledgeBaseKey", "propertyNameToGroupBy", "delimitor", "propertyName", result => {
                lastSuccess = result;
            }, error => {
                lastError = error;
            });
            expect(lastSuccess).to.be.false;
            expect(lastError).to.be.instanceof(Error);
        });
        it("should teturn the closest features grouped by attribute value hidden in strings", () => {
            const coordinate = [565449.0700000001, 5937439.2645],
                features = [
                    new Feature({
                        geometry: new Point([565556.73151767, 5935130.20726153]),
                        lines: "S11,S31,S21",
                        otherParam: 1234,
                        propertyNameToGroupBy: "S,S,S"
                    }),
                    new Feature({
                        geometry: new Point([565435.80113706, 5937426.29039814]),
                        lines: "U1",
                        otherParam: 5678,
                        propertyNameToGroupBy: "U"
                    })
                ],
                delimitor = ",",
                propertyName = ["lines", "propertyNameToGroupBy"],
                expected = {
                    knowledgeBaseKey: ["2,312", "0,019"],
                    lines: ["S11, S31, S21", "U1"],
                    propertyNameToGroupBy: ["S", "U"]
                };
            let lastSuccess = false,
                lastError = null;

            nextGroupedFeaturesByDistance(coordinate, features, "knowledgeBaseKey", "propertyNameToGroupBy", delimitor, propertyName, result => {
                lastSuccess = result;
            }, error => {
                lastError = error;
            });
            expect(lastSuccess).to.deep.equal(expected);
            expect(lastError).to.be.null;
        });
    });
});
