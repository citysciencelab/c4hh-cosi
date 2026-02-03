import {expect} from "chai";
import {getMappedProperty} from "../../../../../components/shared/js/getMappedProperty.js";
import sinon from "sinon";

describe("addons/SimulationTool/components/shared/js/getMappedProperty.js", () => {
    it("should return empty string if the key is not string.", function () {
        expect(getMappedProperty(null)).to.be.equal("");
        expect(getMappedProperty(0)).to.be.equal("");
        expect(getMappedProperty(undefined)).to.be.equal("");
        expect(getMappedProperty([])).to.be.equal("");
        expect(getMappedProperty({})).to.be.equal("");
        expect(getMappedProperty(true)).to.be.equal("");
    });

    it("should return the original text if the propertiesMapping is not an object.", function () {
        expect(getMappedProperty("key", null)).to.be.equal("key");
        expect(getMappedProperty("key", 0)).to.be.equal("key");
        expect(getMappedProperty("key", undefined)).to.be.equal("key");
        expect(getMappedProperty("key", [])).to.be.equal("key");
        expect(getMappedProperty("key", "")).to.be.equal("key");
        expect(getMappedProperty("key", true)).to.be.equal("key");
    });

    it("should return the original text if the propertiesMapping does not contain this key.", function () {
        const propertiesMapping = {
            "building_height": "Höhe"
        };

        expect(getMappedProperty("key", propertiesMapping)).to.be.equal("key");
    });

    it("should return the mapped property.", function () {
        const propertiesMapping = {
            "building_height": "Höhe"
        };

        sinon.stub(i18next, "t").callsFake(key => key);
        expect(getMappedProperty("building_height", propertiesMapping)).to.be.equal("Höhe");
        sinon.restore();
    });
});
