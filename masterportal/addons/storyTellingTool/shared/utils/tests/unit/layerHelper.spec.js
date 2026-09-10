import {expect} from "chai";
import {getVisibleLayerList} from "../../layerHelper.js";

describe("addons/storyTellingTool/shared/utils/layerHelper.js", () => {
    describe("getVisibleLayerList", () => {

        /**
         * Helper function to create simulated OpenLayers layers (mocks)
         * @param {String} id The simulated layer ID
         * @param {String} name The simulated layer name
         * @param {Boolean} visible The simulated visibility
         * @returns {Object} Mock layer
         */
        function createMockLayer (id, name, visible) {
            return {
                getVisible () {
                    return visible;
                },
                get (key) {
                    if (key === "id") {
                        return id;
                    }
                    if (key === "name") {
                        return name;
                    }
                    return null;
                }
            };
        }

        /**
         * Helper function to create a simulated OpenLayers collection
         * @param {Object[]} layersArray Array containing mock layers
         * @returns {Object} Mock collection object containing a getArray method
         */
        function createMockCollection (layersArray) {
            return {
                getArray () {
                    return layersArray;
                }
            };
        }

        it("should return empty array if the parameter is not a valid OpenLayers collection", () => {
            expect(getVisibleLayerList(0)).to.deep.equal([]);
            expect(getVisibleLayerList(null)).to.deep.equal([]);
            expect(getVisibleLayerList(undefined)).to.deep.equal([]);
            expect(getVisibleLayerList([])).to.deep.equal([]);
            expect(getVisibleLayerList({})).to.deep.equal([]);
            expect(getVisibleLayerList(false)).to.deep.equal([]);
            expect(getVisibleLayerList("string")).to.deep.equal([]);
        });

        it("should return only visible layers", () => {
            const layer1 = createMockLayer("1", "layer1", true),
                layer2 = createMockLayer("2", "layer2", false),
                collection = createMockCollection([layer1, layer2]);

            expect(getVisibleLayerList(collection)).to.deep.equal([layer1]);
        });

        it("should exclude 'markerPoint' and 'markerPolygon' layers even if they are visible", () => {
            const validLayer = createMockLayer("1", "validLayer", true),
                markerPoint = createMockLayer("2", "markerPoint", true),
                markerPolygon = createMockLayer("3", "markerPolygon", true),
                collection = createMockCollection([validLayer, markerPoint, markerPolygon]);

            expect(getVisibleLayerList(collection)).to.deep.equal([validLayer]);
        });

        it("should exclude the layer with the given excludeLayerId", () => {
            const layer1 = createMockLayer("1", "layer1", true),
                baselayer = createMockLayer("base1", "baselayer", true),
                collection = createMockCollection([layer1, baselayer]);

            expect(getVisibleLayerList(collection, "base1")).to.deep.equal([layer1]);
        });

        it("should return the correct list of valid, visible layers combined", () => {
            const layer1 = createMockLayer("1", "layer1", true),
                layer2 = createMockLayer("2", "layer2", false),
                marker = createMockLayer("3", "markerPoint", true),
                baselayer = createMockLayer("base", "basemap", true),
                layer4 = createMockLayer("4", "layer4", true),
                collection = createMockCollection([layer1, layer2, marker, baselayer, layer4]);

            expect(getVisibleLayerList(collection, "base")).to.deep.equal([layer1, layer4]);
        });
    });
});
