import {expect} from "chai";
import sinon from "sinon";
import Layer2dRasterGeoTiff from "@core/layers/js/layer2dRasterGeoTiff.js";
import styleList from "@masterportal/masterportalapi/src/vectorStyle/styleList.js";
import store from "@appstore/index.js";

describe("src/core/js/layers/layer2dRasterGeoTiff.js", () => {
    let attributes,
        warn,
        fetch,
        styleListStub,
        origGetters;

    beforeAll(() => {
        warn = sinon.spy();
        sinon.stub(console, "warn").callsFake(warn);
        mapCollection.clear();
        const map = {
            id: "ol",
            mode: "2D",
            getView: () => {
                return {
                    getProjection: () => {
                        return {
                            getCode: () => "EPSG:25832"
                        };
                    }
                };
            }
        };

        fetch = global.fetch;
        global.fetch = sinon.spy(() => new Promise(r => r));

        mapCollection.addMap(map, "2D");
        origGetters = store.getters;
    });

    afterAll(() => {
        global.fetch = fetch;
        styleListStub.restore();
    });

    beforeEach(() => {
        attributes = {
            id: "id",
            name: "GeoTiffTestLayer",
            typ: "GeoTiff",
            urls: ["test.url"]
        };
        const styleObj = {
            styleId: "geotiffStyle",
            rules: [{
                style: {
                    type: "raster",
                    color: [
                        "interpolate",
                        ["linear"]
                    ]
                }}
            ]
        };

        styleListStub = sinon.stub(styleList, "returnStyleObject").returns(styleObj);
    });

    afterEach(() => {
        store.getters = origGetters;
    });

    describe("createLayer", () => {
        it("new Layer2dRasterGeoTiff with attributes should create an layer", () => {
            const GeoTiffLayer = new Layer2dRasterGeoTiff(attributes);

            expect(GeoTiffLayer).not.to.be.undefined;
            expect(GeoTiffLayer.getLayer()).not.to.be.undefined;
        });
    });

    describe("getRawLayerAttributes", () => {
        let localAttributes;

        beforeEach(() => {
            localAttributes = {
                name: "layer_name",
                urls: ["test.url"],
                crs: "EPSG:25832",
                zIndex: 1,
                styleId: "geotiffStyle",
                style: []
            };
        });

        it("should return the raw layer attributes", () => {
            const GeoTiffLayer = new Layer2dRasterGeoTiff(localAttributes);

            expect(GeoTiffLayer.getRawLayerAttributes(localAttributes)).to.deep.equals({
                name: "layer_name",
                urls: ["test.url"],
                crs: "EPSG:25832",
                sources: undefined,
                olSourceOptions: undefined,
                zIndex: 1,
                styleId: "geotiffStyle",
                style: []
            });
        });
    });

    describe("style functions", () => {
        it("initStyle should be called on creation and call createStyle if styleListLoaded=true", function () {
            const createStyleSpy = sinon.spy(Layer2dRasterGeoTiff.prototype, "createStyle");

            store.getters = {
                styleListLoaded: true
            };
            attributes.styleId = "geotiffStyle";
            new Layer2dRasterGeoTiff(attributes);

            expect(createStyleSpy.calledOnce).to.be.true;
        });

        it("initStyle should be called on creation and not call createStyle if styleListLoaded=false", function () {
            const createStyleSpy = sinon.spy(Layer2dRasterGeoTiff.prototype, "createStyle");

            store.getters = {
                styleListLoaded: false
            };
            attributes.styleId = "geotiffStyle";
            new Layer2dRasterGeoTiff(attributes);

            expect(createStyleSpy.notCalled).to.be.true;
        });

        it("createStyle should return a style and the type property should be removed", function () {
            let layer2d = null,
                style = null;

            attributes.styleId = "geotiffStyle";
            layer2d = new Layer2dRasterGeoTiff(attributes);
            layer2d.createStyle(attributes);
            style = layer2d.get("style");

            expect(style).not.to.be.null;
            expect(style).to.not.have.property("type");
            expect(style).to.have.property("color");
        });

    });

});
