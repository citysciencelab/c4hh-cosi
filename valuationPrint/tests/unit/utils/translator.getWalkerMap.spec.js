import {expect} from "chai";
import sinon from "sinon";
import Feature from "ol/Feature";
import {MultiPolygon} from "ol/geom";
import {
    getWalkerMap
} from "../../../utils/translator.getWalkerMap";
import store from "../../../../../src/app-store";

describe("addons/valuationPrint/utils/translator.getWalkerMap.js", () => {
    const feature = new Feature({
        geometry: new MultiPolygon([[
            [
                [
                    562877.0009836305,
                    5940982.299269523
                ],
                [
                    562839.9593369664,
                    5941178.090830462
                ],
                [
                    562765.8760436381,
                    5941141.049183797
                ],
                [
                    562797.626026493,
                    5940982.299269523
                ],
                [
                    562877.0009836305,
                    5940982.299269523
                ]
            ]
        ]])
    });

    beforeEach(() => {
        store.getters = {
            "Maps/projection": {
                getCode: () => "EPSG:25832"
            }
        };
    });
    afterEach(sinon.restore);

    describe("getWalkerMap", () => {
        it("should return the map configuration with configured and default value", () => {
            const config = {
                "coordinates": feature,
                "center": [
                    561968.7521088345,
                    5939653.913689158
                ],
                "projection": "EPSG:1234",
                "style": {
                    "borderSize": 4,
                    "color": [
                        228,
                        26,
                        28,
                        1
                    ]
                },
                "scale": 20000,
                "layerIds": [
                    "2426"
                ]
            };

            expect(getWalkerMap(config.coordinates, config.center, config.projection, config.style, config.scale, config.layerIds, undefined).dpi).to.equal(200);
            expect(getWalkerMap(config.coordinates, config.center, config.projection, config.style, config.scale, config.layerIds, undefined).scale).to.equal(20000);
            expect(getWalkerMap(config.coordinates, config.center, config.projection, config.style, config.scale, config.layerIds, undefined).center).to.deep.equal([561968.7521088345, 5939653.913689158]);
            expect(getWalkerMap(config.coordinates, config.center, config.projection, config.style, config.scale, config.layerIds, undefined).projection).to.equal("EPSG:1234");
        });

        it("should return the map configuration with configured value", () => {
            const config = {
                "coordinates": feature,
                "center": [
                    561968.7521088345,
                    5939653.913689158
                ],
                "projection": "EPSG:1234",
                "dpi": 72,
                "style": {
                    "borderSize": 4,
                    "color": [
                        228,
                        26,
                        28,
                        1
                    ]
                },
                "scale": 20000,
                "layerIds": [
                    "2426"
                ]
            };

            expect(getWalkerMap(config.coordinates, config.center, config.projection, config.style, config.scale, config.layerIds, config.dpi).dpi).to.equal(72);
            expect(getWalkerMap(config.coordinates, config.center, config.projection, config.style, config.scale, config.layerIds, config.dpi).scale).to.equal(20000);
            expect(getWalkerMap(config.coordinates, config.center, config.projection, config.style, config.scale, config.layerIds, config.dpi).center).to.deep.equal([561968.7521088345, 5939653.913689158]);
            expect(getWalkerMap(config.coordinates, config.center, config.projection, config.style, config.scale, config.layerIds, config.dpi).projection).to.equal("EPSG:1234");
        });
    });
});
