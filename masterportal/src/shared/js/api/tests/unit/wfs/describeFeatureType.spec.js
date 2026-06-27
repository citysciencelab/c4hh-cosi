import {expect} from "chai";
import {getFeatureDescription} from "@shared/js/api/wfs/describeFeatureType.js";

describe("src/shared/js/api/wfs/describeFeatureType.js", () => {
    describe("getFeatureDescription", () => {
        it("should not throw for mixed element node shapes", () => {
            const json = {
                schema: {
                    element: [
                        {
                            attributes: {
                                name: "other:feature",
                                type: "ns:OtherFeatureType"
                            }
                        },
                        {
                            getAttributes: () => ({
                                name: "app:target_feature",
                                type: "ns:TargetFeatureType"
                            }),
                            complexType: {
                                complexContent: {
                                    extension: {
                                        sequence: {
                                            element: [
                                                {
                                                    attributes: {
                                                        name: "foo",
                                                        type: "xsd:string"
                                                    }
                                                },
                                                {
                                                    getAttributes: () => ({
                                                        name: "bar",
                                                        type: "xsd:dateTime"
                                                    })
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            };

            expect(() => getFeatureDescription(json, "app:target_feature")).to.not.throw();
            expect(getFeatureDescription(json, "app:target_feature")).to.deep.equal([
                {
                    name: "foo",
                    type: "xsd:string"
                },
                {
                    name: "bar",
                    type: "xsd:dateTime"
                }
            ]);
        });

        it("should resolve complexType by type for mixed schema nodes", () => {
            const json = {
                schema: {
                    element: [
                        {
                            attributes: {
                                name: "app:target_feature",
                                type: "ns:TargetFeatureType"
                            }
                        }
                    ],
                    complexType: [
                        {
                            getAttributes: () => ({
                                name: "TargetFeatureType"
                            }),
                            complexContent: {
                                extension: {
                                    sequence: {
                                        element: [
                                            {
                                                getAttributes: () => ({
                                                    name: "count",
                                                    type: "xsd:int"
                                                })
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                }
            };

            expect(getFeatureDescription(json, "app:target_feature")).to.deep.equal([
                {
                    name: "count",
                    type: "xsd:int"
                }
            ]);
        });
    });
});
