import {expect} from "chai";
import mutations from "@modules/compareFeatures/store/mutationsCompareFeatures.js";

const {
    resetLayerSelection,
    selectLayerWithFeatures,
    addFeatureToLayer,
    removeFeatureFromLists
} = mutations;

describe("src/modules/compareFeatures/store/mutationsCompareFeatures.js", () => {

    describe("resetLayerSelection", () => {
        it("Returns false if there is just one layer", () => {
            const state = {
                layerFeatures: {a: 1}
            };

            resetLayerSelection(state);
            expect(state.hasMultipleLayers).to.equal(false);
        });
    });
    describe("selectLayerWithFeatures", () => {
        it("selects the chosen layer and sets selectedLayerId in state", () => {
            const state = {
                layerWithFeaturesToShow: [],
                layerFeatures: {1711: [{properties: {name: "abcd", id: "1234"}}]}
            };

            selectLayerWithFeatures(state, 1711);
            expect(state.selectedLayerId).to.equal(1711);
        });
    });
    describe("addFeatureToLayer", () => {
        it("selects the chosen layer and sets selectedLayerId in state", () => {
            const state = {
                layerFeatures: {},
                feature: {featureId: "feature1", layerId: "1711"}
            };

            addFeatureToLayer(state, state.feature);
            expect(state.layerFeatures).to.eql({"1711": [{featureId: "feature1", layerId: "1711"}]});
        });
    });
    describe("removeFeatureFromLists", () => {
        it("removes feature from prepared list if only one layer is on comparison list", () => {
            const state = {
                layerFeatures: {"2426": [{layerId: "2426", featureId: "APP_BEZIRKE_1422", properties: {Bezirk: "1", Bezirksname: "Hamburg-Mitte", id: "APP_BEZIRKE_1422", idLayer: "2426"}}]},
                hasMultipleLayers: false,
                preparedList: {
                    "2426": [
                        {
                            "row-1": "Bezirk",
                            "APP_BEZIRKE_1422": "1"
                        },
                        {
                            "row-1": "Bezirksname",
                            "APP_BEZIRKE_1422": "Hamburg-Mitte"
                        },
                        {
                            "row-1": "id",
                            "APP_BEZIRKE_1422": "APP_BEZIRKE_1422"
                        },
                        {
                            "row-1": "idLayer",
                            "APP_BEZIRKE_1422": "2426"
                        }
                    ]
                },
                preparedListDisplayTable: {
                    "2426": {
                        "headers": [
                            {
                                "name": "Bezirk",
                                "order": "origin",
                                "index": 0,
                                "visible": true
                            },
                            {
                                "name": "Bezirksname",
                                "order": "origin",
                                "index": 1,
                                "visible": true
                            },
                            {
                                "name": "id",
                                "order": "origin",
                                "index": 2,
                                "visible": false
                            },
                            {
                                "name": "idLayer",
                                "order": "origin",
                                "index": 3,
                                "visible": false
                            }
                        ],
                        "items": [
                            {
                                "Bezirk": "1",
                                "Bezirksname": "Hamburg-Mitte",
                                "id": "APP_BEZIRKE_1422",
                                "idLayer": "2426"
                            }
                        ]
                    }
                },
                payload: {
                    features: [
                        {
                            "row-1": "Bezirk"
                        },
                        {
                            "row-1": "Bezirksname"
                        }
                    ],
                    featureId: "APP_BEZIRKE_1422",
                    selectedLayerId: "2426"
                }
            };

            removeFeatureFromLists(state, state.payload);

            expect(state.preparedListDisplayTable).to.eql({});
            expect(state.layerFeatures).to.eql({});
        });
        it("removes feature from prepared list if only one layer and two features is on comparison list", () => {
            const state = {
                layerFeatures: {"2426": [{layerId: "2426", featureId: "APP_BEZIRKE_1422", properties: {Bezirk: "1", Bezirksname: "Hamburg-Mitte", id: "APP_BEZIRKE_1422", idLayer: "2426"}},
                    {layerId: "2426", featureId: "APP_BEZIRKE_1425", properties: {Bezirk: "4", Bezirksname: "Hamburg-Nord", id: "APP_BEZIRKE_1425", idLayer: "2426"}}
                ]},
                hasMultipleLayers: false,
                preparedList: {
                    "2426": [
                        {
                            "row-1": "Bezirk",
                            "APP_BEZIRKE_1422": "1",
                            "APP_BEZIRKE_1425": "4"
                        },
                        {
                            "row-1": "Bezirksname",
                            "APP_BEZIRKE_1422": "Hamburg-Mitte",
                            "APP_BEZIRKE_1425": "Hamburg-Nord"
                        },
                        {
                            "row-1": "id",
                            "APP_BEZIRKE_1422": "APP_BEZIRKE_1422",
                            "APP_BEZIRKE_1425": "APP_BEZIRKE_1425"
                        },
                        {
                            "row-1": "idLayer",
                            "APP_BEZIRKE_1422": "2426",
                            "APP_BEZIRKE_1425": "2426"
                        }
                    ]
                },
                preparedListDisplayTable: {
                    "2426": {
                        "headers": [
                            {
                                "name": "Bezirk",
                                "order": "origin",
                                "index": 0,
                                "visible": true
                            },
                            {
                                "name": "Bezirksname",
                                "order": "origin",
                                "index": 1,
                                "visible": true
                            },
                            {
                                "name": "id",
                                "order": "origin",
                                "index": 2,
                                "visible": false
                            },
                            {
                                "name": "idLayer",
                                "order": "origin",
                                "index": 3,
                                "visible": false
                            }
                        ],
                        "items": [
                            {
                                "Bezirk": "1",
                                "Bezirksname": "Hamburg-Mitte",
                                "id": "APP_BEZIRKE_1422",
                                "idLayer": "2426"
                            },
                            {
                                "Bezirk": "4",
                                "Bezirksname": "Hamburg-Nord",
                                "id": "APP_BEZIRKE_1425",
                                "idLayer": "2426"
                            }
                        ]
                    }
                },
                payload: {
                    features: [
                        {
                            "row-1": "Bezirk"
                        },
                        {
                            "row-1": "Bezirksname"
                        }
                    ],
                    featureId: "APP_BEZIRKE_1422",
                    selectedLayerId: "2426"
                }
            };

            removeFeatureFromLists(state, state.payload);

            expect(state.preparedListDisplayTable[state.payload.selectedLayerId].items.length).to.eql(1);
            expect(state.layerFeatures[state.payload.selectedLayerId].length).to.eql(1);
            expect(state.layerFeatures).to.eql({2426: [
                {
                    layerId: "2426", featureId: "APP_BEZIRKE_1425", properties: {Bezirk: "4", Bezirksname: "Hamburg-Nord", id: "APP_BEZIRKE_1425", idLayer: "2426"}
                }
            ]});
        });
        it("removes specific feature from prepared list if multiple layers are on comparison list", () => {
            const state = {
                layerFeatures: {2426: [{layerId: "2426", featureId: "APP_BEZIRKE_1422", properties: {Bezirk: "3", Bezirksname: "Hamburg-Mitte", id: "APP_BEZIRKE_1422", idLayer: "2426"}}],
                    8123: [{layerId: "8123", featureId: "APP_KITA_1426", properties: {name: "Schule-1", strasse: "Strasse1", id: "APP_KITA_1426", idLayer: "8123"}}]},
                hasMultipleLayers: true,
                preparedList: {
                    "2426": [
                        {
                            "row-1": "Bezirk",
                            "APP_BEZIRKE_1422": "3"
                        },
                        {
                            "row-1": "Bezirksname",
                            "APP_BEZIRKE_1422": "Hamburg-Mitte"
                        },
                        {
                            "row-1": "id",
                            "APP_BEZIRKE_1422": "APP_BEZIRKE_1422"
                        },
                        {
                            "row-1": "idLayer",
                            "APP_BEZIRKE_1422": "2426"
                        }
                    ],
                    "8123": [
                        {
                            "row-1": "name",
                            "APP_KITA_1426": "Schule-1"
                        },
                        {
                            "row-1": "strasse",
                            "APP_KITA_1426": "Strasse1"
                        },
                        {
                            "row-1": "id",
                            "APP_KITA_1426": "APP_KITA_1426"
                        },
                        {
                            "row-1": "idLayer",
                            "APP_KITA_1426": "8123"
                        }
                    ]
                },
                preparedListDisplayTable: {
                    "2426": {
                        "headers": [
                            {
                                "name": "Bezirk",
                                "order": "origin",
                                "index": 0,
                                "visible": true
                            },
                            {
                                "name": "Bezirksname",
                                "order": "origin",
                                "index": 1,
                                "visible": true
                            },
                            {
                                "name": "id",
                                "order": "origin",
                                "index": 2,
                                "visible": false
                            },
                            {
                                "name": "idLayer",
                                "order": "origin",
                                "index": 3,
                                "visible": false
                            }
                        ],
                        "items": [
                            {
                                "Bezirk": "3",
                                "Bezirksname": "Hamburg-Mitte",
                                "id": "APP_BEZIRKE_1422",
                                "idLayer": "2426"
                            }
                        ]
                    },
                    "8123": {
                        "headers": [
                            {
                                "name": "name",
                                "order": "origin",
                                "index": 0,
                                "visible": true
                            },
                            {
                                "name": "strasse",
                                "order": "origin",
                                "index": 1,
                                "visible": true
                            },
                            {
                                "name": "id",
                                "order": "origin",
                                "index": 2,
                                "visible": false
                            },
                            {
                                "name": "idLayer",
                                "order": "origin",
                                "index": 3,
                                "visible": false
                            }
                        ],
                        "items": [
                            {
                                "name": "Schule-1",
                                "strasse": "Strasse1",
                                "id": "APP_KITA_1426",
                                "idLayer": "8123"
                            }
                        ]
                    }
                },
                payload: {
                    features: [
                        {
                            "row-1": "name"
                        },
                        {
                            "row-1": "strasse"
                        }
                    ],
                    featureId: "APP_KITA_1426",
                    selectedLayerId: "8123"
                }
            };

            mutations.removeFeatureFromLists(state, state.payload);

            expect(state.preparedListDisplayTable[2426].items.length).to.eql(1);
            expect(state.preparedListDisplayTable[8123]).to.be.undefined;
            expect(state.layerFeatures).to.eql({"2426": [
                {
                    layerId: "2426", featureId: "APP_BEZIRKE_1422", properties: {Bezirk: "3", Bezirksname: "Hamburg-Mitte", id: "APP_BEZIRKE_1422", idLayer: "2426"}
                }
            ]});
        });
    });
});
