import {expect} from "chai";
import convertCrsToEpsg from "@shared/js/utils/convertCrsToEpsg.js";

describe("src/shared/js/utils/convertCrsToEpsg.js", () => {
    describe("aliases of EPSG:4326", () => {
        [
            "urn:ogc:def:crs:EPSG:6.6:4326",
            "urn:ogc:def:crs:OGC:1.3:CRS84",
            "urn:ogc:def:crs:OGC:1.3:CRS:84",
            "urn:ogc:def:crs:OGC:2:84",
            "urn:x-ogc:def:crs:EPSG:4326"
        ].forEach(alias => {
            it("positive: should return EPSG:4326 for " + alias, () => {
                expect(convertCrsToEpsg(alias)).to.equal("EPSG:4326");
            });
        });
    });

    describe("aliases of EPSG:3857", () => {
        [
            "EPSG:102100",
            "EPSG:102113",
            "EPSG:900913",
            "epsg:900913",
            "urn:ogc:def:crs:EPSG:6.18:3:3857"
        ].forEach(alias => {
            it("positive: should return EPSG:3857 for " + alias, () => {
                expect(convertCrsToEpsg(alias)).to.equal("EPSG:3857");
            });
        });
    });

    describe("values without alias", () => {
        [
            "EPSG:4326",
            "EPSG:3857",
            "EPSG:25832",
            "urn:ogc:def:crs:EPSG::25832"
        ].forEach(value => {
            it("negative: should return the unchanged value for: " + value, () => {
                expect(convertCrsToEpsg(value)).to.equal(value);
            });
        });

        it("negative: should return undefined if called without a value", () => {
            expect(convertCrsToEpsg(undefined)).to.be.undefined;
        });
    });
});
