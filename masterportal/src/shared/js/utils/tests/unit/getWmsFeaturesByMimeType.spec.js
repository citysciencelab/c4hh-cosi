import {expect} from "chai";
import sinon from "sinon";
import axios from "axios";
import {
    createGfiFeature,
    openFeaturesInNewWindow,
    getXmlFeatures,
    handleXmlResponse,
    getHtmlFeature,
    handleHTMLResponse,
    getJSONFeatures,
    handleJSONResponse,
    mergeFeatures,
    getWmsFeaturesByMimeType
} from "@shared/js/utils/getWmsFeaturesByMimeType.js";

describe("src/shared/js/utils/getWmsFeaturesByMimeType.js", () => {
    const url = "url";
    let layer = null,
        aFeature = null;

    beforeAll(() => {
        mapCollection.clear();
        const map = {
            id: "ol",
            mode: "2D",
            getView: () => {
                return {
                    getProjection: () => ({
                        getCode: () => "EPSG:25832"
                    })
                };
            }
        };

        mapCollection.addMap(map, "2D");
    });


    beforeEach(() => {
        layer = {
            get: (key) => {
                if (key === "name") {
                    return "layerName";
                }
                else if (key === "gfiTheme") {
                    return "gfiTheme";
                }
                else if (key === "gfiAttributes") {
                    return "attributesToShow";
                }
                else if (key === "infoFormat") {
                    return "text/xml";
                }
                return null;
            }
        };
        aFeature = {
            getProperties: () => "featureProperties",
            getId: () => "id"
        };
        sinon.stub(console, "warn").callsFake(sinon.spy());
    });


    describe("createGfiFeature", () => {
        it("should return an object with specific functions to get the given params", () => {
            const feature = createGfiFeature(layer, url, aFeature, null, "documentMock", "foo");

            expect(feature).to.be.an("object");

            expect(feature.getGfiUrl).to.be.a("function");
            expect(feature.getTitle).to.be.a("function");
            expect(feature.getTheme).to.be.a("function");
            expect(feature.getAttributesToShow).to.be.a("function");
            expect(feature.getProperties).to.be.a("function");
            expect(feature.getId).to.be.a("function");

            expect(feature.getGfiUrl()).to.equal("url");
            expect(feature.getTitle()).to.equal("layerName");
            expect(feature.getTheme()).to.equal("gfiTheme");
            expect(feature.getAttributesToShow()).to.equal("attributesToShow");
            expect(feature.getProperties()).to.equal("featureProperties");
            expect(feature.getId()).to.equal("id");
            expect(feature.getDocument()).to.equal("documentMock");
            expect(feature.getBBox()).to.equal("foo");
        });

        it("should use attribute value as title when gfiTitleAttribute is configured and attribute exists", () => {
            const layerWithTitleAttr = {
                    get: (key) => {
                        if (key === "name") {
                            return "layerName";
                        }
                        else if (key === "gfiTitleAttribute") {
                            return "stationName";
                        }
                        return null;
                    }
                },
                featureWithAttr = {
                    getProperties: () => ({
                        stationName: "Hauptbahnhof",
                        line: "U1"
                    }),
                    getId: () => "station-1"
                },
                feature = createGfiFeature(layerWithTitleAttr, url, featureWithAttr);

            expect(feature.getTitle()).to.equal("Hauptbahnhof");
        });

        it("should fall back to layer name when gfiTitleAttribute is configured but attribute is missing", () => {
            const layerWithTitleAttr = {
                    get: (key) => {
                        if (key === "name") {
                            return "ÖPNV-Haltestellen";
                        }
                        else if (key === "gfiTitleAttribute") {
                            return "stationName";
                        }
                        return null;
                    }
                },
                featureWithoutAttr = {
                    getProperties: () => ({
                        line: "U1"
                    }),
                    getId: () => "station-1"
                },
                feature = createGfiFeature(layerWithTitleAttr, url, featureWithoutAttr);

            expect(feature.getTitle()).to.equal("ÖPNV-Haltestellen");
        });

        it("should fall back to layer name when gfiTitleAttribute is configured but attribute is empty string", () => {
            const layerWithTitleAttr = {
                    get: (key) => {
                        if (key === "name") {
                            return "ÖPNV-Haltestellen";
                        }
                        else if (key === "gfiTitleAttribute") {
                            return "stationName";
                        }
                        return null;
                    }
                },
                featureWithEmptyAttr = {
                    getProperties: () => ({
                        stationName: "",
                        line: "U1"
                    }),
                    getId: () => "station-1"
                },
                feature = createGfiFeature(layerWithTitleAttr, url, featureWithEmptyAttr);

            expect(feature.getTitle()).to.equal("ÖPNV-Haltestellen");
        });

        it("should fall back to layer name when gfiTitleAttribute is configured but attribute is null", () => {
            const layerWithTitleAttr = {
                    get: (key) => {
                        if (key === "name") {
                            return "ÖPNV-Haltestellen";
                        }
                        else if (key === "gfiTitleAttribute") {
                            return "stationName";
                        }
                        return null;
                    }
                },
                featureWithNullAttr = {
                    getProperties: () => ({
                        stationName: null,
                        line: "U1"
                    }),
                    getId: () => "station-1"
                },
                feature = createGfiFeature(layerWithTitleAttr, url, featureWithNullAttr);

            expect(feature.getTitle()).to.equal("ÖPNV-Haltestellen");
        });

        it("should fall back to layer name when gfiTitleAttribute is configured but attribute is undefined", () => {
            const layerWithTitleAttr = {
                    get: (key) => {
                        if (key === "name") {
                            return "ÖPNV-Haltestellen";
                        }
                        else if (key === "gfiTitleAttribute") {
                            return "stationName";
                        }
                        return null;
                    }
                },
                featureWithUndefinedAttr = {
                    getProperties: () => ({
                        stationName: undefined,
                        line: "U1"
                    }),
                    getId: () => "station-1"
                },
                feature = createGfiFeature(layerWithTitleAttr, url, featureWithUndefinedAttr);

            expect(feature.getTitle()).to.equal("ÖPNV-Haltestellen");
        });

        it("should use layer name when gfiTitleAttribute is not configured", () => {
            const feature = createGfiFeature(layer, url, aFeature);

            expect(feature.getTitle()).to.equal("layerName");
        });

        it("should handle numeric attribute values as title", () => {
            const layerWithTitleAttr = {
                    get: (key) => {
                        if (key === "name") {
                            return "Building Layer";
                        }
                        else if (key === "gfiTitleAttribute") {
                            return "buildingNumber";
                        }
                        return null;
                    }
                },
                featureWithNumericAttr = {
                    getProperties: () => ({
                        buildingNumber: 42,
                        address: "Main Street"
                    }),
                    getId: () => "building-1"
                },
                feature = createGfiFeature(layerWithTitleAttr, url, featureWithNumericAttr);

            expect(feature.getTitle()).to.equal(42);
        });

        it("should not treat zero as empty value when used as title attribute", () => {
            const layerWithTitleAttr = {
                    get: (key) => {
                        if (key === "name") {
                            return "Counter Layer";
                        }
                        else if (key === "gfiTitleAttribute") {
                            return "count";
                        }
                        return null;
                    }
                },
                featureWithZero = {
                    getProperties: () => ({
                        count: 0,
                        type: "sensor"
                    }),
                    getId: () => "sensor-1"
                },
                feature = createGfiFeature(layerWithTitleAttr, url, featureWithZero);

            expect(feature.getTitle()).to.equal("Counter Layer");
        });
    });

    describe("openFeaturesInNewWindow", () => {
        it("should return false if any funny params are given", () => {
            let result = false;

            result = openFeaturesInNewWindow();
            expect(result).to.be.false;

            result = openFeaturesInNewWindow(1234);
            expect(result).to.be.false;

            result = openFeaturesInNewWindow("url", 1234);
            expect(result).to.be.false;

            result = openFeaturesInNewWindow("url", "gfiAsNewWindow");
            expect(result).to.be.false;

            result = openFeaturesInNewWindow("url", {}, 1234);
            expect(result).to.be.false;
        });
        it("should call the openWindow function if gfiAsNewWindow is an object", () => {
            let lastUrl = "";
            const result = openFeaturesInNewWindow("url", {}, (anUrl) => {
                lastUrl = anUrl;
            });

            expect(result).to.be.true;
            expect(lastUrl).to.equal("url");
        });
        it("should not call the openWindow function if gfiAsNewWindow is null", () => {
            let lastUrl = "";
            const result = openFeaturesInNewWindow("url", null, (anUrl) => {
                lastUrl = anUrl;
            });

            expect(result).to.be.false;
            expect(lastUrl).to.be.empty;
        });
        it("should call the openWindow function if gfiAsNewWindow is null but the url starts with 'http:'", () => {
            let lastUrl = "";
            const result = openFeaturesInNewWindow("http:url", {}, (anUrl) => {
                lastUrl = anUrl;
            });

            expect(result).to.be.true;
            expect(lastUrl).to.equal("http:url");
        });
        it("should call the openWindow function with the params from gfiAsNewWindow", () => {
            let lastUrl = "",
                lastName = "",
                lastSpecs = "";
            const result = openFeaturesInNewWindow("url", {
                name: "name",
                specs: "specs"
            }, (anUrl, name, specs) => {
                lastUrl = anUrl;
                lastName = name;
                lastSpecs = specs;
            });

            expect(result).to.be.true;
            expect(lastUrl).to.equal("url");
            expect(lastName).to.equal("name");
            expect(lastSpecs).to.equal("specs");
        });

        it("should still open a popup if no shared window state is provided", () => {
            let openWindowCallCount = 0;

            const firstResult = openFeaturesInNewWindow("url-1", {name: "_blank"}, () => {
                    openWindowCallCount += 1;
                }),
                secondResult = openFeaturesInNewWindow("url-2", {name: "_blank"}, () => {
                    openWindowCallCount += 1;
                });

            expect(firstResult).to.be.true;
            expect(secondResult).to.be.true;
            expect(openWindowCallCount).to.equal(2);
        });
    });

    describe("getWmsFeaturesByMimeType", () => {
        let popupWindow,
            windowState,
            openWindowSpy,
            axiosGetStub;

        beforeEach(() => {
            popupWindow = {
                closed: false,
                document: document.implementation.createHTMLDocument("GetFeatureInfo")
            };
            windowState = {};
            openWindowSpy = sinon.spy(() => popupWindow);
            axiosGetStub = sinon.stub(axios, "get");
        });

        afterEach(() => {
            axiosGetStub.restore();
        });

        it("positive: combines features from multiple layers with data into the same popup window", async () => {
            const layerWithData = {
                    get: (key) => {
                        if (key === "infoFormat") {
                            return "application/json";
                        }
                        if (key === "name") {
                            return "Layer With Data";
                        }
                        if (key === "gfiAsNewWindow") {
                            return {name: "_blank", specs: ""};
                        }
                        return null;
                    }
                },
                layerWithoutData = {
                    get: (key) => {
                        if (key === "infoFormat") {
                            return "application/json";
                        }
                        if (key === "name") {
                            return "Layer Without Data";
                        }
                        if (key === "gfiAsNewWindow") {
                            return {name: "_blank", specs: ""};
                        }
                        return null;
                    }
                };

            axiosGetStub.onCall(0).resolves({status: 200, statusText: "OK", data: {features: [{id: "1", properties: {name: "foo"}}]}});
            axiosGetStub.onCall(1).resolves({status: 200, statusText: "OK", data: {features: []}});

            const firstResult = await getWmsFeaturesByMimeType(layerWithData, "https://example.com/gfi-1", windowState, undefined, openWindowSpy),
                secondResult = await getWmsFeaturesByMimeType(layerWithoutData, "https://example.com/gfi-2", windowState, undefined, openWindowSpy);

            expect(firstResult).to.be.an("array").that.is.empty;
            expect(secondResult).to.be.an("array").that.is.empty;
            expect(openWindowSpy.calledOnce).to.be.true;
            expect(windowState.popupCount).to.equal(1);
            expect(popupWindow.document.querySelectorAll(".gfi-entry").length).to.equal(1);
            expect(popupWindow.document.querySelector(".gfi-popup-title").textContent).to.equal("Layer With Data");
        });

        it("negative: does not open or append to the popup when no layer has features", async () => {
            const layerWithoutData = {
                get: (key) => {
                    if (key === "infoFormat") {
                        return "application/json";
                    }
                    if (key === "gfiAsNewWindow") {
                        return {name: "_blank", specs: ""};
                    }
                    return null;
                }
            };

            axiosGetStub.resolves({status: 200, statusText: "OK", data: {features: []}});

            const result = await getWmsFeaturesByMimeType(layerWithoutData, "https://example.com/gfi-1", windowState, undefined, openWindowSpy);

            expect(result).to.be.an("array").that.is.empty;
            expect(openWindowSpy.calledOnce).to.be.true;
            expect(windowState.popupCount).to.equal(0);
            expect(popupWindow.document.querySelectorAll(".gfi-entry").length).to.equal(0);
            expect(popupWindow.document.querySelector(".gfi-empty-state").textContent).to.equal("No feature information available.");
        });

        it("positive: navigates between multiple results with the pager arrows", async () => {
            const firstLayer = {
                    get: (key) => {
                        if (key === "infoFormat") {
                            return "application/json";
                        }
                        if (key === "name") {
                            return "First Layer";
                        }
                        if (key === "gfiAsNewWindow") {
                            return {name: "_blank", specs: ""};
                        }
                        return null;
                    }
                },
                secondLayer = {
                    get: (key) => {
                        if (key === "infoFormat") {
                            return "application/json";
                        }
                        if (key === "name") {
                            return "Second Layer";
                        }
                        if (key === "gfiAsNewWindow") {
                            return {name: "_blank", specs: ""};
                        }
                        return null;
                    }
                };

            axiosGetStub.onCall(0).resolves({status: 200, statusText: "OK", data: {features: [{id: "1", properties: {name: "foo"}}]}});
            axiosGetStub.onCall(1).resolves({status: 200, statusText: "OK", data: {features: [{id: "2", properties: {name: "bar"}}]}});

            await getWmsFeaturesByMimeType(firstLayer, "https://example.com/gfi-1", windowState, undefined, openWindowSpy);
            await getWmsFeaturesByMimeType(secondLayer, "https://example.com/gfi-2", windowState, undefined, openWindowSpy);

            const doc = popupWindow.document,
                title = doc.querySelector(".gfi-popup-title"),
                leftButton = doc.querySelector(".gfi-pager-left"),
                rightButton = doc.querySelector(".gfi-pager-right");

            expect(title.textContent).to.equal("First Layer");
            expect(leftButton.disabled).to.be.true;
            expect(rightButton.disabled).to.be.false;

            rightButton.click();

            expect(title.textContent).to.equal("Second Layer");
            expect(leftButton.disabled).to.be.false;
            expect(rightButton.disabled).to.be.true;

            leftButton.click();

            expect(title.textContent).to.equal("First Layer");
        });
    });

    describe("getXmlFeatures", () => {
        it("should call requestGfi and return an empty array, because url is no String", async () => {
            const result = await getXmlFeatures(layer, {url});

            expect(result).to.be.an("array").to.have.lengthOf(0);
        });
    });
    describe("handleXmlResponse", () => {
        it("should return a wms feature with the received properties", async () => {
            const result = await handleXmlResponse([aFeature], layer, url);

            expect(result).to.be.an("array").to.have.lengthOf(1);
            expect(result[0]).to.be.an("object");

            expect(result[0].getGfiUrl).to.be.a("function");
            expect(result[0].getTitle).to.be.a("function");
            expect(result[0].getTheme).to.be.a("function");
            expect(result[0].getAttributesToShow).to.be.a("function");
            expect(result[0].getProperties).to.be.a("function");

            expect(result[0].getGfiUrl()).to.equal("url");
            expect(result[0].getTitle()).to.equal("layerName");
            expect(result[0].getTheme()).to.equal("gfiTheme");
            expect(result[0].getAttributesToShow()).to.equal("attributesToShow");
            expect(result[0].getProperties()).to.equal("featureProperties");
        });
        it("should return an empty array if called with undefined", async () => {
            let result = await handleXmlResponse([undefined], layer, url);

            expect(result).to.be.an("array").to.have.lengthOf(0);
            result = await handleXmlResponse([aFeature], undefined, url);
            expect(result).to.be.an("array").to.have.lengthOf(1);
            expect(result[0]).to.be.an("object");
            expect(result[0].getProperties).to.be.undefined;
        });
    });
    describe("getHtmlFeature", () => {
        it("should call requestGfi and return an empty array, because url is no String", async () => {
            const result = await getHtmlFeature(layer, {url});

            expect(result).to.be.an("array").to.have.lengthOf(0);
        });

    });
    describe("handleHTMLResponse", () => {
        it("handles response with mimeType text/html, empty body and the given url", async () => {
            const documentMock = null,
                result = handleHTMLResponse(documentMock, layer, url);

            expect(result.length).to.equal(0);
        });
        it("handles response with mimeType text/html, filled body and the given url", async () => {
            const documentMock = {
                    getElementsByTagName: () => [
                        {
                            children: ["child1", "child2"]
                        }
                    ]
                },
                result = handleHTMLResponse(documentMock, layer, url);

            expect(result).to.be.an("array").to.have.lengthOf(1);
            expect(result[0]).to.be.an("object");
            expect(result[0].getGfiUrl()).to.equal("url");
            expect(result[0].getTitle()).to.equal("layerName");
            expect(result[0].getTheme()).to.equal("gfiTheme");
            expect(result[0].getAttributesToShow()).to.equal("attributesToShow");
            expect(result[0].getProperties()).to.deep.equal({});
        });
    });
    describe("getJSONFeatures", () => {
        it("should call requestGfi and return an empty array, because url is no String", async () => {
            const result = await getJSONFeatures(layer, {url});

            expect(result).to.be.an("array").to.have.lengthOf(0);
        });

    });
    describe("handleJSONResponse", () => {
        it("handles response with mimeType application/json, empty body and the given url", async () => {
            const objectMock = null,
                result = handleJSONResponse(objectMock, layer, url);

            expect(result.length).to.equal(0);
        });
        it("handles response with mimeType application/json, filled body and the given url", async () => {
            const objectMock = {
                    features: [{
                        properties: {},
                        id: "1"
                    }]
                },
                result = handleJSONResponse(objectMock, layer, url);

            expect(result).to.be.an("array").to.have.lengthOf(1);
            expect(result[0]).to.be.an("object");
            expect(result[0].getGfiUrl()).to.equal("url");
            expect(result[0].getTitle()).to.equal("layerName");
            expect(result[0].getTheme()).to.equal("gfiTheme");
            expect(result[0].getAttributesToShow()).to.equal("attributesToShow");
            expect(result[0].getProperties()).to.deep.equal({});
        });
        it("handles response with mimeType application/json, filled body with geometry and the given url", async () => {
            const objectMock = {
                    features: [
                        {
                            geometry: {
                                coordinates: [
                                    [
                                        [
                                            [386470, 5819395],
                                            [386470, 5819390],
                                            [386559, 5819397],
                                            [386558, 5819403],
                                            [386470, 5819395]
                                        ]
                                    ]
                                ],
                                type: "MultiPolygon"
                            },
                            id: "1",
                            properties: {},
                            type: "Feature"
                        }
                    ]
                },
                result = handleJSONResponse(objectMock, layer, url);

            expect(result).to.be.an("array").to.have.lengthOf(1);
            expect(result[0]).to.be.an("object");
            expect(result[0].getOlFeature()).to.be.an("object");
            expect(result[0].getOlFeature().getGeometry).to.be.an("function");
        });
    });
    describe("mergeFeatures", () => {
        it("creates a merged feature if gfiTheme is DataTable", async () => {
            const objectMock = {
                    features: [
                        {
                            properties: {},
                            id: "1"
                        },
                        {
                            properties: {},
                            id: "1"
                        }
                    ]
                },
                localLayer = {
                    gfiTheme: "DataTable",
                    get: (key) => {
                        if (key === "name") {
                            return "layerName";
                        }
                        else if (key === "gfiTheme") {
                            return "DataTable";
                        }
                        else if (key === "gfiAttributes") {
                            return "attributesToShow";
                        }
                        else if (key === "infoFormat") {
                            return "text/xml";
                        }
                        return null;
                    }
                };

            let result = handleJSONResponse(objectMock, localLayer, url);

            result = mergeFeatures(result, layer, url);

            expect(result).to.be.an("array").to.have.lengthOf(1);
            expect(result[0]).to.be.an("object");
            expect(result[0].getGfiUrl()).to.equal("url");
            expect(result[0].getTitle()).to.equal("layerName");
            expect(result[0].getTheme()).to.equal("DataTable");
            expect(result[0].getAttributesToShow()).to.equal("attributesToShow");
            expect(result[0].getProperties()).to.deep.equal({});
        });
        it("creates a merged feature if gfiTheme is DataTable with bbox", async () => {
            const objectMock = {
                    features: [
                        {
                            properties: {},
                            id: "1"
                        }
                    ]
                },
                localLayer = {
                    gfiTheme: "DataTable",
                    get: (key) => {
                        if (key === "name") {
                            return "layerName";
                        }
                        else if (key === "gfiTheme") {
                            return "DataTable";
                        }
                        else if (key === "gfiAttributes") {
                            return "attributesToShow";
                        }
                        else if (key === "infoFormat") {
                            return "text/xml";
                        }
                        return null;
                    }
                },
                result = mergeFeatures(objectMock.features, localLayer, url, [1234, 1234]);

            expect(result).to.be.an("array").to.have.lengthOf(1);
            expect(result[0]).to.be.an("object");
            expect(result[0].getGfiUrl()).to.equal("url");
            expect(result[0].getTitle()).to.equal("layerName");
            expect(result[0].getTheme()).to.equal("DataTable");
            expect(result[0].getAttributesToShow()).to.equal("attributesToShow");
            expect(result[0].getProperties()).to.deep.equal({});
            expect(result[0].getBBox()).to.deep.equal([1234, 1234]);
        });
    });
});
