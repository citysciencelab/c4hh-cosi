import {expect} from "chai";
import {treeBaselayersKey, treeSubjectsKey} from "@shared/js/utils/constants.js";
import zIndexManager from "@core/layers/js/zIndexManager.js";

describe("src/core/layers/js/zIndexManager.js", () => {
    describe("determineZIndex", () => {
        let layerConfig, myGetters,
            maxZIndex = -1;

        beforeEach(() => {
            layerConfig = [
                {
                    id: "453",
                    baselayer: true,
                    zIndex: 0
                },
                {
                    id: "452",
                    baselayer: true
                },
                {
                    id: "451",
                    baselayer: true
                },
                {
                    id: "1132",
                    name: "100 Jahre Stadtgruen POIs",
                    visibility: true
                },
                {
                    id: "10220",
                    baselayer: false
                }
            ];
            myGetters = {
                maxZIndexOfLayerConfigsByParentKey: () => maxZIndex,
                layerConfigById: (id) => layerConfig.find((config) => config.id === id)
            };
        });
        it("determineZIndex for unknown layer", () => {
            expect(zIndexManager.determineZIndex(null, myGetters)("unknown")).to.be.null;
        });
        it("determineZIndex for first layer with zIndex under parentKey", () => {
            expect(zIndexManager.determineZIndex(null, myGetters)("10220")).to.be.equals(0);
        });
        it("determineZIndex for second layer with zIndex under parentKey", () => {
            maxZIndex = 0;
            expect(zIndexManager.determineZIndex(null, myGetters)("452")).to.be.equals(1);
        });
        it("determineZIndex for third layer with zIndex under parentKey", () => {
            maxZIndex = 1;
            layerConfig[1].zIndex = 1;
            expect(zIndexManager.determineZIndex(null, myGetters)("451")).to.be.equals(2);
        });
        it("determineZIndex for layer with existing zIndex", () => {
            maxZIndex = 100;
            layerConfig[0].zIndex = 100;
            expect(zIndexManager.determineZIndex(null, myGetters)("453")).to.be.equals(100);
        });
    });

    describe("maxZIndexOfLayerConfigsByParentKey", () => {
        let layerConfig, myGetters;

        beforeEach(() => {
            layerConfig = {
                [treeBaselayersKey]: {
                    elements: [
                        {
                            id: "452",
                            baselayer: true,
                            zIndex: 0
                        },
                        {
                            id: "452",
                            baselayer: true,
                            zIndex: 1
                        },
                        {
                            id: "451",
                            baselayer: true
                        }
                    ]
                },
                [treeSubjectsKey]: {
                    elements: [
                        {
                            id: "10220",
                            zIndex: 2
                        },
                        {
                            id: "10221",
                            zIndex: 3
                        }
                    ]
                }
            };
            myGetters = {
                allLayerConfigsByParentKey: (key) => layerConfig[key]?.elements
            };
        });
        it("maxZIndexOfLayerConfigsByParentKey for basedata", () => {
            expect(zIndexManager.maxZIndexOfLayerConfigsByParentKey(null, myGetters)(treeBaselayersKey)).to.be.equals(1);
        });
        it("maxZIndexOfLayerConfigsByParentKeyfor basedata with no zIndex", () => {
            layerConfig[treeBaselayersKey].elements[0].zIndex = undefined;
            layerConfig[treeBaselayersKey].elements[1].zIndex = undefined;
            expect(zIndexManager.maxZIndexOfLayerConfigsByParentKey(null, myGetters)(treeBaselayersKey)).to.be.equals(-1);
        });
        it("maxZIndexOfLayerConfigsByParentKeyfor basedata with no elements", () => {
            layerConfig[treeBaselayersKey].elements = [];
            expect(zIndexManager.maxZIndexOfLayerConfigsByParentKey(null, myGetters)(treeBaselayersKey)).to.be.equals(-1);
        });
        it("maxZIndexOfLayerConfigsByParentKey for subjectdata", () => {
            expect(zIndexManager.maxZIndexOfLayerConfigsByParentKey(null, myGetters)(treeSubjectsKey)).to.be.equals(3);
        });
        it("maxZIndexOfLayerConfigsByParentKeyfor subjectdata with no zIndex", () => {
            layerConfig[treeSubjectsKey].elements[0].zIndex = undefined;
            layerConfig[treeSubjectsKey].elements[1].zIndex = undefined;
            expect(zIndexManager.maxZIndexOfLayerConfigsByParentKey(null, myGetters)(treeSubjectsKey)).to.be.equals(-1);
        });
        it("maxZIndexOfLayerConfigsByParentKeyfor subjectdata with no elements", () => {
            layerConfig[treeSubjectsKey].elements = [];
            expect(zIndexManager.maxZIndexOfLayerConfigsByParentKey(null, myGetters)(treeSubjectsKey)).to.be.equals(-1);
        });
    });

    describe("updateLayerConfigZIndex", () => {
        it("Should set new zindex for layer with zIndex greater than maxZIndex", () => {
            const layerContainer = [
                    {zIndex: 1},
                    {zIndex: 2},
                    {zIndex: 3},
                    {zIndex: 4},
                    {zIndex: 5}
                ],
                maxZIndex = 2,
                resultZIndex = [1, 2, 4, 5, 6];

            zIndexManager.updateLayerConfigZIndex({}, {layerContainer, maxZIndex});

            layerContainer.forEach((layerContainerConf, index) => {
                expect(layerContainerConf.zIndex).to.equals(resultZIndex[index]);
            });
        });
    });

    describe("incrementZIndex and resetZIndex", () => {
        beforeEach(() => {
            zIndexManager.resetZIndex();
        });

        it("should return 1 after reset", () => {
            expect(zIndexManager.incrementZIndex()).to.equal(1);
        });

        it("should increment on each call", () => {
            zIndexManager.incrementZIndex();
            expect(zIndexManager.incrementZIndex()).to.equal(2);
        });

        it("should reset to 1", () => {
            zIndexManager.incrementZIndex();
            zIndexManager.incrementZIndex();
            zIndexManager.resetZIndex();
            expect(zIndexManager.incrementZIndex()).to.equal(1);
        });
    });

    describe("sortVisibleLayerListByZindexBeforePrint", () => {
        let layer1, layer2;

        beforeEach(() => {
            layer1 = {id: "1", getZIndex: () => 1};
            layer2 = {id: "2", getZIndex: () => 2};
        });

        it("should sort layers by zIndex ascending", () => {
            layer1.getZIndex = () => 5;
            layer2.getZIndex = () => 4;

            expect(zIndexManager.sortVisibleLayerListByZindexBeforePrint([layer1, layer2])).to.deep.equals([layer2, layer1]);
        });

        it("should keep original order if layers have no getZIndex function", () => {
            delete layer1.getZIndex;
            delete layer2.getZIndex;

            expect(zIndexManager.sortVisibleLayerListByZindexBeforePrint([layer1, layer2])).to.deep.equals([layer1, layer2]);
        });

        it("should keep original order if layers have the same zIndex", () => {
            layer1.getZIndex = () => 5;
            layer2.getZIndex = () => 5;

            expect(zIndexManager.sortVisibleLayerListByZindexBeforePrint([layer1, layer2])).to.deep.equals([layer1, layer2]);
        });

        it("should keep original order if one layer has zIndex and the other does not", () => {
            layer1.getZIndex = () => 5;
            delete layer2.getZIndex;

            expect(zIndexManager.sortVisibleLayerListByZindexBeforePrint([layer1, layer2])).to.deep.equals([layer1, layer2]);
        });
    });
});
