import {expect} from "chai";
import {createFeature, createLayer, prepareProperties} from "../../gfiOnAddress";

describe("ADDON: gfiOnAddress/gfiOnAddress.js", () => {
    before(() => {
        i18next.init({
            lng: "cimode",
            debug: false
        });
    });

    describe("prepareProperties", () => {
        it("should return object with values as string", () => {
            const properties = {
                name: "search result",
                strasse: {
                    _: "Example Street"
                }
            };

            expect(prepareProperties(properties)).to.deep.equals({
                name: "search result",
                strasse: "Example Street"
            });
        });
    });

    describe("createLayer", () => {
        it("should return a layer with get function", () => {
            const searchResult = {
                    properties: {
                        name: "search result",
                        strasse: {
                            _: "Example Street"
                        }
                    }
                },
                gazetteerConfig = {
                    serviceId: 8
                },
                layer = createLayer(searchResult, gazetteerConfig);

            expect(typeof layer.get).to.equals("function");
            expect(layer.get("name")).to.equals("modules.gfiOnAddress.title");
            expect(layer.get("gfiTheme")).to.equals("default");
            expect(layer.get("gfiAttributes")).to.equal("showAll");
        });
    });

    describe("createFeature", () => {
        it("should return a feature to show the gfi", () => {
            const searchResult = {
                    properties: {
                        name: "search result",
                        strasse: {
                            _: "Example Street"
                        }
                    }
                },
                gazetteerConfig = {
                    serviceId: 8
                },
                feature = createFeature(searchResult, gazetteerConfig);

            expect(feature).to.be.an("object");
            expect(feature.getProperties()).to.deep.equals({
                name: "search result",
                strasse: "Example Street"
            });
            expect(feature.getTitle()).to.equals("modules.gfiOnAddress.title");
            expect(feature.getTheme()).to.equals("default");
            expect(feature.getAttributesToShow()).to.equals("showAll");
        });
    });
});
