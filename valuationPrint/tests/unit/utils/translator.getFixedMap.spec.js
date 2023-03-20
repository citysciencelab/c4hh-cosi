import {expect} from "chai";
import sinon from "sinon";
import store from "../../../../../src/app-store";
import {
    getFixedMap
} from "../../../utils/translator.getFixedMap";

describe("addons/valuationPrint/utils/translator.getFixedMap.js", () => {

    beforeEach(() => {
        store.getters = {
            "Maps/projection": {
                getCode: () => "EPSG:25832"
            }
        };
    });
    afterEach(sinon.restore);

    describe("getFixedMap", () => {
        it("should return the map configuration with configured and default value", () => {
            const config = {
                    "coordinates": [
                        561968.7521088345,
                        5939653.913689158
                    ],
                    "projection": "EPSG:1234",
                    "style": {
                        "pointSize": 4,
                        "color": [
                            228,
                            26,
                            28,
                            1
                        ]
                    },
                    "bbox": [
                        545114.8,
                        5914269.8,
                        591483.1,
                        5957132.8
                    ],
                    "layerIds": [
                        "2426"
                    ]
                },
                result = getFixedMap(config.coordinates, config.projection, config.style, config.bbox, config.layerIds, undefined);

            expect(result).to.be.an("object").that.is.not.empty;
            expect(result.dpi).to.equal(200);
            expect(result.bbox).to.deep.equal([545114.8, 5914269.8, 591483.1, 5957132.8]);
            expect(result.projection).to.equal("EPSG:1234");
        });

        it("should return the map configuration with configured value", () => {
            const config = {
                    "coordinates": [
                        561968.7521088345,
                        5939653.913689158
                    ],
                    "dpi": 72,
                    "projection": "EPSG:1234",
                    "style": {
                        "pointSize": 4,
                        "color": [
                            228,
                            26,
                            28,
                            1
                        ]
                    },
                    "bbox": [
                        545114.8,
                        5914269.8,
                        591483.1,
                        5957132.8
                    ],
                    "layerIds": [
                        "2426"
                    ]
                },
                result = getFixedMap(config.coordinates, config.projection, config.style, config.bbox, config.layerIds, config.dpi);

            expect(result).to.be.an("object").that.is.not.empty;
            expect(result.dpi).to.equal(72);
            expect(result.bbox).to.deep.equal([545114.8, 5914269.8, 591483.1, 5957132.8]);
            expect(result.projection).to.equal("EPSG:1234");
        });
    });
});
