import {expect} from "chai";
import {BildungsatlasApi} from "../../../utils/bildungsatlasApi.js";
import Feature from "ol/Feature.js";

describe("addons/gfiThemes/bildungsatlas/utils/bildungsatlasApi.js", () => {
    describe("BildungsatlasApi.constructor", () => {
        it("should assign wfsUrls and featureTypes as parameters as they are", () => {
            const api = new BildungsatlasApi("configUrl", "wfsUrls", "featureTypes", "mockWfsCall", true);

            expect(api.wfsUrls).to.equal("wfsUrls");
            expect(api.featureTypes).to.equal("featureTypes");
        });
        it("should assign the given mockup", () => {
            const api = new BildungsatlasApi("configUrl", "wfsUrls", "featureTypes", "mockWfsCall", true);

            expect(api.mockWfsCall).to.equal("mockWfsCall");
        });
        it("should create an empty cache object as instance variable on construction", () => {
            const api = new BildungsatlasApi("configUrl", "wfsUrls", "featureTypes", "mockWfsCall", true);

            expect(api.cache).to.be.an("object").and.to.be.empty;
        });
    });

    describe("callWfs", () => {
        it("should call the mockWfsCall for testing, instead of opening any network connections", () => {
            let lastUrl = false,
                lastPayload = false,
                lastOnsuccess = false,
                lastOnerror = false;
            const api = new BildungsatlasApi("configUrl", "wfsUrls", "featureTypes", (url, payload, onsuccess, onerror) => {
                lastUrl = url;
                lastPayload = payload;
                lastOnsuccess = onsuccess;
                lastOnerror = onerror;
            }, true);

            api.callWfs("url", "payload", "onsuccess", "onerror");

            expect(lastUrl).to.equal("url");
            expect(lastPayload).to.equal("payload");
            expect(lastOnsuccess).to.equal("onsuccess");
            expect(lastOnerror).to.equal("onerror");
        });
    });

    describe("hasWfsUrl", () => {
        it("should check true if api.wfsUrls contains an url for the given key", () => {
            const api = new BildungsatlasApi("configUrl", {
                key: "value"
            }, "featureTypes", "mockWfsCall", true);

            expect(api.hasWfsUrl("key")).to.be.true;
        });
        it("should check false if api.wfsUrls doesn't contain an url for the given key", () => {
            const api = new BildungsatlasApi("configUrl", {
                wrongkey: "value"
            }, "featureTypes", "mockWfsCall", true);

            expect(api.hasWfsUrl("key")).to.be.false;
        });
        it("should check false if api.wfsUrls contains the given key, but the content is anything but a string", () => {
            const api = new BildungsatlasApi("configUrl", {
                key: false
            }, "featureTypes", "mockWfsCall", true);

            expect(api.hasWfsUrl("key")).to.be.false;
        });
    });

    describe("hasFeatureType", () => {
        it("should check true if api.featureType contains a feature type for the given key and propertyName", () => {
            const api = new BildungsatlasApi("configUrl", "wfsUrls", {
                key: {
                    propertyName: "value"
                }
            }, "mockWfsCall", true);

            expect(api.hasFeatureType("key", "propertyName")).to.be.true;
        });
        it("should check false if api.featureType doesn't contain a feature type for the given key", () => {
            const api = new BildungsatlasApi("configUrl", "wfsUrls", {
                wrongkey: {
                    propertyName: "value"
                }
            }, "mockWfsCall", true);

            expect(api.hasFeatureType("key", "propertyName")).to.be.false;
        });
        it("should check false if api.featureType doesn't contain a feature type for the given propertyName", () => {
            const api = new BildungsatlasApi("configUrl", "wfsUrls", {
                key: {
                    wrongPropertyName: "value"
                }
            }, "mockWfsCall", true);

            expect(api.hasFeatureType("key", "propertyName")).to.be.false;
        });
        it("should check false if api.featureType contains the feature type and propertyName, but the content is anyhting but a string", () => {
            const api = new BildungsatlasApi("configUrl", "wfsUrls", {
                key: {
                    propertyName: false
                }
            }, "mockWfsCall", true);

            expect(api.hasFeatureType("key", "propertyName")).to.be.false;
        });
    });

    describe("filterComplexTypeFromJsonResponse", () => {
        it("should return the given attribute fromthe ol/Feature within the given jsonData", () => {
            const api = new BildungsatlasApi("configUrl", "wfsUrls", "featureTypes", "mockWfsCall", true),
                feature = new Feature(),
                expected = "complexType";

            feature.set("attributeName", expected);

            expect(api.filterComplexTypeFromJsonResponse([feature], "attributeName")).to.equal(expected);
        });
        it("should return false if the given jsonData is anything but an array with a Feature", () => {
            const api = new BildungsatlasApi("configUrl", "wfsUrls", "featureTypes", "mockWfsCall", true);

            expect(api.filterComplexTypeFromJsonResponse(undefined)).to.be.false;
            expect(api.filterComplexTypeFromJsonResponse(null)).to.be.false;
            expect(api.filterComplexTypeFromJsonResponse("string")).to.be.false;
            expect(api.filterComplexTypeFromJsonResponse(123)).to.be.false;
            expect(api.filterComplexTypeFromJsonResponse(true)).to.be.false;
            expect(api.filterComplexTypeFromJsonResponse(false)).to.be.false;
            expect(api.filterComplexTypeFromJsonResponse({})).to.be.false;
            expect(api.filterComplexTypeFromJsonResponse([])).to.be.false;
            expect(api.filterComplexTypeFromJsonResponse(["string"])).to.be.false;
        });
        it("should return a structure with altered values if values exists and is an object instead of an array", () => {
            const api = new BildungsatlasApi("configUrl", "wfsUrls", "featureTypes", "mockWfsCall", true),
                feature = new Feature(),
                pseudoType = {
                    values: {test: 1}
                },
                expected = {
                    values: [{test: 1}]
                };

            feature.set("attributeName", pseudoType);

            expect(api.filterComplexTypeFromJsonResponse([feature], "attributeName")).to.deep.equal(expected);
        });
    });

    describe("getComplexType", () => {
        it("should call the error handler if no match for the feature type was found", () => {
            let lastError = false;
            const api = new BildungsatlasApi("configUrl", "wfsUrls", "featureTypes", "mockWfsCall", true);

            api.getComplexType("propertyName", "featureTypeKey", "valueReference", "literal", "onsuccess", error => {
                lastError = error;
            });
            expect(lastError).to.be.an.instanceof(Error);
        });
        it("should call the error handler if no match for the url was found", () => {
            let lastError = false;
            const api = new BildungsatlasApi("configUrl", "wfsUrls", {
                featureTypeKey: {
                    propertyName: "featureType"
                }
            }, "mockWfsCall", true);

            api.getComplexType("propertyName", "featureTypeKey", "valueReference", "literal", "onsuccess", error => {
                lastError = error;
            });
            expect(lastError).to.be.an.instanceof(Error);
        });
        it("should call the axios mock", () => {
            let lastUrl = false,
                lastPayload = false,
                lastOnsuccess = false,
                lastOnerror = false;
            const api = new BildungsatlasApi("configUrl", {
                featureType: "url"
            }, {
                featureTypeKey: {
                    propertyName: "featureType"
                }
            }, (url, payload, onsuccess, onerror) => {
                lastUrl = url;
                lastPayload = payload;
                lastOnsuccess = onsuccess;
                lastOnerror = onerror;
            }, true);

            api.getComplexType("propertyName", "featureTypeKey", "valueReference", "literal", "onsuccess", "onerror");

            expect(lastUrl).to.equal("url");
            expect(lastPayload).to.be.a("string");
            expect(lastOnsuccess).to.be.a("function");
            expect(lastOnerror).to.equal("onerror");
        });
    });
});
