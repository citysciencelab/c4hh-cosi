import {expect} from "chai";
import * as addWMS from "../../../js/addWMSRemotely";

describe("ADDON: addLayerRemotely", () => {

    it("addWMSRemotely: getParsedTitle should return parsed title without space and be replaced with minus", function () {
        expect(addWMS.getParsedTitle("test title")).to.equal("test-title");
    });
    it("addWMSRemotely: getParsedTitle should return parsed title without slash and be replaced with minus", function () {
        expect(addWMS.getParsedTitle("test/title")).to.equal("test-title");
    });
    it("addWMSRemotely: getParsedTitle should return parsed title without colon and be replaced with minus", function () {
        expect(addWMS.getParsedTitle("test:title")).to.equal("test-title");
    });
    it("addWMSRemotely: getParsedTitle should return parsed title as original title", function () {
        expect(addWMS.getParsedTitle(undefined)).to.equal("undefined");
        expect(addWMS.getParsedTitle("test")).to.equal("test");
        expect(addWMS.getParsedTitle(1234)).to.equal("1234");
    });

    it("addWMSRemotely: isVersionEnabled should return false if the type of version is not string", function () {
        expect(addWMS.isVersionEnabled(null)).to.be.false;
    });
    it("addWMSRemotely: isVersionEnabled should return false if the version is lower than 1.3.0", function () {
        expect(addWMS.isVersionEnabled("0.3.0")).to.be.false;
        expect(addWMS.isVersionEnabled("1.2.9")).to.be.false;
    });
    it("addWMSRemotely: isVersionEnabled should return true if the version is equal or higher than 1.3.0", function () {
        expect(addWMS.isVersionEnabled("1.3.0")).to.be.true;
        expect(addWMS.isVersionEnabled("2.3.5")).to.be.true;
    });

    let capability = {
            Capability: {
                Layer: {
                    "BoundingBox": [
                        {
                            "crs": "EPSG:25832",
                            "extent": [
                                302907.887193,
                                5435104.982326,
                                389523.673913,
                                5508222.768538
                            ]
                        }
                    ]
                }
            }
        },
        currentExtent = [];

    it("addWMSRemotely: getIfInExtent schould return true if the currentExtent intersects the capability extent", function () {
        currentExtent = [
            205000,
            5009000,
            730000,
            6075800
        ];
        expect(addWMS.getIfInExtent(capability, currentExtent, "EPSG:25832")).to.be.an("array").with.lengthOf(4);
    });

    it("addWMSRemotely: getIfInExtent should return true if the currentExtent is not in the right format", function () {
        currentExtent = "";
        expect(addWMS.getIfInExtent(capability, currentExtent, "EPSG:25832")).to.be.an("array").with.lengthOf(4);
    });

    it("addWMSRemotely: getIfInExtent should return true if the layer in Capability does not have the right crs", function () {
        capability = {
            Capability: {
                Layer: {
                    "BoundingBox": [
                        {
                            "crs": "EPSG:3067",
                            "extent": [
                                336385.4535501953,
                                6628495.2621008465,
                                447592.181149918,
                                7646073.290737241
                            ]
                        }
                    ]
                }
            }
        };
        currentExtent = [
            455000,
            5809000,
            730000,
            6075800
        ];
        expect(addWMS.getIfInExtent(capability, currentExtent, "EPSG:25832")).to.be.true;
    });

    it("addWMSRemotely: getIfInExtent should return true if the layer in Capability does not have the right extent", () => {
        capability = {
            Capability: {
                Layer: {
                    "BoundingBox": [
                        {
                            "crs": "EPSG:25832",
                            "extent": [
                                302907.887193,
                                5435104.982326,
                                389523.673913
                            ]
                        }
                    ]
                }
            }
        };
        currentExtent = [
            455000,
            5809000,
            730000,
            6075800
        ];
        expect(addWMS.getIfInExtent(capability, currentExtent, "EPSG:25832")).to.be.true;
    });


    it("addWMSRemotely: getReversedData should replace all SRS with CRS in the xml node and attribute", function () {
        const data = "<Layer><SRS>EPSG:4326</SRS><Layer queryable=\"1\"><SRS>EPSG:102100</SRS><BoundingBox SRS=\"EPSG:4326\" minx=\"6.355978\" miny=\"49.11015\" maxx=\"7.413363\" maxy=\"49.644331\"/></Layer></Layer>",
            dataXml = new DOMParser().parseFromString(data, "text/xml");

        expect(addWMS.getReversedData(dataXml).getElementsByTagName("SRS").length).to.equal(0);
        expect(addWMS.getReversedData(dataXml).getElementsByTagName("CRS").length).not.to.equal(0);
    });

});
