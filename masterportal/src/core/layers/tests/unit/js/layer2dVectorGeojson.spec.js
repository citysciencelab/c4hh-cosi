import Cluster from "ol/source/Cluster.js";
import {expect} from "chai";
import Feature from "ol/Feature.js";
import {GeoJSON} from "ol/format.js";
import Point from "ol/geom/Point.js";
import Polygon from "ol/geom/Polygon.js";
import sinon from "sinon";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import styleList from "@masterportal/masterportalapi/src/vectorStyle/styleList.js";
import createStyle from "@masterportal/masterportalapi/src/vectorStyle/createStyle.js";
import getGeometryTypeFromService from "@masterportal/masterportalapi/src/vectorStyle/lib/getGeometryTypeFromService.js";
import Layer2dVectorGeojson from "@core/layers/js/layer2dVectorGeojson.js";
import Layer2dVector from "@core/layers/js/layer2dVector.js";
import webgl from "@core/layers/js/webglRenderer.js";

describe("src/core/js/layers/layer2dVectorGeojson.js", () => {
    let attributes,
        warn;

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

        mapCollection.addMap(map, "2D");
    });

    beforeEach(() => {
        // Set prototype of Layer2dVectorGeojson to Layer2dVector to avoid errors in tests
        Object.setPrototypeOf(Layer2dVectorGeojson.prototype, Layer2dVector.prototype);
        attributes = {
            id: "id",
            name: "geojsonTestLayer",
            typ: "Geojson"
        };
    });


    describe("createLayer", () => {
        it("new Layer2dVectorGeojson should create an layer with no warning", () => {
            const styleObj = {
                styleId: "styleId",
                rules: []
            };
            let geojsonLayer = null;

            sinon.stub(styleList, "returnStyleObject").returns(styleObj);
            geojsonLayer = new Layer2dVectorGeojson({});

            expect(geojsonLayer).not.to.be.undefined;
            expect(warn.notCalled).to.be.true;
        });

        it("createLayer shall create an ol.VectorLayer with source and style and GeoJSON-format", function () {
            const geojsonLayer = new Layer2dVectorGeojson(attributes),
                layer = geojsonLayer.getLayer();

            expect(layer).to.be.an.instanceof(VectorLayer);
            expect(layer.getSource()).to.be.an.instanceof(VectorSource);
            expect(layer.getSource().getFormat()).to.be.an.instanceof(GeoJSON);
            expect(layer.get("id")).to.be.equals(attributes.id);
            expect(layer.get("name")).to.be.equals(attributes.name);
            expect(layer.get("gfiTheme")).to.be.equals(attributes.gfiTheme);
        });

        it("createLayer shall create an ol.VectorLayer with cluster-source", function () {
            const styleObj = {
                styleId: "styleId",
                rules: []
            };
            let geojsonLayer = null,
                layer = null;

            sinon.stub(styleList, "returnStyleObject").returns(styleObj);
            attributes.clusterDistance = 60;
            geojsonLayer = new Layer2dVectorGeojson(attributes);
            layer = geojsonLayer.getLayer();

            expect(layer).to.be.an.instanceof(VectorLayer);
            expect(layer.getSource()).to.be.an.instanceof(Cluster);
            expect(layer.getSource().getDistance()).to.be.equals(attributes.clusterDistance);
            expect(layer.getSource().getSource().getFormat()).to.be.an.instanceof(GeoJSON);
            expect(typeof layer.getStyleFunction()).to.be.equals("function");
        });
    });

    describe("getRawLayerAttributes", () => {
        let localAttributes;

        beforeEach(() => {
            localAttributes = {
                clusterDistance: 10,
                geojson: ["feat", "ures"],
                id: "1234",
                url: "exmpale.url"
            };
        });

        it("should return the raw layer attributes", () => {
            const geojsonLayer = new Layer2dVectorGeojson(localAttributes);

            expect(geojsonLayer.getRawLayerAttributes(localAttributes)).to.deep.equals({
                clusterDistance: 10,
                features: ["feat", "ures"],
                id: "1234",
                url: "exmpale.url"
            });
        });
    });

    describe("getOptions", () => {
        let options;

        beforeEach(() => {
            options = [
                "afterLoading",
                "clusterGeometryFunction",
                "featuresFilter",
                "map",
                "onLoadingError",
                "layerStyle"
            ];
        });

        it("should return the options that includes the correct keys", () => {
            const geojsonLayer = new Layer2dVectorGeojson(attributes);

            expect(Object.keys(geojsonLayer.getOptions(attributes))).to.deep.equals(options);
        });
    });

    describe("getStyleFunction", () => {
        it("createStyle and getStyleFunction shall return a function", function () {
            const styleObj = {
                styleId: "styleId",
                rules: []
            };
            let geojsonLayer = null,
                styleFunction = null;

            sinon.stub(styleList, "returnStyleObject").returns(styleObj);
            attributes.styleId = "styleId";
            geojsonLayer = new Layer2dVectorGeojson(attributes);
            geojsonLayer.createStyle(attributes);
            styleFunction = geojsonLayer.getStyleFunction();

            expect(styleFunction).not.to.be.null;
            expect(typeof styleFunction).to.be.equals("function");
        });
    });

    describe("afterLoading", () => {
        it("should set id to features, if id === undefined", () => {
            const geojsonLayer = new Layer2dVectorGeojson(attributes),
                features = [
                    new Feature(),
                    new Feature()
                ];

            geojsonLayer.afterLoading(attributes, features);

            expect(features[0].getId()).to.equals("geojson-id-feature-id-0");
            expect(features[1].getId()).to.equals("geojson-id-feature-id-1");
        });
    });

    describe("applyFeaturesFilter", () => {
        const bboxGeometry = new Polygon([[[0, 0], [0, 20], [20, 20], [20, 0], [0, 0]]]);

        /**
         * Creates a feature inside the bboxGeometry above.
         * @returns {module:ol/Feature~Feature} the feature.
         */
        function insideFeature () {
            return new Feature({geometry: new Point([10, 10])});
        }

        /**
         * Creates a feature outside the bboxGeometry above.
         * @returns {module:ol/Feature~Feature} the feature.
         */
        function outsideFeature () {
            return new Feature({geometry: new Point([100, 100])});
        }

        it("should remove the features outside the bboxGeometry from the source", () => {
            const geojsonLayer = new Layer2dVectorGeojson({...attributes, bboxGeometry}),
                features = [insideFeature(), outsideFeature()],
                source = geojsonLayer.getLayer().getSource();

            source.addFeatures(features);
            geojsonLayer.applyFeaturesFilter({...attributes, bboxGeometry}, features);

            expect(source.getFeatures()).to.deep.equals([features[0]]);
        });

        it("should keep all features if no bboxGeometry is set", () => {
            const geojsonLayer = new Layer2dVectorGeojson(attributes),
                features = [insideFeature(), outsideFeature()],
                source = geojsonLayer.getLayer().getSource();

            source.addFeatures(features);
            geojsonLayer.applyFeaturesFilter(attributes, features);

            expect(source.getFeatures()).to.deep.equals(features);
        });

        it("should remove the features from the underlying source of a cluster source", () => {
            const geojsonLayer = new Layer2dVectorGeojson({...attributes, bboxGeometry, clusterDistance: 10}),
                features = [insideFeature(), outsideFeature()],
                source = geojsonLayer.getLayer().getSource().getSource();

            source.addFeatures(features);
            geojsonLayer.applyFeaturesFilter({...attributes, bboxGeometry, clusterDistance: 10}, features);

            expect(source.getFeatures()).to.deep.equals([features[0]]);
        });
    });

    describe("startAutoRefresh", () => {
        it("should register featuresloadend, refresh layer source and notify observers", () => {
            const geojsonLayer = new Layer2dVectorGeojson(attributes),
                layerSource = {
                    once: sinon.stub(),
                    refresh: sinon.spy()
                },
                features = [
                    new Feature()
                ],
                observerSpy = sinon.spy(),
                clock = sinon.useFakeTimers();

            geojsonLayer.setLayerSource(layerSource);
            geojsonLayer.layer = {
                getSource: () => {
                    return {
                        getFeatures: () => features
                    };
                }
            };
            sinon.stub(geojsonLayer, "afterLoading");
            geojsonLayer.setObserverAutoInterval(observerSpy);

            geojsonLayer.startAutoRefresh(10);
            clock.tick(10);
            layerSource.once.firstCall.args[1]();

            expect(layerSource.once.calledOnceWithExactly("featuresloadend", sinon.match.func)).to.be.true;
            expect(layerSource.refresh.calledOnce).to.be.true;
            expect(geojsonLayer.afterLoading.calledOnceWithExactly(geojsonLayer.attributes, features)).to.be.true;
            expect(observerSpy.calledOnce).to.be.true;

            geojsonLayer.stopAutoRefresh();
            clock.restore();
        });

        it("should use wrapped vector source when layer source is a cluster", () => {
            const geojsonLayer = new Layer2dVectorGeojson(attributes),
                wrappedSource = {
                    once: sinon.stub(),
                    refresh: sinon.spy()
                },
                clusterSource = new Cluster({
                    source: new VectorSource(),
                    distance: 10
                }),
                observerSpy = sinon.spy(),
                clock = sinon.useFakeTimers();

            sinon.stub(clusterSource, "getSource").returns(wrappedSource);
            geojsonLayer.setLayerSource(clusterSource);
            geojsonLayer.layer = {
                getSource: () => {
                    return {
                        getFeatures: () => []
                    };
                }
            };
            sinon.stub(geojsonLayer, "afterLoading");
            geojsonLayer.setObserverAutoInterval(observerSpy);

            geojsonLayer.startAutoRefresh(10);
            clock.tick(10);
            wrappedSource.once.firstCall.args[1]();

            expect(wrappedSource.once.calledOnceWithExactly("featuresloadend", sinon.match.func)).to.be.true;
            expect(wrappedSource.refresh.calledOnce).to.be.true;
            expect(geojsonLayer.afterLoading.calledOnce).to.be.true;
            expect(observerSpy.calledOnce).to.be.true;

            geojsonLayer.stopAutoRefresh();
            clock.restore();
        });
    });

    describe("Use WebGL renderer", () => {
        it("Should create the layer with WebGL methods, if renderer: \"webgl\" is set", function () {
            const vectorLayer = new Layer2dVectorGeojson({...attributes, renderer: "webgl"}),
                layer = vectorLayer.getLayer();

            expect(vectorLayer.isDisposed).to.equal(webgl.isDisposed);
            expect(vectorLayer.setIsSelected).to.equal(webgl.setIsSelected);
            expect(vectorLayer.hideAllFeatures).to.equal(webgl.hideAllFeatures);
            expect(vectorLayer.showAllFeatures).to.equal(webgl.showAllFeatures);
            expect(vectorLayer.showFeaturesByIds).to.equal(webgl.showFeaturesByIds);
            expect(vectorLayer.setStyle).to.equal(webgl.setStyle);
            expect(vectorLayer.source).to.equal(layer.getSource());
            expect(layer.get("isPointLayer")).to.not.be.undefined;
        });
    });

    describe("createLegend", () => {
        beforeEach(() => {
            const styleObj = {
                styleId: "styleId",
                rules: []
            };

            attributes = {
                id: "id",
                version: "1.3.0"
            };
            sinon.stub(styleList, "returnStyleObject").returns(styleObj);
        });

        it("createLegend with legendURL", async () => {
            attributes.legendURL = "legendUrl1";
            const layerWrapper = new Layer2dVectorGeojson(attributes);

            expect(await layerWrapper.createLegend()).to.be.deep.equals([attributes.legendURL]);
        });

        it("createLegend with legendURL as array", async () => {
            attributes.legendURL = ["legendUrl1"];
            const layerWrapper = new Layer2dVectorGeojson(attributes);

            expect(await layerWrapper.createLegend()).to.be.deep.equals(attributes.legendURL);
        });

        it("createLegend with styleObject and legend true", async () => {
            attributes.legend = true;
            const layerWrapper = new Layer2dVectorGeojson(attributes),
                legendInformation = [
                    {label: "legend Information", img: "legend.png"}
                ];

            sinon.stub(createStyle, "returnLegendByStyleId").returns({legendInformation});
            sinon.stub(getGeometryTypeFromService, "getGeometryTypeFromWFS");

            expect(await layerWrapper.createLegend()).to.deep.equals(legendInformation);
        });

        it("createLegend should sort legend entries by style legendValue order", async () => {
            const styleObj = {
                styleId: "styleId",
                rules: [
                    {style: {legendValue: "Second"}},
                    {style: {legendValue: "First"}},
                    {style: {legendValue: "Third"}}
                ]
            };
            const legendInformation = [
                {label: "Third", img: "third.png"},
                {label: "First", img: "first.png"},
                {label: "Second", img: "second.png"}
            ];

            attributes.legend = true;
            styleList.returnStyleObject.returns(styleObj);
            sinon.stub(createStyle, "returnLegendByStyleId").resolves({legendInformation});
            sinon.stub(getGeometryTypeFromService, "getGeometryTypeFromWFS");

            const layerWrapper = new Layer2dVectorGeojson(attributes);

            expect(await layerWrapper.createLegend()).to.deep.equals([
                {label: "Second", img: "second.png"},
                {label: "First", img: "first.png"},
                {label: "Third", img: "third.png"}
            ]);
        });

        it("createLegend should keep unknown entries in their original positions", async () => {
            const styleObj = {
                styleId: "styleId",
                rules: [
                    {style: {legendValue: "Known"}}
                ]
            };
            const legendInformation = [
                {label: "Unknown A", img: "a.png"},
                {label: "Known", img: "known.png"},
                {label: "Unknown B", img: "b.png"}
            ];

            attributes.legend = true;
            styleList.returnStyleObject.returns(styleObj);
            sinon.stub(createStyle, "returnLegendByStyleId").resolves({legendInformation});
            sinon.stub(getGeometryTypeFromService, "getGeometryTypeFromWFS");

            const layerWrapper = new Layer2dVectorGeojson(attributes);

            expect(await layerWrapper.createLegend()).to.deep.equals([
                {label: "Unknown A", img: "a.png"},
                {label: "Known", img: "known.png"},
                {label: "Unknown B", img: "b.png"}
            ]);
        });

        it("createLegend should match fallback labels with normalized whitespace", async () => {
            const styleObj = {
                styleId: "styleId",
                rules: [
                    {
                        conditions: {
                            properties: {
                                schultyp: "Grundschule",
                                schuljahr: "2024/25"
                            }
                        }
                    },
                    {
                        conditions: {
                            properties: {
                                schultyp: "Integrierte Sekundarschule"
                            }
                        }
                    }
                ]
            };
            const legendInformation = [
                {label: "Integrierte Sekundarschule", img: "iss.png"},
                {label: "Grundschule, 2024/25", img: "grundschule.png"}
            ];

            attributes.legend = true;
            styleList.returnStyleObject.returns(styleObj);
            sinon.stub(createStyle, "returnLegendByStyleId").resolves({legendInformation});
            sinon.stub(getGeometryTypeFromService, "getGeometryTypeFromWFS");

            const layerWrapper = new Layer2dVectorGeojson(attributes);

            expect(await layerWrapper.createLegend()).to.deep.equals([
                {label: "Grundschule, 2024/25", img: "grundschule.png"},
                {label: "Integrierte Sekundarschule", img: "iss.png"}
            ]);
        });
    });
});
