import epsgCodeToURI from "../../../utils/epsgCodeToURI.js";
import {expect} from "chai";
import sinon from "sinon";

describe("epsgCodeToURI", () => {
    beforeEach(() => {
        sinon.stub(console, "warn").callsFake(sinon.spy());
    });
    it("returns correct URI for known EPSG code", () => {
        expect(epsgCodeToURI("EPSG:25832")).to.equal("http://www.opengis.net/def/crs/EPSG/0/25832");
    });

    it("returns empty string for unknown EPSG code", () => {
        expect(epsgCodeToURI("EPSG:9999")).to.equal("");
    });
});
