import {expect} from "chai";
import sinon from "sinon";

import find3DPickedFeatureModule from "@shared/js/utils/find3DPickedFeature.js";

const {find3DPickedFeature} = find3DPickedFeatureModule;

/**
 * Creates a mock Cesium feature.
 * @param {string|null} id The value returned by getProperty("id").
 * @returns {Object} Mock feature.
 */
function createFeature (id) {
    return {
        getProperty: sinon.stub().callsFake((prop) => prop === "id" ? id : undefined)
    };
}

/**
 * Creates a mock tile content with a list of features.
 * @param {Array} features Array of feature objects.
 * @returns {Object} Mock tile content.
 */
function createContent (features) {
    return {
        featuresLength: features.length,
        getFeature: sinon.stub().callsFake((i) => features[i])
    };
}

/**
 * Creates a mock tile with optional content.
 * @param {Object|null} content The tile content.
 * @returns {Object} Mock tile.
 */
function createTile (content) {
    return {_content: content};
}

/**
 * Creates a mock Cesium3DTileset with selected tiles.
 * @param {Array} tiles Array of tile objects.
 * @returns {Object} Mock tileset.
 */
function createTileset (tiles) {
    const tileset = {_selectedTiles: tiles};

    // Make instanceof Cesium.Cesium3DTileset work via the global mock
    Object.setPrototypeOf(tileset, global.Cesium.Cesium3DTileset.prototype);
    return tileset;
}

/**
 * Creates a mock Cesium scene with a list of tilesets.
 * @param {Array} tilesets Array of tileset objects.
 * @returns {Object} Mock scene.
 */
function createScene (tilesets) {
    return {
        _primitives: {
            _primitives: tilesets
        }
    };
}

