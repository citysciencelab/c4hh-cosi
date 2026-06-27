import {expect} from "chai";
import {CommuterOL} from "../../../utils/commuterOL.js";
import {Point} from "ol/geom.js";
import Feature from "ol/Feature.js";

describe("addons/commuterFlows/utils/commuterOL.js", () => {
    let lastCalls = {};
    const dummyFunc = {
            resetLastCalls: () => {
                lastCalls = {
                    createLayerIfNotExists: false,
                    getFeatures: false,
                    addFeature: false,
                    clearLayer: false,
                    zoomToExtent: false,
                    showLayer: false,
                    hideLayer: false,
                    render: false,
                    onPostRender: false,
                    unPostRender: false,
                    expandExtent: false
                };
            }
        },
        generalDummy = new CommuterOL({}, {
            createLayerIfNotExists: labelname => {
                lastCalls.createLayerIfNotExists = labelname;
            },
            getFeatures: layer => {
                lastCalls.getFeatures = layer;
            },
            addFeature: (layer, feature) => {
                lastCalls.addFeature = [layer, feature];
            },
            clearLayer: layer => {
                lastCalls.clearLayer = layer;
            },
            zoomToExtent: extent => {
                lastCalls.zoomToExtent = extent;
            },
            showLayer: layer => {
                lastCalls.showLayer = layer;
            },
            hideLayer: layer => {
                lastCalls.hideLayer = layer;
            },
            render: () => {
                lastCalls.render = true;
            },
            onPostRender: (layer, event) => {
                lastCalls.onPostRender = [layer, event];
            },
            unPostRender: (layer, event) => {
                lastCalls.unPostRender = [layer, event];
            },
            expandExtent: (extent1, extent2) => {
                if (!Array.isArray(lastCalls.expandExtent)) {
                    lastCalls.expandExtent = [];
                }
                lastCalls.expandExtent.push([extent1, extent2]);
            }
        });

    describe("CommuterOL.constructor", () => {
        it("should create layers in a specific order on startup using createLayerIfNotExists", () => {
            const layernames = [],
                expected = [
                    "CommuterOL_layerBeams",
                    "CommuterOL_layerBubbles",
                    "CommuterOL_layerAnimation",
                    "CommuterOL_layerCaptions"
                ];

            new CommuterOL({}, {
                createLayerIfNotExists: layername => {
                    layernames.push(layername);
                }
            });

            expect(layernames).to.deep.equal(expected);
        });
    });

    describe("calcRadiusLog10", () => {
        it("should return minRadiusPx if any invalid argument is given", () => {
            expect(generalDummy.calcRadiusLog10()).to.equal(0);

            expect(generalDummy.calcRadiusLog10(null, 1, 1, 1)).to.equal(1);
            expect(generalDummy.calcRadiusLog10("string", 1, 1, 1)).to.equal(1);
            expect(generalDummy.calcRadiusLog10([], 1, 1, 1)).to.equal(1);
            expect(generalDummy.calcRadiusLog10({}, 1, 1, 1)).to.equal(1);
            expect(generalDummy.calcRadiusLog10(true, 1, 1, 1)).to.equal(1);

            expect(generalDummy.calcRadiusLog10(1, null, 1, 1)).to.equal(1);
            expect(generalDummy.calcRadiusLog10(1, "string", 1, 1)).to.equal(1);
            expect(generalDummy.calcRadiusLog10(1, [], 1, 1)).to.equal(1);
            expect(generalDummy.calcRadiusLog10(1, {}, 1, 1)).to.equal(1);
            expect(generalDummy.calcRadiusLog10(1, true, 1, 1)).to.equal(1);

            expect(generalDummy.calcRadiusLog10(1, 1, null, 1)).to.equal(1);
            expect(generalDummy.calcRadiusLog10(1, 1, "string", 1)).to.equal(1);
            expect(generalDummy.calcRadiusLog10(1, 1, [], 1)).to.equal(1);
            expect(generalDummy.calcRadiusLog10(1, 1, {}, 1)).to.equal(1);
            expect(generalDummy.calcRadiusLog10(1, 1, true, 1)).to.equal(1);
        });
        it("should return zero if the given minRadiusPx is anything but a number", () => {
            expect(generalDummy.calcRadiusLog10(1, 1, 1, null)).to.equal(0);
            expect(generalDummy.calcRadiusLog10(1, 1, 1, "string")).to.equal(0);
            expect(generalDummy.calcRadiusLog10(1, 1, 1, [])).to.equal(0);
            expect(generalDummy.calcRadiusLog10(1, 1, 1, {})).to.equal(0);
            expect(generalDummy.calcRadiusLog10(1, 1, 1, true)).to.equal(0);
        });
        it("should return minRadiusPx if minRadiusPx is greater than maxRadiusPx", () => {
            expect(generalDummy.calcRadiusLog10(1, 1, 1, 2)).to.equal(2);
        });
        it("should return minRadiusPx if value is equal or less than zero", () => {
            expect(generalDummy.calcRadiusLog10(0, 1, 1, 2)).to.equal(2);
            expect(generalDummy.calcRadiusLog10(-1, 1, 1, 2)).to.equal(2);
        });
        it("should return minRadiusPx if the given maxValue is equal or less than zero (avoid devision by zero)", () => {
            expect(generalDummy.calcRadiusLog10(1, 0, 1, 2)).to.equal(2);
            expect(generalDummy.calcRadiusLog10(1, -1, 1, 2)).to.equal(2);
        });
        it("should return maxRadiusPx if the given value is equal or greater than maxValue", () => {
            expect(generalDummy.calcRadiusLog10(3, 3, 2, 1)).to.equal(2);
            expect(generalDummy.calcRadiusLog10(4, 3, 2, 1)).to.equal(2);
        });

        it("should calculate the linear ratio on a radius between maxRadiusPx and minRadiusPx", () => {
            expect(generalDummy.calcRadiusLog10(1, 10000, 50, 5)).to.equal(5);
            expect(generalDummy.calcRadiusLog10(10, 10000, 50, 5)).to.equal(16.25);
            expect(generalDummy.calcRadiusLog10(100, 10000, 50, 5)).to.equal(27.5);
            expect(generalDummy.calcRadiusLog10(1000, 10000, 50, 5)).to.equal(38.75);
            expect(generalDummy.calcRadiusLog10(10000, 10000, 50, 5)).to.equal(50);
        });
    });

    describe("calcRadiusLinear", () => {
        it("should return minRadiusPx if any invalid argument is given", () => {
            expect(generalDummy.calcRadiusLinear()).to.equal(0);

            expect(generalDummy.calcRadiusLinear(null, 1, 1, 1)).to.equal(1);
            expect(generalDummy.calcRadiusLinear("string", 1, 1, 1)).to.equal(1);
            expect(generalDummy.calcRadiusLinear([], 1, 1, 1)).to.equal(1);
            expect(generalDummy.calcRadiusLinear({}, 1, 1, 1)).to.equal(1);
            expect(generalDummy.calcRadiusLinear(true, 1, 1, 1)).to.equal(1);

            expect(generalDummy.calcRadiusLinear(1, null, 1, 1)).to.equal(1);
            expect(generalDummy.calcRadiusLinear(1, "string", 1, 1)).to.equal(1);
            expect(generalDummy.calcRadiusLinear(1, [], 1, 1)).to.equal(1);
            expect(generalDummy.calcRadiusLinear(1, {}, 1, 1)).to.equal(1);
            expect(generalDummy.calcRadiusLinear(1, true, 1, 1)).to.equal(1);

            expect(generalDummy.calcRadiusLinear(1, 1, null, 1)).to.equal(1);
            expect(generalDummy.calcRadiusLinear(1, 1, "string", 1)).to.equal(1);
            expect(generalDummy.calcRadiusLinear(1, 1, [], 1)).to.equal(1);
            expect(generalDummy.calcRadiusLinear(1, 1, {}, 1)).to.equal(1);
            expect(generalDummy.calcRadiusLinear(1, 1, true, 1)).to.equal(1);
        });
        it("should return zero if the given minRadiusPx is anything but a number", () => {
            expect(generalDummy.calcRadiusLinear(1, 1, 1, null)).to.equal(0);
            expect(generalDummy.calcRadiusLinear(1, 1, 1, "string")).to.equal(0);
            expect(generalDummy.calcRadiusLinear(1, 1, 1, [])).to.equal(0);
            expect(generalDummy.calcRadiusLinear(1, 1, 1, {})).to.equal(0);
            expect(generalDummy.calcRadiusLinear(1, 1, 1, true)).to.equal(0);
        });
        it("should return minRadiusPx if minRadiusPx is greater than maxRadiusPx", () => {
            expect(generalDummy.calcRadiusLinear(1, 1, 1, 2)).to.equal(2);
        });
        it("should return minRadiusPx if value is equal or less than zero", () => {
            expect(generalDummy.calcRadiusLinear(0, 1, 1, 2)).to.equal(2);
            expect(generalDummy.calcRadiusLinear(-1, 1, 1, 2)).to.equal(2);
        });
        it("should return minRadiusPx if the given maxValue is equal or less than zero (avoid devision by zero)", () => {
            expect(generalDummy.calcRadiusLinear(1, 0, 1, 2)).to.equal(2);
            expect(generalDummy.calcRadiusLinear(1, -1, 1, 2)).to.equal(2);
        });
        it("should return maxRadiusPx if the given value is equal or greater than maxValue", () => {
            expect(generalDummy.calcRadiusLinear(3, 3, 2, 1)).to.equal(2);
            expect(generalDummy.calcRadiusLinear(4, 3, 2, 1)).to.equal(2);
        });

        it("should calculate the linear ratio on a radius between maxRadiusPx and minRadiusPx", () => {
            expect(generalDummy.calcRadiusLinear(5, 10, 100, 0)).to.equal(50);
            expect(generalDummy.calcRadiusLinear(5, 10, 100, 50)).to.equal(75);
            expect(generalDummy.calcRadiusLinear(180, 640, 4.8, 1.6)).to.equal(2.5);
        });
    });

    describe("calcRadiusArea", () => {
        it("should return zero if any invalid argument is given", () => {
            expect(generalDummy.calcRadiusArea()).to.equal(0);

            expect(generalDummy.calcRadiusArea(null, 1, 1)).to.equal(0);
            expect(generalDummy.calcRadiusArea("string", 1, 1)).to.equal(0);
            expect(generalDummy.calcRadiusArea([], 1, 1)).to.equal(0);
            expect(generalDummy.calcRadiusArea({}, 1, 1)).to.equal(0);
            expect(generalDummy.calcRadiusArea(true, 1, 1)).to.equal(0);

            expect(generalDummy.calcRadiusArea(1, null, 1)).to.equal(0);
            expect(generalDummy.calcRadiusArea(1, "string", 1)).to.equal(0);
            expect(generalDummy.calcRadiusArea(1, [], 1)).to.equal(0);
            expect(generalDummy.calcRadiusArea(1, {}, 1)).to.equal(0);
            expect(generalDummy.calcRadiusArea(1, true, 1)).to.equal(0);

            expect(generalDummy.calcRadiusArea(1, 1, null)).to.equal(0);
            expect(generalDummy.calcRadiusArea(1, 1, "string")).to.equal(0);
            expect(generalDummy.calcRadiusArea(1, 1, [])).to.equal(0);
            expect(generalDummy.calcRadiusArea(1, 1, {})).to.equal(0);
            expect(generalDummy.calcRadiusArea(1, 1, true)).to.equal(0);
        });
        it("should return zero if any argument is zero", () => {
            expect(generalDummy.calcRadiusArea(0, 1, 1)).to.equal(0);
            expect(generalDummy.calcRadiusArea(1, 0, 1)).to.equal(0);
            expect(generalDummy.calcRadiusArea(1, 1, 0)).to.equal(0);
        });
        it("should return maxRadiusPx if value equals or is greater than maxValue", () => {
            expect(generalDummy.calcRadiusArea(1, 1, 1)).to.equal(1);
            expect(generalDummy.calcRadiusArea(2, 1, 1)).to.equal(1);
        });
        it("should calculate the circle area", () => {
            expect(generalDummy.calcRadiusArea(5, 10, 100).toFixed(2)).to.equal("70.71");
        });
    });
    describe("getBubbleColor", () => {
        it("should return rgba black if any invalid argument is given", () => {
            expect(generalDummy.getBubbleColor()).to.deep.equal([0, 0, 0, 1]);

            expect(generalDummy.getBubbleColor(undefined, [[0, 0, 0, 0]], [0])).to.deep.equal([0, 0, 0, 1]);
            expect(generalDummy.getBubbleColor(null, [[0, 0, 0, 0]], [0])).to.deep.equal([0, 0, 0, 1]);
            expect(generalDummy.getBubbleColor("string", [[0, 0, 0, 0]], [0])).to.deep.equal([0, 0, 0, 1]);
            expect(generalDummy.getBubbleColor([], [[0, 0, 0, 0]], [0])).to.deep.equal([0, 0, 0, 1]);
            expect(generalDummy.getBubbleColor({}, [[0, 0, 0, 0]], [0])).to.deep.equal([0, 0, 0, 1]);
            expect(generalDummy.getBubbleColor(true, [[0, 0, 0, 0]], [0])).to.deep.equal([0, 0, 0, 1]);

            expect(generalDummy.getBubbleColor(0, undefined, [0])).to.deep.equal([0, 0, 0, 1]);
            expect(generalDummy.getBubbleColor(0, null, [0])).to.deep.equal([0, 0, 0, 1]);
            expect(generalDummy.getBubbleColor(0, "string", [0])).to.deep.equal([0, 0, 0, 1]);
            expect(generalDummy.getBubbleColor(0, [], [0])).to.deep.equal([0, 0, 0, 1]);
            expect(generalDummy.getBubbleColor(0, {}, [0])).to.deep.equal([0, 0, 0, 1]);
            expect(generalDummy.getBubbleColor(0, true, [0])).to.deep.equal([0, 0, 0, 1]);

            expect(generalDummy.getBubbleColor(0, [[0, 0, 0, 0]], undefined)).to.deep.equal([0, 0, 0, 1]);
            expect(generalDummy.getBubbleColor(0, [[0, 0, 0, 0]], null)).to.deep.equal([0, 0, 0, 1]);
            expect(generalDummy.getBubbleColor(0, [[0, 0, 0, 0]], "string")).to.deep.equal([0, 0, 0, 1]);
            expect(generalDummy.getBubbleColor(0, [[0, 0, 0, 0]], [])).to.deep.equal([0, 0, 0, 1]);
            expect(generalDummy.getBubbleColor(0, [[0, 0, 0, 0]], {})).to.deep.equal([0, 0, 0, 1]);
            expect(generalDummy.getBubbleColor(0, [[0, 0, 0, 0]], true)).to.deep.equal([0, 0, 0, 1]);
        });
        it("should return rgba black if a negative index is given", () => {
            expect(generalDummy.getBubbleColor(-1, [[0, 0, 0, 0]], [0])).to.deep.equal([0, 0, 0, 1]);
        });
        it("should return rgba black if an invalid rgba color is given and choosen", () => {
            expect(generalDummy.getBubbleColor(0, [[0, 0, 0]], [0])).to.deep.equal([0, 0, 0, 1]);
            expect(generalDummy.getBubbleColor(0, [[0, 0, 0, 0, 0]], [0])).to.deep.equal([0, 0, 0, 1]);
            expect(generalDummy.getBubbleColor(0, [undefined], [0])).to.deep.equal([0, 0, 0, 1]);
            expect(generalDummy.getBubbleColor(0, [null], [0])).to.deep.equal([0, 0, 0, 1]);
            expect(generalDummy.getBubbleColor(0, ["string"], [0])).to.deep.equal([0, 0, 0, 1]);
            expect(generalDummy.getBubbleColor(0, [[]], [0])).to.deep.equal([0, 0, 0, 1]);
            expect(generalDummy.getBubbleColor(0, [{}], [0])).to.deep.equal([0, 0, 0, 1]);
            expect(generalDummy.getBubbleColor(0, [true], [0])).to.deep.equal([0, 0, 0, 1]);
        });
        it("should return rgba black if no or an invalid shifting is given and choosen", () => {
            expect(generalDummy.getBubbleColor(0, [[1, 1, 1, 1]], undefined)).to.deep.equal([0, 0, 0, 1]);
            expect(generalDummy.getBubbleColor(0, [[1, 1, 1, 1]], null)).to.deep.equal([0, 0, 0, 1]);
            expect(generalDummy.getBubbleColor(0, [[1, 1, 1, 1]], "string")).to.deep.equal([0, 0, 0, 1]);
            expect(generalDummy.getBubbleColor(0, [[1, 1, 1, 1]], [])).to.deep.equal([0, 0, 0, 1]);
            expect(generalDummy.getBubbleColor(0, [[1, 1, 1, 1]], {})).to.deep.equal([0, 0, 0, 1]);
            expect(generalDummy.getBubbleColor(0, [[1, 1, 1, 1]], true)).to.deep.equal([0, 0, 0, 1]);
        });
        it("should regulate the choosen color within [0..255] if color values are out of bounce", () => {
            expect(generalDummy.getBubbleColor(0, [[-1, 1, 1, 1]], [0])).to.deep.equal([0, 1, 1, 1]);
            expect(generalDummy.getBubbleColor(0, [[1, -1, 1, 1]], [0])).to.deep.equal([1, 0, 1, 1]);
            expect(generalDummy.getBubbleColor(0, [[1, 1, -1, 1]], [0])).to.deep.equal([1, 1, 0, 1]);
            expect(generalDummy.getBubbleColor(0, [[1, 1, 1, -0.1]], [0])).to.deep.equal([1, 1, 1, 0]);

            expect(generalDummy.getBubbleColor(0, [[256, 1, 1, 1]], [0])).to.deep.equal([255, 1, 1, 1]);
            expect(generalDummy.getBubbleColor(0, [[1, 256, 1, 1]], [0])).to.deep.equal([1, 255, 1, 1]);
            expect(generalDummy.getBubbleColor(0, [[1, 1, 256, 1]], [0])).to.deep.equal([1, 1, 255, 1]);
            expect(generalDummy.getBubbleColor(0, [[1, 1, 1, 1.1]], [0])).to.deep.equal([1, 1, 1, 1]);
        });
        it("should regulate the choosen color within [0..255] if shifting lifts the color values out of bounce", () => {
            expect(generalDummy.getBubbleColor(0, [[1, 1, 1, 1]], [-2])).to.deep.equal([0, 0, 0, 1]);
            expect(generalDummy.getBubbleColor(0, [[1, 1, 1, 1]], [255])).to.deep.equal([255, 255, 255, 1]);
        });
        it("should choose a color from a color list at the correct index, circling through colors", () => {
            expect(generalDummy.getBubbleColor(3, [
                [1, 1, 1, 1],
                [2, 2, 2, 1],
                [3, 3, 3, 1],
                [4, 4, 4, 1],
                [5, 5, 5, 1]
            ], [0])).to.deep.equal([4, 4, 4, 1]);
            expect(generalDummy.getBubbleColor(8, [
                [1, 1, 1, 1],
                [2, 2, 2, 1],
                [3, 3, 3, 1],
                [4, 4, 4, 1],
                [5, 5, 5, 1]
            ], [0])).to.deep.equal([4, 4, 4, 1]);
            expect(generalDummy.getBubbleColor(13, [
                [1, 1, 1, 1],
                [2, 2, 2, 1],
                [3, 3, 3, 1],
                [4, 4, 4, 1],
                [5, 5, 5, 1]
            ], [0])).to.deep.equal([4, 4, 4, 1]);
        });

        it("should choose the correct color from the color list shifting inbetween cycles", () => {
            expect(generalDummy.getBubbleColor(3, [
                [10, 10, 10, 1],
                [20, 20, 20, 1],
                [30, 30, 30, 1],
                [40, 40, 40, 1],
                [50, 50, 50, 1]
            ], [0, -1, 1])).to.deep.equal([40, 40, 40, 1]);
            expect(generalDummy.getBubbleColor(8, [
                [10, 10, 10, 1],
                [20, 20, 20, 1],
                [30, 30, 30, 1],
                [40, 40, 40, 1],
                [50, 50, 50, 1]
            ], [0, -1, 1])).to.deep.equal([39, 39, 39, 1]);
            expect(generalDummy.getBubbleColor(13, [
                [10, 10, 10, 1],
                [20, 20, 20, 1],
                [30, 30, 30, 1],
                [40, 40, 40, 1],
                [50, 50, 50, 1]
            ], [0, -1, 1])).to.deep.equal([41, 41, 41, 1]);
            expect(generalDummy.getBubbleColor(18, [
                [10, 10, 10, 1],
                [20, 20, 20, 1],
                [30, 30, 30, 1],
                [40, 40, 40, 1],
                [50, 50, 50, 1]
            ], [0, -1, 1])).to.deep.equal([40, 40, 40, 1]);
        });
    });

    describe("getExtentOfFeatures", () => {
        it("should return an empty array if anything but a valid array is given", () => {
            expect(generalDummy.getExtentOfFeatures(undefined)).to.be.an("array").and.to.be.empty;
            expect(generalDummy.getExtentOfFeatures(null)).to.be.an("array").and.to.be.empty;
            expect(generalDummy.getExtentOfFeatures("string")).to.be.an("array").and.to.be.empty;
            expect(generalDummy.getExtentOfFeatures(1)).to.be.an("array").and.to.be.empty;
            expect(generalDummy.getExtentOfFeatures({})).to.be.an("array").and.to.be.empty;
            expect(generalDummy.getExtentOfFeatures(true)).to.be.an("array").and.to.be.empty;
        });
        it("should return an empty array if an empty array is given", () => {
            expect(generalDummy.getExtentOfFeatures([])).to.be.an("array").and.to.be.empty;
        });
        it("should not expand the extent for invalid features", () => {
            const featureList = [
                    new Feature(new Point([1, 1])),
                    new Feature(new Point([2, 2])),
                    undefined,
                    new Feature(new Point([3, 3]))
                ],
                expected = [[[1, 1, 1, 1], [2, 2, 2, 2]], [[1, 1, 1, 1], [3, 3, 3, 3]]];

            dummyFunc.resetLastCalls();
            generalDummy.getExtentOfFeatures(featureList);
            expect(lastCalls.expandExtent).to.deep.equal(expected);
        });
    });
});
