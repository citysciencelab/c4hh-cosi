import {findMappingObjectByCategory, prepareStatsFeatures} from "../../../utils/prepareStatsFeatures";
import {expect} from "chai";
import Feature from "ol/Feature.js";

describe("addons/DistrictSelector/utils/prepareDistrictLevels.js", () => {
    describe("findMappingObjectByCategory", () => {
        it("", () => {
            expect(findMappingObjectByCategory({})).to.be.undefined;
            expect(findMappingObjectByCategory(true)).to.be.undefined;
            expect(findMappingObjectByCategory("districtLevels")).to.be.undefined;
            expect(findMappingObjectByCategory(undefined)).to.be.undefined;
            expect(findMappingObjectByCategory(null)).to.be.undefined;
            expect(findMappingObjectByCategory(42)).to.be.undefined;
            expect(findMappingObjectByCategory([])).to.be.undefined;
        });

        it("", () => {
            const mappingObject = findMappingObjectByCategory("bev_insgesamt");

            expect(mappingObject).to.be.an("object");
            expect(mappingObject).to.have.property("value");
            expect(mappingObject).to.have.property("group");
        });
    });

    describe("prepareStatsFeatures", () => {
        const feature = new Feature({
                name: "Altona",
                id: "123",
                kategorie: "bev_insgesamt",
                geom: "i am a geometry"
            }),
            featureDummy = new Feature({
                name: "Ottensen",
                id: "456",
                kategorie: "berry_rich"
            });

        it("should set the 'kategorie' and the 'group' property of the feature", () => {
            prepareStatsFeatures(feature);

            expect(feature).to.be.an("object");
            expect(feature.get("kategorie")).to.be.equal("Bevölkerung insgesamt");
            expect(feature.get("group")).to.be.equal("Bevölkerung");
        });

        it("should unset the 'geom' property on the feature", () => {
            prepareStatsFeatures(feature);

            expect(feature.get("geom")).to.be.undefined;
        });

        it("should do nothing with the feature properties, if no mappingObject was found", () => {
            prepareStatsFeatures(featureDummy);

            expect(featureDummy.get("kategorie")).to.be.equal("berry_rich");
            expect(featureDummy.get("group")).to.be.undefined;
        });
    });

});