describe("src/shared/js/utils/find3DPickedFeature.js", () => {
    beforeAll(() => {
        global.Cesium = {
            Cesium3DTileset: function Cesium3DTileset () { /* mock constructor */ }
        };
    });

    afterAll(() => {
        delete global.Cesium;
    });

    describe("find3DPickedFeature", () => {
        it("should resolve with null if there are no primitives in the scene", async () => {
            const scene = createScene([]);

            const result = await find3DPickedFeature(scene, "TEST_ID");

            expect(result).to.be.null;
        });

        it("should resolve with null if primitives contain no Cesium3DTileset instances", async () => {
            const nonTileset = {_selectedTiles: []},
                scene = createScene([nonTileset]);

            const result = await find3DPickedFeature(scene, "TEST_ID");

            expect(result).to.be.null;
        });

        it("should resolve with null if the tileset has no selected tiles", async () => {
            const tileset = createTileset([]),
                scene = createScene([tileset]);

            const result = await find3DPickedFeature(scene, "TEST_ID");

            expect(result).to.be.null;
        });

        it("should resolve with null if tile content is null", async () => {
            const tile = createTile(null),
                tileset = createTileset([tile]),
                scene = createScene([tileset]);

            const result = await find3DPickedFeature(scene, "TEST_ID");

            expect(result).to.be.null;
        });

        it("should resolve with null if tile content is undefined", async () => {
            const tile = createTile(undefined),
                tileset = createTileset([tile]),
                scene = createScene([tileset]);

            const result = await find3DPickedFeature(scene, "TEST_ID");

            expect(result).to.be.null;
        });

        it("should resolve with null if tile content has no features (featuresLength 0)", async () => {
            const content = createContent([]),
                tile = createTile(content),
                tileset = createTileset([tile]),
                scene = createScene([tileset]);

            const result = await find3DPickedFeature(scene, "TEST_ID");

            expect(result).to.be.null;
        });

        it("should resolve with null if no feature matches the given featureId", async () => {
            const content = createContent([createFeature("OTHER_ID")]),
                tile = createTile(content),
                tileset = createTileset([tile]),
                scene = createScene([tileset]);

            const result = await find3DPickedFeature(scene, "TEST_ID");

            expect(result).to.be.null;
        });

        it("should resolve with the feature if featureId matches", async () => {
            const targetFeature = createFeature("TEST_ID"),
                content = createContent([targetFeature]),
                tile = createTile(content),
                tileset = createTileset([tile]),
                scene = createScene([tileset]);

            const result = await find3DPickedFeature(scene, "TEST_ID");

            expect(result).to.equal(targetFeature);
        });

        it("should resolve with the correct feature among multiple features in the same tile", async () => {
            const otherFeature = createFeature("OTHER_ID"),
                targetFeature = createFeature("TEST_ID"),
                content = createContent([otherFeature, targetFeature]),
                tile = createTile(content),
                tileset = createTileset([tile]),
                scene = createScene([tileset]);

            const result = await find3DPickedFeature(scene, "TEST_ID");

            expect(result).to.equal(targetFeature);
        });

        it("should resolve with the correct feature across multiple tiles", async () => {
            const tileWithoutMatch = createTile(createContent([createFeature("OTHER_ID")])),
                targetFeature = createFeature("TEST_ID"),
                tileWithMatch = createTile(createContent([targetFeature])),
                tileset = createTileset([tileWithoutMatch, tileWithMatch]),
                scene = createScene([tileset]);

            const result = await find3DPickedFeature(scene, "TEST_ID");

            expect(result).to.equal(targetFeature);
        });

        it("should resolve with the correct feature across multiple tilesets", async () => {
            const tilesetWithoutMatch = createTileset([createTile(createContent([createFeature("OTHER_ID")]))]),
                targetFeature = createFeature("TEST_ID"),
                tilesetWithMatch = createTileset([createTile(createContent([targetFeature]))]),
                scene = createScene([tilesetWithoutMatch, tilesetWithMatch]);

            const result = await find3DPickedFeature(scene, "TEST_ID");

            expect(result).to.equal(targetFeature);
        });

        it("should resolve with the first matching feature if featureId appears multiple times", async () => {
            const firstMatch = createFeature("TEST_ID"),
                secondMatch = createFeature("TEST_ID"),
                content = createContent([firstMatch, secondMatch]),
                tile = createTile(content),
                tileset = createTileset([tile]),
                scene = createScene([tileset]);

            const result = await find3DPickedFeature(scene, "TEST_ID");

            expect(result).to.equal(firstMatch);
        });

        it("should skip features where getProperty returns null for 'id'", async () => {
            const nullIdFeature = createFeature(null),
                targetFeature = createFeature("TEST_ID"),
                content = createContent([nullIdFeature, targetFeature]),
                tile = createTile(content),
                tileset = createTileset([tile]),
                scene = createScene([tileset]);

            const result = await find3DPickedFeature(scene, "TEST_ID");

            expect(result).to.equal(targetFeature);
        });

        it("should skip features where getProperty returns undefined for 'id'", async () => {
            const undefinedIdFeature = createFeature(undefined),
                targetFeature = createFeature("TEST_ID"),
                content = createContent([undefinedIdFeature, targetFeature]),
                tile = createTile(content),
                tileset = createTileset([tile]),
                scene = createScene([tileset]);

            const result = await find3DPickedFeature(scene, "TEST_ID");

            expect(result).to.equal(targetFeature);
        });

        it("should handle a feature that itself is null/undefined (getFeature returns null)", async () => {
            const content = {
                    featuresLength: 2,
                    getFeature: sinon.stub().callsFake((i) => i === 0 ? null : createFeature("TEST_ID"))
                },
                tile = createTile(content),
                tileset = createTileset([tile]),
                scene = createScene([tileset]);

            const result = await find3DPickedFeature(scene, "TEST_ID");

            expect(result).to.not.be.null;
            expect(result.getProperty("id")).to.equal("TEST_ID");
        });

        it("should ignore non-tileset primitives mixed with tilesets", async () => {
            const nonTileset = {_selectedTiles: []},
                targetFeature = createFeature("TEST_ID"),
                tileset = createTileset([createTile(createContent([targetFeature]))]),
                scene = createScene([nonTileset, tileset]);

            const result = await find3DPickedFeature(scene, "TEST_ID");

            expect(result).to.equal(targetFeature);
        });

        it("should return a Promise", () => {
            const scene = createScene([]);
            const result = find3DPickedFeature(scene, "TEST_ID");

            expect(result).to.be.instanceOf(Promise);
        });

        it("should call getProperty with 'id' when iterating features", async () => {
            const feature = createFeature("TEST_ID"),
                content = createContent([feature]),
                tile = createTile(content),
                tileset = createTileset([tile]),
                scene = createScene([tileset]);

            await find3DPickedFeature(scene, "TEST_ID");

            expect(feature.getProperty.calledWith("id")).to.be.true;
        });
    });
});
