import {findMappingObjectByCategory, prepareStatsFeatures} from "../../../utils/prepareStatsFeatures";
import {expect} from "chai";
import Feature from "ol/Feature.js";

describe.skip("addons/DistrictSelector/utils/prepareDistrictLevels.js", () => {
    describe("findMappingObjectByCategory", async () => {
        it("should returns undefined", async () => {
            const mappingJson = [
                {
                    "category": "bev_insgesamt",
                    "value": "Bevölkerung insgesamt",
                    "group": "Bevölkerung",
                    "statgebiet": "15563",
                    "stadtteil": "19034",
                    "bezirk": "18970",
                    "valueType": "absolute"
                },
                {
                    "category": "arb_arbeitslose_ingesamt_anz",
                    "value": "Arbeitslose insgesamt",
                    "group": "Arbeitslose",
                    "statgebiet": "15975",
                    "stadtteil": "19023",
                    "bezirk": "18960",
                    "valueType": "absolute"
                },
                {
                    "category": "arb_arbeitslose_ingesamt_proz",
                    "value": "Anteil der Arbeitslosen",
                    "group": "Arbeitslose",
                    "statgebiet": "15976",
                    "stadtteil": "19024",
                    "bezirk": "18961",
                    "valueType": "relative",
                    "calculation": {
                        "operation": "divide",
                        "category_A": "Arbeitslose insgesamt",
                        "category_B": "Bevölkerung insgesamt",
                        "modifier": 100
                    }
                }
            ];

            expect(await findMappingObjectByCategory({}, mappingJson)).to.be.undefined;
            expect(await findMappingObjectByCategory(true, mappingJson)).to.be.undefined;
            expect(await findMappingObjectByCategory("districtLevels", mappingJson)).to.be.undefined;
            expect(await findMappingObjectByCategory(undefined, mappingJson)).to.be.undefined;
            expect(await findMappingObjectByCategory(null, mappingJson)).to.be.undefined;
            expect(await findMappingObjectByCategory(42, mappingJson)).to.be.undefined;
            expect(await findMappingObjectByCategory([], mappingJson)).to.be.undefined;
        });

        it("should return an object with properties value and group", async () => {
            const mappingJson = [
                    {
                        "category": "bev_insgesamt",
                        "value": "Bevölkerung insgesamt",
                        "group": "Bevölkerung",
                        "statgebiet": "15563",
                        "stadtteil": "19034",
                        "bezirk": "18970",
                        "valueType": "absolute"
                    },
                    {
                        "category": "arb_arbeitslose_ingesamt_anz",
                        "value": "Arbeitslose insgesamt",
                        "group": "Arbeitslose",
                        "statgebiet": "15975",
                        "stadtteil": "19023",
                        "bezirk": "18960",
                        "valueType": "absolute"
                    },
                    {
                        "category": "arb_arbeitslose_ingesamt_proz",
                        "value": "Anteil der Arbeitslosen",
                        "group": "Arbeitslose",
                        "statgebiet": "15976",
                        "stadtteil": "19024",
                        "bezirk": "18961",
                        "valueType": "relative",
                        "calculation": {
                            "operation": "divide",
                            "category_A": "Arbeitslose insgesamt",
                            "category_B": "Bevölkerung insgesamt",
                            "modifier": 100
                        }
                    }
                ],
                mappingObject = await findMappingObjectByCategory("bev_insgesamt", mappingJson);

            expect(mappingObject).to.be.an("object");
            expect(mappingObject).to.have.property("value");
            expect(mappingObject).to.have.property("group");
        });
    });

    describe("prepareStatsFeatures", async () => {
        it("should set the 'kategorie' and the 'group' property of the feature", async () => {
            const feature = new Feature({
                    name: "Altona",
                    id: "123",
                    kategorie: "bev_insgesamt",
                    geom: "i am a geometry"
                }),
                mappingJson = [
                    {
                        "category": "bev_insgesamt",
                        "value": "Bevölkerung insgesamt",
                        "group": "Bevölkerung",
                        "statgebiet": "15563",
                        "stadtteil": "19034",
                        "bezirk": "18970",
                        "valueType": "absolute"
                    },
                    {
                        "category": "arb_arbeitslose_ingesamt_anz",
                        "value": "Arbeitslose insgesamt",
                        "group": "Arbeitslose",
                        "statgebiet": "15975",
                        "stadtteil": "19023",
                        "bezirk": "18960",
                        "valueType": "absolute"
                    },
                    {
                        "category": "arb_arbeitslose_ingesamt_proz",
                        "value": "Anteil der Arbeitslosen",
                        "group": "Arbeitslose",
                        "statgebiet": "15976",
                        "stadtteil": "19024",
                        "bezirk": "18961",
                        "valueType": "relative",
                        "calculation": {
                            "operation": "divide",
                            "category_A": "Arbeitslose insgesamt",
                            "category_B": "Bevölkerung insgesamt",
                            "modifier": 100
                        }
                    }
                ];

            await prepareStatsFeatures(feature, mappingJson);

            expect(feature).to.be.an("object");
            expect(feature.get("kategorie")).to.be.equal("Bevölkerung insgesamt");
            expect(feature.get("group")).to.be.equal("Bevölkerung");
        });

        it("should unset the 'geom' property on the feature", async () => {
            const feature = new Feature({
                    name: "Altona",
                    id: "123",
                    kategorie: "bev_insgesamt",
                    geom: "i am a geometry"
                }),
                mappingJson = [
                    {
                        "category": "bev_insgesamt",
                        "value": "Bevölkerung insgesamt",
                        "group": "Bevölkerung",
                        "statgebiet": "15563",
                        "stadtteil": "19034",
                        "bezirk": "18970",
                        "valueType": "absolute"
                    },
                    {
                        "category": "arb_arbeitslose_ingesamt_anz",
                        "value": "Arbeitslose insgesamt",
                        "group": "Arbeitslose",
                        "statgebiet": "15975",
                        "stadtteil": "19023",
                        "bezirk": "18960",
                        "valueType": "absolute"
                    },
                    {
                        "category": "arb_arbeitslose_ingesamt_proz",
                        "value": "Anteil der Arbeitslosen",
                        "group": "Arbeitslose",
                        "statgebiet": "15976",
                        "stadtteil": "19024",
                        "bezirk": "18961",
                        "valueType": "relative",
                        "calculation": {
                            "operation": "divide",
                            "category_A": "Arbeitslose insgesamt",
                            "category_B": "Bevölkerung insgesamt",
                            "modifier": 100
                        }
                    }
                ];

            await prepareStatsFeatures(feature, mappingJson);

            expect(feature.get("geom")).to.be.undefined;
        });

        it("should do nothing with the feature properties, if no mappingObject was found", async () => {
            const featureDummy = new Feature({
                    name: "Ottensen",
                    id: "456",
                    kategorie: "berry_rich"
                }),
                mappingJson = [
                    {
                        "category": "bev_insgesamt",
                        "value": "Bevölkerung insgesamt",
                        "group": "Bevölkerung",
                        "statgebiet": "15563",
                        "stadtteil": "19034",
                        "bezirk": "18970",
                        "valueType": "absolute"
                    },
                    {
                        "category": "arb_arbeitslose_ingesamt_anz",
                        "value": "Arbeitslose insgesamt",
                        "group": "Arbeitslose",
                        "statgebiet": "15975",
                        "stadtteil": "19023",
                        "bezirk": "18960",
                        "valueType": "absolute"
                    },
                    {
                        "category": "arb_arbeitslose_ingesamt_proz",
                        "value": "Anteil der Arbeitslosen",
                        "group": "Arbeitslose",
                        "statgebiet": "15976",
                        "stadtteil": "19024",
                        "bezirk": "18961",
                        "valueType": "relative",
                        "calculation": {
                            "operation": "divide",
                            "category_A": "Arbeitslose insgesamt",
                            "category_B": "Bevölkerung insgesamt",
                            "modifier": 100
                        }
                    }
                ];

            await prepareStatsFeatures(featureDummy, mappingJson);

            expect(featureDummy.get("kategorie")).to.be.equal("berry_rich");
            expect(featureDummy.get("group")).to.be.undefined;
        });
    });

});
