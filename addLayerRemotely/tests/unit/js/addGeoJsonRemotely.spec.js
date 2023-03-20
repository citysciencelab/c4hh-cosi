import {expect} from "chai";
import {getFeatureIds, returnGeoJSONLayerObject} from "../../../js/addGeoJsonRemotely";
import sinon from "sinon";

const geojson = {
    "type": "FeatureCollection",
    "features":
    [
        {
            "type": "Feature",
            "geometry":
                {
                    "type": "Point",
                    "coordinates": [10.023374939929553, 53.5356067536243]
                },
            "properties": {"epsg": "WGS84"}
        }
    ],
    "styles": [
        {
            "styleId": "customStyle",
            "rules": [
                {
                    "style": {
                        "circleStrokeColor": [255, 0, 0, 1],
                        "circleFillColor": [255, 0, 0, 0.5]
                    }
                }
            ]
        }
    ]
};

describe("ADDON: addGeoJsonRemotely - returnGeoJSONLayerObject", function () {
    it("returnGeoJSONLayerObject should return an object", function () {
        expect(returnGeoJSONLayerObject("name", "id", geojson, "styleId", "parentId", "showAll", 20)).to.be.a("object");
    });
    it("returnGeoJSONLayerObject should return an object including the right properties", function () {
        expect(returnGeoJSONLayerObject("name", "id", geojson, "styleId", "parentId", "showAll", 20)).to.have.own.property("styleId");
        expect(returnGeoJSONLayerObject("name", "id", geojson, "styleId", "parentId", "showAll", 20)).to.have.own.property("clusterDistance");
        expect(returnGeoJSONLayerObject("name", "id", geojson, "styleId", "parentId", "showAll", 20)).to.have.own.property("parentId");
    });
    it("returnGeoJSONLayerObject should return an object not including clusterDistance", function () {
        expect(returnGeoJSONLayerObject("name", "id", geojson, "styleId", "parentId", "showAll")).to.not.have.own.property("clusterDistance");
    });
});

describe("ADDON: addGeoJsonRemotely - getFeatureIds", function () {
    const correctId = "42",
        fakeLayer = {
            get: () => correctId,
            getSource: () => {
                return {
                    getFeatures: () => [{id: "66", getId}, {id: "89", getId}]
                };
            }
        },
        fakeFunction = sinon.fake.returns({
            getArray: () => [fakeLayer]
        });

    afterEach(function () {
        sinon.restore();
        sinon.resetHistory();
    });

    /**
     * @returns {string} The id of the feature;
     */
    function getId () {
        return this.id;
    }

    beforeEach(function () {
        sinon.stub(Radio, "request").callsFake(fakeFunction);
    });
    it("addGeoJsonRemotely should return an array of feature Ids if the layer was found", function () {
        expect(getFeatureIds(correctId)).to.eql(["66", "89"]);
    });

    it("addGeoJsonRemotely should log an error on the console if no layer was found with the specified layerId and return an empty array", function () {
        const wrongId = "402";

        expect(getFeatureIds(wrongId)).to.eql([]);
    });
});
